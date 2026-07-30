/**
 * 대표 본인 번호(ADMIN_PHONE_NUMBER)로 텍스트 1통 발송 — 범용 발송기
 * 2026-07-21 대표 지시 "대표가 직접 해야 하는 것들은 SMS로 매일 아침 보고" 구현용 신설.
 * festival-submission-nudge.ts와 동일한 Solapi 직발송 패턴.
 *
 * 사용: npx tsx scripts/send-admin-sms.ts <메시지파일경로>
 *  - 수신자는 ADMIN_PHONE_NUMBER 고정 (대표 본인 전용 — 임의 수신자 발송 불가)
 *  - SMS_SUBJECT env로 제목 지정 (기본 "KD4 알림")
 *  - DRY_RUN=1 이면 발송 없이 본문만 출력
 *  - 킬스위치: ~/.claude/flags/agent-halt
 */
import { SolapiMessageService } from 'solapi'
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const file = process.argv[2]
if (!file || !existsSync(file)) {
  console.error('사용법: npx tsx scripts/send-admin-sms.ts <메시지파일>')
  process.exit(1)
}
if (existsSync(join(homedir(), '.claude/flags/agent-halt'))) {
  console.log('킬스위치 감지 — 중단')
  process.exit(0)
}

const text = readFileSync(file, 'utf-8').trim()
if (!text) {
  console.error('빈 메시지 — 중단')
  process.exit(1)
}

const apiKey = process.env.SOLAPI_API_KEY
const apiSecret = process.env.SOLAPI_API_SECRET
const from = process.env.SOLAPI_FROM_NUMBER
const admin = process.env.ADMIN_PHONE_NUMBER
if (process.env.DRY_RUN === '1') {
  console.log(text)
  console.log('DRY_RUN — 발송 안 함')
  process.exit(0)
}
if (!apiKey || !apiSecret || !from || !admin) {
  console.error('env 누락 — 중단 (SOLAPI_API_KEY/SECRET/FROM_NUMBER, ADMIN_PHONE_NUMBER)')
  process.exit(1)
}

const service = new SolapiMessageService(apiKey, apiSecret)
service
  .send([{ to: admin, from, text, subject: process.env.SMS_SUBJECT || 'KD4 알림' }])
  .then(() => {
    console.log('발송 완료')
    process.exit(0)
  })
  .catch((e) => {
    console.error('발송 실패:', e instanceof Error ? e.message : e)
    process.exit(1)
  })
