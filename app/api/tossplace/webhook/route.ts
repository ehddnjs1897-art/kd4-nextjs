/**
 * POST /api/tossplace/webhook — 토스플레이스 Open API 웹훅 수신 (결제 발생 즉시 노션 수강현황 기입)
 * 2026-09-10 신설. 공용 로직 lib/tossplace.ts. 일 1회 대사는 scripts/tossplace-sync.ts.
 *
 * 안전장치: TOSSPLACE_WEBHOOK_SECRET 가 없으면 404 — 키 발급 전 배포돼도 아무 일도 안 함.
 * 검증: x-toss-signature = "v1=" + HMAC-SHA256(`${timestamp}.${rawBody}`, secret) (문서: /reference/open-api/webhook.html)
 *      타임스탬프 5분 초과 거부 · x-toss-webhook-id 로 중복 처리 방지(메모리 LRU, 인스턴스 단위)
 * 문서에 결제 이벤트 페이로드가 명시돼 있지 않아 data 안의 결제 ID를 방어적으로 찾는다 → 못 찾으면 200 + 로그.
 * 등록: developers.tossplace.com [내 애플리케이션] → OpenAPI → 웹훅 생성 → URL https://kd4.club/api/tossplace/webhook
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getPayment, syncPayment } from '@/lib/tossplace'

export const runtime = 'nodejs'
const seen = new Map<string, number>() // webhook-id → ts (인스턴스 로컬)

function verify(raw: string, sig: string | null, tsHeader: string | null, secret: string) {
  if (!sig || !tsHeader) return false
  if (Math.abs(Date.now() - Number(tsHeader) * (String(tsHeader).length <= 10 ? 1000 : 1)) > 5 * 60e3) return false
  const expected = createHmac('sha256', secret).update(`${tsHeader}.${raw}`).digest('hex')
  const got = sig.replace(/^v1=/, '')
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}
function findPaymentIds(data: unknown): string[] {
  const ids = new Set<string>()
  const walk = (v: unknown, key = '') => {
    if (!v || typeof v !== 'object') return
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (/^(paymentId|paymentIds)$/.test(k)) (Array.isArray(val) ? val : [val]).forEach((x) => x && ids.add(String(x)))
      else if (k === 'id' && /payment/i.test(key) && typeof val === 'string') ids.add(val)
      else walk(val, k)
    }
  }
  walk(data)
  return [...ids]
}

export async function POST(req: NextRequest) {
  const secret = process.env.TOSSPLACE_WEBHOOK_SECRET
  const raw = await req.text()
  // 시크릿 미설정(설정 중) = 받기만 하고 무시. 404/5xx를 돌려주면 토스가 재전송 반복 후 웹훅을 끌 수 있어 200으로 응답.
  if (!secret) { console.log('[tossplace-webhook] secret 미설정 — 수신만, 처리 안 함', raw.slice(0, 200)); return NextResponse.json({ ok: true, ignored: true }) }
  const ts = req.headers.get('x-toss-timestamp') || req.headers.get('x-toss-webhook-timestamp')
  if (!verify(raw, req.headers.get('x-toss-signature'), ts, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const wid = req.headers.get('x-toss-webhook-id') || ''
  if (wid && seen.has(wid)) return NextResponse.json({ ok: true, dup: true })
  if (wid) { seen.set(wid, Date.now()); if (seen.size > 500) seen.delete(seen.keys().next().value as string) }

  let event: { type?: string; data?: unknown; merchantId?: string | number } = {}
  try { event = JSON.parse(raw) } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  const ids = findPaymentIds(event.data ?? event)
  const mid = event.merchantId != null ? String(event.merchantId) : undefined // 페이로드의 매장 ID 우선 (env 미설정 대비)
  const out: unknown[] = []
  for (const id of ids) {
    try { out.push(await syncPayment(await getPayment(id, mid), true)) }
    catch (e) { out.push({ status: 'error', paymentId: id, note: String(e).slice(0, 120) }) }
  }
  console.log('[tossplace-webhook]', event.type, ids.length ? JSON.stringify(out) : 'no payment id in payload')
  return NextResponse.json({ ok: true, type: event.type, handled: out.length })
}
