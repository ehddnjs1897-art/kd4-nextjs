/**
 * PATCH /api/applications/[id] — 상담 신청 status 변경 (admin 전용)
 *
 * 클라이언트(AdminDashboard)는 historical reasons로 /api/applications 호출하지만
 * 실제 데이터는 consultations 테이블에 누적된다 (광고 랜딩 /join 의 1차 영속 저장소).
 * applications 테이블은 회원가입·일반 신청용으로 분리되어 있다.
 *
 * Body: { status: 'pending' | 'confirmed' | 'completed' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const VALID_STATUSES = ['pending', 'confirmed', 'completed', '대기', '확인', '완료'] as const

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
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  return { userId: user.id }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  const { id } = await params
  const { status } = await request.json().catch(() => ({}))

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: '유효하지 않은 status' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('consultations')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[api/applications PATCH] consultations update 실패:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
