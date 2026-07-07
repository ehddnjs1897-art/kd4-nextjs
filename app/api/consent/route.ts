import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CONSENT_VERSION } from '@/lib/consent'

export const runtime = 'nodejs'

/**
 * 기존 회원 서비스 동의 기록 (방침·약관 v1, 2026-07-07 신설)
 * — 동의 버전·시각을 auth user_metadata에 남긴다. /consent 페이지에서 호출.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { tos?: boolean; privacy?: boolean; dist?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  if (body.tos !== true || body.privacy !== true) {
    return NextResponse.json({ error: '필수 동의 항목에 체크해 주세요.' }, { status: 400 })
  }

  const meta: Record<string, string> = {
    consent_tos: CONSENT_VERSION,
    consent_privacy: CONSENT_VERSION,
    consent_at: new Date().toISOString(),
  }
  if (body.dist === true) meta.consent_dist = CONSENT_VERSION

  // admin update: user_metadata 전체 교체 가능성에 대비해 기존 값 스프레드로 보존
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, ...meta },
  })
  if (error) {
    console.error('[consent] 동의 기록 실패:', error.message)
    return NextResponse.json({ error: '동의 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
