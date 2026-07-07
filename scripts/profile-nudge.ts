/**
 * 프로필 빈칸 채우기 주간 알림 (2026-07-07 대표 지시: "일주일 주기로 자동으로 보내게해줘")
 *
 * 매주 수요일 10:00 launchd(com.kd4.profile-nudge)가 실행.
 * 공개 배우 중 프로필 빈칸(대표사진·갤러리·영상·이력서문서)이 있는 멤버에게
 * 사람별 맞춤 LMS 발송 + 새 서비스 동의 안내. 빈칸을 채우면 다음 주부터 자동 제외.
 *
 * 안전장치:
 *  - 재발송 가드: 최근 6일 내 발송자 스킵 (sent-log JSON)
 *  - 3회 상한: 3번 보내도 안 채우면 더 안 보내고 대표 요약 문자에 명단으로 에스컬레이션
 *  - 대표 요약: 매 실행 후 ADMIN_PHONE_NUMBER로 발송 결과 1건 보고
 *  - 킬스위치: ~/.claude/flags/agent-halt 또는 ~/.claude/flags/profile-nudge-off 존재 시 중단
 *  - DRY_RUN=1 이면 발송 없이 대상·문구만 출력
 *
 * 실행: cd kd4-nextjs && npx tsx scripts/profile-nudge.ts  (env는 래퍼 셸이 주입)
 */
import { createClient } from '@supabase/supabase-js'
import { SolapiMessageService } from 'solapi'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const DRY = process.env.DRY_RUN === '1'
const OPS = join(homedir(), 'Desktop/KD4-HUB/04-ops/daily-reports')
const SENT_LOG = join(OPS, 'profile-nudge-sent.json')
const RUN_LOG = join(OPS, 'profile-nudge.log')
const MAX_NUDGES = 3
const COOLDOWN_DAYS = 6

function halt(): boolean {
  const flags = join(homedir(), '.claude/flags')
  return existsSync(join(flags, 'agent-halt')) || existsSync(join(flags, 'profile-nudge-off'))
}

function log(line: string) {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const msg = `[${stamp}] ${line}`
  console.log(msg)
  try { appendFileSync(RUN_LOG, msg + '\n') } catch { /* 로그 실패는 발송을 막지 않음 */ }
}

type SentLog = Record<string, { name: string; count: number; lastAt: string }>

function loadSentLog(): SentLog {
  try { return JSON.parse(readFileSync(SENT_LOG, 'utf8')) } catch { return {} }
}

