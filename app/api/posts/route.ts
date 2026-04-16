import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET /api/posts?category=일반&page=1&limit=20
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select('id, title, category, author_name, views, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && category !== '전체') {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: '게시글 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { title?: string; content?: string; category?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const { title, content, category = '질문' } = body

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
  }
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }

  const validCategories = ['일반', '공지', '질문', '자유', '수업']
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
  }

  // 작성자 이름 조회 (admin 클라이언트 → RLS 우회)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const authorName = profile?.name ?? user.email?.split('@')[0] ?? '익명'

  // 프로필이 없으면 먼저 생성 (author_id FK 오류 방지)
  if (!profile) {
    const { error: upsertErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: user.id,
        name: authorName,
      },
      { onConflict: 'id' }
    )
    if (upsertErr) {
      console.error('[POST /api/posts] profile upsert error:', upsertErr)
      return NextResponse.json(
        { error: '프로필 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }
  }

  // 게시글 insert (admin → RLS 정책 무관하게 저장)
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: title.trim(),
      content: content.trim(),
      category,
      author_id: user.id,
      author_name: authorName,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[POST /api/posts] insert error:', error)
    return NextResponse.json({ error: error.message ?? '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
