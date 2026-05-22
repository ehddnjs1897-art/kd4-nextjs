/**
 * POST /api/actors/[id]/videos — 영상 추가
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

    const { youtube_id, r2_key, title, video_type } = await request.json()
    if (!youtube_id && !r2_key) {
      return NextResponse.json({ error: 'youtube_id 또는 r2_key가 필요합니다.' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      actor_id: id,
      title: title || null,
      sort_order: 0,
    }
    if (youtube_id) insertData.youtube_id = youtube_id
    if (r2_key) {
      insertData.r2_key = r2_key
      insertData.video_type = video_type || 'reel'
      insertData.is_public = false
      insertData.uploaded_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('actor_videos')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error('[videos POST] DB 오류:', error.message)
      return NextResponse.json({ error: '영상 추가에 실패했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
