/**
 * 일괄 문자 발송기 — Solapi 직발송 (Make 경유 1통씩 호출 대체)
 * 2026-08-19 대표 지시 "메이크로 하나씩 보내는 거 너무 느려, 일괄로 할 수 있는 방법" 구현.
 *
 * 입력: JSON 파일 — [{ "name": "홍길동", "phone": "010-1234-5678", "text": "본문..." }, ...]
 *   (name은 로그용. text는 사람별로 완성된 본문 — 치환은 호출 측에서 끝내고 넘길 것)
 *
 * 사용:
 *   npx tsx scripts/bulk-sms.ts <목록.json>            # DRY RUN — 미리보기만, 발송 안 함 (기본)
 *   npx tsx scripts/bulk-sms.ts <목록.json> --send     # 실제 발송 (대표 "보내" 승인 후에만)
 *   npx tsx scripts/bulk-sms.ts <목록.json> --send --at "2026-08-20T11:00:00+09:00"   # 예약 발송(KST 명시)
 *   SMS_SUBJECT="KD4 안내" … 로 LMS 제목 지정(기본 "KD4 액팅 스튜디오")
 *   --memo "24기 개강 안내 발송 — 회신 대기"   # 발송 후 노션 상담자 카드(연락처 매칭) 상담메모에 "M/D 발송 — …" 자동 append (2026-09-08)
 *
 * 동작:
 *  - 킬스위치 ~/.claude/flags/agent-halt 있으면 즉시 중단
 *  - 번호 정규화(숫자만) · 중복번호 제거 · 빈 본문 제외
 *  - Solapi send()에 배열 한 번에 전달 (1요청 = 최대 10,000건) → 20~60명이 수 초 내 완료
 *  - 결과를 ~/Desktop/KD4-HUB/04-ops/logs/bulk-sms.log 에 한 줄씩 append (날짜·이름·번호·groupId·상태)
 *
 * 안전장치 (2026-09-24 — 9/23 지난 시각 예약 즉시발송 82명 사고 + 9/10 수신거부 링크 404 사고 후):
 *  - --at 에 시간대 표기(+09:00 또는 Z)가 없으면 중단 — 노트북이 해외 시간대면 다른 시각으로 해석됨
 *  - --at 이 이미 지났거나 5분 이내면 중단 — Solapi는 지난 시각 예약을 '즉시 발송'으로 처리함
 *  - 본문 링크(kd4.club/u/ 수신거부 포함)를 발송 전에 HEAD로 열어 봄 — 404 등 깨진 링크가 하나라도 있으면 중단
 *    (DRY RUN에서도 똑같이 검사하므로 미리보기 단계에서 걸러짐. /u/ 링크는 확인 페이지로 302만 하고 해지는 POST로만 돼서 열어 봐도 안전)
 *
 * 🚨 규칙: 문자는 반드시 미리보기(DRY RUN) → 대표 승인 → --send. 자동 루틴에서 임의 호출 금지.
 */
import './_loadEnv'
import { SolapiMessageService } from 'solapi'
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'

type Item = { name?: string; phone: string; text: string }

const file = process.argv[2]
const doSend = process.argv.includes('--send')
const atIdx = process.argv.indexOf('--at')
const scheduledAt = atIdx > -1 ? process.argv[atIdx + 1] : undefined

// ── 안전장치 1: 예약 시각 검사 (DRY RUN에서도 실행 · 발송 직전에 한 번 더)
const MIN_LEAD_MS = 5 * 60 * 1000
const TZ_SUFFIX_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i
function checkSchedule(at: string | undefined): void {
  const stop = (msg: string): never => {
    console.error(`⛔ 예약 시각 차단 — ${msg}\n   → 시각을 다시 계산해 "--at 2026-10-05T11:00:00+09:00"처럼 넣거나, 지금 바로 보낼 거면 --at 없이 실행.`)
    process.exit(1)
  }
  if (atIdx > -1 && (!at || at.startsWith('--'))) stop('--at 뒤에 시각이 없음 (이대로면 즉시 발송될 수 있음)')
  if (!at) return
  if (!TZ_SUFFIX_RE.test(at.trim())) stop(`시간대 표기 없음: "${at}" — 끝에 +09:00(한국시간)을 붙일 것`)
  const t = Date.parse(at)
  if (isNaN(t)) stop(`형식 오류: "${at}" (예: 2026-08-20T11:00:00+09:00)`)
  const kst = new Date(t).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })
  const leadMs = t - Date.now()
  if (leadMs < MIN_LEAD_MS) {
    stop(leadMs <= 0
      ? `이미 지난 시각(한국시간 ${kst}) — Solapi는 지난 시각 예약을 즉시 발송함(9/23 사고)`
      : `5분 이내 예약(한국시간 ${kst}, ${Math.round(leadMs / 1000)}초 뒤)`)
  }
}
checkSchedule(scheduledAt)

