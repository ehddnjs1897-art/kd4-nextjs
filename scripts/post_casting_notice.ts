/**
 * 캐스팅 카드(슬라이드1)를 kd4.club 커뮤니티 게시판 '캐스팅' 탭에 자동 등록.
 * 실행: cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && \
 *   npx tsx scripts/post_casting_notice.ts --name "이름" --work "작품명" --image "/절대/경로/슬라이드1.png"
 */
import './_loadEnv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
if (!URL || !KEY) { console.error('env 누락 (.env.local 확인)'); process.exit(1) }
const sb = createClient(URL, KEY, { auth: { persistSession: false } })

// 공지 작성자 = 브랜드 공식 계정
const ADMIN_AUTHOR_ID = '6f14e3e3-cb14-4ff2-8011-989d671e4686' // 유익액터스
const ADMIN_AUTHOR_NAME = '유익액터스'

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  const name = get('--name')
  const work = get('--work')
  const image = get('--image')
  if (!name || !work || !image) {
    console.error('사용법: --name "이름" --work "작품명" --image "/경로/슬라이드1.png"')
    process.exit(1)
  }
  return { name, work, image }
}

async function main() {
  const { name, work, image } = parseArgs()

  const bytes = readFileSync(image)
  const fileName = `posts/casting_${randomUUID()}.png`
  const { error: upErr } = await sb.storage.from('casting').upload(fileName, bytes, {
    contentType: 'image/png',
    upsert: false,
  })
  if (upErr) { console.error('이미지 업로드 실패:', upErr.message); process.exit(1) }
  const { data: { publicUrl } } = sb.storage.from('casting').getPublicUrl(fileName)

  const title = `🎉 ${name} 배우님, ${work} 캐스팅 축하드립니다!`
  const content =
    `<img src="${publicUrl}" style="max-width:100%;border-radius:8px;" />` +
    `<p>KD4 액팅 스튜디오 ${name} 배우님이 ${work} 작품에 캐스팅 되셨습니다.</p>` +
    `<p>축하드립니다 🎉</p>`

  const { data, error } = await sb
    .from('posts')
    .insert({
      title,
      content,
      category: '캐스팅',
      author_id: ADMIN_AUTHOR_ID,
      author_name: ADMIN_AUTHOR_NAME,
    })
    .select('id')
    .maybeSingle()

  if (error || !data) { console.error('게시글 작성 실패:', error?.message); process.exit(1) }

  console.log(`✅ 게시 완료: https://kd4.club/board/${data.id}`)
}

main()
