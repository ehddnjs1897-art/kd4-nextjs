/**
 * POST /api/actors/[id]/filmography — 필모그래피 항목 추가
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'

type Ctx = { params: Promise<{ id: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const { category, year, title, role, broadcaster, film_type } = await request.json()
    if (!title) return NextResponse.json({ error: '작품명이 필요합니다.' }, { status: 400 })
    if (typeof title === 'string' && title.length > 200) {
      return NextResponse.json({ error: '작품명은 200자 이하로 입력해주세요.' }, { status: 400 })
    }

    const VALID_FILM_CATEGORIES = new Set(['drama', 'movie', 'musical', 'theater', 'commercial', 'etc'])
    if (category && !VALID_FILM_CATEGORIES.has(category)) {
      return NextResponse.json({ error: '유효하지 않은 카테고리입니다.' }, { status: 400 })
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
      .single()

    if (error) {
      console.error('[filmography POST] DB 오류:', error.message)
      return NextResponse.json({ error: '필모그래피 추가에 실패했습니다.' }, { status: 500 })
    }
    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
