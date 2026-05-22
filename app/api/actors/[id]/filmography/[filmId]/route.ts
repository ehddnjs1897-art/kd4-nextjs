/**
 * PATCH  /api/actors/[id]/filmography/[filmId] — 항목 수정
 * DELETE /api/actors/[id]/filmography/[filmId] — 항목 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Ctx = { params: Promise<{ id: string; filmId: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function authorize(actorId: string, userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('actor_id, role').eq('id', userId).single()
  return profile && (profile.actor_id === actorId || profile.role === 'admin')
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id, filmId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(filmId))
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const body = await request.json()
    const allowed = ['category', 'year', 'title', 'role', 'broadcaster', 'film_type']
    const patch: Record<string, unknown> = {}
    for (const k of allowed) { if (k in body) patch[k] = body[k] }

    // 필드 길이 제한
    if (typeof patch.title === 'string' && patch.title.length > 200)
      return NextResponse.json({ error: '제목은 200자 이하입니다.' }, { status: 400 })
    if (typeof patch.role === 'string' && patch.role.length > 100)
      return NextResponse.json({ error: '역할은 100자 이하입니다.' }, { status: 400 })
    if (typeof patch.broadcaster === 'string' && patch.broadcaster.length > 100)
      return NextResponse.json({ error: '방송사·배급사는 100자 이하입니다.' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('actor_filmography').update(patch).eq('id', filmId).eq('actor_id', id)
    if (error) {
      console.error('[filmography PATCH] DB 오류:', error.message)
      return NextResponse.json({ error: '필모그래피 수정에 실패했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { id, filmId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(filmId))
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const { error } = await supabaseAdmin
      .from('actor_filmography').delete().eq('id', filmId).eq('actor_id', id)
    if (error) {
      console.error('[filmography DELETE] DB 오류:', error.message)
      return NextResponse.json({ error: '필모그래피 삭제에 실패했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
