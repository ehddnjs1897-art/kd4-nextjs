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
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-m4v', 'video/x-matroska'])
const ALLOWED_UPLOAD_ROLES = new Set(['member', 'actor', 'editor', 'admin'])

// 레이트 리밋: 10분 내 10회 presigned URL 발급 초과 시 차단
const presignedReqMap = new Map<string, number[]>()
const PRESIGN_WINDOW_MS = 10 * 60_000
const PRESIGN_MAX = 10

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

  // 레이트 리밋: 10분 내 10회 초과 시 차단
  const now = Date.now()
  const times = (presignedReqMap.get(user.id) ?? []).filter(t => now - t < PRESIGN_WINDOW_MS)
  if (times.length >= PRESIGN_MAX) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  const clPresign = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
  if (clPresign > 4_096) return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })

  presignedReqMap.set(user.id, [...times, now])
  if (presignedReqMap.size > 2000) {
    const now2 = Date.now()
    for (const [k, v] of presignedReqMap) {
      if (v.every(t => now2 - t > PRESIGN_WINDOW_MS)) presignedReqMap.delete(k)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }
  const filename = typeof body.filename === 'string' ? body.filename.slice(0, 500) : ''
  const contentType = typeof body.contentType === 'string' ? body.contentType : ''
  const size = Number(body.size ?? 0)

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename과 contentType이 필요합니다.' }, { status: 400 })
  }
  if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
    return NextResponse.json({ error: '지원하지 않는 영상 형식입니다. (mp4, mov, avi, webm만 가능)' }, { status: 400 })
  }
  if (!Number.isFinite(size) || size <= 0) {
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
  // Date.now() 단독 사용 시 동일 ms 내 충돌 가능 → 랜덤 suffix 추가
  const rand = Math.random().toString(36).slice(2, 8)
  const key = `actors/intake/${user.id}/${Date.now()}-${rand}.${ext}`

  try {
    const uploadUrl = await getUploadUrl(key, contentType, 600, size) // 10분 + ContentLength 강제 (선언 크기 우회 방어)
    return NextResponse.json({ uploadUrl, key }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    console.error('[r2/upload-url] presigned URL 발급 실패:', e)
    return NextResponse.json({ error: '업로드 URL 발급에 실패했습니다.' }, { status: 500 })
  }
}
