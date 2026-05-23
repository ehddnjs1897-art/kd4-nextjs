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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 관리자 요청 속도 제한: 5초 냉각
const appPatchMap = new Map<string, number>()
const APP_PATCH_COOLDOWN_MS = 5_000

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
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  return { userId: user.id }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin()
    if (check instanceof NextResponse) return check

    // 5초 냉각
    const { userId: appAdminId } = check as { userId: string }
    const nowAPM = Date.now()
    const lastAPM = appPatchMap.get(appAdminId) ?? 0
    if (nowAPM - lastAPM < APP_PATCH_COOLDOWN_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    appPatchMap.set(appAdminId, nowAPM)
    if (appPatchMap.size > 200) {
      const cutoffAPM = nowAPM - APP_PATCH_COOLDOWN_MS
      for (const [k, v] of appPatchMap) { if (v < cutoffAPM) appPatchMap.delete(k) }
    }

    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '유효하지 않은 ID 형식입니다.' }, { status: 400 })
    }
    const { status } = await request.json().catch(() => ({}))

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 status' }, { status: 400 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('consultations')
      .update({ status })
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[api/applications PATCH] consultations update 실패:', error.message)
      return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
    }
    if (!updated) return NextResponse.json({ error: '상담 신청을 찾을 수 없습니다.' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/applications/[id]] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
