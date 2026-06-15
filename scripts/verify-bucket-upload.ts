/**
 * 버킷 업로드 검증 (read+임시쓰기) — 사용자 흐름(signed URL)으로 HEIC·octet-stream 실제 업로드 테스트.
 * 실행: cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && npx tsx scripts/verify-bucket-upload.ts
 */
import { createClient } from '@supabase/supabase-js'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n/g, '').trim().replace(/\/$/, '')
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\\n/g, '').trim()
if (!URL || !KEY) { console.error('env 누락'); process.exit(1) }
const sb = createClient(URL, KEY, { auth: { persistSession: false } })

async function testUpload(bucket: string, ext: string, contentType: string) {
  const path = `intake/_mimetest/${Date.now()}-${Math.floor(performance.now())}.${ext}`
  const { data: sd, error: se } = await sb.storage.from(bucket).createSignedUploadUrl(path)
  if (se || !sd) { console.log(`  [${bucket}] ${contentType}: signed URL 발급 실패 — ${se?.message}`); return }
  const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: contentType })
  const { error: ue } = await sb.storage.from(bucket).uploadToSignedUrl(sd.path, sd.token, blob, { contentType })
  if (ue) { console.log(`  [${bucket}] ${contentType}: ❌ 거부 — ${ue.message}`); return }
  console.log(`  [${bucket}] ${contentType}: ✅ 업로드 OK`)
  await sb.storage.from(bucket).remove([sd.path])  // 테스트 파일 정리
}

async function main() {
  console.log('=== 사용자 흐름(signed URL) 업로드 테스트 ===')
  await testUpload('actor-photos', 'heic', 'image/heic')          // 아이폰 사진
  await testUpload('actor-photos', 'jpg', 'image/jpeg')           // 일반 사진
  await testUpload('actor-docs', 'pptx', 'application/octet-stream') // PPT(브라우저 MIME 미상)
  await testUpload('actor-docs', 'pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
  await testUpload('actor-docs', 'pdf', 'application/pdf')
  console.log('완료 — 모두 ✅면 박이아 재제출 시 정상 등록됩니다.')
}
main().catch(e => { console.error(e); process.exit(1) })
