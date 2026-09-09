/**
 * 토스플레이스(토스 사장님 포스) Open API → 노션 「🎓 KD4 수강 현황」 자동 기입 공용 로직
 * 2026-09-10 대표 지시 "현금영수증 발행/미발행 손으로 채우기 싫다, 토스사장님 연동" 구현.
 *
 * 흐름: 주문 목록(from~to, 결제 변동 기준) → 주문별 결제 상세 → 노션 행 매칭(금액·월·결제일·연락처 뒷4자리)
 *      → 결제수단·결제일(비어있을 때만)·승인번호·현금영수증번호·영수증발행일 기입.
 * 사용처: scripts/tossplace-sync.ts (CLI, 일 1회 대사) · app/api/tossplace/webhook/route.ts (실시간)
 *
 * 문서: https://docs.tossplace.com/reference/open-api/payment.html
 *      https://docs.tossplace.com/reference/open-api/order/order-methods.html
 * ⚠️ 응답 필드명은 문서 기준 추정 포함(현금영수증 객체 키 등) — 첫 실데이터로 검증 후 고정할 것.
 */

export type TossCashReceipt = {
  issuerType?: string // CONSUMER | BUSINESSES
  issuanceType?: string // PHONE | BUSINESS_NUMBER | CARD
  identityNumber?: string
  issueNumber?: string
  issuedAt?: string
}
export type TossPayment = {
  id: string
  orderId?: string
  merchantId?: number | string
  state?: string // APPROVED | CANCELLED
  amount?: number
  approvedNo?: string
  approvedAt?: string
  cancelledAt?: string
  createdAt?: string
  sourceType?: string // CASH | CARD | PREPAID_VALUE | ACCOUNT_TRANSFER | BARCODE | EXTERNAL
  paymentMethod?: string
  cashReceipt?: TossCashReceipt | null
  [k: string]: unknown
}
export type SyncResult = {
  status: 'matched' | 'unmatched' | 'ambiguous' | 'skipped' | 'cancelled' | 'error'
  paymentId: string
  amount?: number
  approvedAt?: string
  sourceType?: string
  receipt?: string
  page?: { id: string; name: string }
  candidates?: string[]
  note?: string
}

const NOTION_DS = 'cf2db178-c407-48d1-ae9e-96a45b5e8a23' // 🎓 KD4 수강 현황
const NOTION_VER = '2025-09-03'
const TOSS_BASE = () => (process.env.TOSSPLACE_BASE_URL || 'https://open-api.tossplace.com/api-public/openapi/v1').replace(/\/$/, '')

function tossHeaders() {
  const ak = process.env.TOSSPLACE_ACCESS_KEY, sk = process.env.TOSSPLACE_SECRET_KEY
  if (!ak || !sk) throw new Error('TOSSPLACE_ACCESS_KEY / TOSSPLACE_SECRET_KEY 미설정')
  return { 'x-access-key': ak, 'x-secret-key': sk, 'Content-Type': 'application/json' }
}
function merchantId(override?: string) {
  const m = override || process.env.TOSSPLACE_MERCHANT_ID
  if (!m) throw new Error('TOSSPLACE_MERCHANT_ID(매장고유번호) 미설정')
  return m
}
function ts(d: Date) {
  return (process.env.TOSSPLACE_TS_FORMAT || 'ms') === 'iso' ? d.toISOString() : String(d.getTime())
}
async function tossGet<T>(path: string, params?: Record<string, string>, mid?: string): Promise<T> {
  const url = new URL(`${TOSS_BASE()}/merchants/${merchantId(mid)}${path}`)
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v)
  const r = await fetch(url, { headers: tossHeaders() })
  if (!r.ok) throw new Error(`토스플레이스 ${r.status} ${path}: ${(await r.text()).slice(0, 200)}`)
  return (await r.json()) as T
}

/** 기간 내 결제 변동이 있는 주문 목록 (페이지 순회) */
export async function listOrders(from: Date, to: Date): Promise<Array<{ id?: string; orderId?: string; [k: string]: unknown }>> {
  const out: Array<{ id?: string; orderId?: string }> = []
  for (let page = 1; page <= 50; page++) {
    const res = await tossGet<unknown>('/order/orders', { from: ts(from), to: ts(to), page: String(page), size: '100' })
    const arr = Array.isArray(res) ? res : ((res as { content?: unknown[]; data?: unknown[] }).content || (res as { data?: unknown[] }).data || [])
    out.push(...(arr as Array<{ id?: string; orderId?: string }>))
    if (arr.length < 100) break
  }
  return out
}
export async function paymentsByOrder(orderId: string): Promise<TossPayment[]> {
  const res = await tossGet<unknown>('/payment/payments/by-order-id', { orderId })
  return (Array.isArray(res) ? res : (res as { content?: TossPayment[] }).content || []) as TossPayment[]
}
export async function getPayment(paymentId: string, mid?: string): Promise<TossPayment> {
  return tossGet<TossPayment>(`/payment/payments/${paymentId}`, undefined, mid)
}

/** 응답의 현금영수증 객체 키가 문서마다 다를 수 있어 방어적으로 추출 */
export function pickReceipt(p: TossPayment): TossCashReceipt | undefined {
  const c = (p.cashReceipt || (p as Record<string, unknown>).cashReceiptDetails || (p as Record<string, unknown>).receipt) as TossCashReceipt | undefined
  return c && (c.issueNumber || c.identityNumber) ? c : undefined
}
const METHOD: Record<string, string> = { CARD: '카드', CASH: '현금', ACCOUNT_TRANSFER: '계좌이체' }
const kstDate = (iso?: string) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10) : undefined)
const monthOf = (d: string) => d.slice(0, 7)
const prevMonth = (m: string) => { const [y, mo] = m.split('-').map(Number); return `${mo === 1 ? y - 1 : y}-${String(mo === 1 ? 12 : mo - 1).padStart(2, '0')}` }

