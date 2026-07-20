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

// 과거 월별 매출 (2025.11 ~ 2026.4) — 구글시트 과거기록. 이후 월은 자동 집계라 여기 추가 금지
const PAST_REVENUE: Record<string, number> = {
  '25.11': 7740100,
  '25.12': 5272800,
  '26.1': 6035000,
  '26.2': 7204300,
  '26.3': 8510000,
  '26.4': 7972500,
}

// 이 시점(2026-06)부터 결제 입력 창구가 노션 수강현황 DB → 매출도 노션이 정본
const NOTION_REVENUE_FROM_IDX = 2026 * 12 + (6 - 1)

// 대표 확정 매출 — 자동집계보다 우선 (2026-07-21 대표: 6월 12,360,000원 확정)
// 노션에 '완납인데 금액 미기재' 행들이 있어 자동합계가 낮게 잡히는 달의 보정값.
// 노션 금액이 다 채워져 자동합계가 이 값에 도달하면 해당 키를 지워도 됨.
const CONFIRMED_REVENUE: Record<string, number> = {
  '26.6': 12360000,
}

// '26.6' 형식 키 → 월 일련번호 (연*12+월-1). 비교/정렬용
function keyIdx(k: string): number {
  const m = k.match(/^(\d{2})\.(\d{1,2})$/)
  return m ? (2000 + Number(m[1])) * 12 + (Number(m[2]) - 1) : -1
}

/**
 * 표시할 월 목록을 2025-11부터 서울 기준 이번 달까지 자동 생성.
 * 노션에 이번 달 이후 매출(다음 달 예약금 등)이 이미 있으면 그 월까지 포함.
 * → 매달 코드 수정 없이 새 달이 자동으로 나타남.
 */
function buildMonths(notionYMs: string[]): { keys: string[]; label: Record<string, string> } {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const cy = Number(parts.find((p) => p.type === 'year')?.value) || new Date().getFullYear()
  const cm = Number(parts.find((p) => p.type === 'month')?.value) || new Date().getMonth() + 1
  let endIdx = cy * 12 + (cm - 1)
  for (const ym of notionYMs) {
    const m = ym.match(/^(\d{4})-(\d{1,2})$/)
    if (m) endIdx = Math.max(endIdx, Number(m[1]) * 12 + (Number(m[2]) - 1))
  }
  const startIdx = 2025 * 12 + (11 - 1) // 2025-11
  const keys: string[] = []
  const label: Record<string, string> = {}
  for (let i = startIdx; i <= endIdx; i++) {
    const y = Math.floor(i / 12)
    const mo = (i % 12) + 1
    const k = `${String(y).slice(2)}.${mo}`
    keys.push(k)
    label[k] = `${y}년 ${mo}월`
  }
  return { keys, label }
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

  // Supabase(결제대기·과도기 매출) + 노션(수강 명단·매출 정본·미납)을 동시 조회
  const [enrollRes, notionData, notionUnpaid] = await Promise.all([
    supabaseAdmin
      .from('enrollments')
      .select('name, amount, year_month, class_name, payment_status, paid_at, created_at')
      .limit(2000),
    fetchScheduleFromNotion(),
    fetchUnpaidFromNotion(),
  ])

  const rows = enrollRes.error ? [] : enrollRes.data ?? []

  // Supabase 월별 매출 (결제완료 건만) + 결제대기 명단
  const supaByMonth: Record<string, number> = {}
  const unpaid: UnpaidRow[] = []

  for (const r of rows) {
    const key = normalizeYM(r.year_month as string)
    const amount = Number(r.amount) || 0
    const paid = r.payment_status === '결제완료'

    if (paid && key) {
      supaByMonth[key] = (supaByMonth[key] || 0) + amount
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

  // 노션 월별 매출 ('2026-07' → '26.7' 키로 정규화)
  const notionRevRaw = notionData?.revenueByMonth ?? {}
  const notionRev: Record<string, number> = {}
  for (const [ym, won] of Object.entries(notionRevRaw)) {
    const k = normalizeYM(ym)
    if (k) notionRev[k] = (notionRev[k] || 0) + won
  }

  // 월 목록: 2025-11 ~ 이번 달 (+노션에 매출 잡힌 미래 월) 자동 생성
  const { keys: monthKeys, label: monthLabel } = buildMonths(Object.keys(notionRevRaw))

  // 월별 매출 — 소스 우선순위:
  //   2026-06부터: 노션 수강현황 DB (결제 입력 정본) → 연동 실패 시 Supabase 폴백
  //   2026-05: Supabase enrollments / 그 이전: 구글시트 과거기록(PAST_REVENUE)
  const revenue: MonthRevenue[] = monthKeys.map((k) => {
    const supa = supaByMonth[k] || 0
    const auto =
      keyIdx(k) >= NOTION_REVENUE_FROM_IDX ? notionRev[k] ?? supa : PAST_REVENUE[k] ?? supa
    const won = CONFIRMED_REVENUE[k] ?? auto
    return { key: k, label: monthLabel[k] ?? k, won, man: Math.round(won / 10000) }
  })

  // 수강현황 (월별 기수별 명단) — 노션 실시간, 비어있으면 정적 JSON fallback
  const liveSchedule = notionData?.schedule ?? null
  const rawSchedule: Record<string, unknown> =
    liveSchedule && Object.keys(liveSchedule).length > 0
      ? liveSchedule
      : (scheduleByMonth as Record<string, unknown>)
  const schedule: ScheduleMap = {}
  for (const [k, v] of Object.entries(rawSchedule)) {
    if (k.startsWith('_')) continue
    // 월 키 형식 통일: 노션 '2026-06' / JSON '26.6' → 모두 '26.6' (monthKeys 매칭)
    const nk = normalizeYM(k) ?? k
    schedule[nk] = v as Record<string, string[]>
  }

  return (
    <SalesDashboard
      monthKeys={monthKeys}
      revenue={revenue}
      schedule={schedule}
      unpaid={unpaid}
      notionUnpaid={notionUnpaid}
      notionLive={!!notionData}
    />
  )
}
