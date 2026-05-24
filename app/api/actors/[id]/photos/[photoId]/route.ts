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

// PATCH/DELETE 레이트 리밋: 5분 내 10회 초과 차단 (대량 사진 조작 방어)
const photosEditMap = new Map<string, number[]>()
const PHOTOS_EDIT_WINDOW_MS = 5 * 60_000
const PHOTOS_EDIT_MAX = 10

function checkPhotosRateLimit(userId: string): boolean {
  const now = Date.now()
  const times = (photosEditMap.get(userId) ?? []).filter(t => now - t < PHOTOS_EDIT_WINDOW_MS)
  if (times.length >= PHOTOS_EDIT_MAX) return false
  photosEditMap.set(userId, [...times, now])
  if (photosEditMap.size > 2000) {
    const cutoff = now - PHOTOS_EDIT_WINDOW_MS
    for (const [k, v] of photosEditMap) {
      if (v.every(t => t < cutoff)) photosEditMap.delete(k)
    }
  }
  return true
}

async function authorize(actorId: string, userId: string) {
  // maybeSingle(): 0건도 허용 → PGRST116 오류 로그 노이즈 방지
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('actor_id, role')
    .eq('id', userId)
    .maybeSingle()
  return profile && (profile.actor_id === actorId || profile.role === 'admin' || profile.role === 'editor')
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
    const clPhoto = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
    if (clPhoto > 256) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
    if (!checkPhotosRateLimit(user.id)) return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
    }

    if (body.is_profile !== true) {
      return NextResponse.json({ error: 'is_profile: true 만 허용됩니다.' }, { status: 400 })
    }

    // body.is_profile === true 이 보장됨 (L64 guard 통과 후 항상 true)
    // photoId가 이 actor의 사진인지 먼저 검증 (IDOR 방어)
    const { data: owned } = await supabaseAdmin
      .from('actor_photos').select('id').eq('id', photoId).eq('actor_id', id).maybeSingle()
    if (!owned) return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })
    // 1. 기존 대표 해제
    const { error: clearErr } = await supabaseAdmin
      .from('actor_photos').update({ is_profile: false }).eq('actor_id', id)
    if (clearErr) throw new Error('대표 해제 실패')
    // 2. 새 대표 지정 + URL 즉시 반환 (select 체인으로 추가 round-trip 제거)
    const { data: photo, error: setErr } = await supabaseAdmin
      .from('actor_photos').update({ is_profile: true }).eq('id', photoId).eq('actor_id', id).select('url').maybeSingle()
    if (setErr) throw new Error('대표 지정 실패')
    // 3. actors 테이블 profile_photo URL 업데이트 + rows-affected 확인
    if (photo) {
      const { data: updatedActor, error: actorPhotoErr } = await supabaseAdmin
        .from('actors').update({ profile_photo: photo.url }).eq('id', id)
        .select('id').maybeSingle()
      if (actorPhotoErr) throw new Error('actors 대표사진 업데이트 실패')
      if (!updatedActor) console.error('[PATCH /api/actors/[id]/photos/[photoId]] actors row 소실:', id)
    }

    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/actors/[id]/photos/[photoId]]', err instanceof Error ? err.message : String(err))
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
    if (!checkPhotosRateLimit(user.id)) return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })

    // actor_id 조건 포함 — 타 배우 사진 삭제 IDOR 방어
    const { data: photo } = await supabaseAdmin
      .from('actor_photos')
      .select('storage_path, is_profile')
      .eq('id', photoId)
      .eq('actor_id', id)
      .maybeSingle()

    if (!photo) return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

    // Storage에서 삭제
    if (photo.storage_path) {
      try { await deleteFile(photo.storage_path, 'actor-photos') } catch { /* 이미 없는 경우 무시 */ }
    }

    const { data: deletedPhoto, error } = await supabaseAdmin
      .from('actor_photos').delete().eq('id', photoId).eq('actor_id', id)
      .select('id').maybeSingle()
    if (error) {
      console.error('[DELETE /api/actors/[id]/photos/[photoId]] delete error:', error.message)
      return NextResponse.json({ error: '사진 삭제에 실패했습니다.' }, { status: 500 })
    }
    if (!deletedPhoto) return NextResponse.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

    // 삭제된 사진이 대표였으면 다음 사진을 대표로
    const deleteWarnings: string[] = []
    if (photo.is_profile) {
      const { data: next } = await supabaseAdmin
        .from('actor_photos')
        .select('id, url')
        .eq('actor_id', id)
        .limit(1)
        .maybeSingle()
      if (next) {
        const { error: promoteErr } = await supabaseAdmin.from('actor_photos').update({ is_profile: true }).eq('id', next.id)
        if (promoteErr) { console.error('[photos DELETE] 대표 승격 실패:', promoteErr.message); deleteWarnings.push('대표사진 승격 실패') }
        const { error: thumbErr } = await supabaseAdmin.from('actors').update({ profile_photo: next.url }).eq('id', id)
        if (thumbErr) { console.error('[photos DELETE] profile_photo 업데이트 실패:', thumbErr.message); deleteWarnings.push('프로필 사진 업데이트 실패') }
      } else {
        const { error: clearErr } = await supabaseAdmin.from('actors').update({ profile_photo: null }).eq('id', id)
        if (clearErr) { console.error('[photos DELETE] profile_photo 초기화 실패:', clearErr.message); deleteWarnings.push('프로필 사진 초기화 실패') }
      }
    }

    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ ok: true, ...(deleteWarnings.length > 0 && { warnings: deleteWarnings }) })
  } catch (err) {
    console.error('[DELETE /api/actors/[id]/photos/[photoId]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
