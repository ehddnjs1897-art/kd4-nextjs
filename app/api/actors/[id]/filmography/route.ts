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

    const { category, year, title, role } = await request.json()
    if (!title) return NextResponse.json({ error: '작품명이 필요합니다.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('actor_filmography')
      .insert({ actor_id: id, category: category || '드라마', year: year || null, title, role: role || null, sort_order: 0 })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
