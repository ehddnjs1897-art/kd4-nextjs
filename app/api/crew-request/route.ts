/**
 * POST /api/crew-request
 * 로그인한 회원이 KD4 크루 접근 신청 → role을 'crew_pending'으로 변경 + 관리자 이메일 발송
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyCrewRequest } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 현재 역할 + 이름 조회
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .maybeSingle()

  const currentRole = (profile?.role ?? 'user') as string

  // 이미 신청했거나 승인된 경우
  if (currentRole !== 'user' && currentRole !== 'member') {
    return NextResponse.json({
      message: '이미 신청되었거나 크루 권한이 있습니다.',
      role: currentRole,
    })
  }

  // 프로필 없으면 먼저 생성 후 crew_pending으로 upsert
  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        name: profile?.name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? null,
        email: user.email ?? null,
        role: 'crew_pending',
      },
      { onConflict: 'id' }
    )

  if (updateErr) {
    console.error('[POST /api/crew-request] 업데이트 오류:', updateErr.message)
    return NextResponse.json({ error: '신청 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 관리자에게 이메일 알림 (실패해도 신청은 완료)
  const applicantName = profile?.name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? '(이름 없음)'
  const applicantEmail = user.email ?? '(이메일 없음)'
  notifyCrewRequest(applicantName, applicantEmail, user.id).catch(console.error)

  return NextResponse.json({ success: true, role: 'crew_pending' })
}
