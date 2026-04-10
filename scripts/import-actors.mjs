/**
 * 구글 시트 → Supabase actors 임포트 (ESM, Node.js 직접 실행)
 * 실행: node scripts/import-actors.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qudyncopszvcbnwgrwbd.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_seNPYzM-osjneCy2w91Lkw_248ByWeq'
const SHEET_ID = '1XfatoR0V4DoTVpQrujG8kpMd1Soaaw86C2qVKnd5IZI'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function parseCSV(text) {
  const rows = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = []
    let inQuote = false
    let cell = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cols.push(cell.trim())
        cell = ''
      } else {
        cell += ch
      }
    }
    cols.push(cell.trim())
    rows.push(cols)
  }
  return rows
}

function extractDriveId(url) {
  if (!url) return null
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (m1) return m1[1]
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m2) return m2[1]
  return null
}

function normalizeGender(raw) {
  const s = (raw || '').trim()
  if (s === '남' || s === 'M' || s === '남성') return '남'
  if (s === '여' || s === 'F' || s === '여성') return '여'
  return null
}

function normalizeAgeGroup(raw) {
  const s = (raw || '').trim()
  if (s.includes('20')) return '20대'
  if (s.includes('30')) return '30대'
  if (s.includes('40')) return '40대'
  if (s.includes('50') || s.includes('60')) return '50대 이상'
  return null
}

async function main() {
  console.log('📥 구글 시트 다운로드 중...')
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`,
    { redirect: 'follow' }
  )
  if (!res.ok) throw new Error(`시트 다운로드 실패: ${res.status}`)
  const text = await res.text()
  const rows = parseCSV(text)

  // 헤더 제거
  const dataRows = rows.slice(1).filter(r => r[0]?.trim())
  console.log(`📋 총 ${dataRows.length}명 처리 시작...\n`)

  let inserted = 0
  let skipped = 0
  const errors = []

  for (const row of dataRows) {
    const name = row[0]?.trim()
    if (!name) { skipped++; continue }

    const gender = normalizeGender(row[1])
    const age_group = normalizeAgeGroup(row[2])
    const driveProfileUrl = row[3]?.trim() || null
    const driveVideoUrl = row[4]?.trim() || null
    const phone = row[5]?.trim() || null
    const recentWork = row[6]?.trim() || null
    const email = row[7]?.trim() || null
    const drivePhotoId = row[8]?.trim() || extractDriveId(driveProfileUrl)

    const { data: actor, error } = await supabase
      .from('actors')
      .insert({
        name,
        gender,
        age_group,
        phone: phone || null,
        email: email || null,
        drive_photo_id: drivePhotoId || null,
        source: 'drive_import',
        is_public: true,
      })
      .select('id')
      .single()

    if (error) {
      console.log(`  ❌ ${name}: ${error.message}`)
      errors.push(`${name}: ${error.message}`)
    } else {
      console.log(`  ✅ ${name} (${gender ?? '?'} / ${age_group ?? '?'})`)
      inserted++

      // 최근 작품 → 필모그래피
      if (recentWork && actor?.id) {
        await supabase.from('actor_filmography').insert({
          actor_id: actor.id,
          category: 'drama',
          title: recentWork,
          sort_order: 0,
        })
      }
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log(`✅ 삽입 완료: ${inserted}명`)
  console.log(`⏭️  스킵: ${skipped}행`)
  if (errors.length > 0) {
    console.log(`❌ 오류 ${errors.length}건:`)
    errors.forEach(e => console.log(`   - ${e}`))
  }
}

main().catch(err => {
  console.error('임포트 실패:', err)
  process.exit(1)
})
