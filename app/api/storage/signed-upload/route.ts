/**
 * POST /api/storage/signed-upload — Supabase Storage 서명된 업로드 URL 발급
 *
 * 배경: lib/supabase/server.ts 가 세션 쿠키를 httpOnly:true 로 설정(XSS 방어)하기 때문에
 *       브라우저 JS(createBrowserClient)는 세션을 읽지 못한다.
 *       → 클라이언트 직접 storage.upload()는 비로그인(anon) 취급되어 RLS에 막힌다.
 *       영상(R2)이 서버 presigned URL로 우회하듯, 사진/문서도 서버가 서명 URL을 발급한다.
 *
 * 흐름:
 *   1) 서버(쿠키 읽기 가능)에서 로그인 검증
 *   2) supabaseAdmin(service_role)로 createSignedUploadUrl 발급 — RLS 우회
 *   3) 클라이언트는 uploadToSignedUrl(path, token, file)로 직접 업로드 (세션 불필요)
 *
 * 경로 네임스페이스는 항상 `intake/{user.id}/...` — 다운스트림 검증
 *   (api/profile/intake, api/actors/[id])과 일치 + IDOR 방어.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// 버킷별 허용 용량 (UI/클라이언트 사전체크와 동일 기준; 실제 강제는 버킷 file_size_limit)
const BUCKET_LIMITS: Record<string, number> = {
  'actor-photos': 15 * 1024 * 1024, // 15MB
  'actor-docs': 20 * 1024 * 1024, //  20MB (PPT/PDF)
}

export async function POST(request: NextRequest) {
  // ── 로그인 검증 (서버 클라이언트는 httpOnly 쿠키를 읽을 수 있음) ──
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // ── 입력 파싱 ──
  let body: { bucket?: string; ext?: string; size?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const bucket = body.bucket
  if (!bucket || !(bucket in BUCKET_LIMITS)) {
    return NextResponse.json({ error: '허용되지 않은 버킷입니다.' }, { status: 400 })
  }

  if (typeof body.size === 'number' && body.size > BUCKET_LIMITS[bucket]) {
    const mb = Math.round(BUCKET_LIMITS[bucket] / 1024 / 1024)
    return NextResponse.json({ error: `파일이 너무 큽니다. (최대 ${mb}MB)` }, { status: 400 })
  }

  // 확장자 새니타이즈 — 영숫자 1~5자만 (경로 인젝션 방어)
  const ext = (body.ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'

  // 경로: 항상 intake/{user.id}/ — 서버가 세션 user.id로 결정 (클라이언트 위조 불가)
  const rand = crypto.randomUUID().slice(0, 8)
  const path = `intake/${user.id}/${Date.now()}-${rand}.${ext}`

  // ── 서명 URL 발급 (service_role → RLS 우회) ──
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) {
    console.error('[signed-upload] createSignedUploadUrl 오류:', error?.message)
    return NextResponse.json({ error: '업로드 URL 발급에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ path: data.path, token: data.token }, { status: 200 })
}
