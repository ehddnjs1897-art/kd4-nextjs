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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isR2Configured()) {
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

  // role 확인 — admin/crew/editor/director는 모든 영상 접근 가능
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const elevated = role === 'admin' || role === 'crew' || role === 'editor' || role === 'director'

  const { id } = await params
  const url = new URL(request.url)
  const requestedExpiry = parseInt(url.searchParams.get('expiry') ?? '86400', 10)
  const expirySec = Math.min(Math.max(requestedExpiry, 60), MAX_EXPIRY_SEC)

  // 영상 row 조회
  const { data: video, error } = await supabaseAdmin
    .from('actor_videos')
    .select('id, r2_key, is_public, actor_id')
    .eq('id', id)
    .single()

  if (error || !video) {
    return NextResponse.json({ error: '영상을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (!video.r2_key) {
    return NextResponse.json(
      { error: '아직 R2에 업로드되지 않은 영상입니다.' },
      { status: 404 }
    )
  }

  // 권한: is_public=true (공개) 또는 elevated role
  if (!video.is_public && !elevated) {
    return NextResponse.json(
      { error: '이 영상은 권한이 있는 사용자만 접근 가능합니다.' },
      { status: 403 }
    )
  }

  try {
    const signedUrl = await getVideoSignedUrl(video.r2_key, expirySec)
    const expiresAt = new Date(Date.now() + expirySec * 1000).toISOString()
    return NextResponse.json({ url: signedUrl, expiresAt })
  } catch (err) {
    console.error('[signed-url] 발급 실패:', err)
    return NextResponse.json({ error: 'signed URL 발급 실패' }, { status: 500 })
  }
}
