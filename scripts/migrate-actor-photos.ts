/**
 * Actor 사진 1회성 마이그레이션
 * Drive 썸네일 → Supabase Storage `actor-photos` 버킷
 *
 * 실행 전 준비:
 * 1. Supabase Storage에 `actor-photos` 버킷 생성 (Public)
 * 2. 마이그레이션 SQL 실행: supabase/migrations/2026-05-07_add_storage_photo_path.sql
 * 3. .env.local 에 SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL 확인
 *
 * 실행:
 *   npx tsx scripts/migrate-actor-photos.ts
 *
 * 멱등성: storage_photo_path가 이미 있는 actor는 건너뜀.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env 누락')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const BUCKET = 'actor-photos'
const DELAY_MS = 200 // Drive rate limit 회피

async function main() {
  // 1. 대상 actor 목록
  const { data: actors, error } = await supabase
    .from('actors')
    .select('id, name, drive_photo_id, storage_photo_path')
    .not('drive_photo_id', 'is', null)
    .is('storage_photo_path', null)

  if (error) {
    console.error('❌ actors fetch 실패:', error.message)
    process.exit(1)
  }

  console.log(`📦 마이그레이션 대상: ${actors?.length ?? 0}명`)
  if (!actors || actors.length === 0) {
    console.log('✅ 모두 이미 마이그레이션됨. 종료.')
    return
  }

  let success = 0
  let failed = 0

  for (const actor of actors) {
    if (!actor.drive_photo_id) continue
    const filename = `${actor.id}.jpg`

    try {
      // 2. Drive에서 사진 fetch (썸네일 URL 사용 — uc?export=view는 권한 페이지로 리다이렉트되는 경우 있음)
      const driveUrl = `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w1600`
      const res = await fetch(driveUrl)
      if (!res.ok) throw new Error(`Drive fetch ${res.status}`)

      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('text/html')) {
        throw new Error('Drive returned HTML (권한 없음 또는 파일 비공개)')
      }

      // Buffer로 변환 — Blob의 type이 application/octet-stream이면 contentType 옵션이 무시됨
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 3. Storage 업로드 (명시적으로 image/jpeg 지정)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      if (uploadError) throw uploadError

      // 4. DB 업데이트
      const { error: updateError } = await supabase
        .from('actors')
        .update({ storage_photo_path: filename })
        .eq('id', actor.id)
      if (updateError) throw updateError

      console.log(`✅ ${actor.name} (${actor.id}) → ${filename}`)
      success++
    } catch (err: any) {
      console.error(`❌ ${actor.name} (${actor.id}): ${err.message ?? err}`)
      failed++
    }

    // rate limit 회피
    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  console.log(`\n📊 결과: 성공 ${success} / 실패 ${failed} / 총 ${actors.length}`)
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err)
  process.exit(1)
})
