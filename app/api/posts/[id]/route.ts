import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

// GET /api/posts/[id] — 조회수 +1 포함
export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  // 조회수 증가 (SQL로 atomic increment — race condition 방지)
  await supabase.rpc('increment_views', { post_id: id })

  return NextResponse.json({ ...post, views: (post.views ?? 0) + 1 })
}

// PATCH /api/posts/[id] — 본인 또는 admin만
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // post + profile 병렬 조회
  const [{ data: post, error: fetchError }, { data: profile }] = await Promise.all([
    supabase.from('posts').select('author_id').eq('id', id).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (fetchError || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const isAdmin = profile?.role === 'admin'
  if (post.author_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
  }

  let body: { title?: string; content?: string; category?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (body.title?.trim()) {
    if (body.title.trim().length > 200) {
      return NextResponse.json({ error: '제목은 200자 이하로 입력해주세요.' }, { status: 400 })
    }
    updates.title = body.title.trim()
  }
  if (body.content?.trim()) {
    if (body.content.trim().length > 10000) {
      return NextResponse.json({ error: '내용은 10,000자 이하로 입력해주세요.' }, { status: 400 })
    }
    updates.content = body.content.trim()
  }
  if (body.category) {
    const validCategories = ['일반', '공지', '질문', '자유', '수업']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
    }
    updates.category = body.category
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/posts/[id] — 본인 또는 admin만
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

  // post + profile 병렬 조회
  const [{ data: post, error: fetchError }, { data: profile }] = await Promise.all([
    supabase.from('posts').select('author_id').eq('id', id).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (fetchError || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const isAdmin = profile?.role === 'admin'
  if (post.author_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
