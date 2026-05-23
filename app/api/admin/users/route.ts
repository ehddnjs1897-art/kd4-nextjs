/**
 * GET  /api/admin/users  — 전체 회원 목록 (admin 전용)
 * PATCH /api/admin/users  — 회원 역할 변경 (admin 전용)
 *
 * Body (PATCH): { id: string, role: 'user' | 'editor' | 'admin' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// 'user' 제외 — DB CHECK 제약에 없으며 관리자가 직접 할당하는 역할이 아님
const VALID_ROLES = ['member', 'actor', 'crew_pending', 'crew', 'editor', 'director_pending', 'director', 'admin'] as const
type ValidRole = (typeof VALID_ROLES)[number]
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ─── 공통: admin 권한 확인 ───────────────────────────────────────────────────

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

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  try {
    // 페이지네이션 — 한 번에 최대 500행. page 쿼리로 추가 페이지 조회 가능
    const { searchParams } = new URL(request.url)
    const PAGE_SIZE = 500
    const rawPage = parseInt(searchParams.get('page') ?? '0', 10)
    const page = Math.max(0, Number.isFinite(rawPage) ? rawPage : 0)
    const from = page * PAGE_SIZE

    const { data, error, count } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, created_at, actor_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('[GET /api/admin/users] Supabase 오류:', error.message)
      return NextResponse.json(
        { error: '회원 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE })
  } catch (err) {
    console.error('[GET /api/admin/users] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  let body: { id?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  try {
    const { id, role } = body

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json(
        { error: '유효한 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 자기 자신의 역할 변경 방지 (admin → user 격하 시 관리자 페이지 접근 차단 위험)
    const { userId: adminId } = check as { userId: string }
    if (id === adminId) {
      return NextResponse.json(
        { error: '자기 자신의 역할은 변경할 수 없습니다.' },
        { status: 400 }
      )
    }

    if (!role || !VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json(
        { error: `역할은 ${VALID_ROLES.join(', ')} 중 하나여야 합니다.` },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: role as ValidRole })
      .eq('id', id)
      .select('id, name, email, role')
      .maybeSingle()

    if (error) {
      console.error('[PATCH /api/admin/users] Supabase 오류:', error.message)
      return NextResponse.json(
        { error: '역할 변경에 실패했습니다.' },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('[PATCH /api/admin/users] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
