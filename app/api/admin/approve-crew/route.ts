/**
 * GET /api/admin/approve-crew?uid=XXX
 * 관리자가 이메일 링크 클릭 → 해당 유저 role을 'crew'로 승인
 * 로그인한 관리자(admin)만 실행 가능
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const uid = searchParams.get('uid')

  if (!uid) {
    return NextResponse.redirect(`${origin}/admin?error=missing_uid`)
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

  // 대상 유저 정보 조회
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('role, name, email')
    .eq('id', uid)
    .maybeSingle()

  if (!target) {
    return NextResponse.redirect(`${origin}/admin?error=user_not_found`)
  }

  // crew_pending → crew 승인
  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'crew' })
    .eq('id', uid)

  if (updateErr) {
    console.error('[approve-crew] 업데이트 오류:', updateErr.message)
    return NextResponse.redirect(`${origin}/admin?error=update_failed`)
  }

  // 관리자 패널로 리디렉트 (성공 메시지 포함)
  return NextResponse.redirect(
    `${origin}/admin?approved=${encodeURIComponent(target.name ?? target.email ?? uid)}`
  )
}
