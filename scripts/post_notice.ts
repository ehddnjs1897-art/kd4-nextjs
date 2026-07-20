/**
 * 일반 공지 게시글(제목+본문+이미지 1장)을 커뮤니티 게시판 '공지'에 등록.
 * 실행: cd ~/Desktop/kd4-nextjs && set -a && source .env.local && set +a && \
 *   npx tsx scripts/post_notice.ts --title "제목" --body "/절대/경로/본문.txt" --image "/절대/경로/이미지.png"
 */
import './_loadEnv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
if (!URL || !KEY) { console.error('env 누락 (.env.local 확인)'); process.exit(1) }
const sb = createClient(URL, KEY, { auth: { persistSession: false } })

const ADMIN_AUTHOR_ID = '6f14e3e3-cb14-4ff2-8011-989d671e4686' // 유익액터스
const ADMIN_AUTHOR_NAME = '유익액터스'

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  const title = get('--title')
  const bodyPath = get('--body')
  const image = get('--image')
  if (!title || !bodyPath || !image) {
    console.error('사용법: --title "제목" --body "/경로/본문.txt" --image "/경로/이미지.png"')
    process.exit(1)
  }
  return { title, bodyPath, image }
}

async function main() {
  const { title, bodyPath, image } = parseArgs()
  const bodyText = readFileSync(bodyPath, 'utf8').trim()

  const bytes = readFileSync(image)
  const fileName = `posts/notice_${randomUUID()}.png`
  const { error: upErr } = await sb.storage.from('casting').upload(fileName, bytes, {
    contentType: 'image/png',
    upsert: false,
  })
  if (upErr) { console.error('이미지 업로드 실패:', upErr.message); process.exit(1) }
  const { data: { publicUrl } } = sb.storage.from('casting').getPublicUrl(fileName)

  const bodyHtml = bodyText
    .split('\n')
    .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
    .join('')
  const content = `<img src="${publicUrl}" style="max-width:100%;border-radius:8px;" />${bodyHtml}`

  const { data, error } = await sb
    .from('posts')
    .insert({
      title,
      content,
      category: '공지',
      author_id: ADMIN_AUTHOR_ID,
      author_name: ADMIN_AUTHOR_NAME,
    })
    .select('id')
    .maybeSingle()

  if (error || !data) { console.error('게시글 작성 실패:', error?.message); process.exit(1) }

  console.log(`✅ 게시 완료: https://kd4.club/board/${data.id}`)
}

main()
