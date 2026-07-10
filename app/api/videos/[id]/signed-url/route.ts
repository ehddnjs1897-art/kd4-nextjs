/**
 * GET /api/videos/[id]/signed-url?expiry=86400
 *
 * 영상 signed URL 발급 — 인증된 사용자만 (멤버 + admin + crew)
 * 비공개 영상이지만 시간제한 링크로 캐스팅 디렉터에게 공유 가능.
 *
 * Query:
 *   expiry: 만료 초 (기본 86400 = 24h, 최대 604800 = 7d)
 *
 * Response: { url, expiresAt }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getVideoSignedUrl, isR2Configured } from '@/lib/r2'

const MAX_EXPIRY_SEC = 7 * 24 * 60 * 60 // 7일
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET 레이트 리밋: 60 req/min per user (R2 egress 남용 방어)
const signedUrlMap = new Map<string, { count: number; resetAt: number }>()
const SIGNED_URL_LIMIT = 60
const SIGNED_URL_WINDOW_MS = 60_000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isR2Configured()) {
    console.error('[signed-url] R2 환경변수 미설정')
    return NextResponse.json({ error: 'R2 미설정' }, { status: 500 })
  }

  // 인증 확인 (멤버 이상)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: '영상 시청은 멤버 인증이 필요합니다.' },
      { status: 401 }
    )
  }

  // 레이트 리밋: 1분 60회 초과 차단 (R2 egress 남용 방어)
  const nowSU = Date.now()
  const bucketSU = signedUrlMap.get(user.id)
  if (bucketSU && nowSU < bucketSU.resetAt) {
    if (bucketSU.count >= SIGNED_URL_LIMIT) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    bucketSU.count++
  } else {
    signedUrlMap.set(user.id, { count: 1, resetAt: nowSU + SIGNED_URL_WINDOW_MS })
    if (signedUrlMap.size > 2000) {
      for (const [k, v] of signedUrlMap) {
        if (nowSU > v.resetAt) signedUrlMap.delete(k)
      }
    }
  }

  // params 먼저 해결 → UUID 검증 → role + video 병렬 조회 (round-trip 1개 절감)
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: '잘못된 영상 ID입니다.' }, { status: 400 })
  }
  const url = new URL(request.url)
  const requestedExpiry = parseInt(url.searchParams.get('expiry') ?? '86400', 10)
  const expirySec = Math.min(Math.max(Math.floor(requestedExpiry || 86400), 60), MAX_EXPIRY_SEC)

  // role 확인 + 영상 row(+배우 공개 여부) 병렬 조회
  const [{ data: profile }, { data: video, error: videoError }] = await Promise.all([
    supabaseAdmin.from('profiles').select('role, actor_id').eq('id', user.id).maybeSingle(),
    supabaseAdmin.from('actor_videos').select('id, r2_key, actor_id, title, video_type, actors ( is_public, name, gender, birth_year )').eq('id', id).maybeSingle(),
  ])

  const role = profile?.role
  // 운영 역할: 모든 영상(비공개 배우 포함) 시청 가능
  const elevated = role === 'admin' || role === 'crew' || role === 'editor' || role === 'director' || role === 'member'

  if (videoError || !video) {
    return NextResponse.json({ error: '영상을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (!video.r2_key) {
    return NextResponse.json(
      { error: '아직 R2에 업로드되지 않은 영상입니다.' },
      { status: 404 }
    )
  }

  // 시청 권한 (2026-06-12 부분공개 정책 — 회원가입 퍼널과 일치):
  //   - 공개 배우(is_public)의 영상: 로그인 사용자 누구나 시청 가능 (user/actor 포함)
  //   - 비공개 배우의 영상: 운영 역할(elevated) 또는 본인만
  //   - 다운로드는 여전히 디렉터/관리자만 (아래 별도 게이트)
  type ActorRel = { is_public?: boolean | null; name?: string | null; gender?: string | null; birth_year?: number | null }
  const actorsRel = (video as unknown as { actors?: ActorRel | ActorRel[] }).actors
  const actorRow = Array.isArray(actorsRel) ? actorsRel[0] : actorsRel
  const actorIsPublic = actorRow?.is_public === true
  const isOwnVideo = !!profile?.actor_id && video.actor_id === profile.actor_id
  if (!actorIsPublic && !elevated && !isOwnVideo) {
    return NextResponse.json(
      { error: '이 영상은 권한이 있는 사용자만 접근 가능합니다.' },
      { status: 403 }
    )
  }

  // 다운로드는 디렉터/관리자만 (정책)
  const download = url.searchParams.get('download') === '1'
  if (download && !(role === 'director' || role === 'admin')) {
    return NextResponse.json(
      { error: '영상 다운로드는 디렉터/관리자만 가능합니다.' },
      { status: 403 }
    )
  }

  try {
    const ext = video.r2_key.split('.').pop() || 'mp4'
    // 다운로드 파일명: "{OO}년생 {성별} {이름}_출연영상{N}" (독백은 "..._독백", 2026-07-10 대표 지시)
    //  - 업로드 파일명 무관, 다운로드 시 이 양식으로 통일 (프로필 문서와 동일 규칙)
    //  - N(순번)·독백 여부는 서버에서 계산 → 어느 다운로드 버튼(인라인/일괄)이든 정확
    //  - 배우 메타(name) 없으면 기존 title 폴백
    let filename: string | undefined
    if (download) {
      const vtype = (video as { video_type?: string | null }).video_type
      const name = actorRow?.name
      const gender = (actorRow?.gender || '').trim()
      const birthYear2 = actorRow?.birth_year ? String(actorRow.birth_year).slice(-2) : ''
      let base: string
      if (name) {
        let label: string
        if (vtype === 'monologue') {
          label = '독백'
        } else {
          // 이 영상이 출연영상(reel) 중 몇 번째인지 sort_order 기준으로 계산 (화면 표시 순서와 일치)
          const { data: rs } = await supabaseAdmin
            .from('actor_videos')
            .select('id, video_type, sort_order')
            .eq('actor_id', video.actor_id)
            .not('r2_key', 'is', null)
            .order('sort_order', { ascending: true })
          const reels = (rs ?? []).filter((r) => (r as { video_type?: string | null }).video_type !== 'monologue')
          const pos = reels.findIndex((r) => r.id === video.id)
          label = `출연영상${pos >= 0 ? pos + 1 : 1}`
        }
        const prefixParts = [birthYear2 && `${birthYear2}년생`, gender].filter(Boolean)
        base = [...prefixParts, `${name}_${label}`].join(' ')
      } else {
        base = video.title || 'video'
      }
      filename = `${base.replace(/[\\/:*?"<>|]/g, '_')}.${ext}`
    }
    const signedUrl = await getVideoSignedUrl(video.r2_key, expirySec, filename)
    const expiresAt = new Date(Date.now() + expirySec * 1000).toISOString()
    return NextResponse.json({ url: signedUrl, expiresAt }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[signed-url] 발급 실패:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'signed URL 발급 실패' }, { status: 500 })
  }
}
