/**
 * PATCH /api/admin/actors/[id] — 배우 is_public 토글 (admin 전용)
 *
 * Body: { is_public: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'

// ─── 공통: admin 권한 확인 ───────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 관리자 요청 속도 제한: 5초 냉각
const adminActorPatchMap = new Map<string, number>()
const ADMIN_ACTOR_PATCH_COOLDOWN_MS = 5_000

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // supabaseAdmin으로 조회 — RLS 우회, 실제 DB 값 기준 권한 확인
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileErr || !profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    )
  }

  return { userId: user.id }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  // 5초 냉각
  const { userId: adminActorId } = check as { userId: string }
  const nowAAP = Date.now()
  const lastAAP = adminActorPatchMap.get(adminActorId) ?? 0
  if (nowAAP - lastAAP < ADMIN_ACTOR_PATCH_COOLDOWN_MS) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  adminActorPatchMap.set(adminActorId, nowAAP)
  if (adminActorPatchMap.size > 2000) {
    const cutoffAAP = nowAAP - ADMIN_ACTOR_PATCH_COOLDOWN_MS
    for (const [k, v] of adminActorPatchMap) { if (v < cutoffAAP) adminActorPatchMap.delete(k) }
  }

  try {
    const { id } = await params

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json(
        { error: '유효한 배우 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const cl = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (cl > 256) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
    const body = await request.json()
    const { is_public } = body as { is_public?: unknown }

    if (typeof is_public !== 'boolean') {
      return NextResponse.json(
        { error: 'is_public은 boolean 값이어야 합니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('actors')
      .update({ is_public })
      .eq('id', id)
      .select('id, name, is_public')
      .maybeSingle()

    if (error) {
      console.error('[PATCH /api/admin/actors/[id]] Supabase 오류:', error.message)
      return NextResponse.json(
        { error: '공개 설정 변경에 실패했습니다.' },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
    }

    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ actor: data })
  } catch (err) {
    console.error('[PATCH /api/admin/actors/[id]] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
