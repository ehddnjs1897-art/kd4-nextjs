import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import type { InsightSourceType, InsightCategory } from '@/lib/types'

// GEMINI_KEY는 서버 전용. NEXT_PUBLIC_* 접두사 사용 금지.
const GEMINI_KEY = process.env.GEMINI_KEY

// CORS는 자체 도메인 + 로컬 dev만 허용 (이전 '*'은 SSRF·CSRF 위험)
const ALLOWED_ORIGINS = new Set([
  'https://kd4.club',
  'http://localhost:3000',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://kd4.club'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}

function withCors(res: NextResponse, origin: string | null) {
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

// admin 권한 확인 (다른 /api/admin/* 파일들과 동일 패턴)
async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const { data: profile, error: profileErr } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profileErr || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return { userId: user.id }
}

// SSRF 가드: 사용자 입력 URL이 안전한 외부 호스트인지 검증
//   - https 또는 http만 허용
//   - 사설/링크로컬 IP 차단 (127.x, 10.x, 172.16~31.x, 192.168.x, 169.254.x, ::1, fc00::/7)
//   - 일부 위험 호스트명 차단
function isSafeExternalUrl(rawUrl: string): boolean {
  let u: URL
  try { u = new URL(rawUrl) } catch { return false }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false

  const host = u.hostname.toLowerCase()

  // 명백히 위험한 호스트명
  if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.local')) return false
  if (host === 'metadata.google.internal') return false

  // IPv4 사설/링크로컬 차단
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number)
    if (a === 10) return false
    if (a === 127) return false
    if (a === 169 && b === 254) return false        // AWS metadata
    if (a === 172 && b >= 16 && b <= 31) return false
    if (a === 192 && b === 168) return false
    if (a === 0) return false
  }

  // IPv6 단축형 차단 (정밀 파싱은 생략, 명백한 케이스만)
  if (host === '::1' || host === '[::1]') return false
  if (host.startsWith('fc') || host.startsWith('fd')) return false  // ULA
  if (host.startsWith('fe80:')) return false                          // 링크로컬

  return true
}

async function fetchOgMeta(url: string) {
  if (!isSafeExternalUrl(url)) {
    return { title: null, description: null, image_url: null }
  }
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InsightsBot/1.0)' },
    })
    // 리다이렉트 후 최종 URL도 안전한지 재검증 (DNS rebinding 1차 방어)
    if (res.url && !isSafeExternalUrl(res.url)) {
      return { title: null, description: null, image_url: null }
    }
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

// PostgREST .or() 인젝션 방어: 메타문자 escape
function sanitizeSearchTerm(s: string): string {
  return s.replace(/[,()*]/g, '').slice(0, 100)
}

// GET /api/insights?category=연기&source_type=video&favorite=true&q=검색어
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return withCors(auth, origin)

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

  if (category && category !== '전체') query = query.eq('category', category)
  if (sourceType && sourceType !== '전체') query = query.eq('source_type', sourceType)
  if (favorite === 'true') query = query.eq('is_favorite', true)
  if (q) {
    const safe = sanitizeSearchTerm(q)
    if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,memo.ilike.%${safe}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }), origin)

  return withCors(NextResponse.json({ data: data ?? [], total: count ?? 0 }), origin)
}

// POST /api/insights
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return withCors(auth, origin)

  let body: { url?: string; memo?: string }
  try {
    body = await request.json()
  } catch {
    return withCors(NextResponse.json({ error: '잘못된 요청' }, { status: 400 }), origin)
  }

  const { url, memo } = body
  if (!url || !isSafeExternalUrl(url)) {
    return withCors(NextResponse.json({ error: '유효한 외부 URL을 입력해주세요.' }, { status: 400 }), origin)
  }

  const [og, ai] = await Promise.all([
    fetchOgMeta(url),
    classifyWithGemini(url, null, memo ?? null),
  ])

  const newItem = {
    id: randomUUID(),
    url,
    title: og.title ?? url,
    description: ai.description ?? (memo ? `- ${memo}` : null),
    image_url: og.image_url ?? null,
    memo: memo ?? null,
    category: (ai.category ?? '기타') as InsightCategory,
    tags: (ai.tags ?? []) as string[],
    source_type: (ai.source_type ?? 'other') as InsightSourceType,
    is_favorite: false,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin.from('insights').insert(newItem).select().single()

  if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }), origin)

  return withCors(NextResponse.json(data, { status: 201 }), origin)
}
