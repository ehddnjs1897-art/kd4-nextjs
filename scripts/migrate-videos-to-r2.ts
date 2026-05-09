/**
 * Supabase Storage → Cloudflare R2 영상 자동 이전 스크립트
 *
 * 실행:
 *   cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a
 *   && npx tsx scripts/migrate-videos-to-r2.ts
 *
 * 동작:
 * 1. Supabase Storage 버킷('actor-videos' 또는 사용자 지정)에서 모든 영상 파일 나열
 * 2. 각 파일 다운로드 → R2 업로드
 * 3. actor_videos 테이블에 r2_key + 메타 정보 저장
 *    (Supabase Storage의 영상은 그대로 두고, R2에만 추가 — 안전망)
 * 4. 진행 상황 + 검증 결과 출력
 *
 * 멱등: 이미 r2_key가 있는 영상은 스킵
 *
 * 안전망: Supabase Storage 영상은 삭제 안 함. 검증 완료 후 수동 삭제.
 */

import { createClient } from '@supabase/supabase-js'
import { uploadVideo, buildVideoKey, isR2Configured } from '../lib/r2'
import { extname } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SOURCE_BUCKET = process.env.MIGRATE_SOURCE_BUCKET ?? 'actor-videos'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env 누락')
  process.exit(1)
}
if (!isR2Configured()) {
  console.error('❌ R2 환경변수 누락 (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

interface StorageFile {
  name: string
  id: string
  metadata?: { size?: number; mimetype?: string }
}

async function listAllVideos(prefix = '', collected: StorageFile[] = []): Promise<StorageFile[]> {
  const { data, error } = await supabase.storage.from(SOURCE_BUCKET).list(prefix, {
    limit: 1000,
    offset: 0,
  })
  if (error) {
    console.error(`❌ 목록 조회 실패 (${prefix}):`, error.message)
    return collected
  }
  for (const item of data ?? []) {
    if (!item.id) {
      // 폴더 → 재귀
      const subPath = prefix ? `${prefix}/${item.name}` : item.name
      await listAllVideos(subPath, collected)
    } else {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name
      collected.push({ name: fullPath, id: item.id, metadata: item.metadata as StorageFile['metadata'] })
    }
  }
  return collected
}

async function downloadFromSupabase(path: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(SOURCE_BUCKET).download(path)
  if (error || !data) {
    console.error(`❌ 다운로드 실패 (${path}):`, error?.message ?? 'no data')
    return null
  }
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function findActorIdFromPath(path: string): Promise<string | null> {
  // 가능한 패턴 시도: "{actor_id}/foo.mp4" 또는 actor name match
  const parts = path.split('/')
  if (parts.length >= 2) {
    // 첫 부분이 UUID 형식이면 actor_id로 가정
    if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(parts[0])) {
      const { data } = await supabase
        .from('actors')
        .select('id')
        .eq('id', parts[0])
        .maybeSingle()
      if (data) return data.id
    }
  }
  // 파일명에 actor 이름 포함 가능 — 이름 매칭 시도
  const filename = parts[parts.length - 1]
  const nameMatch = filename.replace(/\.(mp4|mov|webm|mkv)$/i, '').split(/[_\-\s]/)[0]
  if (nameMatch.length >= 2) {
    const { data } = await supabase
      .from('actors')
      .select('id, name')
      .ilike('name', `%${nameMatch}%`)
      .limit(1)
      .maybeSingle()
    if (data) {
      console.log(`   🔍 파일 ${path} → 배우 매칭: ${data.name}`)
      return data.id
    }
  }
  return null
}

async function alreadyMigrated(r2Key: string): Promise<boolean> {
  const { count } = await supabase
    .from('actor_videos')
    .select('*', { count: 'exact', head: true })
    .eq('r2_key', r2Key)
  return (count ?? 0) > 0
}

async function main() {
  console.log(`🚀 Supabase Storage(${SOURCE_BUCKET}) → R2 영상 이전 시작\n`)

  // 1. 목록 조회
  const files = await listAllVideos()
  const videoFiles = files.filter((f) => /\.(mp4|mov|webm|mkv|avi)$/i.test(f.name))
  console.log(`📦 발견된 영상 파일: ${videoFiles.length}개`)

  if (videoFiles.length === 0) {
    console.log('⚠️  Supabase Storage에 영상 없음. 빈 마이그레이션.')
    return
  }

  let success = 0
  let skipped = 0
  let failed = 0
  const errors: Array<{ path: string; reason: string }> = []

  for (const file of videoFiles) {
    console.log(`\n📥 처리 중: ${file.name}`)
    try {
      // actor_id 추측
      const actorId = await findActorIdFromPath(file.name)
      if (!actorId) {
        console.warn(`   ⚠️  actor_id 매칭 실패 — 스킵 (수동 처리 필요)`)
        errors.push({ path: file.name, reason: 'actor_id 매칭 실패' })
        failed++
        continue
      }

      const ext = extname(file.name).slice(1) || 'mp4'
      const r2Key = buildVideoKey(actorId, `migrated.${ext}`)

      // 멱등 체크
      if (await alreadyMigrated(r2Key)) {
        console.log(`   ⏭  이미 R2에 있음 — 스킵`)
        skipped++
        continue
      }

      // 다운로드
      console.log(`   ⬇️  Supabase에서 다운로드...`)
      const buffer = await downloadFromSupabase(file.name)
      if (!buffer) {
        failed++
        errors.push({ path: file.name, reason: '다운로드 실패' })
        continue
      }
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(1)

      // R2 업로드
      console.log(`   ⬆️  R2 업로드 (${sizeMB}MB) → ${r2Key}`)
      const mime = file.metadata?.mimetype ?? `video/${ext}`
      await uploadVideo(r2Key, buffer, mime)

      // DB row 생성
      const { error } = await supabase.from('actor_videos').insert({
        actor_id: actorId,
        title: file.name.split('/').pop() ?? file.name,
        r2_key: r2Key,
        file_size_bytes: buffer.length,
        uploaded_at: new Date().toISOString(),
        is_public: false,
      })

      if (error) {
        console.warn(`   ⚠️  DB insert 실패: ${error.message}`)
        // 단, 같은 (actor_id, r2_key) 이미 있으면 무시
        if (!error.message.includes('duplicate')) {
          errors.push({ path: file.name, reason: `DB: ${error.message}` })
          failed++
          continue
        }
      }

      console.log(`   ✅ 완료`)
      success++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`   ❌ 예외: ${msg}`)
      errors.push({ path: file.name, reason: msg })
      failed++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 결과 요약`)
  console.log(`   ✅ 성공: ${success}`)
  console.log(`   ⏭  스킵 (이미 이전): ${skipped}`)
  console.log(`   ❌ 실패: ${failed}`)
  console.log(`   📦 총 처리: ${videoFiles.length}`)
  if (errors.length > 0) {
    console.log(`\n⚠️  실패 목록:`)
    for (const e of errors) {
      console.log(`   - ${e.path} → ${e.reason}`)
    }
  }
  console.log('\n💡 다음 단계:')
  console.log('   1. /actors/{id} 페이지에서 영상 재생 검증')
  console.log('   2. 모두 정상이면 Supabase Storage actor-videos 버킷 수동 삭제 가능')
  console.log('   3. Supabase Pro → Free 다운그레이드')
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err)
  process.exit(1)
})
