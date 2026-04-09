import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

// DELETE /api/comments/[id] — 본인 또는 admin만
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', id)
    .single()

  if (fetchError || !comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (comment.author_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
