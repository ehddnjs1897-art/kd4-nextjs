/**
 * 「경계선」 영화제 출품 매일 알림 문자 — 2026-07-13 대표 지시
 * ("이거 매일 나한테 sms로 지원하라고 메시지 보내봐")
 *
 * 정본 04-ops/영화제출품_지원가능_전수.md ①-b 쇼트리스트(S+A급 9곳)를
 * 04-ops/영화제_출품_상태.json 상태 파일로 추적, 미제출·마감 안 지난 것만
 * D-day 임박순으로 매일 대표 본인 번호(ADMIN_PHONE_NUMBER)에 SMS 1통.
 *
 * 제출 완료 표시 = 대표가 채팅에서 "OO 냈어"라고 말하면, 그 세션이
 * 상태 JSON의 해당 항목 submitted:true로 갱신(자동 파싱 아님 — 수동 확인 후 반영).
 *
 * 안전장치:
 *  - 킬스위치: ~/.claude/flags/agent-halt 또는 ~/.claude/flags/festival-nudge-off
 *  - 당일 중복발송 가드 (로그 기준)
 *  - 마감 지난 항목(D-day < 0)은 자동 제외
 *  - 전부 제출완료거나 대상 0건이면 발송 없이 로그만
 *  - DRY_RUN=1 이면 발송 없이 문구만 콘솔 출력
 */
import { SolapiMessageService } from 'solapi'
import { existsSync, readFileSync, appendFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const DRY = process.env.DRY_RUN === '1'
const STATE_PATH = join(homedir(), 'Desktop/KD4-HUB/04-ops/영화제_출품_상태.json')
const LOG = join(homedir(), 'Desktop/KD4-HUB/04-ops/daily-reports/festival-submission-nudge.log')

function halt(): boolean {
  const flags = join(homedir(), '.claude/flags')
  return existsSync(join(flags, 'agent-halt')) || existsSync(join(flags, 'festival-nudge-off'))
}

function log(line: string) {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const msg = `[${stamp}] ${line}`
  console.log(msg)
  try { appendFileSync(LOG, msg + '\n') } catch { /* 로그 실패는 발송을 막지 않음 */ }
}

function todayKST(): Date {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()))
}

function dday(deadline: string): number {
  const d = new Date(deadline + 'T00:00:00Z')
  const t = todayKST()
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}

interface Item { name: string; deadline: string; fee: string; url: string; note: string; submitted: boolean }

async function main() {
  if (halt()) { log('킬스위치 감지 — 중단'); return }

  const dateStr = todayKST().toISOString().slice(0, 10)
  if (existsSync(LOG)) {
    const already = readFileSync(LOG, 'utf-8').split('\n').some((l) => l.includes(`[${dateStr}`) && l.includes('발송 완료'))
    if (already) { log('오늘 이미 발송됨 — 중단'); return }
  }

  if (!existsSync(STATE_PATH)) { log('상태 파일 없음 — 중단'); process.exit(1) }
  const items: Item[] = JSON.parse(readFileSync(STATE_PATH, 'utf-8'))

  const pending = items
    .filter((i) => !i.submitted)
    .map((i) => ({ ...i, d: dday(i.deadline) }))
    .filter((i) => i.d >= 0)
    .sort((a, b) => a.d - b.d)

  if (pending.length === 0) {
    log('보낼 대상 없음 — 전부 제출완료 또는 마감 지남')
    return
  }

  const lines = ['[KD4 영화제 출품 알림]', '「경계선」 아직 안 낸 곳:']
  pending.forEach((i, idx) => {
    const md = new Date(i.deadline + 'T00:00:00Z')
    const mdStr = `${md.getUTCMonth() + 1}/${md.getUTCDate()}`
    lines.push(`${idx + 1}. ${i.name} — D-${i.d} (${mdStr}) ${i.fee}`)
  })
  lines.push('', '낸 곳 있으면 채팅으로 "OO 냈어" 알려주세요, 목록에서 뺄게요.', '전체 링크·준비물: 영화제출품_지원가능_전수.md')

  const text = lines.join('\n')

  const from = process.env.SOLAPI_FROM_NUMBER
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const admin = process.env.ADMIN_PHONE_NUMBER
  if (!DRY && (!from || !apiKey || !apiSecret || !admin)) { log('env 누락 — 중단'); process.exit(1) }

  if (DRY) {
    console.log(text)
    log(`DRY_RUN — 발송 안 함 (대상 ${pending.length}건)`)
    return
  }

  const service = new SolapiMessageService(apiKey!, apiSecret!)
  try {
    await service.send([{ to: admin!, from: from!, text, subject: 'KD4 영화제 출품 알림' }])
    log(`발송 완료 — 대상 ${pending.length}건`)
  } catch (e) {
    log(`발송 실패: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
