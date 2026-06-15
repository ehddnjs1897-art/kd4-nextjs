/**
 * 배우 업로드 버킷 allowed_mime_types 완화 — 2026-06-16 (멱등)
 * 박이아 등 등록 실패 2차 원인: 아이폰 HEIC 사진·PPT octet-stream MIME이 버킷에 거부됨.
 * 실행: cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && npx tsx scripts/fix-bucket-mime-types.ts
 */
import { createClient } from '@supabase/supabase-js'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n/g, '').trim().replace(/\/$/, '')
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\\n/g, '').trim()
if (!URL || !KEY) { console.error('env 누락'); process.exit(1) }
const sb = createClient(URL, KEY, { auth: { persistSession: false } })

// 사진: 아이폰 HEIC/HEIF 포함 (svg는 XSS 위험이라 제외 — 공개 버킷)
const PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
// 문서: pptx + ppt(구버전) + pdf + octet-stream(브라우저 MIME 미상 폴백). 비공개 버킷 + 코드가 확장자 검증.
const DOC_MIME = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/pdf',
  'application/octet-stream',
]

async function main() {
  const p = await sb.storage.updateBucket('actor-photos', { public: true, fileSizeLimit: 15728640, allowedMimeTypes: PHOTO_MIME })
  console.log(p.error ? `actor-photos 실패: ${p.error.message}` : 'OK actor-photos MIME 완화 (HEIC 포함)')

  const d = await sb.storage.updateBucket('actor-docs', { public: false, fileSizeLimit: 20971520, allowedMimeTypes: DOC_MIME })
  console.log(d.error ? `actor-docs 실패: ${d.error.message}` : 'OK actor-docs MIME 완화 (ppt·octet-stream 포함)')

  const { data: bs } = await sb.storage.listBuckets()
  for (const b of bs ?? []) {
    if (b.id === 'actor-photos' || b.id === 'actor-docs') {
      console.log(`  ${b.id}:`, JSON.stringify((b as { allowed_mime_types?: string[] }).allowed_mime_types))
    }
  }
}
main().catch(e => { console.error(e); process.exit(1) })
