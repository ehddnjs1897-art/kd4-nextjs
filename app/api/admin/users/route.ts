/**
 * GET  /api/admin/users  — 전체 회원 목록 (admin 전용)
 * PATCH /api/admin/users  — 회원 역할 변경 (admin 전용)
 *
 * Body (PATCH): { id: string, role: 'user' | 'editor' | 'admin' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const VALID_ROLES = ['user', 'editor', 'admin'] as const
type ValidRole = (typeof VALID_ROLES)[number]

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

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    )
  }

  return { userId: user.id }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, created_at, actor_id')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/admin/users] Supabase 오류:', error.message)
      return NextResponse.json(
        { error: '회원 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: data ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/users] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  try {
    const body = await request.json()
    const { id, role } = body as { id?: string; role?: string }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: '유효한 사용자 ID가 필요합니다.' },
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
      .single()

    if (error) {
      console.error('[PATCH /api/admin/users] Supabase 오류:', error.message)
      return NextResponse.json(
        { error: '역할 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('[PATCH /api/admin/users] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
