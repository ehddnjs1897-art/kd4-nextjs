/**
 * 권동원 수상·영화제 이력 1회성 입력 — 2026-06-12 대표 채팅 직접 제공 (허용 데이터 소스)
 *
 * 입력 데이터 (대표 원문):
 *  - 영화제: 장편 독립 파미르 — 전주국제영화제
 *  - 영화제: 7days 7people — 전주국제영화제
 *  - (K-웹드라마 어워드 연기상은 수상 작품 미특정 — 대표 확인 후 별도 입력)
 *
 * 실행:
 *   cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && npx tsx scripts/add-awards-kwondongwon-20260612.ts
 *
 * 멱등: award 가 이미 채워진 row 는 건드리지 않음.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ env 누락'); process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const ENTRIES: { titleLike: string; award: string }[] = [
  { titleLike: '파미르', award: '전주국제영화제' },
  { titleLike: '7days', award: '전주국제영화제' },
]

async function main() {
  const { data: actor, error: aErr } = await supabase
    .from('actors').select('id, name').eq('name', '권동원').maybeSingle()
  if (aErr || !actor) { console.error('❌ 권동원 조회 실패:', aErr?.message ?? 'row 없음'); process.exit(1) }

  for (const e of ENTRIES) {
    const { data: rows, error } = await supabase
      .from('actor_filmography')
      .select('id, title, award')
      .eq('actor_id', actor.id)
      .ilike('title', `%${e.titleLike}%`)
    if (error) { console.error(`❌ ${e.titleLike} 조회 실패:`, error.message); continue }
    if (!rows || rows.length === 0) { console.warn(`⚠️ ${e.titleLike} — 필모 row 없음 (스킵)`); continue }
    for (const row of rows) {
      if (row.award && row.award.trim()) {
        console.log(`⏭ ${row.title} — award 이미 있음("${row.award}") 보존`); continue
      }
      const { error: uErr } = await supabase
        .from('actor_filmography').update({ award: e.award }).eq('id', row.id)
      if (uErr) console.error(`❌ ${row.title} 업데이트 실패:`, uErr.message)
      else console.log(`✅ ${row.title} → award="${e.award}"`)
    }
  }
}
main().catch((e) => { console.error('❌ 치명 오류:', e); process.exit(1) })
