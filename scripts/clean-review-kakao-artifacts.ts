/**
 * actor_reviews.review_text 에 섞여 들어온 복붙 아티팩트 제거 (1회성)
 *
 * 실행:
 *   npx tsx scripts/clean-review-kakao-artifacts.ts          # dry-run (기본)
 *   npx tsx scripts/clean-review-kakao-artifacts.ts --apply  # 실제 UPDATE
 *
 * 데이터 출처는 2종 (2026-07-19 실측):
 *   A) 네이버 카페 게시글 스크랩 — 게시판명/작성자등급/조회수/카페 링크/홍보 푸터
 *   B) 카카오톡 대화 복붙   — 카카오프렌즈 이모티콘 이름 줄, 메시지 타임스탬프
 *
 * 원칙: 후기 본문 실제 내용은 절대 건드리지 않는다. 아래 명시 패턴만 제거.
 * 주의: 홍보 헤더(☆…☆)와 바로 아래 URL은 반드시 "쌍으로" 제거 — URL만 지우면
 *       고아 헤더가 남아 오히려 더 지저분해짐.
 */
import './_loadEnv'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const APPLY = process.argv.includes('--apply')

// 카카오프렌즈 캐릭터 — 이모티콘 이름은 "[수식어 ]캐릭터" 형태로 파싱됨
const KAKAO_CHARS = ['네오', '튜브', '제이지', '라이언', '프로도', '어피치', '무지', '춘식이', '춘식', '콘']

/** 줄 전체가 카카오 이모티콘 이름인가 (예: "벙찐 튜브", "인사하는 제이지", "졸린 라이언") */
function isEmoticonName(line: string): boolean {
  const t = line.trim()
  if (!t || t.length > 22) return false
  // 문장부호·숫자·이모지가 있으면 본문일 가능성 → 제외
  if (/[.,!?~…"'()[\]<>:;0-9]/.test(t)) return false
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)) return false
  return KAKAO_CHARS.some((c) => t === c || (t.endsWith(c) && /^[가-힣a-zA-Z ]+$/.test(t)))
}

/** 줄 전체가 카카오 메시지 타임스탬프인가 (예: "오후 5:09") */
const isKakaoTimestamp = (l: string) => /^\s*(오전|오후)\s*\d{1,2}\s*:\s*\d{2}\s*$/.test(l)

/** 네이버 카페 홍보 헤더 (다음 줄 URL과 쌍으로 제거) */
const isCafePromoHeader = (l: string) =>
  /^\s*☆\s*(프로필 스튜디오 리스트|배우 훈련 단체 리스트)\s*☆\s*$/.test(l)

/** KD4 무료수업 홍보 푸터 (다음 줄 URL과 쌍으로 제거) */
const isPromoFooter = (l: string) =>
  /(홍대|강남).*(연기\s*워크샵|Acting Studio).*(듣고 싶으시다면)/i.test(l)

const isUrlLine = (l: string) => /https?:\/\/|(?:cafe|pf|open)\.(?:naver|kakao)\.com|bit\.ly|forms\.gle/i.test(l)

/** 카페 게시판명 (예: "스 터 디 >", "스터디 >") */
const isBoardName = (l: string) => /^\s*(?:[가-힣]\s*){2,6}>\s*$/.test(l)

/** 카페 작성자 등급 줄 (예: "연기자 한다경 DIAMON 👑 + 구독 1:1 채팅") */
const isAuthorRankLine = (l: string) =>
  /(DIAMON|PLATIN|GOLD|SILVER|BRONZE)/i.test(l) || /\+\s*구독/.test(l) || /1\s*:\s*1\s*(?:챗|채)팅/.test(l)

/** 카페 메타 줄 (예: "2025.03.21. 10:05 조회 18 댓글 1 URL 복사", "댓글 0 URL 복사", "전체보기") */
const isCafeMetaLine = (l: string) => {
  const t = l.trim()
  if (/^전체보기$/.test(t)) return true
  // (?:💬)? — 서로게이트 페어라 `💬?` 로 쓰면 하위 서로게이트만 optional 이 되어 매칭 실패함
  if (/^(?:💬)?\s*댓글\s*\d+\s*URL\s*복사$/u.test(t)) return true
  if (/^\d{4}\.\d{2}\.\d{2}\.\s*\d{1,2}:\d{2}(\s*조회\s*\d+)?(\s*(?:💬)?\s*댓글\s*\d+)?(\s*URL\s*복사)?$/u.test(t)) return true
  return false
}

