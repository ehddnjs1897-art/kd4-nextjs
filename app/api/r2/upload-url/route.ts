/**
 * POST /api/r2/upload-url
 * 영상 업로드용 presigned PUT URL 발급 (브라우저 → R2 직접 업로드).
 * Vercel 본문 4.5MB 제한을 우회하기 위함 (최대 300MB 영상).
 *
 * Body(JSON): { filename: string, contentType: string, size: number }
 * Response:   { uploadUrl: string, key: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUploadUrl, isR2Configured } from '@/lib/r2'

const MAX_SIZE_BYTES = 300 * 1024 * 1024 // 300MB
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-m4v'])
const ALLOWED_UPLOAD_ROLES = new Set(['member', 'actor', 'editor', 'admin'])

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: '영상 저장소(R2)가 아직 설정되지 않았습니다. 관리자에게 문의하세요.' },
      { status: 503 }
    )
  }

  // 로그인 확인
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 역할 체크 — member/actor/editor/admin만 영상 업로드 가능
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || !ALLOWED_UPLOAD_ROLES.has(profile.role ?? '')) {
    return NextResponse.json({ error: '업로드 권한이 없습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const filename = typeof body?.filename === 'string' ? body.filename : ''
  const contentType = typeof body?.contentType === 'string' ? body.contentType : ''
  const size = Number(body?.size ?? 0)

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename과 contentType이 필요합니다.' }, { status: 400 })
  }
  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    return NextResponse.json({ error: '지원하지 않는 영상 형식입니다. (mp4, mov, avi, webm만 가능)' }, { status: 400 })
  }
  if (size <= 0) {
    return NextResponse.json({ error: '파일 크기가 올바르지 않습니다.' }, { status: 400 })
  }
  if (size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `영상이 너무 큽니다. 최대 ${MAX_SIZE_BYTES / 1024 / 1024}MB까지 가능합니다.` },
      { status: 413 }
    )
  }

  // 확장자 allowlist — 클라이언트 제공 filename의 확장자 검증 (content-type과 별도)
  const ALLOWED_EXTS = new Set(['mp4', 'mov', 'avi', 'webm', 'm4v', 'mkv'])
  const rawExt = filename.split('.').pop()?.toLowerCase() || ''
  const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : 'mp4'

  // 사용자 네임스페이스 키 (배우 row 생성 전 단계 — intake)
  const key = `actors/intake/${user.id}/${Date.now()}.${ext}`

  try {
    const uploadUrl = await getUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, key })
  } catch (e) {
    console.error('[r2/upload-url] presigned URL 발급 실패:', e)
    return NextResponse.json({ error: '업로드 URL 발급에 실패했습니다.' }, { status: 500 })
  }
}
