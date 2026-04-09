import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/comments — 로그인 필요
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { post_id?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const { post_id, content } = body

  if (!post_id) {
    return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 })
  }
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
  }

  // 게시글 존재 확인
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', post_id)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  // 작성자 이름 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const authorName = profile?.name ?? user.email?.split('@')[0] ?? '익명'

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id,
      content: content.trim(),
      author_id: user.id,
      author_name: authorName,
    })
    .select('id, post_id, author_id, author_name, content, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
