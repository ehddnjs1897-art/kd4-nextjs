import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY

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
    // URL로 source_type 추측
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

  let query = supabaseAdmin
    .from('insights')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && category !== '전체') query = query.eq('category', category)
  if (sourceType && sourceType !== '전체') query = query.eq('source_type', sourceType)
  if (favorite === 'true') query = query.eq('is_favorite', true)
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,memo.ilike.%${q}%`)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: '조회 오류' }, { status: 500 })

  return NextResponse.json({ data, total: count })
}

// POST /api/insights
export async function POST(request: NextRequest) {
  let body: { url?: string; memo?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const { url, memo } = body
  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'URL을 입력해주세요.' }, { status: 400 })
  }

  const [og, ai] = await Promise.all([
    fetchOgMeta(url),
    classifyWithGemini(url, null, memo ?? null),
  ])

  // og 가져온 뒤 title 알게 됐으므로 description만 AI에서 다시 생성 (없을 경우)
  const finalDescription = ai.description ?? (memo ? `- ${memo}` : null)

  const { data, error } = await supabaseAdmin
    .from('insights')
    .insert({
      url,
      title: og.title ?? url,
      description: finalDescription,
      image_url: og.image_url,
      memo: memo ?? null,
      category: ai.category ?? '기타',
      tags: ai.tags ?? [],
      source_type: ai.source_type ?? 'other',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
