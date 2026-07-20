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
import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const DRY = process.env.DRY_RUN === '1'
const OPS = join(homedir(), 'Desktop/KD4-HUB/04-ops/daily-reports')
const SENT_LOG = join(OPS, 'profile-nudge-sent.json')
// 사진 치수 캐시 — Supabase 무료 전환(2026-07-21) 후 egress 절약: 같은 사진을 매주 재다운로드하지 않음.
// 스토리지 파일은 불변(URL 고정)이라 치수 캐시가 판정 결과를 바꾸지 않음 (가로사진 판정 로직 동일).
const DIMS_CACHE = join(OPS, 'photo-dims-cache.json')
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

interface Missing {
  mainPhoto: boolean
  gallery: boolean
  video: boolean
  doc: boolean
  legacyPhoto: boolean
  noLandscape: boolean
  noSummary: boolean
  noBirthYear: boolean
}

function buildText(name: string, missing: Missing): string {
  const items: string[] = []
  if (missing.mainPhoto || missing.gallery) {
    items.push(missing.mainPhoto ? '▪ 프로필 사진 (대표사진 포함 3장 이상)' : '▪ 프로필 사진 3장 이상')
  }
  // 사진은 있지만 옛 자료(가로 이력서 합성사진)를 자동으로 오려낸 것 — 본인이 직접 올린 사진 아님
  // (mainPhoto 항목과 중복 노출 안 되게 위 조건에서 제외된 케이스만 별도 문구)
  if (missing.legacyPhoto && !missing.mainPhoto && !missing.gallery) {
    items.push('▪ 프로필 사진 교체 — 지금 사진은 예전 자료에서 자동으로 오려낸 사진이에요. 본인이 직접 찍은 사진으로 새로 올려주세요')
  }
  if (missing.video) items.push('▪ 연기 영상 (릴 또는 독백)')
  if (missing.doc) items.push('▪ 이력서 파일 (예전 파일 유실 — 다시 업로드)')
  // 2026-07-08 대표 지시: 카카오톡 공유 썸네일은 가로(와이드) 사진에 최적화 —
  // 가로 사진이 하나도 없으면 세로사진을 억지로 늘려써서 어색하게 잘림.
  if (missing.noLandscape) items.push('▪ 가로(와이드) 사진 최소 1장 — 카카오톡 공유 썸네일에 사용돼요. 가로로 찍은 사진 한 장만 추가로 올려주세요')
  // 2026-07-08 대표 지시(리더클래스 점검 중 발견): 한줄소개는 캐스팅 담당자가 5초 안에
  // 제일 먼저 읽는 항목 — 대시보드 완성도 카드엔 반영되지만 자동문자엔 빠져있던 항목 추가.
  if (missing.noSummary) items.push('▪ 한줄소개 — 캐스팅 담당자가 가장 먼저 보는 문구예요. 나를 한 줄로 소개해 주세요')
  // 2026-07-07 대표 지시(카톡 공유 썸네일 점검 중 발견): 출생연도가 없으면 실제 나이 대신
  // "30대" 같은 연령대로만 표시됨(/api/og/actor 로직) — 정확한 나이 노출을 위해 생년 입력 유도.
  if (missing.noBirthYear) items.push('▪ 출생연도 — 캐스팅 담당자가 정확한 나이를 확인할 수 있도록 생년을 입력해 주세요')

  const head = items.length === 1 ? '아래 항목 하나만 채워주시면 돼요.' : '아래 비어 있는 항목을 채워주세요.'

  return [
    '[KD4 액팅 스튜디오]',
    `${name}님, 배우 DB 프로필 최신화 안내드립니다.`,
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

/** actor_photos 한 장의 실제 픽셀 치수 확인 (원본 다운로드 후 sharp 메타데이터) */
async function imgDims(url: string): Promise<{ w: number; h: number } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const meta = await sharp(buf).metadata()
    if (!meta.width || !meta.height) return null
    return { w: meta.width, h: meta.height }
  } catch {
    return null
  }
}

/**
 * 배우별 "진짜 가로사진" 보유 여부 — /api/og/actor/[id]의 pickLandscapeUrl과 동일 기준
 * (전신사진 제외, width > height*1.05). 4명씩 동시 다운로드해 확인 (53명 기준 1분 내외).
 */
interface PhotoRow { actor_id: string; url: string | null; storage_path: string | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function computeLandscapeSet(sb: any, actorIds: string[]): Promise<Set<string>> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const { data: photos } = await sb
    .from('actor_photos')
    .select('actor_id, url, storage_path, photo_type, sort_order')
    .neq('photo_type', 'current')
    .order('sort_order', { ascending: true }) as { data: PhotoRow[] | null }

  const byActor = new Map<string, string[]>()
  for (const p of photos ?? []) {
    const u = p.url ?? (p.storage_path ? `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${p.storage_path}` : null)
    if (!u) continue
    const list = byActor.get(p.actor_id) ?? []
    list.push(u.split('?')[0])
    byActor.set(p.actor_id, list)
  }

  let dimsCache: Record<string, { w: number; h: number }> = {}
  try { dimsCache = JSON.parse(readFileSync(DIMS_CACHE, 'utf8')) } catch { /* 첫 실행 — 캐시 없음 */ }

