/**
 * PATCH /api/admin/actors/[id] — 배우 is_public 토글 (admin 전용)
 *
 * Body: { is_public: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

// ─── PATCH ───────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: '유효한 배우 ID가 필요합니다.' },
        { status: 400 }
      )
    }

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
      .single()

    if (error) {
      console.error('[PATCH /api/admin/actors/[id]] Supabase 오류:', error.message)
      return NextResponse.json(
        { error: '공개 설정 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ actor: data })
  } catch (err) {
    console.error('[PATCH /api/admin/actors/[id]] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
