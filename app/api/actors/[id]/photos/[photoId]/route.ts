/**
 * PATCH /api/actors/[id]/photos/[photoId]  — is_profile 변경
 * DELETE /api/actors/[id]/photos/[photoId] — 사진 삭제 (Storage + DB)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { deleteFile } from '@/lib/storage'

type Ctx = { params: Promise<{ id: string; photoId: string }> }

async function authorize(actorId: string, userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('actor_id, role')
    .eq('id', userId)
    .single()
  return profile && (profile.actor_id === actorId || profile.role === 'admin')
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id, photoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await request.json()

  if (body.is_profile) {
    // 기존 대표 해제 후 새 대표 지정
    await supabaseAdmin.from('actor_photos').update({ is_profile: false }).eq('actor_id', id)
    await supabaseAdmin.from('actor_photos').update({ is_profile: true }).eq('id', photoId)
    // actors 테이블 profile_photo URL 업데이트
    const { data: photo } = await supabaseAdmin.from('actor_photos').select('url').eq('id', photoId).single()
    if (photo) await supabaseAdmin.from('actors').update({ profile_photo: photo.url }).eq('id', id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id, photoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { data: photo } = await supabaseAdmin
    .from('actor_photos')
    .select('storage_path, is_profile')
    .eq('id', photoId)
    .single()

  if (!photo) return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

  // Storage에서 삭제
  if (photo.storage_path) {
    try { await deleteFile(photo.storage_path, 'actor-photos') } catch { /* 이미 없는 경우 무시 */ }
  }

  const { error } = await supabaseAdmin.from('actor_photos').delete().eq('id', photoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 삭제된 사진이 대표였으면 다음 사진을 대표로
  if (photo.is_profile) {
    const { data: next } = await supabaseAdmin
      .from('actor_photos')
      .select('id, url')
      .eq('actor_id', id)
      .limit(1)
      .single()
    if (next) {
      await supabaseAdmin.from('actor_photos').update({ is_profile: true }).eq('id', next.id)
      await supabaseAdmin.from('actors').update({ profile_photo: next.url }).eq('id', id)
    } else {
      await supabaseAdmin.from('actors').update({ profile_photo: null }).eq('id', id)
    }
  }

  return NextResponse.json({ ok: true })
}
