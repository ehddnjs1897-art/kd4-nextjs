/**
 * POST /api/actors/[id]/filmography — 필모그래피 항목 추가
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'

type Ctx = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 레이트 리밋: 5분 내 30개 필모그래피 추가 초과 시 차단 (스팸 INSERT 방지)
const filmographyPostMap = new Map<string, number[]>()
const FILM_WINDOW_MS = 5 * 60_000
const FILM_MAX = 30

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 배우 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).maybeSingle()
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 레이트 리밋: 5분 내 30회 초과 시 차단
    const now = Date.now()
    const times = (filmographyPostMap.get(user.id) ?? []).filter(t => now - t < FILM_WINDOW_MS)
    if (times.length >= FILM_MAX) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (5분 최대 30개)' }, { status: 429 })
    }
    filmographyPostMap.set(user.id, [...times, now])

    let parsedBody: { category?: string; year?: number; title?: string; role?: string; broadcaster?: string; film_type?: string }
    try {
      parsedBody = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }
    const { category, year, title, role, broadcaster, film_type } = parsedBody
    if (!title) return NextResponse.json({ error: '작품명이 필요합니다.' }, { status: 400 })
    if (typeof title === 'string' && title.length > 200) {
      return NextResponse.json({ error: '작품명은 200자 이하로 입력해주세요.' }, { status: 400 })
    }

    const VALID_FILM_CATEGORIES = new Set(['drama', 'movie', 'musical', 'theater', 'commercial', 'etc'])
    if (category && !VALID_FILM_CATEGORIES.has(category)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 })
    }
    if (year !== undefined && year !== null) {
      const y = Number(year)
      if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear() + 2) {
        return NextResponse.json({ error: `연도는 1900~${new Date().getFullYear() + 2} 범위여야 합니다.` }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('actor_filmography')
      .insert({
        actor_id: id,
        category: category || 'drama',
        year: year || null,
        title: String(title).slice(0, 200),
        role: role ? String(role).slice(0, 100) : null,
        broadcaster: broadcaster ? String(broadcaster).slice(0, 100) : null,
        film_type: film_type ? String(film_type).slice(0, 50) : null,
        sort_order: 0,
      })
      .select('id')
      .maybeSingle()

    if (error || !data) {
      console.error('[filmography POST] DB 오류:', error?.message)
      return NextResponse.json({ error: '필모그래피 추가에 실패했습니다.' }, { status: 500 })
    }
    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('[POST /api/actors/[id]/filmography]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