if (!file || !existsSync(file)) {
  console.error('사용법: npx tsx scripts/bulk-sms.ts <목록.json> [--send]')
  process.exit(1)
}
if (existsSync(join(homedir(), '.claude/flags/agent-halt'))) {
  console.log('킬스위치 감지 — 중단')
  process.exit(0)
}

const raw: Item[] = JSON.parse(readFileSync(file, 'utf-8'))
const seen = new Set<string>()
const items = raw
  .map((it) => ({ ...it, phone: (it.phone || '').replace(/\D/g, ''), text: (it.text || '').trim() }))
  .filter((it) => {
    if (!/^01\d{8,9}$/.test(it.phone)) { console.warn(`⚠️ 번호 형식 이상 — 제외: ${it.name} ${it.phone}`); return false }
    if (!it.text) { console.warn(`⚠️ 빈 본문 — 제외: ${it.name}`); return false }
    if (seen.has(it.phone)) { console.warn(`⚠️ 중복 번호 — 제외: ${it.name} ${it.phone}`); return false }
    seen.add(it.phone)
    return true
  })

const scheduledKst = scheduledAt
  ? new Date(Date.parse(scheduledAt)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })
  : ''
console.log(`대상 ${items.length}명 (입력 ${raw.length}건)` + (scheduledAt ? ` · 예약 ${scheduledAt} (한국시간 ${scheduledKst})` : ''))
for (const it of items) {
  const bytes = Buffer.byteLength(it.text, 'utf8')
  console.log(`— ${it.name ?? ''} ${it.phone} (${bytes}B ${bytes > 90 ? 'LMS' : 'SMS'})`)
}

