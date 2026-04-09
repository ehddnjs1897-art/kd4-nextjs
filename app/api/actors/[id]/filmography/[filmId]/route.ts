/**
 * PATCH  /api/actors/[id]/filmography/[filmId] — 항목 수정
 * DELETE /api/actors/[id]/filmography/[filmId] — 항목 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Ctx = { params: Promise<{ id: string; filmId: string }> }

async function authorize(actorId: string, userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('actor_id, role').eq('id', userId).single()
  return profile && (profile.actor_id === actorId || profile.role === 'admin')
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, filmId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await request.json()
  const allowed = ['category', 'year', 'title', 'role']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) patch[k] = body[k] }

  const { error } = await supabaseAdmin
    .from('actor_filmography').update(patch).eq('id', filmId).eq('actor_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id, filmId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('actor_filmography').delete().eq('id', filmId).eq('actor_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
