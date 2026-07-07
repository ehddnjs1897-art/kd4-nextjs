/**
 * 출생연도 입력 안내 (1회성) — 2026-07-08 대표 지시
 * "74% 40명한테도 내일 예약문자보내 ... 생년까지 어떻게 최신화하는지 내용 포함해"
 *
 * 매주 정기 프로필빈칸 문자(profile-nudge.ts)와 별개의 1회성 캠페인.
 * 실행 시점(발송 당일) 기준 살아있는 DB를 다시 조회해 birth_year 없는 공개 배우에게
 * "출생연도 입력 방법"을 구체적으로 안내하는 전용 문자를 보낸다.
 *
 * 이 스크립트가 다루는 40명은 정기 문자(오늘 7/8 10시, birth_year 항목 포함)를
 * 이미 받았을 수 있음 — 그래서 내용을 다르게(방법 안내 중심) 구성해 중복감을 줄임.
 *
 * 안전장치:
 *  - 킬스위치: ~/.claude/flags/agent-halt 또는 ~/.claude/flags/birthyear-nudge-off
 *  - DRY_RUN=1 이면 발송 없이 대상·문구만 출력
 *  - 1회성이므로 재발송 가드 없음 — 실행 자체를 1회만 예약(launchd 1회성 잡)
 *  - 실행 후 admin 요약 문자 1건 + 실행 완료 후 launchd 잡 자기 자신 unload
 *
 * 실행: cd kd4-nextjs && npx tsx scripts/birthyear-nudge.ts
 */
import { createClient } from '@supabase/supabase-js'
import { SolapiMessageService } from 'solapi'
import { existsSync, appendFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const DRY = process.env.DRY_RUN === '1'
const RUN_LOG = join(homedir(), 'Desktop/KD4-HUB/04-ops/daily-reports/birthyear-nudge.log')

function halt(): boolean {
  const flags = join(homedir(), '.claude/flags')
  return existsSync(join(flags, 'agent-halt')) || existsSync(join(flags, 'birthyear-nudge-off'))
}

function log(line: string) {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const msg = `[${stamp}] ${line}`
  console.log(msg)
  try { appendFileSync(RUN_LOG, msg + '\n') } catch { /* 로그 실패는 발송을 막지 않음 */ }
}

function buildText(name: string): string {
  return [
    '[KD4 액팅 스튜디오]',
    `${name}님, 카카오톡으로 프로필 링크를 공유하면 나이가 "20대"처럼 큰 범위로만 보여요.`,
    '실제 나이(예: 28세)가 정확히 뜨려면 출생연도 입력이 필요합니다.',
    '',
    '입력 방법',
    '1) kd4.club 로그인',
    '2) 마이페이지 → 내 프로필 수정',
    '3) "기본 정보" 카드에서 출생연도 입력',
    '4) 저장 누르기',
    '',
    'https://kd4.club/dashboard',
    '',
    '문의 010-8564-0244',
  ].join('\n')
}

async function main() {
  if (halt()) { log('킬스위치 감지 — 실행 중단'); return }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const from = process.env.SOLAPI_FROM_NUMBER
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!url || !key || (!DRY && (!from || !apiKey || !apiSecret))) {
    log('env 누락 — 중단'); process.exit(1)
  }

  const sb = createClient(url, key)
  // 실행 시점(발송 당일) 기준 재조회 — 그 사이 스스로 입력을 채운 사람은 자동 제외됨.
  const { data: actors, error } = await sb
    .from('actors')
    .select('id, name, phone, is_public, birth_year')
    .eq('is_public', true)
    .is('birth_year', null)
  if (error) { log(`DB 조회 실패: ${error.message}`); process.exit(1) }

  const targets: { id: string; name: string; phone: string; text: string }[] = []
  let noPhone = 0
  for (const a of actors ?? []) {
    if (!a.phone) { noPhone++; continue }
    targets.push({ id: a.id, name: a.name, phone: String(a.phone).replace(/\D/g, ''), text: buildText(a.name) })
  }

  log(`대상 ${targets.length}명 (번호없음 ${noPhone}명) — 실행 시점 재조회 기준`)

  if (DRY) {
    for (const t of targets) console.log(`\n──── ${t.name} (${t.phone}) ────\n${t.text}`)
    log('DRY_RUN — 발송 안 함')
    return
  }

  if (targets.length === 0) { log('보낼 대상 없음 — 전원 완료'); return }

  const service = new SolapiMessageService(apiKey!, apiSecret!)
  let ok = 0, fail = 0
  try {
    await service.send(targets.map((t) => ({ to: t.phone, from: from!, text: t.text, subject: 'KD4 출생연도 안내' })))
    ok = targets.length
  } catch (e) {
    fail = targets.length
    log(`발송 실패: ${e instanceof Error ? e.message : e}`)
  }

  const admin = process.env.ADMIN_PHONE_NUMBER
  if (admin) {
    const summary = `[KD4 자동보고] 출생연도 안내 문자 ${ok}명 발송${fail ? ` (실패 ${fail})` : ''} (번호없음 ${noPhone}명)`
    try { await service.send([{ to: admin, from: from!, text: summary, subject: 'KD4 1회성 자동보고' }]) } catch { /* 요약 실패는 무시 */ }
  }

  log(`발송 완료 ${ok}명 / 실패 ${fail}명`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
