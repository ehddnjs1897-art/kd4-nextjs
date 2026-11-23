#!/usr/bin/env node
// 캐스팅 카드 → 홈페이지 «캐스팅 현황»(/casting) 동기화
//
// 하는 일: 카드 원본 폴더의 `KD4_캐스팅_{이름}_{작품}_슬라이드1.png` 를 전부 읽어
//   ① public/casting/cards/ 에 가벼운 썸네일(webp, 가로 640)로 저장하고
//   ② lib/casting-cards.ts 목록을 새로 쓴다.
// 새 카드를 만든 뒤:  node scripts/sync-casting-cards.mjs  → 커밋·푸시
//
// 표기 원칙: 방송사·작품·역할은 «카드에 적힌 글자 그대로». 파일명과 카드 글자가 다른 건은
//   아래 OVERRIDES 에 카드 글자를 적어 둔다 (추측으로 채우지 말 것).
import { createHash } from 'node:crypto'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.argv[2] || path.join(os.homedir(), 'Desktop', '클로드 산출물', 'casting', 'output')
const OUT_DIR = path.join(ROOT, 'public', 'casting', 'cards')
const OUT_TS = path.join(ROOT, 'lib', 'casting-cards.ts')
const WIDTH = 640

// 작품 문자열 맨 앞의 방송사·플랫폼 (긴 것부터)
const PLATFORMS = ['350만 유튜브', '35만 유튜브', '상업영화', '디즈니+', 'NETFLIX', 'Netflix', 'TV-CF', 'TVING', 'JTBC', 'KBS2', 'KBS', 'MBC', 'SBS', 'tvN', 'ENA', '비글루', '숏폼', '릴숏', '영화']

// 파일명과 카드 글자가 다른 건 — 카드 글자 기준 (2026-11-24 카드 글자 대조)
const OVERRIDES = {
  '권동원|무빙': { platform: '디즈니+', title: '무빙2 : 지니어스' },
  '이훈|비글루 국가권력급 상속자가 돌아왔다': { role: '조연' },
  '장서후|밀숏 후회까지 168시간': { platform: '릴숏', title: '후회까지 168시간', role: '조연' },
  '윤지원|MBC 가족관계증명서 ㅣ 조연 전정아 역': { platform: 'MBC', title: '가족관계증명서', role: '조연 전정아 역' },
  '심려진|TV-CFㅣSC제일은행': { platform: 'TV-CF', title: 'SC제일은행' },
}

function splitWork(work) {
  for (const p of PLATFORMS) {
    if (work === p) return { platform: p, title: '' }
    if (work.startsWith(p + ' ')) return { platform: p, title: work.slice(p.length + 1).trim() }
  }
  return { platform: '', title: work }
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const names = (await readdir(SRC)).map((f) => f.normalize('NFC'))
const real = await readdir(SRC)
const cards = []
for (let i = 0; i < names.length; i++) {
  const m = names[i].match(/^KD4_캐스팅_(.+?)_(.+)_슬라이드1\.png$/)
  if (!m) continue
  const [, name, work] = m
  const key = `${name}|${work}`
  const base = splitWork(work)
  const o = OVERRIDES[key] || {}
  const card = { name, platform: o.platform ?? base.platform, title: o.title ?? base.title, role: o.role }
  if (!card.platform) console.warn(`⚠️ 방송사·플랫폼을 못 나눔 → 카드 글자 확인 후 OVERRIDES 에 추가: ${key}`)
  const src = path.join(SRC, real[i])
  const st = await stat(src)
  card.madeAt = new Date(st.birthtimeMs || st.mtimeMs).toISOString().slice(0, 10)
  card.id = createHash('sha1').update(key).digest('hex').slice(0, 10)
  card.src = src
  cards.push(card)
}
// 최신순(만든 날) → 이름순
cards.sort((a, b) => (a.madeAt < b.madeAt ? 1 : a.madeAt > b.madeAt ? -1 : a.name.localeCompare(b.name, 'ko') || a.title.localeCompare(b.title, 'ko')))

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })
let bytes = 0
for (const c of cards) {
  const out = path.join(OUT_DIR, `${c.id}.webp`)
  const info = await sharp(c.src).resize({ width: WIDTH }).webp({ quality: 78 }).toFile(out)
  bytes += info.size
}

const rows = cards
  .map((c) => `  { img: '/casting/cards/${c.id}.webp', name: ${q(c.name)}, platform: ${q(c.platform)}, title: ${q(c.title)}${c.role ? `, role: ${q(c.role)}` : ''}, madeAt: '${c.madeAt}' },`)
  .join('\n')
const ts = `// ⚠️ 자동 생성 파일 — 직접 고치지 말 것. 새 카드를 만든 뒤 \`node scripts/sync-casting-cards.mjs\` 를 실행한다.
// «캐스팅 현황»(/casting) 전체 목록. 홈 화면의 고른 목록(lib/casting-photos.ts)과는 별개다.
// 방송사·작품·역할 = 카드에 적힌 글자 그대로 (다른 건은 스크립트의 OVERRIDES).

export interface CastingCard {
  /** 썸네일 경로 (public/casting/cards) */
  img: string
  name: string
  /** 방송사·플랫폼 — 카드 표기 그대로 */
  platform: string
  /** 작품명 — 카드 표기 그대로 */
  title: string
  /** 역할 — 카드에 적혀 있을 때만 */
  role?: string
  /** 카드 만든 날 (정렬용, 화면에 표시하지 않음) */
  madeAt: string
}

/** 최신순 */
export const CASTING_CARDS: CastingCard[] = [
${rows}
]

/** «MBC 〈첫 번째 남자〉 · 조연» — 카드에 적힌 것만 이어 붙인다 */
export function castingCardWork(c: CastingCard): string {
  const work = [c.platform, c.title ? \`〈\${c.title}〉\` : ''].filter(Boolean).join(' ')
  return [work, c.role].filter(Boolean).join(' · ')
}
`
await writeFile(OUT_TS, ts)
console.log(`✅ 카드 ${cards.length}건 · 배우 ${new Set(cards.map((c) => c.name)).size}명 · 썸네일 ${(bytes / 1024 / 1024).toFixed(1)}MB → ${path.relative(ROOT, OUT_TS)}`)
