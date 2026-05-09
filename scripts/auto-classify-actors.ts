/**
 * 배우 캐스팅 태그 1회성 자동 분류 — Gemini 2.0 Flash
 *
 * 실행:
 *   cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && npx tsx scripts/auto-classify-actors.ts
 *
 * 전제:
 * 1. supabase/migrations/2026-05-10_actor_casting_fields.sql 실행됨
 * 2. .env.local 에 GEMINI_KEY (또는 NEXT_PUBLIC_GEMINI_KEY) + Supabase 키
 *
 * 동작:
 * - is_public=true 배우 전체 조회 (필모그래피 join)
 * - --force 플래그 없으면 last_classified_at 있는 배우 스킵 (멱등)
 * - 각 배우별 Gemini 호출 (300ms delay, rate limit 회피)
 * - casting_tags + casting_summary + last_classified_at 업데이트
 *
 * 비용: 60명 분류 ≈ Gemini Flash $0.0001/req → 거의 무료
 */

import { createClient } from '@supabase/supabase-js'
import { classifyActor } from '../lib/actor-tags'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const FORCE = process.argv.includes('--force')
const DELAY_MS = 300

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env 누락')
  process.exit(1)
}

if (!process.env.GEMINI_KEY && !process.env.NEXT_PUBLIC_GEMINI_KEY) {
  console.error('❌ GEMINI_KEY env 누락 — Gemini API 키 필요')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log(`📦 배우 캐스팅 태그 자동 분류 시작${FORCE ? ' (--force: 전체 재분류)' : ''}`)

  // 대상 actor + 필모그래피 join
  const { data: actors, error } = await supabase
    .from('actors')
    .select(
      `
      id, name, gender, age_group, height, skills, last_classified_at,
      actor_filmography ( title, role, year, production )
    `
    )
    .eq('is_public', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ actors fetch 실패:', error.message)
    process.exit(1)
  }

  if (!actors || actors.length === 0) {
    console.log('⚠️  공개 배우 0명 — 종료')
    return
  }

  // 멱등: last_classified_at 있는 배우 스킵 (--force 제외)
  const targets = FORCE
    ? actors
    : actors.filter((a: { last_classified_at: string | null }) => !a.last_classified_at)

  console.log(`📊 전체 ${actors.length}명 / 분류 대상 ${targets.length}명`)
  if (targets.length === 0) {
    console.log('✅ 모두 이미 분류됨 (--force 로 재분류 가능)')
    return
  }

  let success = 0
  let failed = 0
  const samples: Array<{ name: string; tags: string[]; summary: string }> = []

  for (const actor of targets as Array<{
    id: string
    name: string
    gender: '남' | '여' | null
    age_group: string | null
    height: number | null
    skills: string[] | null
    actor_filmography: Array<{ title: string; role: string | null; year: number | null; production: string | null }>
  }>) {
    try {
      const result = await classifyActor({
        name: actor.name,
        gender: actor.gender,
        age_group: actor.age_group,
        height: actor.height,
        skills: actor.skills,
        filmography: actor.actor_filmography ?? [],
      })

      // 빈 결과 (Gemini 일시 장애 등) 시 업데이트 스킵 — 기존 분류 보호
      if (result.tags.length === 0 && !result.summary) {
        console.log(`⏭  ${actor.name.padEnd(8)} → 빈 결과 (Gemini 일시 실패) · 기존 데이터 유지`)
        failed++
        await new Promise((r) => setTimeout(r, DELAY_MS))
        continue
      }

      const { error: updateError } = await supabase
        .from('actors')
        .update({
          casting_tags: result.tags.length > 0 ? result.tags : null,
          casting_summary: result.summary || null,
          last_classified_at: new Date().toISOString(),
        })
        .eq('id', actor.id)

      if (updateError) throw updateError

      const tagStr = result.tags.length > 0 ? result.tags.join(',') : '(태그 없음)'
      console.log(`✅ ${actor.name.padEnd(8)} → [${tagStr}] "${result.summary}"`)
      if (samples.length < 5) samples.push({ name: actor.name, ...result })
      success++
    } catch (err) {
      console.error(`❌ ${actor.name}:`, err instanceof Error ? err.message : err)
      failed++
    }

    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  console.log(`\n📊 결과: 성공 ${success} / 실패 ${failed} / 대상 ${targets.length}`)
  if (samples.length > 0) {
    console.log('\n🔍 샘플 5건 검증:')
    for (const s of samples) {
      console.log(`  ${s.name}: [${s.tags.join(',')}] · ${s.summary}`)
    }
  }
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err)
  process.exit(1)
})
