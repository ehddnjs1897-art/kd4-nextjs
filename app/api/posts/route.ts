import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST 엔드포인트 인메모리 유저 디바운스 (30초 — DB count 경쟁 조건 완화)
const postsPostDebounceMap = new Map<string, number>()
const POSTS_POST_DEBOUNCE_MS = 30_000

// GET 엔드포인트 IP 기반 레이트 리밋 (60 req/min — DoS 방어)
const postsGetRateMap = new Map<string, { count: number; resetAt: number }>()
const POSTS_GET_RATE_LIMIT = 60
const POSTS_GET_RATE_WINDOW_MS = 60_000

// GET /api/posts?category=일반&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    // IP 레이트 리밋: 1분 60회 초과 차단 (DoS 방어)
    const ip = request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? null
    if (ip) {
      const now = Date.now()
      const bucket = postsGetRateMap.get(ip)
      if (bucket && now < bucket.resetAt) {
        if (bucket.count >= POSTS_GET_RATE_LIMIT) {
          return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
        }
        bucket.count++
      } else {
        postsGetRateMap.set(ip, { count: 1, resetAt: now + POSTS_GET_RATE_WINDOW_MS })
        // 오래된 항목 정리 (메모리 누수 방지)
        if (postsGetRateMap.size > 2000) {
          for (const [k, v] of postsGetRateMap) {
            if (now > v.resetAt) postsGetRateMap.delete(k)
          }
        }
      }
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    // parseInt → NaN 방어: Math.max/min(NaN) = NaN → .range(NaN,NaN) → DB 500 방지
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
    const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1)
    const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20))
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
      .from('posts')
      .select('id, title, category, author_name, views, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const VALID_CATEGORIES_GET = new Set(['일반', '공지', '질문', '자유', '수업', '전체'])
    if (category && category !== '전체' && VALID_CATEGORIES_GET.has(category)) {
      query = query.eq('category', category)
    }

    // 내 게시글 필터 (UUID 검증 필수)
    const authorId = searchParams.get('author_id')
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (authorId && UUID_RE.test(authorId)) {
      query = query.eq('author_id', authorId)
    }

    // 제목 검색 (ilike — 대소문자 무시, 최대 100자)
    // % 와 _ 이스케이프 — ilike wildcard 남용으로 인한 전체 테이블 스캔 DoS 방지 (insights와 동일 패턴)
    const rawQ = searchParams.get('q')?.trim().slice(0, 100)
    const q = rawQ ? rawQ.replace(/%/g, '\\%').replace(/_/g, '\\_') : rawQ
    if (q) query = query.ilike('title', `%${q}%`)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: '게시글 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data, total: count, page, limit }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[GET /api/posts]', err)
    return NextResponse.json({ error: '게시글 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    let body: { title?: string; content?: string; category?: string }
    try {
      const clPostsPost = parseInt(request.headers.get('content-length') ?? '0', 10)
      if (clPostsPost > 32_768) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }

    const { title, content, category = '질문' } = body
  
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: '제목은 200자 이하로 입력해주세요.' }, { status: 400 })
    }
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
    }
    if (content.trim().length > 10000) {
      return NextResponse.json({ error: '내용은 10,000자 이하로 입력해주세요.' }, { status: 400 })
    }
  
    const validCategories = ['일반', '공지', '질문', '자유', '수업']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: '올바른 카테고리를 선택해주세요.' }, { status: 400 })
    }
  
    // 인메모리 디바운스 — DB count 비원자적 경쟁 조건 완화 (30초 내 재시도 차단)
    const lastPost = postsPostDebounceMap.get(user.id) ?? 0
    if (Date.now() - lastPost < POSTS_POST_DEBOUNCE_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    postsPostDebounceMap.set(user.id, Date.now())
    if (postsPostDebounceMap.size > 1000) {
      const cutoffP = Date.now() - POSTS_POST_DEBOUNCE_MS
      for (const [k, v] of postsPostDebounceMap) {
        if (v < cutoffP) postsPostDebounceMap.delete(k)
      }
    }

    // 레이트 리밋: 1분에 최대 5개 (스팸 방지)
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString()
    const { count: recentPostCount } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .gte('created_at', oneMinAgo)
    if ((recentPostCount ?? 0) >= 5) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (1분 최대 5개)' }, { status: 429 })
    }

    // 작성자 이름 + 역할 조회 (admin 클라이언트 → RLS 우회)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .maybeSingle()

    // '공지' 카테고리는 관리자만 사용 가능 (UI에서도 숨기지만 API 레벨에서도 강제)
    if (category === '공지' && profile?.role !== 'admin') {
      return NextResponse.json({ error: '공지 카테고리는 관리자만 사용할 수 있습니다.' }, { status: 403 })
    }

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
      .maybeSingle()

    if (error || !data) {
      console.error('[POST /api/posts] insert error:', error)
      return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/posts] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
