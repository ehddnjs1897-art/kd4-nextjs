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
    if (commentsDeleteMap.size > 1000) {
      const cutoffD = nowD - DELETE_WINDOW_MS
      for (const [k, v] of commentsDeleteMap) {
        if (v.every(t => t < cutoffD)) commentsDeleteMap.delete(k)
      }
    }

    // supabaseAdmin으로 ownership 조회 — RLS가 comments 읽기를 제한해도 본인 글 조회 보장
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('author_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'admin'
    if (comment.author_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    // supabaseAdmin 사용 — TOCTOU 방어: WHERE에 author_id 재포함 (admin 제외)
    // 선-조회와 삭제 사이 author_id가 DB에서 바뀌더라도 원래 작성자만 삭제 가능
    let deleteQuery = supabaseAdmin.from('comments').delete().eq('id', id)
    if (!isAdmin) deleteQuery = deleteQuery.eq('author_id', user.id)
    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/comments/[id]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
