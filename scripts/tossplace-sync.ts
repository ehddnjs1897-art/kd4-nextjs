/**
 * 토스플레이스(사장님 포스) 결제·현금영수증 → 노션 수강현황 대사 CLI
 * 2026-09-10 신설. 공용 로직은 lib/tossplace.ts. 실시간 웹훅은 app/api/tossplace/webhook/route.ts.
 *
 * 사용:
 *   npx tsx scripts/tossplace-sync.ts                          # DRY RUN — 어제 00:00 ~ 지금, 판정만 (기본)
 *   npx tsx scripts/tossplace-sync.ts --apply                  # 실제 노션 기입
 *   npx tsx scripts/tossplace-sync.ts --from 2026-09-01 --to 2026-09-10 --apply
 *   npx tsx scripts/tossplace-sync.ts --payment <결제ID> --apply   # 단건
 *   npx tsx scripts/tossplace-sync.ts --check                  # 키·매장 연결만 확인(주문 1건 조회)
 *
 * 필요 env(.env.local): TOSSPLACE_ACCESS_KEY · TOSSPLACE_SECRET_KEY · TOSSPLACE_MERCHANT_ID · NOTION_TOKEN
 *   선택: TOSSPLACE_BASE_URL · TOSSPLACE_TS_FORMAT(ms|iso, 기본 ms)
 * 동작: 킬스위치(~/.claude/flags/agent-halt) 있으면 중단 · 결과를 04-ops/logs/tossplace-sync.log 에 append
 *   매칭 못 한 건(unmatched/ambiguous)은 요약에 이름 후보와 함께 출력 — 사람이 노션에서 1분 확인.
 * 🚨 문자·알림 발송 없음. 노션 기입만.
 */
import './_loadEnv'
import { existsSync, appendFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'
import { syncRange, syncPayment, getPayment, listOrders, type SyncResult } from '../lib/tossplace'

const argv = process.argv.slice(2)
const flag = (n: string) => argv.includes(n)
const opt = (n: string) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : undefined }
if (flag('--help') || flag('-h')) { console.log(require('fs').readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0) }
if (existsSync(join(homedir(), '.claude/flags/agent-halt'))) { console.log('킬스위치 감지 — 중단'); process.exit(0) }

const apply = flag('--apply')
const LOG = join(homedir(), 'Desktop/KD4-HUB/04-ops/logs/tossplace-sync.log')
const log = (line: string) => { mkdirSync(dirname(LOG), { recursive: true }); appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`) }

async function main() {
  if (flag('--check')) {
    const to = new Date(), from = new Date(to.getTime() - 7 * 864e5)
    const orders = await listOrders(from, to)
    console.log(`✅ 연결 OK — 최근 7일 주문 ${orders.length}건 (매장 ${process.env.TOSSPLACE_MERCHANT_ID})`)
    return
  }
  let results: SyncResult[]
  const pid = opt('--payment')
  if (pid) {
    results = [await syncPayment(await getPayment(pid), apply)]
  } else {
    const to = opt('--to') ? new Date(`${opt('--to')}T23:59:59+09:00`) : new Date()
    const from = opt('--from') ? new Date(`${opt('--from')}T00:00:00+09:00`) : new Date(new Date(to.toISOString().slice(0, 10) + 'T00:00:00+09:00').getTime() - 864e5)
    console.log(`${apply ? '🟢 APPLY' : '🟡 DRY RUN'} · ${from.toISOString().slice(0, 10)} ~ ${to.toISOString().slice(0, 10)}`)
    results = await syncRange(from, to, apply)
  }
  const count = (s: SyncResult['status']) => results.filter((r) => r.status === s).length
  for (const r of results) {
    const line = `${r.status.padEnd(9)} ${r.paymentId} ${r.amount ?? ''}원 ${r.approvedAt?.slice(0, 16) ?? ''} ${r.sourceType ?? ''} 영수증:${r.receipt ?? '-'} → ${r.page?.name ?? ''}${r.candidates ? ' 후보[' + r.candidates.join(',') + ']' : ''} ${r.note ?? ''}`
    console.log((r.status === 'matched' ? '✔ ' : r.status === 'skipped' ? '· ' : '⚠ ') + line)
    log(`${apply ? 'APPLY' : 'DRY'} ${line}`)
  }
  console.log(`\n합계 ${results.length}건 — 기입 ${count('matched')} · 이미됨 ${count('skipped')} · 못찾음 ${count('unmatched')} · 중복후보 ${count('ambiguous')} · 취소 ${count('cancelled')} · 오류 ${count('error')}`)
  if (!apply) console.log('(판정만 했습니다. 실제 기입은 --apply)')
}
main().catch((e) => { console.error('❌', e.message || e); log(`ERROR ${String(e).slice(0, 200)}`); process.exit(1) })
