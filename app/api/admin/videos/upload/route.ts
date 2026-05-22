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

// 파일 크기 제한: 500MB (R2는 5TB까지 가능, 안전 한도)
const MAX_SIZE_BYTES = 500 * 1024 * 1024
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/avi', 'video/x-matroska']
const ALLOWED_VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']

export const runtime = 'nodejs'
export const maxDuration = 300 // 5분 (큰 영상 업로드 대응)

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return null
}

export async function POST(request: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.' },
      { status: 500 }
    )
  }

  const authErr = await requireAdmin()
  if (authErr) return authErr

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
    const r2Key = buildVideoKey(actorId, file.name)
    await uploadVideo(r2Key, buffer, file.type)

    // 2. DB row 생성 — 실패 시 R2 고아 파일 정리
    const { data, error } = await supabaseAdmin
      .from('actor_videos')
      .insert({
        actor_id: actorId,
        title: title || file.name,
        r2_key: r2Key,
        file_size_bytes: file.size,
        uploaded_at: new Date().toISOString(),
        is_public: false,
      })
      .select('id, r2_key, actor_id, title, file_size_bytes')
      .single()

    if (error) {
      console.error('[upload] DB insert 실패:', error.message)
      // R2 고아 파일 정리 (best-effort)
      try { await deleteVideo(r2Key) } catch { /* ignore */ }
      return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ video: data })
  } catch (err) {
    console.error('[upload] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '업로드 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