type Hit = string

function clean(input: string): { out: string; hits: Hit[] } {
  const hits: Hit[] = []
  const lines = input.split('\n')
  const keep: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()

    // 헤더/푸터 + 바로 다음(공백줄 건너뛴) URL 줄을 쌍으로 제거
    if (isCafePromoHeader(t) || isPromoFooter(t)) {
      hits.push(isCafePromoHeader(t) ? '카페 홍보 헤더+URL' : 'KD4 홍보 푸터+URL')
      let j = i + 1
      while (j < lines.length && !lines[j].trim()) j++
      if (j < lines.length && isUrlLine(lines[j])) i = j
      continue
    }
    if (isBoardName(t)) { hits.push('카페 게시판명'); continue }
    if (isAuthorRankLine(t)) { hits.push('작성자 등급/구독 줄'); continue }
    if (isCafeMetaLine(t)) { hits.push('카페 메타(조회수/댓글)'); continue }
    if (isEmoticonName(t)) { hits.push(`이모티콘 이름(${t})`); continue }
    if (isKakaoTimestamp(t)) { hits.push('카톡 타임스탬프'); continue }
    if (isUrlLine(t)) { hits.push('URL 줄'); continue }

    keep.push(line)
  }

  const out = keep
    .map((l) => l.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { out, hits: [...new Set(hits)] }
}

async function main() {
  const { data, error } = await db
    .from('actor_reviews')
    .select('id, reviewer_name, course_type, review_text')
    .order('id')

  if (error) throw new Error(`조회 실패: ${error.message}`)
  const rows = data ?? []
  console.log(`전체 후기: ${rows.length}건 (모드: ${APPLY ? 'APPLY' : 'DRY-RUN'})\n`)

  const changed: { id: string; name: string; before: string; after: string; hits: Hit[] }[] = []

  for (const r of rows) {
    const before = r.review_text ?? ''
    if (!before.trim()) continue
    const { out, hits } = clean(before)
    if (out !== before && hits.length > 0) {
      changed.push({ id: r.id, name: r.reviewer_name, before, after: out, hits })
    }
  }

  // 안전장치: 본문이 과도하게 사라지면 중단 (규칙 오작동 조기 탐지)
  // 임계치 0.35 — 2026-07-19 실측 최저 잔존율이 0.46(짧은 후기 + 긴 URL 보일러플레이트,
  // 본문 온전함 육안 확인)이었고 분포가 매끄러워 오작동 이상치가 없었음. 0.5는 오탐.
  const suspicious = changed.filter((c) => c.after.length < c.before.length * 0.35)
  for (const c of changed) {
    console.log('─'.repeat(70))
    console.log(`[${c.id.slice(0, 8)}] ${c.name} — ${c.before.length}자 → ${c.after.length}자`)
    console.log(`  규칙: ${c.hits.join(', ')}`)
    console.log('  AFTER:\n' + c.after.split('\n').map((l) => '    ' + l).join('\n'))
  }
  console.log('─'.repeat(70))
  console.log(`\n영향 받는 후기: ${changed.length}건 / ${rows.length}건`)

  if (suspicious.length) {
    console.log(`\n⚠️ 본문 50% 이상 삭제된 건 ${suspicious.length}개 — 규칙 재검토 필요:`)
    suspicious.forEach((c) => console.log(`   [${c.id.slice(0, 8)}] ${c.name} ${c.before.length}→${c.after.length}자`))
    if (APPLY) { console.log('\n❌ 안전장치 발동 — UPDATE 중단'); process.exit(1) }
  }

  if (!APPLY) { console.log('\n(dry-run — 실제 UPDATE 하려면 --apply)'); return }

  let ok = 0
  for (const c of changed) {
    const { error: upErr } = await db.from('actor_reviews').update({ review_text: c.after }).eq('id', c.id)
    if (upErr) console.error(`  ✗ ${c.id} 실패: ${upErr.message}`)
    else ok++
  }
  console.log(`\n✅ UPDATE 완료: ${ok}/${changed.length}건`)
}

main().catch((e) => { console.error(e); process.exit(1) })
