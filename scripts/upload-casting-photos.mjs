/**
 * 캐스팅 사진을 Supabase Storage에 업로드
 * 실행: node scripts/upload-casting-photos.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qudyncopszvcbnwgrwbd.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'casting'
const CASTING_DIR = './public/casting'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// 한글 파일명 → ASCII 스토리지 키 매핑
const FILE_MAP = {
  'KD4_캐스팅_권동원_1.png':          'kwondongwon-1.png',
  'KD4_캐스팅_명승호_1.png':          'myungseungho-1.png',
  'KD4_캐스팅_강승현_1.png':          'kangseunghyun-1.png',
  'KD4_캐스팅_박우진_1.png':          'pakwoojin-1.png',
  'KD4_캐스팅_권동원_무빙1.png':      'kwondongwon-moving1.png',
  'KD4_캐스팅_배승헌_1.png':          'baesunghun-1.png',
  'KD4_캐스팅_윤지원_1.png':          'yoonjiwon-1.png',
  'KD4_캐스팅_명승호_크래시2.png':    'myungseungho-crash2.png',
  'KD4_캐스팅_이차일_1.png':          'leechaeil-1.png',
  'KD4_캐스팅_이훈_1.png':            'leehoon-1.png',
  'KD4_캐스팅_장서후_1.png':          'jangseohoo-1.png',
  'KD4_캐스팅_정다운_1 (1).png':      'jungdawoon-1.png',
  'KD4_캐스팅_채병욱_1.png':          'chaebiyungwook-1.png',
  'KD4_캐스팅_김신율_1.png':          'kimsinyul-1.png',
  'KD4_캐스팅_김이영_1.png':          'kimiyoung-1.png',
}

async function main() {
  // 1. 버킷 생성 (없으면)
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  })
  if (bucketError && !bucketError.message.includes('already exists')) {
    throw bucketError
  }
  console.log(`✅ 버킷 '${BUCKET}' 준비 완료\n`)

  // 2. FILE_MAP 기준으로 업로드
  const entries = Object.entries(FILE_MAP)
  console.log(`📁 총 ${entries.length}개 파일 업로드 시작...\n`)

  const results = []

  for (const [originalName, storageName] of entries) {
    const filePath = join(CASTING_DIR, originalName)
    let fileBuffer
    try {
      fileBuffer = readFileSync(filePath)
    } catch {
      console.log(`  ⚠️  ${originalName}: 파일 없음 (스킵)`)
      continue
    }
    const contentType = 'image/png'

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storageName, fileBuffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.log(`  ❌ ${storageName}: ${error.message}`)
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storageName)
      console.log(`  ✅ ${storageName}`)
      results.push({ original: originalName, storage: storageName, url: urlData.publicUrl })
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log(`✅ 업로드 완료: ${results.length}/${files.length}개`)

  // 3. casting-photos.ts 수정용 URL 출력
  console.log('\n📋 Supabase Storage URL 목록:')
  for (const r of results) {
    console.log(`  ${r.original} → ${r.url}`)
  }
}

main().catch(err => {
  console.error('업로드 실패:', err)
  process.exit(1)
})
