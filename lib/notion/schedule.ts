/**
 * 노션 「🎓 KD4 수강 현황」 DB → 월별 수강 데이터 로더
 * ────────────────────────────────────────────────
 * - NOTION_TOKEN 환경변수가 있으면 노션 API(fetch, 패키지 불필요)로 실시간 조회
 * - 없거나 실패하면 null 반환 → 호출측이 기존 정적 JSON으로 fallback (빌드/런타임 안전)
 * - 단방향(노션→웹). ISR revalidate 300s.
 *
 * 활성화: Vercel 환경변수 NOTION_TOKEN 추가 + 수강현황 DB를 인테그레이션에 연결
 *   (가이드: KD4-HUB/04-ops/playbooks/notion-token-setup.md)
 */

const SCHEDULE_DB_ID = 'f8ac0376e1fd4a8f9d9cd560b7b58b92'
const NOTION_VERSION = '2022-06-28'

/** 월 → "수업 기수" → 이름[] */
export type ScheduleByMonth = Record<string, Record<string, string[]>>

type NotionText = { plain_text?: string }
type NotionProp = {
  title?: NotionText[]
  rich_text?: NotionText[]
  select?: { name?: string } | null
  number?: number | null
}
type NotionPage = { properties?: Record<string, NotionProp> }

function plain(arr?: NotionText[]): string {
  return (arr || []).map((t) => t.plain_text || '').join('')
}

export type NotionScheduleData = {
  schedule: ScheduleByMonth
  /**
   * 'YYYY-MM' → 해당 월 금액 합(원). 결제상태 완납·분납 행의 금액만 집계
   * (미납·환불·협찬 제외). 2026-06부터 결제 입력 창구가 이 DB라 매출 정본.
   */
  revenueByMonth: Record<string, number>
}

/**
 * 노션 수강현황 DB를 월별로 그룹해서 반환 (수강 명단 + 월별 매출 합계).
 * 토큰이 없거나 어떤 에러든 발생하면 null (호출측 JSON fallback).
 */
export async function fetchScheduleFromNotion(): Promise<NotionScheduleData | null> {
  const token = process.env.NOTION_TOKEN
  if (!token) return null

  try {
    const pages: NotionPage[] = []
    let cursor: string | undefined
    let guard = 0

    do {
      const res = await fetch(`https://api.notion.com/v1/databases/${SCHEDULE_DB_ID}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
        next: { revalidate: 300 },
      })
      if (!res.ok) return null
      const data = (await res.json()) as {
        results?: NotionPage[]
        has_more?: boolean
        next_cursor?: string
      }
      pages.push(...(data.results || []))
      cursor = data.has_more ? data.next_cursor : undefined
    } while (cursor && ++guard < 50)

    const byMonth: ScheduleByMonth = {}
    const revenueByMonth: Record<string, number> = {}
    for (const p of pages) {
      const pr = p.properties || {}
      const name = plain(pr['이름']?.title)
      const month = pr['월']?.select?.name || ''
      if (!month) continue

      // 매출 집계 — 완납·분납 행의 금액만 (이름 유무와 무관)
      const pay = pr['결제상태']?.select?.name || ''
      const amount = typeof pr['금액']?.number === 'number' ? pr['금액'].number || 0 : 0
      if ((pay === '완납' || pay === '분납') && amount > 0) {
        revenueByMonth[month] = (revenueByMonth[month] || 0) + amount
      }

      if (!name) continue
      const subject = pr['수업']?.select?.name || ''
      const cohort = plain(pr['기수']?.rich_text)
      const key = cohort ? `${subject} ${cohort}` : subject
      byMonth[month] = byMonth[month] || {}
      byMonth[month][key] = byMonth[month][key] || []
      byMonth[month][key].push(name)
    }
    return { schedule: byMonth, revenueByMonth }
  } catch {
    return null
  }
}

/** 노션 실시간 미납 체크 행 (매출 대시보드 「미납 체크」 카드용) */
export type NotionUnpaidItem = {
  name: string
  ban: string
  pay: string
  status: string
  memo: string
  /** 금액(원) — 미납 KPI 합산용. 노션에 비어있으면 0 */
  amount: number
}

/** Asia/Seoul 기준 현재 월 키 'YYYY-MM' (노션 월 select 값과 동일 형식, 예: '2026-06') */
function seoulMonthKey(): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value || ''
  const m = parts.find((p) => p.type === 'month')?.value || ''
  return `${y}-${m}`
}

/**
 * 노션 수강현황 DB에서 현재 월(Asia/Seoul)의 미납 체크 명단을 반환.
 * - 결제상태가 '미납'·'분납' 이거나 상태가 '휴면'인 행만 추림
 * - 토큰이 없거나 어떤 에러든 발생하면 null (호출측에서 카드 숨김)
 */
export async function fetchUnpaidFromNotion(): Promise<{
  month: string
  items: NotionUnpaidItem[]
} | null> {
  const token = process.env.NOTION_TOKEN
  if (!token) return null

  const month = seoulMonthKey()

  try {
    const pages: NotionPage[] = []
    let cursor: string | undefined
    let guard = 0

    do {
      const body: Record<string, unknown> = {
        page_size: 100,
        filter: { property: '월', select: { equals: month } },
      }
      if (cursor) body.start_cursor = cursor
      const res = await fetch(`https://api.notion.com/v1/databases/${SCHEDULE_DB_ID}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        next: { revalidate: 300 },
      })
      if (!res.ok) return null
      const data = (await res.json()) as {
        results?: NotionPage[]
        has_more?: boolean
        next_cursor?: string
      }
      pages.push(...(data.results || []))
      cursor = data.has_more ? data.next_cursor : undefined
    } while (cursor && ++guard < 50)

    const items: NotionUnpaidItem[] = []
    for (const p of pages) {
      const pr = p.properties || {}
      const name = plain(pr['이름']?.title)
      if (!name) continue
      const pay = pr['결제상태']?.select?.name || ''
      const status = pr['상태']?.select?.name || ''
      if (!(pay === '미납' || pay === '분납' || status === '휴면')) continue
      // 반 표기: '반' select가 있으면 그대로 사용 (이미 기수 포함된 이름), 없을 때만 수업+기수 조합
      const banSelect = pr['반']?.select?.name || ''
      const subject = pr['수업']?.select?.name || ''
      const cohort = plain(pr['기수']?.rich_text)
      const ban = banSelect || (cohort ? `${subject} ${cohort}`.trim() : subject)
      const amount = typeof pr['금액']?.number === 'number' ? pr['금액'].number || 0 : 0
      items.push({ name, ban, pay, status, memo: plain(pr['메모']?.rich_text), amount })
    }
    return { month, items }
  } catch {
    return null
  }
}
