/**
 * GET  /api/actors/[id]  — 배우 단건 상세 조회
 * PATCH /api/actors/[id] — 배우 기본 정보 수정 (editor/admin 본인만)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidateTag } from '@/lib/revalidate'
import type { Actor, ActorDetail } from '@/lib/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: '배우 ID가 필요합니다.' }, { status: 400 })
    }

    // 로그인 여부 + 역할 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let canSeeContact = false   // 연락처 열람 가능 여부 (director/admin or 본인)
    let canSeeNonPublic = false // 비공개 프로필 열람 가능 여부 (본인 or admin/editor)

    if (user) {
      // supabaseAdmin: RLS 우회로 정확한 role/actor_id 조회 (다른 auth 체크와 일관성 유지)
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('role, actor_id').eq('id', user.id).maybeSingle()
      const role = profile?.role ?? ''
      const isOwn = profile?.actor_id === id
      canSeeContact = isOwn || ['director', 'admin'].includes(role)
      // 본인 또는 관리/편집자는 is_public=false 프로필도 열람 가능 (관리자 검토 대기 중인 경우)
      canSeeNonPublic = isOwn || ['admin', 'editor'].includes(role)
    }

    // 항상 '*' 로 조회 후 JS 레벨에서 민감 컬럼 제거
    let query = supabaseAdmin
      .from('actors')
      .select('*, actor_photos(*), actor_videos(*), actor_filmography(*)')
      .eq('id', id)
    if (!canSeeNonPublic) query = query.eq('is_public', true)
    const { data: actor, error } = await query.maybeSingle()

    if (error) {
      console.error('[GET /api/actors/[id]] Supabase 오류:', error.message)
      return NextResponse.json({ error: '배우 조회에 실패했습니다.' }, { status: 500 })
    }
    if (!actor) {
      return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
    }

    const typedActor = actor as unknown as ActorDetail

    // 연락처 포함 여부에 따라 응답
    if (!canSeeContact) {
      const { phone: _phone, email: _email, ...safe } = typedActor as Actor & ActorDetail
      return NextResponse.json({ actor: safe as ActorDetail })
    }

    return NextResponse.json({ actor: typedActor })
  } catch (err) {
    console.error('[GET /api/actors/[id]] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: '잘못된 배우 ID입니다.' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    // 본인 actor_id + 역할 확인 (supabaseAdmin: RLS 정책 무관 — 정확한 role 보장)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('actor_id, role')
      .eq('id', user.id)
      .maybeSingle()

    // 권한: 본인 actor_id | admin | editor (editor=콘텐츠팀 — 전체 배우 데이터 편집 가능, 역할 관리 불가)
    if (!profile || (profile.actor_id !== id && profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()

    // 입력값 검증
    const ALLOWED_AGE_GROUPS = new Set(['10대', '20대', '30대', '40대', '50대 이상', null, ''])
    if ('age_group' in body && !ALLOWED_AGE_GROUPS.has(body.age_group)) {
      return NextResponse.json({ error: '잘못된 나이대입니다.' }, { status: 400 })
    }
    if ('height' in body && body.height !== null) {
      const h = Number(body.height)
      if (!Number.isFinite(h) || h < 100 || h > 250)
        return NextResponse.json({ error: '키는 100–250 범위여야 합니다.' }, { status: 400 })
    }
    if ('weight' in body && body.weight !== null) {
      const w = Number(body.weight)
      if (!Number.isFinite(w) || w < 20 || w > 200)
        return NextResponse.json({ error: '몸무게는 20–200 범위여야 합니다.' }, { status: 400 })
    }
    if (typeof body.casting_summary === 'string' && body.casting_summary.length > 2000)
      return NextResponse.json({ error: '캐스팅 소개는 2000자 이하로 입력해주세요.' }, { status: 400 })
    if (typeof body.instagram === 'string') {
      if (body.instagram.length > 200)
        return NextResponse.json({ error: '인스타그램은 200자 이하로 입력해주세요.' }, { status: 400 })
      // 핸들(예: @username) 또는 https://instagram.com/... 형식만 허용
      const ig = body.instagram.trim()
      if (ig && !/^@?[\w.]{1,50}$/.test(ig) && !/^https?:\/\/(www\.)?instagram\.com\/[\w./?=#&%-]*$/.test(ig))
        return NextResponse.json({ error: '인스타그램은 핸들(@username) 또는 인스타그램 URL 형식이어야 합니다.' }, { status: 400 })
    }
    if (typeof body.name_en === 'string' && body.name_en.length > 100)
      return NextResponse.json({ error: '영문 이름은 100자 이하로 입력해주세요.' }, { status: 400 })
    if (typeof body.profile_doc_path === 'string' && body.profile_doc_path.length > 500)
      return NextResponse.json({ error: '프로필 문서 경로가 너무 깁니다.' }, { status: 400 })
    if (typeof body.profile_doc_path === 'string' && body.profile_doc_path && profile.role !== 'admin' && profile.role !== 'editor') {
      if (!body.profile_doc_path.startsWith(`intake/${user.id}/`))
        return NextResponse.json({ error: '허가되지 않은 문서 경로입니다.' }, { status: 403 })
    }
    if (Array.isArray(body.casting_tags)) {
      if (body.casting_tags.length > 30 || body.casting_tags.some((t: unknown) => typeof t !== 'string' || t.length > 50))
        return NextResponse.json({ error: '태그 형식이 잘못되었습니다.' }, { status: 400 })
    }
    if (Array.isArray(body.skills)) {
      if (body.skills.length > 50 || body.skills.some((s: unknown) => typeof s !== 'string' || s.length > 100))
        return NextResponse.json({ error: '스킬 형식이 올바르지 않습니다. (최대 50개, 각 100자 이하)' }, { status: 400 })
    }

    const allowed = ['height', 'weight', 'skills', 'instagram', 'casting_summary', 'casting_tags', 'name_en', 'age_group', 'profile_doc_path']
    const patch: Record<string, unknown> = {}
    for (const k of allowed) {
      if (k in body) patch[k] = body[k]
    }

    const { data: updated, error } = await supabaseAdmin
      .from('actors')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ error: '배우 정보 수정에 실패했습니다.' }, { status: 500 })
    if (!updated) return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
    revalidateTag('actors')
    revalidateTag(`actor-${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/actors/[id]]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 내부 오류' }, { status: 500 })
  }
}
