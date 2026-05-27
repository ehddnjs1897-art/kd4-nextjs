import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// 인메모리 디바운스 — DB count 경쟁 조건 완화 (동일 유저 30초 내 재전송 차단)
const commentsPostDebounceMap = new Map<string, number>()
const COMMENTS_POST_DEBOUNCE_MS = 30_000

// POST /api/comments — 로그인 필요
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    let body: { post_id?: string; content?: string }
    try {
      const clComments = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
      if (clComments > 8_192) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }

    const { post_id, content } = body

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!post_id || !UUID_RE.test(post_id)) {
      return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 })
    }
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: '댓글은 2,000자 이하로 입력해주세요.' }, { status: 400 })
    }

    // 인메모리 디바운스 — DB count 비원자적 경쟁 조건 완화
    const lastComment = commentsPostDebounceMap.get(user.id) ?? 0
    if (Date.now() - lastComment < COMMENTS_POST_DEBOUNCE_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    commentsPostDebounceMap.set(user.id, Date.now())
    if (commentsPostDebounceMap.size > 2000) {
      const cutoffC = Date.now() - COMMENTS_POST_DEBOUNCE_MS
      for (const [k, v] of commentsPostDebounceMap) {
        if (v < cutoffC) commentsPostDebounceMap.delete(k)
      }
    }

    // 레이트 리밋 + 게시글 존재 + 작성자 이름 — 3개 쿼리 병렬 (순차 1+2 round-trip → 1)
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString()
    const [{ count: recentCommentCount }, { data: post, error: postError }, { data: profile }] = await Promise.all([
      supabaseAdmin.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', user.id).gte('created_at', oneMinAgo),
      supabaseAdmin.from('posts').select('id').eq('id', post_id).maybeSingle(),
      supabaseAdmin.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    ])
    if ((recentCommentCount ?? 0) >= 10) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (1분 최대 10개)' }, { status: 429 })
    }

    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const authorName = profile?.name ?? '익명'

    // supabaseAdmin: 서비스 롤로 INSERT — RLS 정책 변경에 무관하게 안전하게 작성
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id,
        content: content.trim(),
        author_id: user.id,
        author_name: authorName,
      })
      .select('id, post_id, author_id, author_name, content, created_at')
      .maybeSingle()

    if (error || !data) {
      console.error('[POST /api/comments] insert error:', error?.message)
      return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
    }

    revalidatePath('/board')
    revalidatePath(`/board/${post_id}`)
    return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[POST /api/comments]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '댓글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
