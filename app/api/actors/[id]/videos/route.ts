/**
 * POST /api/actors/[id]/videos — 영상 추가
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('actor_id, role').eq('id', user.id).single()
  if (!profile || (profile.actor_id !== id && profile.role !== 'admin')) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { youtube_id, title } = await request.json()
  if (!youtube_id) return NextResponse.json({ error: 'youtube_id가 필요합니다.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('actor_videos')
    .insert({ actor_id: id, youtube_id, title: title || null, sort_order: 0 })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
