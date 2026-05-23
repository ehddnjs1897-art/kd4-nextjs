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

// 인메모리 디바운스: 60초 내 재제출 차단 (DB count 쿼리 최소화)
const enrollDebounceMap = new Map<string, number>()
const ENROLL_DEBOUNCE_MS = 60_000

function priceToInt(p?: string): number {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, ''), 10) || 0
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
  
    if (authErr || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
  
    // 바디 크기 제한: 32KB
    const contentLengthE = parseInt(request.headers.get('content-length') ?? '0', 10)
    if (contentLengthE > 32_768) {
      return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
    }

    // 인메모리 디바운스: 60초 내 재제출 차단 (DB count 쿼리 최소화)
    const nowED = Date.now()
    const lastED = enrollDebounceMap.get(user.id) ?? 0
    if (nowED - lastED < ENROLL_DEBOUNCE_MS) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    enrollDebounceMap.set(user.id, nowED)
    if (enrollDebounceMap.size > 1000) {
      for (const [k, v] of enrollDebounceMap) {
        if (nowED - v > ENROLL_DEBOUNCE_MS) enrollDebounceMap.delete(k)
      }
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
    if (class_names.length > 20) {
      return NextResponse.json({ error: '한 번에 최대 20개 클래스까지 신청할 수 있습니다.' }, { status: 400 })
    }
    if (!class_names.every((cn) => typeof cn === 'string')) {
      return NextResponse.json({ error: '잘못된 클래스 데이터입니다.' }, { status: 400 })
    }
    if (!year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
      return NextResponse.json({ error: '수강 월이 올바르지 않습니다.' }, { status: 400 })
    }
    // 월·연도 범위 검증 — 형식은 맞지만 의미 없는 값 차단 (예: 2020-13, 9999-99)
    const ym = year_month.split('-')
    const ymYear = parseInt(ym[0], 10)
    const ymMonth = parseInt(ym[1], 10)
    if (ymMonth < 1 || ymMonth > 12) {
      return NextResponse.json({ error: '수강 월이 올바르지 않습니다. (1~12월)' }, { status: 400 })
    }
    if (ymYear < 2020 || ymYear > new Date().getFullYear() + 2) {
      return NextResponse.json({ error: '수강 연도가 유효하지 않습니다.' }, { status: 400 })
    }
    if (phone) {
      // 길이 선가드 — 대용량 문자열에 .replace() 실행 방지
      if (typeof phone !== 'string' || phone.length > 30) {
        return NextResponse.json({ error: '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)' }, { status: 400 })
      }
      if (!/^01[0-9][\-\s]?\d{3,4}[\-\s]?\d{4}$/.test(phone.replace(/\s/g, ''))) {
        return NextResponse.json({ error: '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)' }, { status: 400 })
      }
    }
  
    // 레이트 리밋: 5분 내 30행 초과 시 차단 (정상 신청 최대 20행/회)
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const { count: recentCount } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', fiveMinAgo)
    if ((recentCount ?? 0) >= 30) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
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
      name: ((profile?.name ?? (user.user_metadata?.name as string) ?? null) as string | null)?.slice(0, 100) ?? null,
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
  } catch (err) {
    console.error('[POST /api/enrollments] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '신청 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
