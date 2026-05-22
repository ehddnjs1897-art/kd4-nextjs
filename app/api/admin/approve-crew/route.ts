/**
 * GET /api/admin/approve-crew?uid=XXX
 * 관리자가 이메일 링크 클릭 → 해당 유저 role을 'crew'로 승인
 * 로그인한 관리자(admin)만 실행 가능
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const uid = searchParams.get('uid')

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uid || !UUID_RE.test(uid)) {
    return NextResponse.redirect(`${origin}/admin?error=invalid_uid`)
  }

  // 관리자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    // 로그인 안 된 경우 → 로그인 후 다시 이 URL로 리디렉트
    return NextResponse.redirect(
      `${origin}/auth/login?next=/api/admin/approve-crew?uid=${uid}`
    )
  }

  // admin 여부 확인
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.redirect(`${origin}/?error=not_admin`)
  }

  // 대상 유저 정보 조회 (phone 포함)
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('role, name, email, phone')
    .eq('id', uid)
    .maybeSingle()

  if (!target) {
    return NextResponse.redirect(`${origin}/admin?error=user_not_found`)
  }

  // 승인 대상 역할 매핑 — 크루/디렉터 신청 모두 처리
  //   crew_pending → crew, director_pending → director (이미 승인된 경우는 그대로 유지)
  const APPROVE_MAP: Record<string, { role: string; label: string }> = {
    crew_pending: { role: 'crew', label: '크루' },
    crew: { role: 'crew', label: '크루' },
    director_pending: { role: 'director', label: '디렉터' },
    director: { role: 'director', label: '디렉터' },
  }
  const mapped = APPROVE_MAP[target.role ?? '']
  if (!mapped) {
    return NextResponse.redirect(`${origin}/admin?error=invalid_role`)
  }

  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: mapped.role })
    .eq('id', uid)

  if (updateErr) {
    console.error('[approve-crew] 업데이트 오류:', updateErr.message)
    return NextResponse.redirect(`${origin}/admin?error=update_failed`)
  }

  // 사용자에게 승인 SMS 알림 (trally 패턴 — 양방향 알림)
  if (target.phone) {
    const msg =
      mapped.role === 'director'
        ? `[KD4] 디렉터 승인 완료\n${target.name ?? ''}님, 디렉터 권한이 승인되었습니다.\n배우 연락처 열람·프로필 다운로드가 가능합니다.`
        : `[KD4] 크루 승인 완료\n${target.name ?? ''}님, KD4 크루 권한이 승인되었습니다.\n커뮤니티·배우 DB·대본 분석 이용 가능합니다.`
    sendSMS(target.phone, msg).catch(console.error)
  }

  // 관리자 패널로 리디렉트 (성공 메시지 포함)
  return NextResponse.redirect(
    `${origin}/admin?approved=${encodeURIComponent(target.name ?? target.email ?? uid)}`
  )
}
