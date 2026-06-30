/**
 * POST /api/upload — 파일 업로드
 *
 * - 로그인 필수 + admin/editor: 전체 허용, member/actor: 본인 actorId만 허용
 * - multipart/form-data: { file: File, actorId: string, bucket?: string }
 * - 이미지 파일 5MB 제한
 * - 반환: { url, path, provider }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { uploadFile } from '@/lib/storage'
import { revalidateTag } from '@/lib/revalidate'

const MAX_IMAGE_SIZE = 15 * 1024 * 1024 // 15 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DEFAULT_BUCKET = 'actor-media'
// 업로드 허용 버킷 — 클라이언트가 임의 버킷에 파일을 올리는 것을 방지
const ALLOWED_BUCKETS = new Set(['actor-media', 'actor-photos'])
// 현재사진(전신 각도) 허용 라벨 — 화이트리스트 (2026-07-01 대표 지시: 정면/좌측/우측/후면/전신)
const CURRENT_PHOTO_LABELS = new Set(['정면', '좌측', '우측', '후면', '전신'])

// ─── 권한 확인 ───────────────────────────────────────────────────────────────

async function requireUploadAccess(
  targetActorId: string | null
): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role, actor_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileErr || !profile) {
    if (profileErr) console.error('[upload] profile fetch error:', profileErr.message)
    return NextResponse.json(
      { error: '프로필 정보를 가져올 수 없습니다.' },
      { status: 500 }
    )
  }

  const role: string = profile.role ?? 'user'

  // admin/editor: 전체 허용
  if (role === 'admin' || role === 'editor') {
    return { userId: user.id }
  }

  // member/actor: 본인 actor_id 에만 허용
  if (
    (role === 'member' || role === 'actor') &&
    targetActorId &&
    profile.actor_id === targetActorId
  ) {
    return { userId: user.id }
  }

  return NextResponse.json(
    { error: '파일 업로드 권한이 없습니다.' },
    { status: 403 }
  )
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Content-Length 헤더 캡처 (실제 검사는 권한확인 후 — 미인증에 413 정책 노출 방지).
  // ⚠️ 아래 formData()가 본문을 먼저 버퍼링하므로 '본문 파싱 전 조기 차단'은 아님 — 선언 크기 거부용.
  const clActorUpload = parseInt(request.headers.get('content-length') ?? '0', 10) || 0

  // actorId를 먼저 읽어서 권한 체크에 사용 (본문 파싱 실패 시 프레임워크 500 대신 400 JSON)
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }
  const actorIdRaw = formData.get('actorId')
  const targetActorId = typeof actorIdRaw === 'string' ? actorIdRaw : null

  if (!targetActorId || !UUID_RE.test(targetActorId)) {
    return NextResponse.json({ error: '잘못된 배우 ID입니다.' }, { status: 400 })
  }

  const check = await requireUploadAccess(targetActorId)
  if (check instanceof NextResponse) return check

  // CL guard after auth — 미인증 클라이언트에 413 대신 401 노출 (정책 정보 유출 방지)
  // 실제 파일 상한 MAX_IMAGE_SIZE(15MB) + multipart 오버헤드 여유 1MB.
  // (2026-06-13 수정: 6MB→16MB — 폰 원본 사진 6~15MB가 클라 통과 후 서버 413으로 막히던 버그)
  if (clActorUpload > MAX_IMAGE_SIZE + 1024 * 1024) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })

  try {
    const file = formData.get('file')
    const actorId = targetActorId  // 이미 UUID 검증됨 (line 79)
    const rawBucket = (formData.get('bucket') as string | null) ?? DEFAULT_BUCKET
    const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : DEFAULT_BUCKET

    // 현재사진(전신 각도) — photoType='current' + label(정면/좌측/우측/후면/전신). 그 외는 일반 프로필 사진.
    const rawPhotoType = (formData.get('photoType') as string | null) ?? ''
    const rawLabel = (formData.get('label') as string | null) ?? ''
    const isCurrent = rawPhotoType === 'current' && CURRENT_PHOTO_LABELS.has(rawLabel)
    const photoType = isCurrent ? 'current' : null
    const photoLabel = isCurrent ? rawLabel : null

    // 레이트 리밋 + 사진 총량 제한 — 두 COUNT를 병렬 조회 (순차 2 round-trip → 1)
    const MAX_PHOTOS_PER_ACTOR = 200
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const [{ count: recentUploads }, { count: photoCount }, { data: maxSortRow }, { data: actorRow }] = await Promise.all([
      supabaseAdmin
        .from('actor_photos')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', actorId)
        .gte('created_at', fiveMinAgo),
      supabaseAdmin
        .from('actor_photos')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', actorId),
      // sort_order MAX도 병렬 조회 (Storage 업로드 전에 미리 확보 — round-trip 절감)
      supabaseAdmin
        .from('actor_photos')
        .select('sort_order')
        .eq('actor_id', actorId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // 대표사진 유무 — 비어있으면 새 업로드를 자동 대표 승격 (아래)
      supabaseAdmin
        .from('actors')
        .select('profile_photo')
        .eq('id', actorId)
        .maybeSingle(),
    ])
    if ((recentUploads ?? 0) >= 20) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요. (5분 최대 20장)' }, { status: 429 })
    }

    // ── 유효성 검사 ──
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'file 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // actorId는 L79(requireUploadAccess)에서 이미 UUID 검증 완료 — 중복 체크 불필요

    // MIME 타입 확인 (클라이언트 선언)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `허용되지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Magic byte 검증 — 실제 파일 내용이 이미지인지 확인 (MIME 위조 방어)
    const headerBuf = Buffer.from(await file.slice(0, 12).arrayBuffer())
    const isJpeg = headerBuf[0] === 0xff && headerBuf[1] === 0xd8 && headerBuf[2] === 0xff
    const isPng = headerBuf[0] === 0x89 && headerBuf[1] === 0x50 && headerBuf[2] === 0x4e && headerBuf[3] === 0x47
    const isGif = headerBuf[0] === 0x47 && headerBuf[1] === 0x49 && headerBuf[2] === 0x46
    const isWebp = headerBuf[0] === 0x52 && headerBuf[1] === 0x49 && headerBuf[2] === 0x46 && headerBuf[3] === 0x46
      && headerBuf[8] === 0x57 && headerBuf[9] === 0x45 && headerBuf[10] === 0x42 && headerBuf[11] === 0x50
    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return NextResponse.json(
        { error: '파일 내용이 이미지 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 확인
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        {
          error: `파일 크기가 너무 큽니다. (현재: ${sizeMB}MB, 최대: 15MB)`,
        },
        { status: 400 }
      )
    }

    // 배우별 최대 사진 수 제한 확인 (위에서 미리 조회한 photoCount 사용)
    if ((photoCount ?? 0) >= MAX_PHOTOS_PER_ACTOR) {
      return NextResponse.json(
        { error: `사진은 최대 ${MAX_PHOTOS_PER_ACTOR}장까지 등록할 수 있습니다.` },
        { status: 400 }
      )
    }

    // ── Storage 업로드 ──
    const result = await uploadFile(file, bucket, actorId, file.name.slice(0, 200))

    // sort_order는 위 Promise.all에서 미리 조회한 maxSortRow 재사용 (추가 round-trip 없음)
    const nextSortOrder = (maxSortRow?.sort_order ?? -1) + 1

    // ── actor_photos 테이블 삽입 ──
    const { data: photoRow, error: dbErr } = await supabaseAdmin
      .from('actor_photos')
      .insert({
        actor_id: actorId,
        url: result.url,
        storage_path: result.path,
        is_profile: false,
        sort_order: nextSortOrder,
        photo_type: photoType,   // 'current'(전신 각도) 또는 null(일반 프로필)
        label: photoLabel,       // 현재사진일 때만 정면/좌측/우측/후면/전신
      })
      .select('id')
      .maybeSingle()

    if (dbErr || !photoRow) {
      console.error('[POST /api/upload] actor_photos 삽입 오류:', dbErr?.message)
      return NextResponse.json({ error: 'DB 삽입 실패' }, { status: 500 })
    }

    // ── 메인사진 자동 승격 (2026-06-12 대표 지시) ──
    // actors.profile_photo가 비어있으면(목록 카드·상세 헤더가 PII 포함 이력서 이미지에 의존 중)
    // 이번 업로드를 자동 대표 지정 → 가입 후 사진만 올리면 첫 화면 사진이 즉시 교체된다.
    // 이미 대표사진이 있으면 건드리지 않음 (배우가 '대표 지정' 버튼으로 직접 변경).
    // 현재사진(전신 각도)은 카드/헤더 대표사진이 될 수 없음 — 자동 승격 제외
    let isProfile = false
    if (!isCurrent && !actorRow?.profile_photo?.trim()) {
      const [{ error: promoteErr }, { error: photoFlagErr }] = await Promise.all([
        supabaseAdmin.from('actors').update({ profile_photo: result.url }).eq('id', actorId),
        supabaseAdmin.from('actor_photos').update({ is_profile: true }).eq('id', photoRow.id),
      ])
      if (promoteErr || photoFlagErr) {
        console.error('[POST /api/upload] 자동 대표 승격 실패:', promoteErr?.message ?? photoFlagErr?.message)
      } else {
        isProfile = true
      }
    }

    revalidateTag('actors')
    revalidateTag(`actor-${actorId}`)
    return NextResponse.json({ url: result.url, id: photoRow.id, path: result.path, provider: result.provider, isProfile, photoType, label: photoLabel }, { status: 200 })
  } catch (err: unknown) {
    console.error('[POST /api/upload] 오류:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: '업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
