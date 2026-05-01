/**
 * 1회성 마이그레이션: actors의 Google Drive 썸네일 → Supabase Storage
 *
 * 실행:
 *   npm run migrate:actors
 *
 * 사전 조건 (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * DB 마이그레이션 선행:
 *   supabase/migrations/20260501_add_storage_photo_path.sql 실행 (actors.storage_photo_path 컬럼 추가)
 *
 * 결과:
 *   1. Supabase Storage 버킷 'actor-photos' 생성 (public)
 *   2. drive_photo_id 가진 모든 actor의 사진을 Drive에서 fetch → Storage 업로드
 *   3. actors.storage_photo_path 업데이트
 *   4. 진행 로그 출력 + 실패 건 별도 정리
 *
 * 멱등성: storage_photo_path가 이미 있는 actor는 건너뜀.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('✗ .env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BUCKET = 'actor-photos'
const DRIVE_THUMB_BASE = 'https://drive.google.com/thumbnail'
const DOWNLOAD_SIZE = 'w1200' // 원본은 너무 큼, 1200px wide로 충분

type ActorRow = {
  id: string
  name: string | null
  drive_photo_id: string | null
  storage_photo_path: string | null
}

async function ensureBucket(): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`버킷 목록 조회 실패: ${error.message}`)

  const exists = buckets?.find((b) => b.name === BUCKET)
  if (exists) {
    console.log(`✓ 버킷 '${BUCKET}' 존재 확인`)
    return
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5_242_880, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })
  if (createErr) throw new Error(`버킷 생성 실패: ${createErr.message}`)
  console.log(`✓ 버킷 '${BUCKET}' 생성됨 (public)`)
}

async function fetchDriveImage(driveId: string): Promise<Buffer> {
  const url = `${DRIVE_THUMB_BASE}?id=${driveId}&sz=${DOWNLOAD_SIZE}`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(`Drive fetch ${res.status}: ${url}`)
  }
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function uploadToStorage(actorId: string, buffer: Buffer): Promise<string> {
  const filePath = `${actorId}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })
  if (error) throw new Error(`Storage 업로드 실패: ${error.message}`)
  return filePath
}

async function migrateOne(actor: ActorRow): Promise<'success' | 'skip' | 'fail'> {
  const label = actor.name ?? actor.id
  if (!actor.drive_photo_id) {
    console.log(`  - ${label}: drive_photo_id 없음, 건너뜀`)
    return 'skip'
  }
  if (actor.storage_photo_path) {
    console.log(`  ⊙ ${label}: 이미 마이그레이션됨, 건너뜀`)
    return 'skip'
  }

  try {
    const buffer = await fetchDriveImage(actor.drive_photo_id)
    const filePath = await uploadToStorage(actor.id, buffer)

    const { error } = await supabase
      .from('actors')
      .update({ storage_photo_path: filePath })
      .eq('id', actor.id)

    if (error) throw new Error(`DB 업데이트 실패: ${error.message}`)
    console.log(`  ✓ ${label}: ${(buffer.length / 1024).toFixed(0)}KB → ${filePath}`)
    return 'success'
  } catch (err) {
    console.error(`  ✗ ${label}: ${(err as Error).message}`)
    return 'fail'
  }
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' actors Drive → Supabase Storage 마이그레이션')
  console.log('═══════════════════════════════════════════════════════\n')

  await ensureBucket()

  console.log('\n[1/2] 배우 데이터 조회 중...')
  const { data: actors, error } = await supabase
    .from('actors')
    .select('id, name, drive_photo_id, storage_photo_path')
    .not('drive_photo_id', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(`✗ 조회 실패: ${error.message}`)
    process.exit(1)
  }
  console.log(`  → ${actors?.length ?? 0}명의 배우 발견 (drive_photo_id 보유)`)

  console.log('\n[2/2] 마이그레이션 진행:')
  const counts = { success: 0, skip: 0, fail: 0 }
  const failed: string[] = []

  for (const actor of (actors ?? []) as ActorRow[]) {
    const result = await migrateOne(actor)
    counts[result]++
    if (result === 'fail') failed.push(actor.name ?? actor.id)
    // Drive rate limit 회피: 200ms 간격
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(' 결과')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  성공: ${counts.success}건`)
  console.log(`  건너뜀: ${counts.skip}건`)
  console.log(`  실패: ${counts.fail}건`)
  if (failed.length > 0) {
    console.log('\n실패 목록:')
    failed.forEach((n) => console.log(`  - ${n}`))
    console.log('\n실패 건은 다시 실행하면 재시도됩니다 (멱등성 유지).')
  }
}

main().catch((err) => {
  console.error('\n✗ 마이그레이션 치명 오류:', err)
  process.exit(1)
})
