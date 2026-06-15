/**
 * actor-docs 버킷 file_size_limit 10MB → 20MB (1회성, 멱등)
 * 박이아 등 배우 프로필 PPT 등록 실패 수정 — 2026-06-15.
 * 실행: cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && npx tsx scripts/fix-actor-docs-bucket.ts
 */
import { createClient } from '@supabase/supabase-js'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n/g, '').trim().replace(/\/$/, '')
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\\n/g, '').trim()
if (!URL || !KEY) { console.error('❌ env 누락'); process.exit(1) }
const sb = createClient(URL, KEY, { auth: { persistSession: false } })

async function main() {
  const before = (await sb.storage.listBuckets()).data?.find(b => b.id === 'actor-docs')
  console.log('이전:', (before as { file_size_limit?: number })?.file_size_limit, 'bytes')

  const { error } = await sb.storage.updateBucket('actor-docs', { public: false, fileSizeLimit: 20971520 })
  if (error) { console.error('🔴 버킷 수정 실패:', error.message); process.exit(2) }

  const after = (await sb.storage.listBuckets()).data?.find(b => b.id === 'actor-docs')
  const mb = ((after as { file_size_limit?: number })?.file_size_limit ?? 0) / 1024 / 1024
  console.log(`✅ actor-docs file_size_limit → ${mb}MB 적용 완료`)
}
main().catch(e => { console.error(e); process.exit(1) })
