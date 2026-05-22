/**
 * POST /api/actors/[id]/filmography — 필모그래피 항목 추가
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).single()
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const { category, year, title, role, broadcaster, film_type } = await request.json()
    if (!title) return NextResponse.json({ error: '작품명이 필요합니다.' }, { status: 400 })
    if (typeof title === 'string' && title.length > 200) {
      return NextResponse.json({ error: '작품명은 200자 이하로 입력해주세요.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('actor_filmography')
      .insert({ actor_id: id, category: category || 'drama', year: year || null, title, role: role || null, broadcaster: broadcaster || null, film_type: film_type || null, sort_order: 0 })
      .select('id')
      .single()

    if (error) {
      console.error('[filmography POST] DB 오류:', error.message)
      return NextResponse.json({ error: '필모그래피 추가에 실패했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
