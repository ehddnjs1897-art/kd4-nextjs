/**
 * 기존에 '공지'로 등록된 캐스팅 축하 게시글을 '캐스팅' 카테고리로 일괄 이전.
 * ⚠️ 먼저 Supabase SQL Editor에서 posts_category_check 제약조건에 '캐스팅'을 추가해야 함.
 * 실행: cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && npx tsx scripts/migrate_casting_category.ts
 */
import './_loadEnv'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
  { auth: { persistSession: false } }
)

async function main() {
  const { data, error } = await sb
    .from('posts')
    .update({ category: '캐스팅' })
    .eq('category', '공지')
    .like('title', '🎉%캐스팅 축하드립니다!')
    .select('id, title')

  if (error) { console.error('마이그레이션 실패:', error.message); process.exit(1) }
  console.log(`✅ ${data.length}건 '캐스팅' 카테고리로 이전 완료`)
  data.forEach(p => console.log(` - ${p.title}`))
}
main()
