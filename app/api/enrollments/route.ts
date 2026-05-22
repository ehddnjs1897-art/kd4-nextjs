/**
 * POST /api/enrollments
 * 로그인한 멤버의 수강 신청 / 이어서 수강 / 다른 클래스 추가.
 *
 * - 금액(amount)은 클라이언트를 신뢰하지 않고 서버에서 lib/classes.ts 기준으로 주입.
 * - user_id는 항상 로그인 세션에서 강제 → 본인 명의로만 신청 가능.
 * - 같은 (user_id, class_name, year_month) 중복은 무시(이미 신청한 달/클래스).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CLASSES } from '@/lib/classes'

const VALID_TYPES = ['신규 등록', '수업 유지', '클래스 추가·변경', '퍼스널 브랜딩 서비스']

function priceToInt(p?: string): number {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, ''), 10) || 0
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: {
    enrollment_type?: string
    class_names?: string[]
    year_month?: string
    phone?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { enrollment_type, class_names, year_month, phone } = body

  if (!enrollment_type || !VALID_TYPES.includes(enrollment_type)) {
    return NextResponse.json({ error: '신청 유형을 선택해 주세요.' }, { status: 400 })
  }
  if (!Array.isArray(class_names) || class_names.length === 0) {
    return NextResponse.json({ error: '수강할 클래스를 선택해 주세요.' }, { status: 400 })
  }
  if (!year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
    return NextResponse.json({ error: '수강 월이 올바르지 않습니다.' }, { status: 400 })
  }

  // 프로필 (이름·이메일·연락처·배우 연결)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, email, phone, actor_id')
    .eq('id', user.id)
    .maybeSingle()

  const baseRow = {
    user_id: user.id,
    actor_id: profile?.actor_id ?? null,
    name: profile?.name ?? (user.user_metadata?.name as string) ?? null,
    phone: phone || profile?.phone || null,
    email: user.email ?? profile?.email ?? null,
    enrollment_type,
    year_month,
    status: '확정',
    payment_status: '결제대기',
  }

  let rows: (typeof baseRow & { class_name: string; amount: number })[]

  if (enrollment_type === '수업 유지') {
    // 수업 유지는 현재 클래스를 그대로 연장 — 관리자가 실제 클래스를 확인 후 처리
    rows = [{ ...baseRow, class_name: '수업 유지', amount: 0 }]
  } else {
    // 유효 클래스만 추려서 서버에서 금액 주입
    rows = class_names
      .map((cn) => CLASSES.find((c) => c.nameKo === cn))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((cls) => ({
        ...baseRow,
        class_name: cls.nameKo,
        amount: priceToInt(cls.originalPrice ?? cls.price),
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: '유효한 클래스가 없습니다.' }, { status: 400 })
    }
  }

  // 중복(같은 달·같은 클래스)은 무시
  const { error } = await supabaseAdmin
    .from('enrollments')
    .upsert(rows, { onConflict: 'user_id,class_name,year_month', ignoreDuplicates: true })

  if (error) {
    console.error('[POST /api/enrollments]', error.message)
    return NextResponse.json({ error: '신청 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
