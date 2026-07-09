/**
 * 오디션 매칭 SMS 발송기 (정식 커밋본) — kd4-audition-actor-match 스케줄이 호출
 *
 * 2026-07-09 신설: 기존엔 매 실행마다 tmp 스크립트를 즉석 작성·삭제해서
 * "성공 즉시 sent.log 기록" 같은 안전장치가 그 주 구현 재량에 좌우됐음.
 * 이 스크립트로 고정해 중간 실패 시에도 이미 보낸 사람이 정확히 기록되게 한다.
 *
 * 입력: 첫 번째 인자로 대상 JSON 파일 경로
 *   [{ "name": "김서연", "actorId": "uuid", "phone": "01012345678",
 *      "text": "문자 전문", "titles": ["작품명 배역", ...] }, ...]
 *
 * 안전장치:
 *  - 킬스위치: ~/.claude/flags/agent-halt · audition-match-off
 *  - 야간가드: KST 08:00~20:59 밖이면 발송하지 않고 "보류" 로그만 (완료로 기록 금지)
 *  - 건당 개별 try/catch — 성공 즉시 sent.log append (부분 실패해도 기발송분 기록 보존)
 *  - DRY_RUN=1 이면 발송 없이 대상·문구만 출력
 *
 * 실행: cd kd4-nextjs && npx tsx scripts/audition-match-send.ts /path/to/targets.json
 */
import { SolapiMessageService } from 'solapi'
import { existsSync, appendFileSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const DRY = process.env.DRY_RUN === '1'
const SENT_LOG = join(homedir(), 'Desktop/KD4-HUB/04-ops/daily-reports/audition-match-sent.log')
const RUN_LOG = join(homedir(), 'Desktop/KD4-HUB/04-ops/daily-reports/audition-match.log')

interface Target {
  name: string
  actorId: string
  phone: string
  text: string
  titles: string[]
}

function halt(): boolean {
  const flags = join(homedir(), '.claude/flags')
  return (
    existsSync(join(flags, 'agent-halt')) ||
    existsSync(join(flags, 'audition-match-off')) ||
    // 2026-07-09 대표 지시 "아직 문자메시지 보내지마" — 품질 검수 통과 전 발송 전면 보류.
    // 매칭·텔레그램 검토알림은 계속 돌고 SMS만 막는다. 해제 = 이 플래그 파일 삭제.
    existsSync(join(flags, 'audition-sms-hold'))
  )
}

function stamp(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16)
}

function log(line: string) {
  const msg = `[${stamp()}] ${line}`
  console.log(msg)
  try { appendFileSync(RUN_LOG, msg + '\n') } catch { /* 로그 실패가 발송을 막지 않음 */ }
}

async function main() {
  if (halt()) { log('킬스위치 감지 — 발송 중단'); return }

  // 야간가드 — 정보통신망법 야간(21~08시) 전송 제한 + 멤버 배려.
  // "보류"는 완료가 아니므로 audition-match.log의 당일 완료 엔트리 포맷과 다르게 남긴다.
  const kstHour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false }).format(new Date())
  )
  if (kstHour < 8 || kstHour >= 21) {
    log(`야간가드: 현재 KST ${kstHour}시 — 발송 보류 (08~21시에만 발송, 완료 아님)`)
    process.exit(2)
  }

  const targetsPath = process.argv[2]
  if (!targetsPath || !existsSync(targetsPath)) {
    log(`대상 파일 없음: ${targetsPath ?? '(미지정)'} — 중단`)
    process.exit(1)
  }

  let targets: Target[]
  try {
    targets = JSON.parse(readFileSync(targetsPath, 'utf-8'))
    if (!Array.isArray(targets)) throw new Error('배열 아님')
  } catch (e) {
    log(`대상 파일 파싱 실패: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }

  const from = process.env.SOLAPI_FROM_NUMBER
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!DRY && (!from || !apiKey || !apiSecret)) { log('Solapi env 누락 — 중단'); process.exit(1) }

  log(`발송 대상 ${targets.length}명 (${DRY ? 'DRY_RUN' : '실발송'})`)

  if (DRY) {
    for (const t of targets) console.log(`\n──── ${t.name} (${t.phone}) ────\n${t.text}`)
    log('DRY_RUN — 발송 안 함')
    return
  }

  const service = new SolapiMessageService(apiKey!, apiSecret!)
  let ok = 0, fail = 0
  for (const t of targets) {
    try {
      await service.sendOne({ to: t.phone.replace(/\D/g, ''), from: from!, text: t.text, subject: 'KD4 오디션 알림' })
      ok++
      // 성공 즉시 기록 — 이후 크래시가 나도 재발송 가드(STEP 3.5)가 이 줄로 중복을 막는다
      appendFileSync(SENT_LOG, `[${stamp().slice(0, 10)}] ${t.name} (${t.actorId}) ← ${t.titles.join(', ')}\n`)
    } catch (e) {
      fail++
      log(`발송 실패: ${t.name} — ${e instanceof Error ? e.message : e}`)
    }
    await new Promise((r) => setTimeout(r, 250))
  }

  const admin = process.env.ADMIN_PHONE_NUMBER
  if (admin && ok + fail > 0) {
    try {
      await service.sendOne({
        to: admin, from: from!,
        text: `[KD4 자동보고] 오디션 매칭 문자 ${ok}명 발송${fail ? ` (실패 ${fail})` : ''}`,
        subject: 'KD4 자동보고',
      })
    } catch { /* 요약 실패는 무시 */ }
  }

  log(`발송 완료 ${ok}명 / 실패 ${fail}명`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
