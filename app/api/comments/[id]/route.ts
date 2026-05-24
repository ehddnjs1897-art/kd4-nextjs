import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Params = Promise<{ id: string }>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// DELETE 레이트 리밋: 1분 내 10회 초과 차단 (대량 삭제 방지)
const commentsDeleteMap = new Map<string, number[]>()
const DELETE_WINDOW_MS = 60_000
const DELETE_MAX = 10

// DELETE /api/comments/[id] — 본인 또는 admin만
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 댓글 ID입니다.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // DELETE 레이트 리밋: 1분 10회 초과 차단
    const nowD = Date.now()
    const deleteTimes = (commentsDeleteMap.get(user.id) ?? []).filter(t => nowD - t < DELETE_WINDOW_MS)
    if (deleteTimes.length >= DELETE_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    commentsDeleteMap.set(user.id, [...deleteTimes, nowD])
    if (commentsDeleteMap.size > 2000) {
      const cutoffD = nowD - DELETE_WINDOW_MS
      for (const [k, v] of commentsDeleteMap) {
        if (v.every(t => t < cutoffD)) commentsDeleteMap.delete(k)
      }
    }

    // supabaseAdmin으로 ownership + 역할 병렬 조회 (Promise.all로 round-trip 1개 절감)
    const [{ data: comment, error: fetchError }, { data: profile }] = await Promise.all([
      supabaseAdmin.from('comments').select('author_id').eq('id', id).maybeSingle(),
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])

    if (fetchError || !comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const isAdmin = profile?.role === 'admin'
    if (comment.author_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    // supabaseAdmin 사용 — TOCTOU 방어 + .select로 rows-affected 확인 (silent no-op 방지)
    const { data: deleted, error: deleteError } = await (
      isAdmin
        ? supabaseAdmin.from('comments').delete().eq('id', id)
        : supabaseAdmin.from('comments').delete().eq('id', id).eq('author_id', user.id)
    ).select('id').maybeSingle()

    if (deleteError) {
      console.error('[DELETE /api/comments/[id]] deleteError:', deleteError.message)
      return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }
    if (!deleted) {
      return NextResponse.json({ error: '댓글을 찾을 수 없거나 이미 삭제되었습니다.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/comments/[id]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
