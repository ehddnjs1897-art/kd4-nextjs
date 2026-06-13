/**
 * 배우 필모그래피(경력) 복원 — 백업 JSON → Supabase actor_filmography
 *
 * 배경 (2026-06-11):
 *   배우 52명의 actor_filmography 가 라이브 DB에서 비어, 개인페이지 경력 섹션이 공백으로 노출됨.
 *   동일 DB 스냅샷 백업(KD4-HUB/03-data/배우DB_분류전백업_2026-06-11_0000.json, 737행)에서
 *   필모그래피를 그대로 재삽입한다. (actor_id 가 라이브 ID와 1:1 일치 — 동일 DB 백업)
 *
 * 실행:
 *   cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && \
 *     npx tsx scripts/restore-filmography.ts            # 기본: DB가 비어있는 배우만 삽입(멱등)
 *   ... scripts/restore-filmography.ts --dry-run        # 네트워크 없이 삽입 계획만 출력
 *   ... scripts/restore-filmography.ts --force          # 배우별 기존 필모 전체 삭제 후 백업으로 재삽입
 *   ... scripts/restore-filmography.ts --backup <path>  # 백업 JSON 경로 지정
 *
 * 안전장치:
 *   - 기본 모드는 "라이브 DB에 필모 0건인 배우만" 삽입 → 중복/덮어쓰기 방지(멱등)
 *   - --force 는 배우 단위 delete→insert (전체 DELETE 아님)
 *   - --dry-run 으로 항상 사전 검증 가능
 *
 * 백업 필모 스키마: { actor_id, category, title, role, year, broadcaster, film_type, award }
 * 삽입 컬럼:        actor_id, category, year, title, role, broadcaster, film_type, award, sort_order
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const DEFAULT_BACKUP =
  '/Users/dongdongy/Desktop/KD4-HUB/03-data/배우DB_분류전백업_2026-06-11_0000.json'
const BACKUP_PATH = (() => {
  const i = process.argv.indexOf('--backup')
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : DEFAULT_BACKUP
})()

const VALID_CATEGORIES = new Set(['drama', 'film', 'cf', 'musical', 'theater', 'etc'])

interface BackupFilmo {
  actor_id: string
  category: string | null
  title: string | null
  role: string | null
  year: number | null
  broadcaster: string | null
  film_type: string | null
  award: string | null
}
interface BackupActor {
  id: string
  name: string
}
interface Backup {
  actors: BackupActor[]
  filmo: BackupFilmo[]
}

function loadBackup(): Backup {
  const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf-8'))
  if (!Array.isArray(raw.actors) || !Array.isArray(raw.filmo)) {
    throw new Error('백업 형식 오류: { actors:[], filmo:[] } 가 아님')
  }
  return raw as Backup
}

/** 백업 행 → DB insert 행 (sort_order 는 배우별 배열 순서대로 0..n) */
function toRows(actorId: string, entries: BackupFilmo[]) {
  return entries.map((f, idx) => ({
    actor_id: actorId,
    category: f.category && VALID_CATEGORIES.has(f.category) ? f.category : 'etc',
    year: f.year ?? null,
    title: f.title ? String(f.title).slice(0, 200) : null,
    role: f.role ? String(f.role).slice(0, 100) : null,
    broadcaster: f.broadcaster ? String(f.broadcaster).slice(0, 100) : null,
    film_type: f.film_type ? String(f.film_type).slice(0, 50) : null,
    award: f.award ? String(f.award).slice(0, 200) : null,
    sort_order: idx,
  }))
}

async function main() {
  const backup = loadBackup()

  // actor_id → 백업 필모 그룹화
  const byActor = new Map<string, BackupFilmo[]>()
  for (const f of backup.filmo) {
    if (!f.title) continue // 제목 없는 행은 제외
    const arr = byActor.get(f.actor_id) ?? []
    arr.push(f)
    byActor.set(f.actor_id, arr)
  }
  const nameOf = new Map(backup.actors.map((a) => [a.id, a.name]))

  console.log(`📦 백업: ${BACKUP_PATH}`)
  console.log(
    `📊 배우 ${backup.actors.length}명 / 필모 ${backup.filmo.length}행 / 필모 보유 배우 ${byActor.size}명`
  )
  console.log(
    `⚙️  모드: ${DRY_RUN ? 'DRY-RUN(네트워크 없음)' : FORCE ? 'FORCE(배우별 삭제→재삽입)' : '기본(DB 비어있는 배우만 삽입)'}\n`
  )

  if (DRY_RUN) {
    let total = 0
    for (const [actorId, entries] of byActor) {
      const rows = toRows(actorId, entries)
      total += rows.length
      console.log(`  ${(nameOf.get(actorId) ?? actorId).padEnd(8)} → ${rows.length}행 삽입 예정`)
    }
    console.log(`\n✅ DRY-RUN 완료 — 총 ${total}행 삽입 예정 (실제 변경 없음)`)
    return
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env 누락')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // 사전 연결 검증 — 키 만료/회전 즉시 감지
  const probe = await supabase.from('actor_filmography').select('id', { count: 'exact', head: true })
  if (probe.error) {
    console.error(`❌ Supabase 연결/인증 실패: ${probe.error.message}`)
    console.error('   → .env.local 의 SUPABASE_SERVICE_ROLE_KEY 가 만료/회전됐을 수 있음. Vercel env에서 최신 키 확인 필요.')
    process.exit(1)
  }
  console.log(`🔌 연결 OK — 현재 actor_filmography 총 ${probe.count ?? '?'}행\n`)

  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const [actorId, entries] of byActor) {
    const name = nameOf.get(actorId) ?? actorId
    try {
      const existing = await supabase
        .from('actor_filmography')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', actorId)
      if (existing.error) throw existing.error
      const haveCount = existing.count ?? 0

      if (haveCount > 0 && !FORCE) {
        console.log(`⏭  ${name.padEnd(8)} → 이미 ${haveCount}행 존재 · 스킵 (--force 로 덮어쓰기)`)
        skipped++
        continue
      }

      if (haveCount > 0 && FORCE) {
        const del = await supabase.from('actor_filmography').delete().eq('actor_id', actorId)
        if (del.error) throw del.error
      }

      const rows = toRows(actorId, entries)
      const ins = await supabase.from('actor_filmography').insert(rows)
      if (ins.error) throw ins.error

      console.log(`✅ ${name.padEnd(8)} → ${rows.length}행 삽입${haveCount > 0 ? ` (기존 ${haveCount}행 교체)` : ''}`)
      inserted += rows.length
    } catch (err) {
      console.error(`❌ ${name}: ${err instanceof Error ? err.message : err}`)
      failed++
    }
  }

  console.log(`\n📊 결과: ${inserted}행 삽입 / ${skipped}명 스킵 / ${failed}명 실패`)
  console.log('⚠️  복원 후 배우 상세 캐시(30초 revalidate) 자동 갱신 — 즉시 확인하려면 해당 배우 페이지 재요청')
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err)
  process.exit(1)
})