function buildText(name: string, missing: { mainPhoto: boolean; gallery: boolean; video: boolean; doc: boolean }): string {
  const items: string[] = []
  if (missing.mainPhoto || missing.gallery) {
    items.push(missing.mainPhoto ? '▪ 프로필 사진 (대표사진 포함 3장 이상)' : '▪ 프로필 사진 3장 이상')
  }
  if (missing.video) items.push('▪ 연기 영상 (릴 또는 독백)')
  if (missing.doc) items.push('▪ 이력서 파일 (예전 파일 유실 — 다시 업로드)')

  const head = items.length === 1 ? '배포 전에 딱 하나만 채워주세요.' : `배포 전에 ${name}님 프로필에 비어 있는 항목을 채워주세요.`

  return [
    '[KD4 액팅 스튜디오]',
    `${name}님, KD4가 배우 프로필을 캐스팅 디렉터·영화과·인물조감독에게 배포하는 작업을 시작합니다.`,
    '',
    head,
    '',
    ...items,
    '',
    'kd4.club 로그인 → 마이페이지 → 내 프로필 수정',
    'https://kd4.club/dashboard',
    '',
    '+ 새로 생긴 [서비스 이용 동의]도 마이페이지 상단에서 1분만 확인해 주세요. 동의가 있어야 프로필 공개·캐스팅 연결이 계속됩니다.',
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
  const { data: actors, error } = await sb
    .from('actors')
    .select('id, name, phone, is_public, profile_photo, profile_doc_path')
    .eq('is_public', true)
  if (error) { log(`DB 조회 실패: ${error.message}`); process.exit(1) }

  const { data: vids } = await sb.from('actor_videos').select('actor_id')
  const vidSet = new Set((vids ?? []).map((v) => v.actor_id))
  const { data: photos } = await sb.from('actor_photos').select('actor_id')
  const photoSet = new Set((photos ?? []).map((p) => p.actor_id))

  const sentLog = loadSentLog()
  const now = Date.now()
  const targets: { id: string; name: string; phone: string; text: string }[] = []
  const capped: string[] = []
  let noPhone = 0

  for (const a of actors ?? []) {
    const missing = {
      mainPhoto: !a.profile_photo,
      // 2026-07-07 수정: actor_photos 행이 없어도 actors.profile_photo가 있으면
      // "사진 없음"으로 오탐 안 함 — 관리자 스크립트가 actors.profile_photo만 직접
      // 갱신하고 actor_photos엔 기록 안 남기는 경로(예: 얼굴크롭 배치)가 실재해서
      // 실사진 있는 24명한테 "사진 없음" 문자가 나갈 뻔한 사고 발견·수정.
      gallery: !photoSet.has(a.id) && !a.profile_photo,
      video: !vidSet.has(a.id),
      doc: !!a.profile_doc_path && String(a.profile_doc_path).startsWith('migrated/'),
    }
    if (!missing.mainPhoto && !missing.gallery && !missing.video && !missing.doc) continue
    if (!a.phone) { noPhone++; continue }

    const prev = sentLog[a.id]
    if (prev && now - new Date(prev.lastAt).getTime() < COOLDOWN_DAYS * 86_400_000) continue
    if (prev && prev.count >= MAX_NUDGES) { capped.push(a.name); continue }

    targets.push({ id: a.id, name: a.name, phone: String(a.phone).replace(/\D/g, ''), text: buildText(a.name, missing) })
  }

  log(`대상 ${targets.length}명 (3회 초과 제외 ${capped.length}명, 번호없음 ${noPhone}명)`)

  if (DRY) {
    for (const t of targets) console.log(`\n──── ${t.name} (${t.phone}) ────\n${t.text}`)
    log('DRY_RUN — 발송 안 함')
    return
  }

  if (targets.length === 0 && capped.length === 0) { log('보낼 대상 없음 — 전원 완료 🎉'); return }

  const service = new SolapiMessageService(apiKey!, apiSecret!)
  let ok = 0, fail = 0
  if (targets.length > 0) {
    try {
      await service.send(targets.map((t) => ({ to: t.phone, from: from!, text: t.text, subject: 'KD4 프로필 채우기' })))
      ok = targets.length
      for (const t of targets) {
        const prev = sentLog[t.id]
        sentLog[t.id] = { name: t.name, count: (prev?.count ?? 0) + 1, lastAt: new Date().toISOString() }
      }
      writeFileSync(SENT_LOG, JSON.stringify(sentLog, null, 2))
    } catch (e) {
      fail = targets.length
      log(`발송 실패: ${e instanceof Error ? e.message : e}`)
    }
  }

  // 대표 요약 보고 (1건)
  const admin = process.env.ADMIN_PHONE_NUMBER
  if (admin) {
    const cappedLine = capped.length > 0 ? `\n3회에도 안 채운 ${capped.length}명(직접 연락 필요): ${capped.join(', ')}` : ''
    const summary = `[KD4 자동보고] 프로필 빈칸 문자 ${ok}명 발송${fail ? ` (실패 ${fail})` : ''}${cappedLine}\n채우면 다음 주부터 자동 제외됩니다.`
    try { await service.send([{ to: admin, from: from!, text: summary, subject: 'KD4 주간 자동보고' }]) } catch { /* 요약 실패는 무시 */ }
  }

  log(`발송 완료 ${ok}명 / 실패 ${fail}명 / 3회상한 ${capped.length}명`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
