/**
 * 배우 DB 등록 진단 (read-only) — 2026-06-15
 * 특정 배우의 actors/profiles 상태 + 등록 막힘 원인 진단.
 *
 * 실행:
 *   cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && \
 *     npx tsx scripts/diag-actor-registration.ts 박이아
 */
import { createClient } from '@supabase/supabase-js'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n/g, '').trim().replace(/\/$/, '')
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\\n/g, '').trim()
if (!URL || !KEY) { console.error('❌ env 누락 (URL/SERVICE_KEY)'); process.exit(1) }

const sb = createClient(URL, KEY, { auth: { persistSession: false } })

function normName(s: string) { return (s ?? '').replace(/\s+/g, '').toLowerCase() }
function normPhone(s: string) { return (s ?? '').replace(/[\s\-.()+]/g, '').replace(/[^0-9]/g, '') }

async function main() {
  const target = process.argv[2] ?? '박이아'
  const tnorm = normName(target)
  console.log(`\n=== 진단 대상: "${target}" (정규화: ${tnorm}) ===\n`)

  // 1. actors 테이블 — 이름 부분일치 전수
  const { data: actors, error: aErr } = await sb
    .from('actors')
    .select('id, name, phone, is_public, self_managed, source, intake_submitted_at, created_at')
    .ilike('name', `%${target}%`)
  if (aErr) { console.error('actors 조회 오류:', aErr.message) }
  console.log(`[actors] "${target}" 부분일치: ${actors?.length ?? 0}건`)
  for (const a of actors ?? []) {
    console.log(`  - id=${a.id}`)
    console.log(`    name="${a.name}" phone="${a.phone ?? '(없음)'}" is_public=${a.is_public} self_managed=${a.self_managed} source=${a.source}`)
    console.log(`    intake_submitted_at=${a.intake_submitted_at ?? '(없음)'} created=${a.created_at}`)
  }

  // 2. profiles 테이블 — 이름 부분일치
  const { data: profiles, error: pErr } = await sb
    .from('profiles')
    .select('id, name, phone, role, actor_id, matched_at, created_at')
    .ilike('name', `%${target}%`)
  if (pErr) { console.error('profiles 조회 오류:', pErr.message) }
  console.log(`\n[profiles] "${target}" 부분일치: ${profiles?.length ?? 0}건`)
  for (const p of profiles ?? []) {
    console.log(`  - id=${p.id}`)
    console.log(`    name="${p.name}" phone="${p.phone ?? '(없음)'}" role=${p.role} actor_id=${p.actor_id ?? '(미연결)'} matched_at=${p.matched_at ?? '(없음)'}`)
  }

  // 3. 매칭 진단 — profile vs actors 동명 비교 (어제 보안 수정 영향 분석)
  console.log(`\n=== 매칭 진단 (2026-06-14 보안 수정 영향 분석) ===`)
  for (const p of profiles ?? []) {
    if (p.actor_id) { console.log(`  · profile ${p.id} 이미 actor_id=${p.actor_id} 연결됨 — 매칭 불필요`); continue }
    const pPhone = normPhone(p.phone ?? '')
    const sameName = (actors ?? []).filter(a => normName(a.name) === normName(p.name ?? ''))
    console.log(`  · profile "${p.name}" (phone정규화="${pPhone || '(없음)'}") → 동명 actor ${sameName.length}건`)
    if (sameName.length === 1) {
      const cand = sameName[0]
      const candPhone = normPhone(cand.phone ?? '')
      const phoneOk = !candPhone || (!!pPhone && candPhone === pPhone)
      console.log(`    후보 actor=${cand.id} candPhone="${candPhone || '(없음)'}"`)
      console.log(`    → 어제 수정 로직 phoneOk=${phoneOk}  ${phoneOk ? '✅ 매칭됨' : '🔴 매칭 차단 (전화 불일치) → 새 비공개 row 생성됨'}`)
      if (!phoneOk) {
        console.log(`    ⚠️ 원인 확정 후보: 후보 actor에 phone="${cand.phone}" 등록 / profile phone="${p.phone}" → 정규화 불일치`)
      }
    } else if (sameName.length === 0) {
      console.log(`    → 동명 actor 없음. 신규 비공개 row 생성 경로 (정상)`)
    } else {
      console.log(`    → 동명 actor 2건+ → 자동매칭 안 함(중복). 수동 정리 필요`)
    }
  }

  // 4. 🚨 시스템 전체 — role=actor인데 actor_id 없는 회원 전수 (등록 실패 의심자)
  const { data: orphans } = await sb.from('profiles')
    .select('id, name, phone, role, actor_id, created_at')
    .eq('role', 'actor').is('actor_id', null).order('created_at', { ascending: false })
  console.log(`\n=== 🚨 미등록 배우회원 (role=actor + actor_id 없음): ${orphans?.length ?? 0}명 ===`)
  for (const o of orphans ?? []) {
    console.log(`  - "${o.name}" phone=${o.phone ?? '없음'} created=${o.created_at}`)
  }

  // 6. Storage 버킷 file_size_limit (코드 허용치와 불일치 = drift → 큰 파일 클라단계 거부)
  const { data: buckets } = await sb.storage.listBuckets()
  console.log(`\n=== Storage 버킷 제한 (코드 허용: actor-photos 15MB · actor-docs 20MB) ===`)
  for (const b of buckets ?? []) {
    const lim = (b as { file_size_limit?: number | null }).file_size_limit
    const mb = lim ? (lim / 1024 / 1024).toFixed(1) + 'MB' : '무제한'
    const mime = (b as { allowed_mime_types?: string[] | null }).allowed_mime_types
    console.log(`  - ${b.id}: ${mb} / mime=${mime ? JSON.stringify(mime) : '제한없음(전체허용)'}`)
  }

  // 5. 대상자 Storage 업로드 파일 — 어느 단계까지 갔는지 (파일 업로드 성공 여부)
  const tgt = (profiles ?? [])[0]
  if (tgt) {
    for (const bucket of ['actor-photos', 'actor-docs']) {
      const { data: files, error: sErr } = await sb.storage.from(bucket).list(`intake/${tgt.id}`)
      console.log(`\n[Storage ${bucket}] intake/${tgt.id}: ${sErr ? 'ERROR ' + sErr.message : (files?.length ?? 0) + '개'}`)
      for (const f of files ?? []) console.log(`  - ${f.name} (${(f as { metadata?: { size?: number } }).metadata?.size ?? '?'} bytes)`)
    }
  }
  console.log('')
}

main().catch((e) => { console.error(e); process.exit(1) })
