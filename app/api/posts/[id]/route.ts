import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Params = Promise<{ id: string }>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET IP 레이트 리밋: 60 req/min
const postDetailGetMap = new Map<string, { count: number; resetAt: number }>()
const POST_DETAIL_GET_LIMIT = 60
const POST_DETAIL_GET_WINDOW_MS = 60_000

// DELETE 레이트 리밋: 10 req/min (스팸 방지)
const postDeleteMap = new Map<string, number[]>()
const POST_DELETE_MAX = 10
const POST_DELETE_WINDOW_MS = 60_000

// PATCH 레이트 리밋: 10초 쿨다운 (스팸 DB 쓰기 방지)
const postPatchMap = new Map<string, number>()
const POST_PATCH_COOLDOWN_MS = 10_000

// GET /api/posts/[id] — 조회수 +1 포함
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 게시글 ID입니다.' }, { status: 400 })
    }
    // IP 레이트 리밋: 1분 60회 초과 차단
    // x-real-ip만 사용 — x-forwarded-for는 클라이언트 위조 가능
    const ipPD = request.headers.get('x-real-ip') ?? null
    if (ipPD) {
      const nowPD = Date.now()
      const bucketPD = postDetailGetMap.get(ipPD)
      if (bucketPD && nowPD < bucketPD.resetAt) {
        if (bucketPD.count >= POST_DETAIL_GET_LIMIT) {
          return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
        }
        bucketPD.count++
      } else {
        postDetailGetMap.set(ipPD, { count: 1, resetAt: nowPD + POST_DETAIL_GET_WINDOW_MS })
        if (postDetailGetMap.size > 2000) {
          for (const [k, v] of postDetailGetMap) {
            if (nowPD > v.resetAt) postDetailGetMap.delete(k)
          }
        }
      }
    }
    const supabase = await createClient()
    // 게시판은 회원 전용 — 비로그인 요청 차단
    const { data: { user: postDetailUser } } = await supabase.auth.getUser()
    if (!postDetailUser) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: post, error } = await supabase
      .from('posts')
      .select('id, title, content, category, author_id, author_name, views, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 조회수 증가는 board/[id]/page.tsx 서버 컴포넌트에서만 수행
    // (API GET은 외부 호출도 가능 → 여기서 increment하면 이중 집계)
    return NextResponse.json(post, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[GET /api/posts/[id]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '게시글 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PATCH /api/posts/[id] — 본인 또는 admin만
export async function PATCH(
  request: NextRequest,
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

    // PATCH 레이트 리밋: 10초 쿨다운 (스팸 DB 쓰기 방지)
    const nowPatch = Date.now()
    const lastPatch = postPatchMap.get(user.id) ?? 0
    if (nowPatch - lastPatch < POST_PATCH_COOLDOWN_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    postPatchMap.set(user.id, nowPatch)
    if (postPatchMap.size > 1000) {
      const cutoff = nowPatch - POST_PATCH_COOLDOWN_MS
      for (const [k, v] of postPatchMap) { if (v < cutoff) postPatchMap.delete(k) }
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
      const clPostPatch = parseInt(request.headers.get('content-length') ?? '0', 10)
      if (clPostPatch > 32_768) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
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
  } catch (err) {
    console.error('[PATCH /api/posts/[id]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
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

    // DELETE 레이트 리밋: 1분 10회 초과 차단
    const nowDel = Date.now()
    const timesDel = (postDeleteMap.get(user.id) ?? []).filter(t => nowDel - t < POST_DELETE_WINDOW_MS)
    if (timesDel.length >= POST_DELETE_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    postDeleteMap.set(user.id, [...timesDel, nowDel])
    if (postDeleteMap.size > 1000) {
      const cutoffDel = nowDel - POST_DELETE_WINDOW_MS
      for (const [k, v] of postDeleteMap) { if (v.every(t => t < cutoffDel)) postDeleteMap.delete(k) }
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
    console.error('[DELETE /api/posts/[id]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
