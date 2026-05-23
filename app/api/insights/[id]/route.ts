import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

import { SITE_URL } from '@/lib/constants'

// 인사이트 PATCH/DELETE 레이트 리밋 (admin 전용이지만 세션 탈취 방어)
const insightMutateMap = new Map<string, number>()
const INSIGHT_COOLDOWN_MS = 5_000
const ALLOWED_ORIGINS = new Set([
  SITE_URL,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : SITE_URL
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}

function withCors(res: NextResponse, origin: string | null) {
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profileErr || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return { userId: user.id }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/insights/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('origin')
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return withCors(auth, origin)
    const { userId: insightUserId } = auth as { userId: string }
    const nowIM = Date.now()
    const lastIM = insightMutateMap.get(insightUserId) ?? 0
    if (nowIM - lastIM < INSIGHT_COOLDOWN_MS) {
      return withCors(NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 }), origin)
    }
    insightMutateMap.set(insightUserId, nowIM)
    if (insightMutateMap.size > 200) {
      const cutoffIM = nowIM - INSIGHT_COOLDOWN_MS
      for (const [k, v] of insightMutateMap) { if (v < cutoffIM) insightMutateMap.delete(k) }
    }

    const { id } = await params
    if (!UUID_RE.test(id)) {
      return withCors(NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 }), origin)
    }
    const clInsightPatch = parseInt(request.headers.get('content-length') ?? '0', 10)
    if (clInsightPatch > 4_096) {
      return withCors(NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 }), origin)
    }
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return withCors(NextResponse.json({ error: '잘못된 요청' }, { status: 400 }), origin)
    }

    // InsightCategory 타입과 동기화 (lib/types.ts) — '전체'는 필터 전용이므로 제외
    const VALID_INSIGHT_CATEGORIES = new Set(['연기', '비즈니스', '크리에이티브', '디자인', '기술', '라이프', '기타'])

    const updates: Record<string, unknown> = {}
    if (typeof body.is_favorite === 'boolean') updates.is_favorite = body.is_favorite
    if (typeof body.memo === 'string') updates.memo = body.memo.slice(0, 2000)
    if (typeof body.category === 'string' && VALID_INSIGHT_CATEGORIES.has(body.category)) updates.category = body.category

    if (Object.keys(updates).length === 0) {
      return withCors(NextResponse.json({ error: '수정할 필드가 없습니다.' }, { status: 400 }), origin)
    }

    const { data, error } = await supabaseAdmin
      .from('insights')
      .update(updates)
      .eq('id', id)
      .select('id, url, title, description, image_url, memo, category, tags, source_type, is_favorite, created_at')
      .maybeSingle()

    if (error) {
      console.error('[insights/[id] PATCH]', error.message)
      return withCors(NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 }), origin)
    }
    if (!data) return withCors(NextResponse.json({ error: '인사이트를 찾을 수 없습니다.' }, { status: 404 }), origin)

    return withCors(NextResponse.json(data), origin)
  } catch (err) {
    console.error('[PATCH /api/insights/[id]] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return withCors(NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 }), origin)
  }
}

// DELETE /api/insights/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('origin')
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return withCors(auth, origin)
    const { userId: insightDelUserId } = auth as { userId: string }
    const nowDel = Date.now()
    if (nowDel - (insightMutateMap.get(insightDelUserId) ?? 0) < INSIGHT_COOLDOWN_MS) {
      return withCors(NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 }), origin)
    }
    insightMutateMap.set(insightDelUserId, nowDel)

    const { id } = await params
    if (!UUID_RE.test(id)) {
      return withCors(NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 }), origin)
    }

    const { data: deleted, error } = await supabaseAdmin.from('insights').delete().eq('id', id).select('id').maybeSingle()

    if (error) {
      console.error('[insights/[id] DELETE]', error.message)
      return withCors(NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 }), origin)
    }
    if (!deleted) return withCors(NextResponse.json({ error: '인사이트를 찾을 수 없습니다.' }, { status: 404 }), origin)

    return withCors(NextResponse.json({ ok: true }), origin)
  } catch (err) {
    console.error('[DELETE /api/insights/[id]] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return withCors(NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 }), origin)
  }
}
