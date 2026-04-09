/**
 * POST /api/upload — 파일 업로드
 *
 * - 로그인 필수 + role: editor 또는 admin
 * - multipart/form-data: { file: File, actorId: string, bucket?: string }
 * - 이미지 파일 5MB 제한
 * - 반환: { url, path, provider }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/storage'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DEFAULT_BUCKET = 'actor-media'

// ─── 권한 확인 ───────────────────────────────────────────────────────────────

async function requireEditorOrAdmin(): Promise<
  { userId: string } | NextResponse
> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: '프로필 정보를 가져올 수 없습니다.' },
      { status: 500 }
    )
  }

  const role: string = profile.role ?? 'user'
  if (role !== 'editor' && role !== 'admin') {
    return NextResponse.json(
      { error: '파일 업로드는 편집자 또는 관리자만 가능합니다.' },
      { status: 403 }
    )
  }

  return { userId: user.id }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const check = await requireEditorOrAdmin()
  if (check instanceof NextResponse) return check

  try {
    const formData = await request.formData()

    const file = formData.get('file')
    const actorId = formData.get('actorId')
    const bucket = (formData.get('bucket') as string | null) ?? DEFAULT_BUCKET

    // ── 유효성 검사 ──
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'file 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (!actorId || typeof actorId !== 'string') {
      return NextResponse.json(
        { error: 'actorId 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // MIME 타입 확인
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `허용되지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 파일 크기 확인
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        {
          error: `파일 크기가 너무 큽니다. (현재: ${sizeMB}MB, 최대: 5MB)`,
        },
        { status: 400 }
      )
    }

    // ── 업로드 ──
    const result = await uploadFile(file, bucket, actorId, file.name)

    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    console.error('[POST /api/upload] 오류:', message)
    return NextResponse.json(
      { error: `업로드에 실패했습니다: ${message}` },
      { status: 500 }
    )
  }
}
