/**
 * GET /api/admin/approve-crew?uid=XXX
 * 관리자가 이메일 링크 클릭 → 해당 유저 role을 'crew'로 승인
 * 로그인한 관리자(admin)만 실행 가능
 */
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/sms'
import { SITE_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Host-header 스푸핑 방지: 리다이렉트 base는 항상 SITE_URL 고정 (open redirect 방어)
  const origin = SITE_URL
  const uid = searchParams.get('uid')

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uid || !UUID_RE.test(uid)) {
    return NextResponse.redirect(`${origin}/admin?error=invalid_uid`)
  }

  // 관리자 인증 확인
  // (이메일 링크 클릭 시 Referer/Origin 헤더가 없어 isSameSite 체크는 항상 false → 제거됨)
  // 실질적인 보안 게이트: getUser() + admin 역할 확인 (아래)
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    // 로그인 안 된 경우 → /admin으로 보냄 (API route를 next로 쓰면 로그인 후 JSON이 노출됨)
    // 로그인 후 이메일 링크를 다시 클릭하면 정상 처리됨
    return NextResponse.redirect(
      `${origin}/auth/login?next=${encodeURIComponent('/admin')}`
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

  // 이미 승인된 경우 — 재실행 방지 (DB 쓰기·SMS 중복 방지)
  if (target.role === 'crew' || target.role === 'director') {
    return NextResponse.redirect(
      `${origin}/admin?already_approved=${encodeURIComponent(target.name ?? target.email ?? uid)}`
    )
  }

  // 승인 대상 역할 매핑 — 신청 상태만 처리
  const APPROVE_MAP: Record<string, { role: string; label: string }> = {
    crew_pending: { role: 'crew', label: '크루' },
    director_pending: { role: 'director', label: '디렉터' },
  }
  const mapped = APPROVE_MAP[target.role ?? '']
  if (!mapped) {
    return NextResponse.redirect(`${origin}/admin?error=invalid_role`)
  }

  // 원자적 업데이트: role이 여전히 pending 상태일 때만 실행 (TOCTOU 방지, SMS 중복 방지)
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: mapped.role })
    .eq('id', uid)
    .in('role', ['crew_pending', 'director_pending'])
    .select('id')
    .maybeSingle()

  if (updateErr) {
    console.error('[approve-crew] 업데이트 오류:', updateErr.message)
    return NextResponse.redirect(`${origin}/admin?error=update_failed`)
  }
  if (!updated) {
    // 동시 요청에서 이미 승인됨 — 멱등적으로 처리
    return NextResponse.redirect(
      `${origin}/admin?already_approved=${encodeURIComponent(target.name ?? target.email ?? uid)}`
    )
  }
  // 역할 변경 후 대시보드 캐시 무효화 (캐시된 권한 정보 갱신)
  revalidatePath('/dashboard')

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
