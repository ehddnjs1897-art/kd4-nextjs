/**
 * POST /api/admin/videos/upload
 *
 * Admin 전용 — 배우 출연영상 R2 업로드
 *
 * Body (multipart/form-data):
 *   file       : Blob (영상 파일)
 *   actor_id   : UUID
 *   title?     : string
 *
 * Response: { id, r2_key, actor_id, title }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { uploadVideo, deleteVideo, buildVideoKey, isR2Configured } from '@/lib/r2'
import { revalidateTag } from '@/lib/revalidate'

// 파일 크기 제한: 500MB (R2는 5TB까지 가능, 안전 한도)
const MAX_SIZE_BYTES = 500 * 1024 * 1024

// 업로드 레이트 리밋: 30분 내 5회 초과 차단 (R2 스토리지 남용 방어)
const adminVideoUploadMap = new Map<string, number[]>()
const ADMIN_VIDEO_UPLOAD_WINDOW_MS = 30 * 60_000
const ADMIN_VIDEO_UPLOAD_MAX = 5
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/avi', 'video/x-matroska']
const ALLOWED_VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']

export const runtime = 'nodejs'
export const maxDuration = 300 // 5분 (큰 영상 업로드 대응)

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  // supabaseAdmin으로 조회 — RLS 우회, 실제 DB 값 기준 권한 확인
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return { userId: user.id }
}

export async function POST(request: NextRequest) {
  if (!isR2Configured()) {
    console.error('[admin/videos/upload] R2 환경변수 미설정')
    return NextResponse.json(
      { error: 'R2 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.' },
      { status: 500 }
    )
  }

  const adminAuth = await requireAdmin()
  if (adminAuth instanceof NextResponse) return adminAuth

  // 레이트 리밋: 30분 내 5회 초과 차단
  const nowAV = Date.now()
  const avTimes = (adminVideoUploadMap.get(adminAuth.userId) ?? []).filter(t => nowAV - t < ADMIN_VIDEO_UPLOAD_WINDOW_MS)
  if (avTimes.length >= ADMIN_VIDEO_UPLOAD_MAX) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  // 레이트 리밋 슬롯 소모는 유효성 검사 통과 후에만 — 잘못된 요청으로 쿼터 소진 방지
  // (실제 카운트 증가는 아래 파일 검증 통과 후로 이동)

  const clAdminVideo = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
  if (clAdminVideo > 520 * 1024 * 1024) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const actorId = formData.get('actor_id') as string | null
    const title = ((formData.get('title') as string | null) ?? '').trim().slice(0, 200) || null

    if (!file || !actorId) {
      return NextResponse.json({ error: 'file과 actor_id는 필수입니다.' }, { status: 400 })
    }

    // actor_id UUID 형식 검증
    if (!UUID_RE.test(actorId)) {
      return NextResponse.json({ error: '유효하지 않은 actor_id 형식입니다.' }, { status: 400 })
    }

    // 배우 존재 여부 + 현재 영상 수 병렬 확인 (고아 R2 파일 방지 + 50개 캡 강제)
    const MAX_VIDEOS_PER_ACTOR = 50
    const [{ data: actorExists }, { count: currentVideoCount }, { data: maxSortRow }] = await Promise.all([
      supabaseAdmin.from('actors').select('id').eq('id', actorId).maybeSingle(),
      supabaseAdmin.from('actor_videos').select('id', { count: 'exact', head: true }).eq('actor_id', actorId),
      supabaseAdmin.from('actor_videos').select('sort_order').eq('actor_id', actorId).order('sort_order', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (!actorExists) {
      return NextResponse.json({ error: '존재하지 않는 배우입니다.' }, { status: 404 })
    }
    if ((currentVideoCount ?? 0) >= MAX_VIDEOS_PER_ACTOR) {
      return NextResponse.json({ error: `영상은 최대 ${MAX_VIDEOS_PER_ACTOR}개까지 등록할 수 있습니다.` }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `파일이 너무 큽니다. 최대 ${MAX_SIZE_BYTES / 1024 / 1024}MB.` },
        { status: 413 }
      )
    }

    // MIME 타입 + 확장자 검증 (클라이언트 위조 방어)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_VIDEO_TYPES.includes(file.type) || !ALLOWED_VIDEO_EXT.includes(ext)) {
      return NextResponse.json({ error: '지원하지 않는 영상 파일 형식입니다.' }, { status: 400 })
    }

    // 1. R2 업로드
    const buffer = Buffer.from(await file.arrayBuffer())

    // 매직 바이트 검증 — MIME/확장자 위조 방어 (MP4/MOV/M4V: ftyp box; WebM/MKV: EBML 헤더; AVI: RIFF)
    const sig = buffer.slice(0, 12)
    const isMp4Ftyp = sig[4] === 0x66 && sig[5] === 0x74 && sig[6] === 0x79 && sig[7] === 0x70 // 'ftyp'
    const isWebm  = sig[0] === 0x1a && sig[1] === 0x45 && sig[2] === 0xdf && sig[3] === 0xa3   // EBML
    const isAvi   = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46   // 'RIFF'
    if (!isMp4Ftyp && !isWebm && !isAvi) {
      return NextResponse.json({ error: '지원하지 않는 영상 파일 형식입니다.' }, { status: 400 })
    }

    // 모든 유효성 검사 통과 후에만 레이트 리밋 슬롯 소모
    adminVideoUploadMap.set(adminAuth.userId, [...avTimes, nowAV])
    if (adminVideoUploadMap.size > 2000) {
      for (const [k, v] of adminVideoUploadMap) {
        if (v.every(t => nowAV - t > ADMIN_VIDEO_UPLOAD_WINDOW_MS)) adminVideoUploadMap.delete(k)
      }
    }

    const r2Key = buildVideoKey(actorId, file.name)
    await uploadVideo(r2Key, buffer, file.type)

    // 2. DB row 생성 — 실패 시 R2 고아 파일 정리
    const { data, error } = await supabaseAdmin
      .from('actor_videos')
      .insert({
        actor_id: actorId,
        title: title || file.name.slice(0, 200),
        r2_key: r2Key,
        file_size_bytes: file.size,
        uploaded_at: new Date().toISOString(),
        is_public: false,
        sort_order: (maxSortRow?.sort_order ?? -1) + 1,
      })
      .select('id, r2_key, actor_id, title, file_size_bytes')
      .maybeSingle()

    if (error || !data) {
      console.error('[upload] DB insert 실패:', error?.message)
      // R2 고아 파일 정리 (best-effort)
      try { await deleteVideo(r2Key) } catch { /* ignore */ }
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 })
    }

    revalidateTag('actors')
    revalidateTag(`actor-${actorId}`)
    return NextResponse.json({ video: data })
  } catch (err) {
    console.error('[upload] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '업로드 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