/* ── Notion ─────────────────────────────────────────────────────────── */
function notionHeaders() {
  const t = process.env.NOTION_TOKEN
  if (!t) throw new Error('NOTION_TOKEN 미설정')
  return { Authorization: `Bearer ${t}`, 'Notion-Version': NOTION_VER, 'Content-Type': 'application/json' }
}
type NotionPage = { id: string; properties: Record<string, any> }
const txt = (p: any) => (p?.title || p?.rich_text || []).map((t: any) => t.plain_text).join('')

async function candidatesFor(amount: number, dateKst: string): Promise<NotionPage[]> {
  const m = monthOf(dateKst)
  const body = {
    page_size: 100,
    filter: { and: [{ property: '금액', number: { equals: amount } }, { or: [{ property: '월', select: { equals: m } }, { property: '월', select: { equals: prevMonth(m) } }] }] },
  }
  const r = await fetch(`https://api.notion.com/v1/data_sources/${NOTION_DS}/query`, { method: 'POST', headers: notionHeaders(), body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`Notion query ${r.status}: ${(await r.text()).slice(0, 200)}`)
  return ((await r.json()).results || []) as NotionPage[]
}

/** 결제 1건을 노션에 반영. apply=false면 판정만(DRY RUN). */
export async function syncPayment(p: TossPayment, apply: boolean): Promise<SyncResult> {
  const base: SyncResult = { status: 'skipped', paymentId: p.id, amount: p.amount, approvedAt: p.approvedAt, sourceType: p.sourceType }
  if (p.state && p.state !== 'APPROVED') return { ...base, status: 'cancelled', note: p.state }
  if (!p.amount || p.amount <= 0) return { ...base, note: '금액 없음' }
  const dateKst = kstDate(p.approvedAt || p.createdAt) || new Date().toISOString().slice(0, 10)
  const receipt = pickReceipt(p)
  base.receipt = receipt?.issueNumber
  const phoneTail = (receipt?.identityNumber || '').replace(/\D/g, '').slice(-4)

  let cands = await candidatesFor(p.amount, dateKst)
  // 1차: 이미 같은 승인번호가 박힌 행 = 처리 완료
  const done = cands.find((c) => p.approvedNo && txt(c.properties['승인번호']) === p.approvedNo)
  if (done) return { ...base, status: 'skipped', page: { id: done.id, name: txt(done.properties['이름']) }, note: '이미 기입됨' }
  // 2차: 승인번호 비어있는 행만 · 결제일 ±7일 · 연락처 뒷4자리
  cands = cands.filter((c) => !txt(c.properties['승인번호']))
  const near = cands.filter((c) => { const d = c.properties['결제일']?.date?.start; return !d || Math.abs((Date.parse(d) - Date.parse(dateKst)) / 864e5) <= 7 })
  if (near.length) cands = near
  if (phoneTail && cands.length > 1) {
    const byPhone = cands.filter((c) => ((c.properties['연락처']?.phone_number || '') as string).replace(/\D/g, '').endsWith(phoneTail))
    if (byPhone.length) cands = byPhone
  }
  const names = cands.map((c) => txt(c.properties['이름']))
  if (cands.length === 0) return { ...base, status: 'unmatched' }
  if (cands.length > 1) return { ...base, status: 'ambiguous', candidates: names }

  const page = cands[0]
  const props: Record<string, unknown> = {}
  const method = METHOD[p.sourceType || '']
  if (method && !page.properties['결제수단']?.select) props['결제수단'] = { select: { name: method } }
  if (!page.properties['결제일']?.date) props['결제일'] = { date: { start: dateKst } }
  if (p.approvedNo) props['승인번호'] = { rich_text: [{ text: { content: String(p.approvedNo) } }] }
  if (receipt?.issueNumber) props['현금영수증번호'] = { rich_text: [{ text: { content: String(receipt.issueNumber) } }] }
  if (receipt?.issuedAt) props['영수증발행일'] = { date: { start: kstDate(receipt.issuedAt) } }
  if (apply && Object.keys(props).length) {
    const r = await fetch(`https://api.notion.com/v1/pages/${page.id}`, { method: 'PATCH', headers: notionHeaders(), body: JSON.stringify({ properties: props }) })
    if (!r.ok) return { ...base, status: 'error', page: { id: page.id, name: names[0] }, note: `Notion PATCH ${r.status}` }
  }
  return { ...base, status: 'matched', page: { id: page.id, name: names[0] }, note: apply ? Object.keys(props).join(',') : 'DRY RUN' }
}

/** 기간 전수 동기화 — 주문→결제→노션. 결제 ID 중복 제거. */
export async function syncRange(from: Date, to: Date, apply: boolean): Promise<SyncResult[]> {
  const orders = await listOrders(from, to)
  const seen = new Set<string>()
  const results: SyncResult[] = []
  for (const o of orders) {
    const oid = (o.orderId || o.id) as string | undefined
    if (!oid) continue
    let pays: TossPayment[] = []
    try { pays = await paymentsByOrder(oid) } catch (e) { results.push({ status: 'error', paymentId: `order:${oid}`, note: String(e).slice(0, 120) }); continue }
    for (const p of pays) {
      if (!p.id || seen.has(p.id)) continue
      seen.add(p.id)
      try { results.push(await syncPayment(p, apply)) } catch (e) { results.push({ status: 'error', paymentId: p.id, note: String(e).slice(0, 120) }) }
    }
  }
  return results
}
