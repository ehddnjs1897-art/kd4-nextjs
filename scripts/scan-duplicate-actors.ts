/**
 * 읽기 전용: 동명 배우 중복행 탐지 스캔.
 * actors 테이블에서 이름 정규화(normalizeName) 기준으로 그룹핑하여
 * "같은 이름 2행 이상 + 공개(is_public=true)/비공개 혼재" 그룹만 콘솔 표로 출력한다.
 *
 * ⚠️ SELECT만 수행. PATCH/UPDATE/DELETE 코드는 이 파일에 넣지 않는다.
 * 발견돼도 자동 병합/수정하지 않음 — 결과 보고 전용.
 *
 * 실행: npx tsx scripts/scan-duplicate-actors.ts
 */
import './_loadEnv'
import { createClient } from '@supabase/supabase-js'

// lib/actor-matching.ts / lib/supabase/admin.ts는 'server-only' import를 갖고 있어
// (해당 패키지가 devDependencies에도 없음) tsx 직접 실행 시 모듈 해석이 깨진다.
// 따라서 normalizeName은 lib/actor-matching.ts와 동일 로직을 그대로 복제해 사용한다.
// ⚠️ lib/actor-matching.ts의 normalizeName(export function normalizeName)이 바뀌면 이 함수도 맞춰 갱신할 것.
function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase()
}

// lib/supabase/admin.ts는 위와 같은 이유로 직접 import 불가 →
// 기존 scripts/*.ts 관례대로 service_role 클라이언트를 직접 생성한다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env 누락')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)

interface ActorRow {
  id: string
  name: string | null
  phone: string | null
  is_public: boolean | null
  source: string | null
}

async function main() {
  const { data, error } = await supabaseAdmin
    .from('actors')
    .select('id, name, phone, is_public, source')
    .limit(5000)

  if (error) {
    console.error('❌ 조회 실패:', error.message)
    process.exit(1)
  }

  const actors = (data ?? []) as ActorRow[]
  console.log(`📋 전체 actors 조회: ${actors.length}행`)

  // normalizeName 기준 그룹핑
  const groups = new Map<string, ActorRow[]>()
  for (const actor of actors) {
    const key = normalizeName(actor.name ?? '')
    if (!key) continue
    const list = groups.get(key) ?? []
    list.push(actor)
    groups.set(key, list)
  }

  // 같은 이름 2행 이상 + 공개/비공개 혼재 그룹만 필터
  const suspiciousGroups: { key: string; rows: ActorRow[] }[] = []
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue
    const hasPublic = rows.some((r) => r.is_public === true)
    const hasPrivate = rows.some((r) => r.is_public !== true)
    if (hasPublic && hasPrivate) {
      suspiciousGroups.push({ key, rows })
    }
  }

  if (suspiciousGroups.length === 0) {
    console.log('\n✅ 중복행 스캔 결과: 0건 — 공개/비공개 혼재 중복 그룹 없음')
    return
  }

  console.log(`\n⚠️ 의심 그룹 ${suspiciousGroups.length}건 발견 (같은 이름 + 공개/비공개 혼재)\n`)

  for (const { rows } of suspiciousGroups) {
    const name = rows[0].name ?? '(이름 없음)'
    console.log(`\n── ${name} (${rows.length}행) ──`)
    console.table(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone ?? '(없음)',
        is_public: r.is_public,
        source: r.source ?? '(없음)',
      }))
    )
  }

  console.log(`\n📊 요약: 의심 그룹 ${suspiciousGroups.length}건 / 전체 이름 그룹 ${groups.size}개 중 2행+ 그룹 ${[...groups.values()].filter((r) => r.length >= 2).length}개`)
  console.log('ℹ️  병합/수정은 이 스크립트에서 수행하지 않음 — 결과만 보고.')
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err)
  process.exit(1)
})
