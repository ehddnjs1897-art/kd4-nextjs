/**
 * POST /api/actors/[id]/videos — 영상 추가
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'

type Ctx = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/

// 레이트 리밋: 5분 내 10개 영상 추가 초과 시 차단
const videoAddMap = new Map<string, number[]>()
const VIDEO_WINDOW_MS = 5 * 60_000
const VIDEO_MAX = 10

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 배우 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).maybeSingle()
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 레이트 리밋: 5분 내 10회 초과 시 차단
    const now = Date.now()
    const times = (videoAddMap.get(user.id) ?? []).filter(t => now - t < VIDEO_WINDOW_MS)
    if (times.length >= VIDEO_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (5분 최대 10개)' }, { status: 429 })
    }
    // content-length 선검사 — rate-limit 슬롯 소진 전 (과도한 요청으로 쿼터 낭비 방지)
    const clVideo = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (clVideo > 16_384) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })

    videoAddMap.set(user.id, [...times, now])
    // 오래된 항목 정리 (메모리 누수 방지)
    if (videoAddMap.size > 2000) {
      const cutoffV = now - VIDEO_WINDOW_MS
      for (const [k, v] of videoAddMap) {
        if (v.every(t => t < cutoffV)) videoAddMap.delete(k)
      }
    }

    let parsedBody: { youtube_id?: string; r2_key?: string; title?: string; video_type?: string }
    try {
      parsedBody = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }
    const { youtube_id, r2_key, title, video_type } = parsedBody
    if (!youtube_id && !r2_key) {
      return NextResponse.json({ error: 'youtube_id 또는 r2_key가 필요합니다.' }, { status: 400 })
    }
    if (youtube_id && !YOUTUBE_ID_RE.test(youtube_id)) {
      return NextResponse.json({ error: '유효하지 않은 YouTube ID입니다.' }, { status: 400 })
    }

    const VALID_VIDEO_TYPES = new Set(['reel', 'monologue', 'commercial', 'short_film', 'drama', 'movie'])
    if (title && typeof title === 'string' && title.length > 200) {
      return NextResponse.json({ error: '제목은 200자 이하입니다.' }, { status: 400 })
    }
    if (r2_key && typeof r2_key === 'string' && r2_key.length > 500) {
      return NextResponse.json({ error: 'r2_key가 너무 깁니다.' }, { status: 400 })
    }
    // R2 key 네임스페이스 검증 — 다른 사용자 파일 탈취 방지 (IDOR)
    // presigned URL 발급 시 `actors/intake/{user.id}/...` 패턴으로만 발급됨
    // admin/editor는 전용 /api/admin/videos/upload 경로를 통해 업로드하므로 자기 네임스페이스 제한 면제
    if (r2_key && typeof r2_key === 'string') {
      // 경로 순회(path-traversal) 방어 — profile/intake/route.ts와 동일 패턴
      // R2는 '..' 세그먼트를 오브젝트 키로 그대로 저장하지만, getVideoSignedUrl/deleteVideo에서 사용 시 문제 발생 가능
      const hasPathTraversal = (p: string) => p.split('/').some(seg => seg === '..' || seg === '.')
      if (hasPathTraversal(r2_key)) {
        return NextResponse.json({ error: '허가되지 않은 파일 경로입니다.' }, { status: 403 })
      }
      const isPrivileged = profile.role === 'admin' || profile.role === 'editor'
      const allowedPrefix = `actors/intake/${user.id}/`
      if (!isPrivileged && !r2_key.startsWith(allowedPrefix)) {
        return NextResponse.json({ error: '허가되지 않은 파일 경로입니다.' }, { status: 403 })
      }
    }
    if (video_type && !VALID_VIDEO_TYPES.has(video_type)) {
      return NextResponse.json({ error: '유효하지 않은 video_type입니다.' }, { status: 400 })
    }

    // 배우당 영상 최대 50개 제한 — 장기 축적 방어
    const { count: existingVideoCount } = await supabaseAdmin
      .from('actor_videos')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', id)
    if ((existingVideoCount ?? 0) >= 50) {
      return NextResponse.json({ error: '배우당 최대 50개 영상까지 추가할 수 있습니다.' }, { status: 429 })
    }

    // MAX(sort_order) + 1 — 항상 0 고정 버그 수정 (R86): 새 영상은 목록 맨 뒤에 추가
    const { data: maxSortRow } = await supabaseAdmin
      .from('actor_videos')
      .select('sort_order')
      .eq('actor_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextSortOrder = (maxSortRow?.sort_order ?? -1) + 1

    const insertData: Record<string, unknown> = {
      actor_id: id,
      title: title || null,
      sort_order: nextSortOrder,
    }
    if (youtube_id) insertData.youtube_id = youtube_id
    if (r2_key) {
      insertData.r2_key = r2_key
      insertData.video_type = video_type || 'reel'
      insertData.is_public = false
      insertData.uploaded_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('actor_videos')
      .insert(insertData)
      .select('id')
      .maybeSingle()

    if (error || !data) {
      console.error('[videos POST] DB 오류:', error?.message)
      return NextResponse.json({ error: '영상 추가에 실패했습니다.' }, { status: 500 })
    }
    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[POST /api/actors/[id]/videos]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
