// R2로 복사된 프로필(PPT/PDF) → 배우 DB 연결 (actors.profile_doc_path)
// 파일명에서 배우 이름 매칭(NFC). DB에 없으면 비공개 신규 생성.
// 실행: node --env-file=.env.local scripts/link-profiles.mjs
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import os from 'node:os'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const RCLONE = `${os.homedir()}/bin/rclone`
const PREFIX = 'migrated/profiles/'

const raw = execSync(`${RCLONE} lsf -R --files-only r2:kd4-actor-videos/${PREFIX}`, { encoding: 'utf8' })
const keys = raw.split('\n').map(s => s.trim()).filter(s => /\.(pdf|pptx|ppt)$/i.test(s))
console.log('R2 프로필 파일:', keys.length, '개')

const { data: actors } = await sb.from('actors').select('id, name, profile_doc_path')
const norm = (s) => s.normalize('NFC').replace(/\s+/g, '')
const findActor = (filename) => actors.find(a => norm(filename).includes(norm(a.name)))

function parseMeta(filename) {
  const head = filename.split('프로필')[0]
  let gender = /여/.test(head) ? '여' : /남/.test(head) ? '남' : null
  const ym = filename.match(/(\d{2})년생/)
  let age_group = null
  if (ym) { const yy = parseInt(ym[1], 10); const birth = yy <= 26 ? 2000 + yy : 1900 + yy; const age = 2026 - birth; age_group = age < 30 ? '20대' : age < 40 ? '30대' : age < 50 ? '40대' : '50대 이상' }
  return { gender, age_group }
}

let linked = 0, created = 0, skipped = 0
const report = []
for (const key of keys) {
  const filename = (key.split('/').pop() || '').normalize('NFC')
  const doc_path = PREFIX + key
  let actor = findActor(filename)
  if (!actor) {
    const m = filename.match(/(?:여|남)\s*([가-힣]{2,4})\s*프로필/) || filename.match(/([가-힣]{2,4})\s*프로필/)
    const name = m ? m[1] : null
    if (!name) { report.push(`⚠️ 이름 추출 실패: ${filename}`); continue }
    const meta = parseMeta(filename)
    const { data: na, error: ce } = await sb.from('actors').insert({ name, gender: meta.gender, age_group: meta.age_group, is_public: false, self_managed: false, source: 'manual' }).select('id, name').single()
    if (ce) { report.push(`❌ 배우 생성 실패 ${name}: ${ce.message}`); continue }
    actor = na; created++; report.push(`➕ 신규 배우 생성(비공개): ${name}`)
  }
  if (actor.profile_doc_path) { skipped++; report.push(`↔️ 이미 프로필 있음(스킵): ${actor.name}`); continue }
  const { error: ue } = await sb.from('actors').update({ profile_doc_path: doc_path }).eq('id', actor.id)
  if (ue) { report.push(`❌ 연결 실패 ${actor.name}: ${ue.message}`); continue }
  linked++; report.push(`📄 ${actor.name} ← ${filename}`)
}
console.log('---'); report.forEach(r => console.log(r)); console.log('---')
console.log(`연결: ${linked} / 신규생성: ${created} / 스킵: ${skipped}`)
