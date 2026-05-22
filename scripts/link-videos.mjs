// R2로 복사된 출연영상 → 배우 DB 연결 (actor_videos 등록)
// 파일명에서 배우 이름 매칭. DB에 없는 배우(예: 김서영)는 자동 생성(비공개).
// 실행: node --env-file=.env.local scripts/link-videos.mjs
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import os from 'node:os'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const RCLONE = `${os.homedir()}/bin/rclone`
const PREFIX = 'migrated/videos/'

// 1. R2에 복사된 영상 키 목록
const raw = execSync(`${RCLONE} lsf -R --files-only r2:kd4-actor-videos/${PREFIX}`, { encoding: 'utf8' })
const keys = raw.split('\n').map(s => s.trim()).filter(s => /\.(mp4|mov|m4v)$/i.test(s))
console.log('R2 영상 파일:', keys.length, '개')

// 2. 배우 목록
const { data: actors } = await sb.from('actors').select('id, name')
const norm = (s) => s.normalize('NFC').replace(/\s+/g, '')
const findActor = (filename) => actors.find(a => norm(filename).includes(norm(a.name)))

// 연령/성별 파싱 (신규 배우 생성용)
function parseMeta(filename) {
  let gender = null
  if (/\s여\s|_여_|여\s/.test(filename) || /여/.test(filename.split('출연')[0])) gender = '여'
  if (/\s남\s|_남_|남\s/.test(filename) || /남/.test(filename.split('출연')[0])) gender = '남'
  const ym = filename.match(/(\d{2})년생/)
  let age_group = null
  if (ym) {
    const yy = parseInt(ym[1], 10)
    const birth = yy <= 26 ? 2000 + yy : 1900 + yy
    const age = 2026 - birth
    age_group = age < 30 ? '20대' : age < 40 ? '30대' : age < 50 ? '40대' : '50대 이상'
  }
  return { gender, age_group }
}

// 기존 등록된 r2_key (중복 방지)
const { data: existingVids } = await sb.from('actor_videos').select('r2_key')
const existingKeys = new Set((existingVids || []).map(v => v.r2_key).filter(Boolean))

let linked = 0, created = 0, skipped = 0
const report = []
for (const key of keys) {
  const r2_key = PREFIX + key
  if (existingKeys.has(r2_key)) { skipped++; continue }
  const filename = (key.split('/').pop() || '').normalize('NFC')
  let actor = findActor(filename)

  if (!actor) {
    // DB에 없는 배우 → 비공개로 생성 (파일명에서 이름 추출)
    const m = filename.match(/(?:여|남)\s*([가-힣]{2,4})\s*출연영상/) || filename.match(/([가-힣]{2,4})\s*출연영상/)
    const name = m ? m[1] : null
    if (!name) { report.push(`⚠️ 이름 추출 실패: ${filename}`); continue }
    const meta = parseMeta(filename)
    const { data: newActor, error: ce } = await sb.from('actors')
      .insert({ name, gender: meta.gender, age_group: meta.age_group, is_public: false, self_managed: false, source: 'manual' })
      .select('id, name').single()
    if (ce) { report.push(`❌ 배우 생성 실패 ${name}: ${ce.message}`); continue }
    actor = newActor
    created++
    report.push(`➕ 신규 배우 생성(비공개): ${name}`)
  }

  const { error: ve } = await sb.from('actor_videos')
    .insert({ actor_id: actor.id, title: filename.replace(/\.(mp4|mov|m4v)$/i, ''), r2_key })
  if (ve) { report.push(`❌ 영상 등록 실패 ${actor.name}: ${ve.message}`); continue }
  linked++
  report.push(`🎬 ${actor.name} ← ${filename}`)
}

console.log('---')
report.forEach(r => console.log(r))
console.log('---')
console.log(`연결: ${linked} / 신규배우생성: ${created} / 중복스킵: ${skipped}`)
