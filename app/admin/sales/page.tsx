import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchScheduleFromNotion, fetchUnpaidFromNotion } from '@/lib/notion/schedule'
import scheduleByMonth from '@/data/schedule-by-month.json'
import SalesDashboard, {
  type MonthRevenue,
  type ScheduleMap,
  type UnpaidRow,
} from './SalesDashboard'

// 매출 대시보드는 이 이메일로 로그인한 경우에만 열람 가능 (관리자 중에서도 대표 전용)
const ADMIN_SALES_EMAILS = ['uikactors@gmail.com']

export const metadata: Metadata = {
  title: '매출/수강 통합 대시보드 (관리자)',
  description: 'KD4 매출/수강 통합 대시보드 (관리자 전용)',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// 과거 월별 매출 (2025.11 ~ 2026.4) — enrollments엔 2026-05·06만 있으므로 구글시트 과거기록으로 보완
const PAST_REVENUE: Record<string, number> = {
  '25.11': 7740100,
  '25.12': 5272800,
  '26.1': 6035000,
  '26.2': 7204300,
  '26.3': 8510000,
  '26.4': 7972500,
}

// 표시할 월 순서 (오래된 → 최신)
const MONTH_KEYS = ['25.11', '25.12', '26.1', '26.2', '26.3', '26.4', '26.5', '26.6']

const MONTH_LABEL: Record<string, string> = {
  '25.11': '2025년 11월',
  '25.12': '2025년 12월',
  '26.1': '2026년 1월',
  '26.2': '2026년 2월',
  '26.3': '2026년 3월',
  '26.4': '2026년 4월',
  '26.5': '2026년 5월',
  '26.6': '2026년 6월',
}

// year_month (예: '2026-05', '2026-5', '26.5' 등) → 정규화 키 '26.5'
function normalizeYM(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  // 'YYYY-MM' 또는 'YYYY-M'
  let m = s.match(/^(\d{4})[-./](\d{1,2})$/)
  if (m) {
    const yy = m[1].slice(2)
    const mm = String(parseInt(m[2], 10))
    return `${yy}.${mm}`
  }
  // 'YY.MM' / 'YY.M'
  m = s.match(/^(\d{2})[.](\d{1,2})$/)
  if (m) return `${m[1]}.${String(parseInt(m[2], 10))}`
  return null
}

export default async function AdminSalesPage() {
  // 1차 가드: app/admin/layout.tsx에서 로그인 + role=admin 확인 완료
  // 2차 가드: 매출은 대표 이메일만 (admin 권한이라도 이 이메일이 아니면 차단)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_SALES_EMAILS.includes((user.email || '').trim().toLowerCase())) {
    redirect('/admin')
  }

  const enrollRes = await supabaseAdmin
    .from('enrollments')
    .select('name, amount, year_month, class_name, payment_status, paid_at, created_at')
    .limit(2000)

  const rows = enrollRes.error ? [] : enrollRes.data ?? []

  // 월별 매출 집계 (결제완료 건만 매출로 카운트)
  const revByMonth: Record<string, number> = { ...PAST_REVENUE }
  const unpaid: UnpaidRow[] = []

  for (const r of rows) {
    const key = normalizeYM(r.year_month as string)
    const amount = Number(r.amount) || 0
    const paid = r.payment_status === '결제완료'

    if (paid && key) {
      revByMonth[key] = (revByMonth[key] || 0) + amount
    }
    if (!paid) {
      unpaid.push({
        name: (r.name as string) || '이름미상',
        className: (r.class_name as string) || '미지정',
        amount,
        status: (r.payment_status as string) || '결제대기',
      })
    }
  }

  // 만원 단위로 변환한 월별 매출 (프리뷰와 동일하게 막대그래프는 만원 단위)
  const revenue: MonthRevenue[] = MONTH_KEYS.map((k) => ({
    key: k,
    label: MONTH_LABEL[k],
    won: revByMonth[k] || 0,
    man: Math.round((revByMonth[k] || 0) / 10000),
  }))

  // 수강현황 (월별 기수별 명단) — 노션 토큰 있으면 실시간, 없으면 정적 JSON fallback
  // + 노션 실시간 미납 체크 명단 (토큰 없거나 실패 시 null → 카드 숨김)
  const [liveSchedule, notionUnpaid] = await Promise.all([
    fetchScheduleFromNotion(),
    fetchUnpaidFromNotion(),
  ])
  // 노션 실시간이 비어있으면(토큰 없음/0건) 정적 JSON으로 폴백
  const rawSchedule: Record<string, unknown> =
    liveSchedule && Object.keys(liveSchedule).length > 0
      ? liveSchedule
      : (scheduleByMonth as Record<string, unknown>)
  const schedule: ScheduleMap = {}
  for (const [k, v] of Object.entries(rawSchedule)) {
    if (k.startsWith('_')) continue
    // 월 키 형식 통일: 노션 '2026-06' / JSON '26.6' → 모두 '26.6' (MONTH_KEYS 매칭)
    const nk = normalizeYM(k) ?? k
    schedule[nk] = v as Record<string, string[]>
  }

  return (
    <SalesDashboard
      monthKeys={MONTH_KEYS}
      revenue={revenue}
      schedule={schedule}
      unpaid={unpaid}
      notionUnpaid={notionUnpaid}
    />
  )
}
