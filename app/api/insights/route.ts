import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const GEMINI_KEY = process.env.GEMINI_KEY ?? process.env.NEXT_PUBLIC_GEMINI_KEY
const DATA_PATH = join(process.cwd(), 'data', 'insights.json')

// 크롬 확장 프로그램 및 외부 호출 허용
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

// JSON 파일 기반 스토어
function readAll(): Insight[] {
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')) } catch { return [] }
}
function writeAll(data: Insight[]) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

interface Insight {
  id: string
  url: string
  title: string | null
  description: string | null
  image_url: string | null
  memo: string | null
  category: string | null
  tags: string[]
  source_type: string | null
  is_favorite: boolean
  created_at: string
}

// og 메타데이터 추출
async function fetchOgMeta(url: string) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InsightsBot/1.0)' },
    })
    const html = await res.text()

    const getTag = (property: string) => {
      const m =
        html.match(new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'))
      return m?.[1] ?? null
    }

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)

    return {
      title: getTag('title') ?? titleTag?.[1]?.trim() ?? null,
      description: getTag('description'),
      image_url: getTag('image'),
    }
  } catch {
    return { title: null, description: null, image_url: null }
  }
}

// Gemini로 카테고리/태그/source_type 분류 + AI 3줄 요약
async function classifyWithGemini(url: string, title: string | null, memo: string | null) {
  if (!GEMINI_KEY) return { category: '기타', tags: [], source_type: 'other', description: null }

  const prompt = `다음 URL과 정보를 분석해서 JSON으로만 응답해. JSON 외 다른 텍스트 없이.

URL: ${url}
제목: ${title ?? '없음'}
메모: ${memo ?? '없음'}

{
  "category": "연기|비즈니스|크리에이티브|기술|라이프|기타",
  "tags": ["태그1", "태그2"],
  "source_type": "video|blog|article|other",
  "description": "메모를 참고해서 이 콘텐츠가 왜 유용한지 3줄로 설명. 각 줄은 '- '로 시작."
}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(15000),
      }
    )
    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no json')
    return JSON.parse(jsonMatch[0])
  } catch {
    const isVideo = /youtube\.com|youtu\.be|vimeo\.com|tiktok\.com/.test(url)
    return {
      category: '기타',
      tags: [],
      source_type: isVideo ? 'video' : 'other',
      description: memo ? `- ${memo}` : null,
    }
  }
}

// GET /api/insights?category=연기&source_type=video&favorite=true&q=검색어
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const sourceType = searchParams.get('source_type')
  const favorite = searchParams.get('favorite')
  const q = searchParams.get('q')
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  let items = readAll().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (category && category !== '전체') items = items.filter(i => i.category === category)
  if (sourceType && sourceType !== '전체') items = items.filter(i => i.source_type === sourceType)
  if (favorite === 'true') items = items.filter(i => i.is_favorite)
  if (q) {
    const lq = q.toLowerCase()
    items = items.filter(i =>
      [i.title, i.description, i.memo].some(f => f?.toLowerCase().includes(lq))
    )
  }

  const total = items.length
  const data = items.slice(offset, offset + limit)

  return withCors(NextResponse.json({ data, total }))
}

// POST /api/insights
export async function POST(request: NextRequest) {
  let body: { url?: string; memo?: string }
  try {
    body = await request.json()
  } catch {
    return withCors(NextResponse.json({ error: '잘못된 요청' }, { status: 400 }))
  }

  const { url, memo } = body
  if (!url || !url.startsWith('http')) {
    return withCors(NextResponse.json({ error: 'URL을 입력해주세요.' }, { status: 400 }))
  }

  const [og, ai] = await Promise.all([
    fetchOgMeta(url),
    classifyWithGemini(url, null, memo ?? null),
  ])

  const finalDescription = ai.description ?? (memo ? `- ${memo}` : null)

  const newItem: Insight = {
    id: randomUUID(),
    url,
    title: og.title ?? url,
    description: finalDescription,
    image_url: og.image_url ?? null,
    memo: memo ?? null,
    category: ai.category ?? '기타',
    tags: ai.tags ?? [],
    source_type: ai.source_type ?? 'other',
    is_favorite: false,
    created_at: new Date().toISOString(),
  }

  const all = readAll()
  all.push(newItem)
  writeAll(all)

  return withCors(NextResponse.json(newItem, { status: 201 }))
}
