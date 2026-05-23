/**
 * PATCH /api/enrollments/[id]
 * - 수강 상태 변경(확정/휴강/취소): 본인 또는 관리자
 * - 결제 상태 변경(결제대기/결제완료): 관리자만
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const VALID_STATUS = ['확정', '휴강', '취소']
const VALID_PAYMENT = ['결제대기', '결제완료']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 레이트 리밋: 30초 냉각 (과도한 상태 변경 방지)
const enrollmentPatchMap = new Map<string, number>()
const ENROLLMENT_PATCH_COOLDOWN_MS = 30_000

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 수강 ID입니다.' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 30초 냉각
    const nowEP = Date.now()
    const lastEP = enrollmentPatchMap.get(user.id) ?? 0
    if (nowEP - lastEP < ENROLLMENT_PATCH_COOLDOWN_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    enrollmentPatchMap.set(user.id, nowEP)

    let body: { status?: string; payment_status?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    // 대상 수강 기록 + 권한 확인 병렬 조회
    const [{ data: enr }, { data: profile }] = await Promise.all([
      supabaseAdmin.from('enrollments').select('user_id').eq('id', id).maybeSingle(),
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])
    if (!enr) {
      return NextResponse.json({ error: '수강 기록을 찾을 수 없습니다.' }, { status: 404 })
    }
    const isAdmin = profile?.role === 'admin'
    const isOwner = enr.user_id === user.id
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const update: Record<string, unknown> = {}

    // 수강 상태 — 본인/관리자 (단, '확정' 설정은 관리자만 — 본인은 '휴강'/'취소'만 가능)
    if (body.status !== undefined) {
      if (!VALID_STATUS.includes(body.status)) {
        return NextResponse.json({ error: '잘못된 수강 상태입니다.' }, { status: 400 })
      }
      if (body.status === '확정' && !isAdmin) {
        return NextResponse.json({ error: '확정 상태는 관리자만 설정할 수 있습니다.' }, { status: 403 })
      }
      update.status = body.status
    }

    // 결제 상태 — 관리자만
    if (body.payment_status !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: '결제 상태는 관리자만 변경할 수 있습니다.' }, { status: 403 })
      }
      if (!VALID_PAYMENT.includes(body.payment_status)) {
        return NextResponse.json({ error: '잘못된 결제 상태입니다.' }, { status: 400 })
      }
      update.payment_status = body.payment_status
      update.paid_at = body.payment_status === '결제완료' ? new Date().toISOString() : null
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('enrollments').update(update).eq('id', id)
    if (error) {
      console.error('[PATCH /api/enrollments/[id]]', error.message)
      return NextResponse.json({ error: '변경 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/enrollments/[id]] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
