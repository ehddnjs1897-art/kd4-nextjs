/**
 * POST /api/profile/intake
 * 배우 본인 온보딩 — 업로드된 PPT/사진/영상을 본인 배우 프로필에 등록.
 *
 * 파일 업로드 자체는 브라우저가 직접 수행(Supabase Storage / R2 presigned).
 * 이 API는 그 결과 경로/키만 받아 DB에 기록한다(작은 JSON → Vercel 제한 무관).
 *
 * 안전장치:
 *  - 로그인 사용자만
 *  - 본인 actor_id가 없으면 새 배우 row를 "비공개(is_public=false)"로 생성 → 관리자 검토 후 공개
 *  - actors 직접 INSERT는 막혀 있으므로 service_role 로만 처리
 *
 * Body(JSON):
 *  {
 *    docPath?: string,                       // actor-docs 버킷 경로 (PPT/PDF)
 *    photos?: { path: string }[],            // actor-photos 버킷 경로들
 *    video?: { key: string, size?: number, filename?: string },  // R2 key
 *    ogPhotoPath?: string                    // 가로사진 경로 → actors.profile_photo (카카오톡 썸네일)
 *  }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function photoPublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${path}`
}

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const docPath: string | null = typeof body?.docPath === 'string' ? body.docPath : null
  const photos: { path: string }[] = Array.isArray(body?.photos)
    ? body.photos.filter((p: unknown): p is { path: string } =>
        !!p && typeof (p as { path?: unknown }).path === 'string')
    : []
  const currentPhotoItems: { path: string; label: string }[] = Array.isArray(body?.currentPhotos)
    ? body.currentPhotos.filter(
        (p: unknown): p is { path: string; label: string } =>
          !!p &&
          typeof (p as { path?: unknown }).path === 'string' &&
          typeof (p as { label?: unknown }).label === 'string'
      )
    : []
  // videos 배열 (신규) + 하위호환: 기존 video 단일 필드도 처리
  const parseVideoItem = (v: unknown) =>
    v && typeof (v as { key?: unknown }).key === 'string'
      ? {
          key: (v as { key: string }).key,
          size: Number((v as { size?: unknown }).size ?? 0) || null,
          filename: typeof (v as { filename?: unknown }).filename === 'string' ? (v as { filename: string }).filename : null,
          video_type: typeof (v as { video_type?: unknown }).video_type === 'string' ? (v as { video_type: string }).video_type : 'reel',
        }
      : null
  const videos: NonNullable<ReturnType<typeof parseVideoItem>>[] = Array.isArray(body?.videos)
    ? body.videos.map(parseVideoItem).filter(Boolean)
    : body?.video ? [parseVideoItem(body.video)].filter(Boolean) : []

  const ogPhotoPath: string | null = typeof body?.ogPhotoPath === 'string' ? body.ogPhotoPath : null

  if (!docPath && photos.length === 0 && videos.length === 0) {
    return NextResponse.json({ error: '제출할 파일이 없습니다.' }, { status: 400 })
  }

  // 프로필 조회
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, actor_id, name, phone')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 })
  }

  const nowIso = new Date().toISOString()

  // 1. 대상 배우 row 결정 — 없으면 비공개로 신규 생성
  let actorId = profile.actor_id as string | null
  if (!actorId) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from('actors')
      .insert({
        name: profile.name ?? '(이름 미입력)',
        phone: profile.phone ?? null,
        email: user.email ?? null,
        is_public: false, // 관리자 검토 후 공개
        self_managed: true,
        source: 'manual',
        intake_submitted_at: nowIso,
      })
      .select('id')
      .single()

    if (createErr || !created) {
      console.error('[profile/intake] 배우 생성 실패:', createErr?.message)
      return NextResponse.json({ error: '프로필 생성에 실패했습니다.' }, { status: 500 })
    }
    actorId = created.id

    // 프로필에 actor_id 연결
    await supabaseAdmin.from('profiles').update({ actor_id: actorId }).eq('id', user.id)
  }

  // 2. PPT(문서) 경로 + 제출 시점 + 가로사진(OG 썸네일) 기록
  const actorPatch: Record<string, unknown> = { intake_submitted_at: nowIso }
  if (docPath) actorPatch.profile_doc_path = docPath
  if (ogPhotoPath) actorPatch.profile_photo = photoPublicUrl(ogPhotoPath)
  await supabaseAdmin.from('actors').update(actorPatch).eq('id', actorId)

  // 3. 사진 rows — 기존 sort_order 다음부터 append
  if (photos.length > 0) {
    const { data: existing } = await supabaseAdmin
      .from('actor_photos')
      .select('sort_order')
      .eq('actor_id', actorId)
      .order('sort_order', { ascending: false })
      .limit(1)
    const base = (existing?.[0]?.sort_order ?? -1) + 1

    const rows = photos.map((p, i) => ({
      actor_id: actorId,
      url: photoPublicUrl(p.path),
      storage_path: p.path,
      sort_order: base + i,
    }))
    const { error: photoErr } = await supabaseAdmin.from('actor_photos').insert(rows)
    if (photoErr) console.error('[profile/intake] 사진 등록 실패:', photoErr.message)
  }

  // 3b. 현재사진 rows
  if (currentPhotoItems.length > 0) {
    const { data: existingCurrent } = await supabaseAdmin
      .from('actor_photos')
      .select('sort_order')
      .eq('actor_id', actorId)
      .order('sort_order', { ascending: false })
      .limit(1)
    const baseC = (existingCurrent?.[0]?.sort_order ?? -1) + 1

    const currentRows = currentPhotoItems.map((p, i) => ({
      actor_id: actorId,
      url: photoPublicUrl(p.path),
      storage_path: p.path,
      sort_order: baseC + i,
      photo_type: 'current',
      label: p.label,
    }))
    const { error: cpErr } = await supabaseAdmin.from('actor_photos').insert(currentRows)
    if (cpErr) console.error('[profile/intake] 현재사진 등록 실패:', cpErr.message)
  }

  // 4. 영상 rows (R2, 최대 3개 — reel 2 + monologue 1)
  for (const vid of videos.slice(0, 3)) {
    const { error: videoErr } = await supabaseAdmin.from('actor_videos').insert({
      actor_id: actorId,
      title: vid.filename,
      r2_key: vid.key,
      file_size_bytes: vid.size,
      uploaded_at: nowIso,
      is_public: false,
      video_type: vid.video_type ?? 'reel',
    })
    if (videoErr) console.error('[profile/intake] 영상 등록 실패:', videoErr.message)
  }

  return NextResponse.json({ ok: true, actorId })
}
