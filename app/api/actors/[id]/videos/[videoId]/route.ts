/**
 * DELETE /api/actors/[id]/videos/[videoId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'
import { deleteVideo, isR2Configured } from '@/lib/r2'

type Ctx = { params: Promise<{ id: string; videoId: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 레이트 리밋: 5분 내 10회 초과 차단 (R2 삭제 API 남용 방어)
const videoDeleteMap = new Map<string, number[]>()
const VIDEO_DELETE_WINDOW_MS = 5 * 60_000
const VIDEO_DELETE_MAX = 10

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { id, videoId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(videoId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    // 레이트 리밋 적용
    const nowVD = Date.now()
    const timesVD = (videoDeleteMap.get(user.id) ?? []).filter(t => nowVD - t < VIDEO_DELETE_WINDOW_MS)
    if (timesVD.length >= VIDEO_DELETE_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    videoDeleteMap.set(user.id, [...timesVD, nowVD])
    if (videoDeleteMap.size > 2000) {
      const cutoffVD = nowVD - VIDEO_DELETE_WINDOW_MS
      for (const [k, v] of videoDeleteMap) { if (v.every(t => t < cutoffVD)) videoDeleteMap.delete(k) }
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).maybeSingle()
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // R2 key 먼저 조회 — 삭제 후 key를 알 수 없으므로 선조회 필수
    const { data: videoRow } = await supabaseAdmin
      .from('actor_videos').select('r2_key').eq('id', videoId).eq('actor_id', id).maybeSingle()
    if (!videoRow) return NextResponse.json({ error: '영상을 찾을 수 없습니다.' }, { status: 404 })

    const { error } = await supabaseAdmin.from('actor_videos').delete().eq('id', videoId).eq('actor_id', id)
    if (error) {
      console.error('[videos DELETE] DB 오류:', error.message)
      return NextResponse.json({ error: '영상 삭제에 실패했습니다.' }, { status: 500 })
    }

    // R2 파일 삭제 (DB 삭제 성공 후 — 실패해도 클라이언트에 영향 없음)
    if (videoRow.r2_key && isR2Configured()) {
      try { await deleteVideo(videoRow.r2_key) } catch (e) {
        // R2 키 전체 노출 방지: 앞 40자만 로깅
        const truncatedKey = videoRow.r2_key ? videoRow.r2_key.slice(0, 40) + (videoRow.r2_key.length > 40 ? '…' : '') : '(없음)'
        console.error('[videos DELETE] R2 삭제 실패 (무시):', truncatedKey, e instanceof Error ? e.message : String(e))
      }
    }

    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/actors/[id]/videos/[videoId]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
