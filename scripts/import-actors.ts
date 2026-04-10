/**
 * 구글 시트 → Supabase actors 테이블 임포트 스크립트
 *
 * 실행: npx ts-node --project tsconfig.scripts.json scripts/import-actors.ts
 *
 * 시트 구조:
 *   A:이름  B:성별  C:연령대  D:프로필링크(Drive)  E:출연영상링크(Drive)
 *   F:연락처  G:최근작품  H:이메일  I:프로필파일ID
 */

import { createClient } from '@supabase/supabase-js'

// ─── 환경변수 ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SHEET_ID = '1XfatoR0V4DoTVpQrujG8kpMd1Soaaw86C2qVKnd5IZI'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ─── 구글 시트 CSV 파싱 ─────────────────────────────────────────────────────
async function fetchSheet(): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
  console.log('📥 구글 시트 다운로드 중...')
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`시트 다운로드 실패: ${res.status} ${res.statusText}\n시트가 공개 상태인지 확인해주세요.`)
  }
  const text = await res.text()
  return parseCSV(text)
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cols: string[] = []
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

// ─── 드라이브 파일 ID 추출 ──────────────────────────────────────────────────
function extractDriveId(url: string): string | null {
  if (!url) return null
  // https://drive.google.com/file/d/FILE_ID/view
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (m1) return m1[1]
  // https://drive.google.com/open?id=FILE_ID
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m2) return m2[1]
  return null
}

// ─── 성별 정규화 ────────────────────────────────────────────────────────────
function normalizeGender(raw: string): string | null {
  const s = raw.trim()
  if (s === '남' || s === 'M' || s === '남성') return '남'
  if (s === '여' || s === 'F' || s === '여성') return '여'
  return null
}

// ─── 연령대 정규화 ──────────────────────────────────────────────────────────
function normalizeAgeGroup(raw: string): string | null {
  const s = raw.trim()
  if (s.includes('20')) return '20대'
  if (s.includes('30')) return '30대'
  if (s.includes('40')) return '40대'
  if (s.includes('50') || s.includes('60')) return '50대 이상'
  return null
}

// ─── 메인 임포트 ────────────────────────────────────────────────────────────
async function main() {
  const rows = await fetchSheet()

  // 첫 행이 헤더면 제거
  const isHeader = rows[0]?.[0]?.trim().includes('이름') || rows[0]?.[0]?.trim() === 'A'
  const dataRows = isHeader ? rows.slice(1) : rows

  console.log(`📋 총 ${dataRows.length}개 행 처리 시작...`)

  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of dataRows) {
    const name = row[0]?.trim()
    if (!name) { skipped++; continue }

    const gender = normalizeGender(row[1] ?? '')
    const age_group = normalizeAgeGroup(row[2] ?? '')
    const driveProfileUrl = row[3]?.trim() || null
    const driveVideoUrl = row[4]?.trim() || null
    const phone = row[5]?.trim() || null
    const recentWork = row[6]?.trim() || null
    const email = row[7]?.trim() || null
    const drivePhotoId = row[8]?.trim() || extractDriveId(driveProfileUrl ?? '')

    const actorData = {
      name,
      gender,
      age_group,
      phone,
      email,
      drive_photo_id: drivePhotoId,
      drive_folder_id: extractDriveId(driveVideoUrl ?? ''),
      source: 'drive_import' as const,
      is_public: true,
    }

    const { error } = await supabase
      .from('actors')
      .insert(actorData)

    if (error) {
      console.error(`  ❌ ${name}: ${error.message}`)
      errors.push(`${name}: ${error.message}`)
    } else {
      console.log(`  ✅ ${name} (${gender ?? '?'} / ${age_group ?? '?'})`)
      inserted++

      // 최근 작품이 있으면 필모그래피에 추가
      if (recentWork) {
        const { data: actor } = await supabase
          .from('actors')
          .select('id')
          .eq('name', name)
          .single()

        if (actor?.id) {
          await supabase.from('actor_filmography').insert({
            actor_id: actor.id,
            category: 'drama',
            title: recentWork,
            sort_order: 0,
          })
        }
      }
    }
  }

  console.log('\n─────────────────────────────────')
  console.log(`✅ 삽입: ${inserted}명`)
  console.log(`⏭️  스킵: ${skipped}행`)
  if (errors.length > 0) {
    console.log(`❌ 오류: ${errors.length}건`)
    errors.forEach(e => console.log(`   - ${e}`))
  }
}

main().catch(err => {
  console.error('임포트 실패:', err)
  process.exit(1)
})
