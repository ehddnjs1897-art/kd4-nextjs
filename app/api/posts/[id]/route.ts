import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Params = Promise<{ id: string }>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/posts/[id] — 조회수 +1 포함
export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 게시글 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 조회수 증가는 board/[id]/page.tsx 서버 컴포넌트에서만 수행
    // (API GET은 외부 호출도 가능 → 여기서 increment하면 이중 집계)
    return NextResponse.json(post)
  } catch (err) {
    console.error('[GET /api/posts/[id]]', err)
    return NextResponse.json({ error: '게시글 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PATCH /api/posts/[id] — 본인 또는 admin만
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: '잘못된 게시글 ID입니다.' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // post + profile 병렬 조회 (둘 다 supabaseAdmin — RLS 우회, .maybeSingle()으로 PGRST116 로그 노이즈 방지)
  const [{ data: post, error: fetchError }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('posts').select('author_id').eq('id', id).maybeSingle(),
    supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
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
    // '공지' 카테고리는 관리자만 설정 가능 (API 레벨 강제)
    if (body.category === '공지' && !isAdmin) {
      return NextResponse.json({ error: '공지 카테고리는 관리자만 사용할 수 있습니다.' }, { status: 403 })
    }
    updates.category = body.category
  }

  // supabaseAdmin 사용 — 위에서 소유권 확인 완료, RLS가 업데이트를 막지 않도록
  const { error: updateError } = await supabaseAdmin
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
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 게시글 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // post + profile 병렬 조회 (둘 다 supabaseAdmin — RLS 우회, .maybeSingle()으로 PGRST116 로그 노이즈 방지)
    const [{ data: post, error: fetchError }, { data: profile }] = await Promise.all([
      supabaseAdmin.from('posts').select('author_id').eq('id', id).maybeSingle(),
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])

    if (fetchError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const isAdmin = profile?.role === 'admin'
    if (post.author_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    // supabaseAdmin 사용 — 위에서 소유권 확인 완료, RLS가 삭제를 막지 않도록
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/posts/[id]]', err)
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
