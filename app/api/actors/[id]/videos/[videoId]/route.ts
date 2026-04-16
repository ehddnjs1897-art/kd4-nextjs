/**
 * DELETE /api/actors/[id]/videos/[videoId]
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Ctx = { params: Promise<{ id: string; videoId: string }> }

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { id, videoId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('actor_id, role').eq('id', user.id).single()
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('actor_videos').delete().eq('id', videoId).eq('actor_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
