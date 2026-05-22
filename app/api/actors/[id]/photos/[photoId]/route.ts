/**
 * PATCH /api/actors/[id]/photos/[photoId]  — is_profile 변경
 * DELETE /api/actors/[id]/photos/[photoId] — 사진 삭제 (Storage + DB)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { deleteFile } from '@/lib/storage'
import { revalidateTag } from '@/lib/revalidate'

type Ctx = { params: Promise<{ id: string; photoId: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function authorize(actorId: string, userId: string) {
  // maybeSingle(): 0건도 허용 → PGRST116 오류 로그 노이즈 방지
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('actor_id, role')
    .eq('id', userId)
    .maybeSingle()
  return profile && (profile.actor_id === actorId || profile.role === 'admin')
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id, photoId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(photoId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const body = await request.json()

    if (body.is_profile) {
      // photoId가 이 actor의 사진인지 먼저 검증 (IDOR 방어)
      const { data: owned } = await supabaseAdmin
        .from('actor_photos').select('id').eq('id', photoId).eq('actor_id', id).maybeSingle()
      if (!owned) return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })
      // 1. 기존 대표 해제
      const { error: clearErr } = await supabaseAdmin
        .from('actor_photos').update({ is_profile: false }).eq('actor_id', id)
      if (clearErr) throw new Error('대표 해제 실패')
      // 2. 새 대표 지정 (actor_id 조건 추가)
      const { error: setErr } = await supabaseAdmin
        .from('actor_photos').update({ is_profile: true }).eq('id', photoId).eq('actor_id', id)
      if (setErr) throw new Error('대표 지정 실패')
      // 3. actors 테이블 profile_photo URL 업데이트
      const { data: photo } = await supabaseAdmin.from('actor_photos').select('url').eq('id', photoId).eq('actor_id', id).single()
      if (photo) await supabaseAdmin.from('actors').update({ profile_photo: photo.url }).eq('id', id)
    }

    revalidateTag('actors')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { id, photoId } = await params
    if (!UUID_RE.test(id) || !UUID_RE.test(photoId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    if (!(await authorize(id, user.id))) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    // actor_id 조건 포함 — 타 배우 사진 삭제 IDOR 방어
    const { data: photo } = await supabaseAdmin
      .from('actor_photos')
      .select('storage_path, is_profile')
      .eq('id', photoId)
      .eq('actor_id', id)
      .single()

    if (!photo) return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

    // Storage에서 삭제
    if (photo.storage_path) {
      try { await deleteFile(photo.storage_path, 'actor-photos') } catch { /* 이미 없는 경우 무시 */ }
    }

    const { error } = await supabaseAdmin.from('actor_photos').delete().eq('id', photoId).eq('actor_id', id)
    if (error) return NextResponse.json({ error: '사진 삭제에 실패했습니다.' }, { status: 500 })

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

    revalidateTag('actors')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
