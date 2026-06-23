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
import { revalidateTag } from '@/lib/revalidate'
import { sanitizeDialects } from '@/lib/dialects'
import { matchActorOnSignup, matchActorForIntake } from '@/lib/actor-matching'
import { isMissingColumnError, findMissingOptionalCol } from '@/lib/db-missing-column'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function photoPublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/actor-photos/${path}`
}

export const runtime = 'nodejs'

// 인메모리 중복 제출 방지 — actor_id 없는 사용자가 동시에 여러 POST를 보내면
// 두 개의 actor row가 생길 수 있다. 60초 쿨다운으로 동일 인스턴스 내 race 방어.
const intakeCooldowns = new Map<string, number>()
const INTAKE_COOLDOWN_MS = 60_000

export async function POST(request: NextRequest) {
  // SUPABASE_URL 없으면 사진 URL이 빈 경로로 DB에 저장되어 이미지가 전부 깨짐
  if (!SUPABASE_URL) {
    console.error('[profile/intake] NEXT_PUBLIC_SUPABASE_URL 환경변수 누락')
    return NextResponse.json({ error: 'SUPABASE_URL 환경변수 누락' }, { status: 500 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // CL 체크 — 레이트리밋 슬롯 소모 전 먼저 확인
  const clIntake = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
  if (clIntake > 32_768) {
    return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
  }

  // 동일 사용자 60초 내 중복 제출 차단 (actor row 중복 생성 race 방어)
  const now = Date.now()
  const lastIntake = intakeCooldowns.get(user.id) ?? 0
  if (now - lastIntake < INTAKE_COOLDOWN_MS) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  intakeCooldowns.set(user.id, now)
  // 만료 항목 정리 — Map 무한 증가 방지
  if (intakeCooldowns.size > 2000) {
    for (const [k, ts] of intakeCooldowns) {
      if (now - ts > INTAKE_COOLDOWN_MS) intakeCooldowns.delete(k)
    }
  }

  try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }
  // 최대 길이 상수
  const MAX_PATH_LEN = 500   // Storage/R2 경로
  const MAX_SUMMARY_LEN = 2000
  const MAX_FILENAME_LEN = 200
  const MAX_PHOTOS = 30      // 배열 크기 상한
  const docPath: string | null = typeof body?.docPath === 'string' ? body.docPath.slice(0, MAX_PATH_LEN) : null
  const photos: { path: string }[] = (Array.isArray(body?.photos)
    ? body.photos.filter((p: unknown): p is { path: string } =>
        !!p && typeof (p as { path?: unknown }).path === 'string')
    : []
  ).slice(0, MAX_PHOTOS)
  const currentPhotoItems: { path: string; label: string }[] = (Array.isArray(body?.currentPhotos)
    ? body.currentPhotos.filter(
        (p: unknown): p is { path: string; label: string } =>
          !!p &&
          typeof (p as { path?: unknown }).path === 'string' &&
          typeof (p as { label?: unknown }).label === 'string' &&
          (p as { label: string }).label.length <= 100
      ).map((p: { path: string; label: string }) => ({
        path: p.path.slice(0, MAX_PATH_LEN),
        // 제어 문자 제거 — CSV 내보내기·관리자 뷰 데이터 오염 방지
        label: p.label.replace(/[\x00-\x1f\x7f]/g, ' ').trim(),
      }))
    : []
  ).slice(0, MAX_PHOTOS)
  // videos 배열 (신규) + 하위호환: 기존 video 단일 필드도 처리
  const VALID_VIDEO_TYPES = new Set(['reel', 'monologue', 'commercial', 'short_film'])
  const parseVideoItem = (v: unknown) =>
    v && typeof (v as { key?: unknown }).key === 'string'
      ? {
          key: (v as { key: string }).key.slice(0, MAX_PATH_LEN),
          size: Number((v as { size?: unknown }).size ?? 0) || null,
          filename: typeof (v as { filename?: unknown }).filename === 'string' ? (v as { filename: string }).filename.slice(0, MAX_FILENAME_LEN) : null,
          video_type: typeof (v as { video_type?: unknown }).video_type === 'string' && VALID_VIDEO_TYPES.has((v as { video_type: string }).video_type) ? (v as { video_type: string }).video_type : 'reel',
        }
      : null
  type ParsedVideo = NonNullable<ReturnType<typeof parseVideoItem>>
  const videos: ParsedVideo[] = Array.isArray(body?.videos)
    ? body.videos.slice(0, 10).map(parseVideoItem).filter((v): v is ParsedVideo => v !== null)
    : body?.video ? [parseVideoItem(body.video)].filter((v): v is ParsedVideo => v !== null) : []

  const ogPhotoPath: string | null = typeof body?.ogPhotoPath === 'string' ? body.ogPhotoPath.slice(0, MAX_PATH_LEN) : null
  const castingSummary: string | null = typeof body?.castingSummary === 'string' && body.castingSummary.trim() ? body.castingSummary.trim().slice(0, MAX_SUMMARY_LEN) : null

  // 스킬 + 고급 숙련도 (콤마 구분 배열, 각 100자/30개 상한, advanced는 skills의 부분집합)
  const MAX_SKILLS = 30
  const MAX_SKILL_LEN = 100
  const sanitizeSkillList = (input: unknown): string[] => {
    if (!Array.isArray(input)) return []
    return input
      .filter((s: unknown): s is string => typeof s === 'string')
      .map((s: string) => s.replace(/[\x00-\x1f\x7f]/g, ' ').trim())
      .filter((s: string) => s.length > 0 && s.length <= MAX_SKILL_LEN)
      .slice(0, MAX_SKILLS)
  }
  const skills = sanitizeSkillList(body?.skills)
  const advancedSkillsInput = sanitizeSkillList(body?.advancedSkills)
  // advanced_skills는 skills의 부분집합으로만 허용 (오타·미입력 항목 차단)
  const skillsSet = new Set(skills)
  const advancedSkills = advancedSkillsInput.filter((s) => skillsSet.has(s))
  // 사투리 가능 지역 (허용 옵션만 화이트리스트)
  const dialects = sanitizeDialects(body?.dialects)

  // 신장(cm)·체중(kg) — 숫자만 추출 후 상식 범위 클램프(범위 밖이면 무시). 인스타 — 제어문자 제거+길이제한
  const parseMetric = (v: unknown, min: number, max: number): number | null => {
    const n = parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10)
    return Number.isFinite(n) && n >= min && n <= max ? n : null
  }
  const height = parseMetric(body?.height, 100, 250)
  const weight = parseMetric(body?.weight, 30, 200)
  const instagram = typeof body?.instagram === 'string'
    ? (body.instagram.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 200) || null)
    : null
  // 출생연도(4자리) → 나이대 자동 도출
  const birthYear = parseMetric(body?.birthYear, 1930, new Date().getFullYear())
  const ageGroupFromBirth = ((): string | null => {
    if (birthYear === null) return null
    const age = new Date().getFullYear() - birthYear
    if (age >= 20 && age < 30) return '20대'
    if (age >= 30 && age < 40) return '30대'
    if (age >= 40 && age < 50) return '40대'
    if (age >= 50) return '50대 이상'
    return null  // 10대 등은 age_group CHECK 안전 위해 미설정
  })()

  if (!docPath && photos.length === 0 && videos.length === 0 && !castingSummary && skills.length === 0) {
    return NextResponse.json({ error: '제출할 파일이 없습니다.' }, { status: 400 })
  }

  // 파일 경로 네임스페이스 검증 — 다른 사용자 파일 탈취 방지 (IDOR + 경로 탐색 방어)
  // '%2e%2e' 등 퍼센트 인코딩 우회 방지를 위해 decodeURIComponent 후 검사
  const hasPathTraversal = (path: string) => {
    let decoded = path
    try { decoded = decodeURIComponent(path) } catch { /* 디코딩 실패 시 원본 사용 */ }
    return decoded.split('/').some(seg => seg === '..' || seg === '.')
  }

  // R2 video keys: presigned URL 발급 시 actors/intake/{user.id}/... 패턴으로만 발급됨
  const allowedVideoPrefix = `actors/intake/${user.id}/`
  if (videos.some(v => hasPathTraversal(v.key) || !v.key.startsWith(allowedVideoPrefix))) {
    return NextResponse.json({ error: '허가되지 않은 영상 파일 경로입니다.' }, { status: 403 })
  }
  // Supabase Storage photo/doc paths: intake/{user.id}/... 패턴으로만 발급됨
  const allowedStoragePrefix = `intake/${user.id}/`
  if (photos.some(p => hasPathTraversal(p.path) || !p.path.startsWith(allowedStoragePrefix))) {
    return NextResponse.json({ error: '허가되지 않은 사진 파일 경로입니다.' }, { status: 403 })
  }
  if (ogPhotoPath && (hasPathTraversal(ogPhotoPath) || !ogPhotoPath.startsWith(allowedStoragePrefix))) {
    return NextResponse.json({ error: '허가되지 않은 OG 사진 경로입니다.' }, { status: 403 })
  }
  // docPath: actor-docs 버킷 — intake/{user.id}/... 패턴
  if (docPath && (hasPathTraversal(docPath) || !docPath.startsWith(allowedStoragePrefix))) {
    return NextResponse.json({ error: '허가되지 않은 문서 파일 경로입니다.' }, { status: 403 })
  }
  // currentPhotos — IDOR 방어: 동일 네임스페이스 검증 (photos와 동일 룰)
  if (currentPhotoItems.some(p => hasPathTraversal(p.path) || !p.path.startsWith(allowedStoragePrefix))) {
    return NextResponse.json({ error: '허가되지 않은 현재사진 경로입니다.' }, { status: 403 })
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
  const partialErrors: string[] = []

  // 이미 제출된 경우 — 중복 제출 방지 (사진/영상 row 중복 삽입 방지)
  if (profile.actor_id) {
    const { data: existingActor } = await supabaseAdmin
      .from('actors').select('intake_submitted_at').eq('id', profile.actor_id).maybeSingle()
    if (existingActor?.intake_submitted_at) {
      return NextResponse.json({ error: '이미 제출된 프로필입니다.', submitted: true }, { status: 409 })
    }
  }

  // 1. 대상 배우 row 결정 — 없으면 이름 매칭 재시도 후 그래도 없으면 비공개로 신규 생성
  let actorId = profile.actor_id as string | null
  if (!actorId) {
    // 온보딩 직전 마지막 매칭 시도 — 서린 케이스 재발 방지
    // (on-signup 시점에 phone 없어서 실패했을 수 있음 → 이름 단독 폴백으로 재시도)
    const matchResult = await matchActorOnSignup(user.id, profile.name ?? '', profile.phone ?? '')
    if (matchResult.matched && matchResult.actorId) {
      actorId = matchResult.actorId
      console.log('[profile/intake] 기존 배우 row 매칭 성공:', actorId)
    } else {
      // 🆕 최신 업로드 우선 — 동일인(이름 일치·전화 비충돌) 자동 병합.
      //    matchActorOnSignup이 "기존행 전화 있음 + 입력 전화 없음"으로 막혔던 케이스
      //    (박우진·김이영)를 본인 업로드 의도로 보고 기존 공개행에 합친다 → 새 중복행 방지.
      const intakeMatch = await matchActorForIntake(user.id, profile.name ?? '', profile.phone ?? '')
      if (intakeMatch.matched && intakeMatch.actorId) {
        actorId = intakeMatch.actorId
        console.log('[profile/intake] 동일인 자동병합(최신 업로드 우선):', actorId, '|', intakeMatch.reason)
      } else {
        if (intakeMatch.reason === 'ambiguous' || intakeMatch.reason === 'phone_conflict' || intakeMatch.reason === 'claimed') {
          // 동일인 의심되나 자동병합 보류 — 비공개 신규행으로 두고 관리자 검토 필요.
          console.warn(`[profile/intake] 동일인 의심·자동병합 보류(${intakeMatch.reason}) → 비공개 신규행. name=${profile.name ?? ''}`)
        }
        const { data: created, error: createErr } = await supabaseAdmin
          .from('actors')
          .insert({
            name: profile.name ?? '(이름 미입력)',
            phone: profile.phone ?? null,
            is_public: false, // 관리자 검토 후 공개
            self_managed: true,
            source: 'manual',
            intake_submitted_at: nowIso,
          })
          .select('id')
          .maybeSingle()

        if (createErr || !created) {
          console.error('[profile/intake] 배우 생성 실패:', createErr?.message)
          return NextResponse.json({ error: '프로필 생성에 실패했습니다.' }, { status: 500 })
        }
        actorId = created.id
      }
    }

    // 프로필에 actor_id 연결 + rows-affected 확인 (user row 消失 시 silent no-op 방지)
    // '일반 회원'(user) 잔재면 '배우 멤버'(actor)로 함께 정리 — 온보딩 완료 = 배우 멤버 (2026-06-12 대표 지시)
    const { data: linked, error: linkErr } = await supabaseAdmin
      .from('profiles')
      .update(profile.role === 'user' ? { actor_id: actorId, role: 'actor' } : { actor_id: actorId })
      .eq('id', user.id)
      .select('id').maybeSingle()
    if (linkErr) {
      console.error('[profile/intake] actor_id 연결 실패 — 생성된 actor row 정리:', linkErr.message)
      // 고아 row 방지: 방금 생성한 actor row best-effort 삭제 후 500 반환
      // (재시도 시 profile.actor_id가 여전히 null이므로 중복 생성 방지)
      try { await supabaseAdmin.from('actors').delete().eq('id', actorId) } catch { /* ignore */ }
      return NextResponse.json({ error: '프로필 생성에 실패했습니다.' }, { status: 500 })
    }
    if (!linked) {
      console.error('[profile/intake] profiles row 소실 — actor row 정리 후 500 반환. user.id:', user.id)
      try { await supabaseAdmin.from('actors').delete().eq('id', actorId) } catch { /* ignore */ }
      return NextResponse.json({ error: '프로필 생성에 실패했습니다.' }, { status: 500 })
    }
  }

  // 2. PPT(문서) 경로 + 제출 시점 + 가로사진(OG 썸네일) 기록
  const actorPatch: Record<string, unknown> = { intake_submitted_at: nowIso }
  if (docPath) actorPatch.profile_doc_path = docPath
  if (ogPhotoPath) actorPatch.profile_photo = photoPublicUrl(ogPhotoPath)
  if (castingSummary) actorPatch.casting_summary = castingSummary
  if (skills.length > 0) actorPatch.skills = skills
  if (advancedSkills.length > 0) actorPatch.advanced_skills = advancedSkills
  if (dialects.length > 0) actorPatch.dialects = dialects
  if (height !== null) actorPatch.height = height
  if (weight !== null) actorPatch.weight = weight
  if (instagram) actorPatch.instagram = instagram
  if (birthYear !== null) actorPatch.birth_year = birthYear
  if (ageGroupFromBirth) actorPatch.age_group = ageGroupFromBirth  // 생년 → 나이대 자동

  // 마이그레이션 미실행 가능 컬럼 대응 — 누락된 컬럼만 빼고 재시도해 안전 처리.
  // ⚠️ UPDATE는 누락 컬럼 시 42703이 아닌 PGRST204를 냄 → isMissingColumnError로 둘 다 잡는다.
  //    (birth_year는 여기서 빠져도 age_group은 유지 → 나이대 검색/필터는 정상 동작)
  const OPTIONAL_COLS = ['advanced_skills', 'dialects', 'birth_year']
  const patchAttempt = async (dropCols: Set<string>) => {
    const finalPatch: Record<string, unknown> = { ...actorPatch }
    for (const c of dropCols) delete finalPatch[c]
    return supabaseAdmin.from('actors').update(finalPatch).eq('id', actorId)
      .select('id').maybeSingle()
  }
  const dropped = new Set<string>()
  let { data: patched, error: patchErr } = await patchAttempt(dropped)
  let guard = 0
  while (isMissingColumnError(patchErr) && guard < OPTIONAL_COLS.length) {
    guard++
    const missing = findMissingOptionalCol(patchErr, OPTIONAL_COLS, dropped)
    if (missing) dropped.add(missing)
    else OPTIONAL_COLS.forEach((c) => dropped.add(c)) // 컬럼 특정 불가 시 옵션 컬럼 모두 제외
    console.warn(`[profile/intake] 컬럼 미존재 — 제외 후 재시도: ${[...dropped].join(', ')}`)
    const retry = await patchAttempt(dropped)
    patched = retry.data
    patchErr = retry.error
  }
  if (patchErr) {
    console.error('[profile/intake] actor 패치 실패:', patchErr.message)
    return NextResponse.json({ error: '프로필 제출 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
  }
  if (!patched) {
    console.error('[profile/intake] actor row 소실 — actorId:', actorId)
    return NextResponse.json({ error: '프로필 제출 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  // 3. sort_order 기준값을 단일 쿼리로 선-조회 — photos/currentPhotos 두 배치 모두 사용
  // READ COMMITTED race 방어: 두 배치가 동일 기준점에서 단조증가하여 overlap 없음
  const { data: existingPhotosMax } = await supabaseAdmin
    .from('actor_photos')
    .select('sort_order')
    .eq('actor_id', actorId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const photoBase = (existingPhotosMax?.sort_order ?? -1) + 1

  // 3. 사진 rows
  if (photos.length > 0) {
    const rows = photos.map((p, i) => ({
      actor_id: actorId,
      url: photoPublicUrl(p.path),
      storage_path: p.path,
      sort_order: photoBase + i,
    }))
    const { error: photoErr } = await supabaseAdmin.from('actor_photos').insert(rows)
    if (photoErr) {
      console.error('[profile/intake] 사진 등록 실패:', photoErr.message)
      partialErrors.push('사진 등록 실패')
    }
  }

  // 3b. 현재사진 rows (photos 이후 sort_order — photoBase + photos.length로 연속 할당)
  if (currentPhotoItems.length > 0) {
    const baseC = photoBase + photos.length

    const currentRows = currentPhotoItems.map((p, i) => ({
      actor_id: actorId,
      url: photoPublicUrl(p.path),
      storage_path: p.path,
      sort_order: baseC + i,
      photo_type: 'current',
      label: p.label,
    }))
    const { error: cpErr } = await supabaseAdmin.from('actor_photos').insert(currentRows)
    if (cpErr) {
      console.error('[profile/intake] 현재사진 등록 실패:', cpErr.message)
      partialErrors.push('현재사진 등록 실패')
    }
  }

  // 4. 영상 rows (R2, 최대 3개 — reel 2 + monologue 1) — 단일 배치 insert
  if (videos.length > 0) {
    const videoRows = videos.slice(0, 3).map((vid, idx) => ({
      actor_id: actorId,
      title: vid.filename,
      r2_key: vid.key,
      file_size_bytes: vid.size,
      uploaded_at: nowIso,
      is_public: false,
      video_type: vid.video_type ?? 'reel',
      sort_order: idx,
    }))
    const { error: videoErr } = await supabaseAdmin.from('actor_videos').insert(videoRows)
    if (videoErr) {
      console.error('[profile/intake] 영상 등록 실패:', videoErr.message)
      partialErrors.push('영상 등록 실패')
    }
  }

  revalidateTag('actors')
  if (actorId) revalidateTag(`actor-${actorId}`)
  return NextResponse.json({
    ok: true,
    actorId,
    ...(partialErrors.length > 0 && { warnings: partialErrors }),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[profile/intake] 서버 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