// ── 안전장치 2: 본문 링크 사전 확인 (DRY RUN에서도 실행)
// kd4.club 링크는 2xx/3xx여야 통과. 외부 링크는 404·410·접속 실패만 차단(봇 차단 403 등은 경고).
const LINK_RE = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*kd4\.club(?:\/[^\s<>"'`)\]]*)?|https?:\/\/[^\s<>"'`)\]]+/gi
function extractLinks(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.match(LINK_RE) ?? []) {
    const clean = m.replace(/[.,!?·…」』]+$/, '')
    out.add(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`)
  }
  return [...out]
}
async function probe(url: string): Promise<number | string> {
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(10000) })
    if (r.status === 405 || r.status === 501) {
      r = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(10000) })
    }
    return r.status
  } catch (e) {
    return `접속 실패(${e instanceof Error ? e.message : String(e)})`
  }
}
async function checkLinks(list: Item[]): Promise<void> {
  const owners = new Map<string, string[]>()
  for (const it of list) {
    for (const u of extractLinks(it.text)) owners.set(u, [...(owners.get(u) ?? []), it.name ?? it.phone])
  }
  if (owners.size === 0) { console.log('\n🔗 본문 링크 없음 — 링크 확인 생략'); return }
  const urls = [...owners.keys()]
  const results: Array<[string, number | string]> = []
  for (let i = 0; i < urls.length; i += 8) {
    const chunk = urls.slice(i, i + 8)
    results.push(...(await Promise.all(chunk.map(async (u) => [u, await probe(u)] as [string, number | string]))))
  }
  const bad: string[] = []
  for (const [u, st] of results) {
    const own = /^https?:\/\/(?:[a-z0-9-]+\.)*kd4\.club(?:[/:?#]|$)/i.test(u)
    const ok = typeof st === 'number' && (own ? st >= 200 && st < 400 : st !== 404 && st !== 410)
    if (!ok) bad.push(`   ✗ ${st} ${u} ← ${owners.get(u)!.join(', ')}`)
    else if (typeof st === 'number' && st >= 400) console.warn(`   ⚠️ ${st} ${u} (외부 링크 — 차단은 안 함)`)
  }
  console.log(`\n🔗 본문 링크 확인 ${urls.length}개 — 정상 ${urls.length - bad.length} · 깨짐 ${bad.length}`)
  if (bad.length) {
    console.error(`⛔ 깨진 링크가 있어 중단 (발송 0건)\n${bad.join('\n')}\n   → 수신거부 링크면 lib/lead-unsubscribe-tokens.ts 커밋·배포 여부부터 확인.`)
    process.exit(1)
  }
}

const apiKey = process.env.SOLAPI_API_KEY
const apiSecret = process.env.SOLAPI_API_SECRET
const from = process.env.SOLAPI_FROM_NUMBER
const subject = process.env.SMS_SUBJECT || 'KD4 액팅 스튜디오'
const logPath = join(homedir(), 'Desktop/KD4-HUB/04-ops/logs/bulk-sms.log')

async function main() {
  await checkLinks(items)
  if (!doSend) {
    console.log('\n[미리보기 — 첫 번째 본문]\n' + (items[0]?.text ?? '(없음)'))
    console.log('\nDRY RUN — 발송 안 함. 실제 발송은 --send 플래그.')
    process.exit(0)
  }
  if (!apiKey || !apiSecret || !from) {
    console.error('env 누락 — 중단 (SOLAPI_API_KEY/SECRET/FROM_NUMBER)')
    process.exit(1)
  }
  mkdirSync(dirname(logPath), { recursive: true })
  checkSchedule(scheduledAt) // 링크 확인에 걸린 시간만큼 지났을 수 있어 발송 직전 재확인
  const service = new SolapiMessageService(apiKey, apiSecret)
  const res: any = await service.send(
    items.map((it) => ({ to: it.phone, from, text: it.text, subject })),
    // scheduledDate는 문자열로 넘긴다(SDK 타입이 string, 시간대 포함 ISO라 절대시각이 그대로 전달됨)
    { allowDuplicates: false, ...(scheduledAt ? { scheduledDate: scheduledAt } : {}) },
  )
  const gid = res?.groupInfo?.groupId ?? res?.groupId ?? '-'
  const cnt = res?.groupInfo?.count ?? res?.count ?? {}
  const ts = new Date().toISOString()
  for (const it of items) appendFileSync(logPath, `${ts}\t${it.name ?? ''}\t${it.phone}\t${gid}\t${scheduledAt ? 'scheduled@' + scheduledAt : 'sent'}\n`)
  console.log(`✅ ${scheduledAt ? '예약' : '발송'} 요청 완료 — groupId ${gid}, 등록 ${cnt.registeredSuccess ?? items.length}건 / 실패 ${cnt.registeredFailed ?? 0}건`)
  const bal = res?.groupInfo?.balance ?? res?.balance
  if (bal) console.log('잔액 정보:', JSON.stringify(bal))
  const memoIdx = process.argv.indexOf('--memo')
  const memoText = memoIdx > -1 ? process.argv[memoIdx + 1] : undefined
  if (memoText) {
    if (!process.env.NOTION_TOKEN) console.warn('⚠️ NOTION_TOKEN 없음 — 상담메모 기록 생략')
    else await writeConsultMemos(items, memoText, scheduledAt)
  }
}

// 노션 상담자 DB(연락처 매칭) 상담메모 append — 캠페인마다 손으로 patch 하던 관례를 내장
async function writeConsultMemos(list: Item[], memo: string, at?: string) {
  const H = { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' }
  const ds = '4f7baedd-d6d5-471c-8320-f32a1a1339c9'
  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const stamp = `${now.getUTCMonth() + 1}/${now.getUTCDate()}` + (at ? ` ${at.slice(11, 16)} 예약발송` : ' 발송')
  let ok = 0
  const miss: string[] = []
  for (const it of list) {
    const tail = it.phone.slice(3)
    const variants = [`${tail.slice(0, 4)}-${tail.slice(4)}`, tail]
    let page: any
    for (const v of variants) {
      const q: any = await fetch(`https://api.notion.com/v1/data_sources/${ds}/query`, {
        method: 'POST', headers: H, body: JSON.stringify({ filter: { property: '연락처', phone_number: { contains: v } } }),
      }).then((r) => r.json())
      if (q.results?.length) { page = q.results[0]; break }
    }
    if (!page) { miss.push(it.name ?? it.phone); continue }
    const old = (page.properties?.['상담메모']?.rich_text ?? []).map((x: any) => x.plain_text).join('')
    const text = ((old ? old + ' · ' : '') + `${stamp} — ${memo}`).slice(0, 1900)
    await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
      method: 'PATCH', headers: H, body: JSON.stringify({ properties: { 상담메모: { rich_text: [{ text: { content: text } }] } } }),
    })
    ok++
  }
  console.log(`📝 노션 상담메모 기록 ${ok}/${list.length}` + (miss.length ? ` · 카드 없음: ${miss.join(', ')}` : ''))
}
main().catch((e) => {
  console.error('발송 실패:', e instanceof Error ? e.message : e)
  process.exit(1)
})