  const result = new Set<string>()
  const CONCURRENCY = 4
  for (let i = 0; i < actorIds.length; i += CONCURRENCY) {
    const batch = actorIds.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async (id) => {
      for (const u of (byActor.get(id) ?? []).slice(0, 8)) {
        let d = dimsCache[u]
        if (!d) {
          const fresh = await imgDims(u)
          if (fresh) { d = fresh; dimsCache[u] = fresh }
        }
        if (d && d.w > d.h * 1.05) { result.add(id); return }
      }
    }))
  }
  try { writeFileSync(DIMS_CACHE, JSON.stringify(dimsCache)) } catch { /* 캐시 저장 실패는 치명 아님 */ }
  return result
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
  const { data: allActors, error } = await sb
    .from('actors')
    .select('id, name, phone, is_public, profile_photo, storage_photo_path, profile_doc_path, casting_summary, birth_year')
    .eq('is_public', true)
  if (error) { log(`DB 조회 실패: ${error.message}`); process.exit(1) }

  // ONLY_NAMES=이름1,이름2 — 특정 인원만 지금 즉시 발송(예: 오늘 수업 앞둔 리더클래스만).
  // 미설정 시 공개 배우 전원 대상(정기 주간 실행 기본 동작).
  const onlyNames = process.env.ONLY_NAMES?.split(',').map((s) => s.trim()).filter(Boolean)
  const actors = onlyNames ? (allActors ?? []).filter((a) => onlyNames.includes(a.name)) : allActors
  if (onlyNames) log(`ONLY_NAMES 필터 적용 — ${onlyNames.length}명 지정, ${actors?.length ?? 0}명 매칭`)

  const { data: vids } = await sb.from('actor_videos').select('actor_id')
  const vidSet = new Set((vids ?? []).map((v) => v.actor_id))
  const { data: photos } = await sb.from('actor_photos').select('actor_id')
  const photoSet = new Set((photos ?? []).map((p) => p.actor_id))

  log('가로사진 보유 여부 확인 중 (이미지 다운로드, 1분 내외)...')
  const landscapeSet = await computeLandscapeSet(sb, (actors ?? []).map((a) => a.id))

  const sentLog = loadSentLog()
  const now = Date.now()
  const targets: { id: string; name: string; phone: string; text: string }[] = []
  const capped: string[] = []
  let noPhone = 0

  for (const a of actors ?? []) {
    // "사진 있음" 판정은 lib/actor-photo.ts getActorPhotoUrl과 동일 우선순위여야 함
    // (profile_photo → storage_photo_path). 2026-07-08: storage_photo_path만 있고
    // profile_photo가 null인 레거시 마이그레이션 배우(박정민 등)를 "사진 없음"으로
    // 잘못 문자 보낼 뻔한 것 발견·수정 — 오늘 벌써 세 번째 같은 유형의 오탐.
    const hasAnyPhoto = !!a.profile_photo || !!a.storage_photo_path
    const missing = {
      mainPhoto: !hasAnyPhoto,
      // 2026-07-07 수정: actor_photos 행이 없어도 실제 사진(profile_photo/storage_photo_path)이
      // 있으면 "사진 없음"으로 오탐 안 함 — 관리자 스크립트가 대표 필드만 직접
      // 갱신하고 actor_photos엔 기록 안 남기는 경로(예: 얼굴크롭 배치)가 실재해서
      // 실사진 있는 배우한테 "사진 없음" 문자가 나갈 뻔한 사고 발견·수정.
      gallery: !photoSet.has(a.id) && !hasAnyPhoto,
      video: !vidSet.has(a.id),
      doc: !!a.profile_doc_path && String(a.profile_doc_path).startsWith('migrated/'),
      // 2026-07-08 대표 지시: '/cards/' 경로는 얼굴크롭 배치가 만든 산출물 —
      // 본인이 실제로 찍어 올린 사진이 아니므로 진짜 프로필 사진으로 교체 유도.
      // 본인이 새 사진 올리고 '대표로 지정'하면 profile_photo가 바뀌어 다음 실행부터 자동 제외됨.
      legacyPhoto: !!a.profile_photo && a.profile_photo.includes('/cards/'),
      // 2026-07-08 대표 지시: 카톡 공유 썸네일(가로 1200×630)은 가로사진 우선 사용(/api/og/actor 로직) —
      // 가로사진이 하나도 없으면 세로사진을 억지로 늘려써서 어색하게 잘림.
      noLandscape: !landscapeSet.has(a.id),
      // 2026-07-08 대표 지시(리더클래스 점검): 한줄소개 — 완성도 카드엔 있었는데 자동문자엔 누락돼있던 항목.
      noSummary: !a.casting_summary || !String(a.casting_summary).trim(),
      // 2026-07-07 대표 지시: 카카오톡 공유 썸네일에 실제나이 대신 "30대"(연령대)가 나오는
      // 문제 발견 — OG 라우트 코드는 정상(birth_year 있으면 실제나이 계산), 원인은 데이터 누락.
      // birth_year 없으면 age_group으로 폴백되는 배우 40명 발견해서 항목 추가.
      noBirthYear: !a.birth_year,
    }
    if (!missing.mainPhoto && !missing.gallery && !missing.video && !missing.doc && !missing.legacyPhoto && !missing.noLandscape && !missing.noSummary && !missing.noBirthYear) continue
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
