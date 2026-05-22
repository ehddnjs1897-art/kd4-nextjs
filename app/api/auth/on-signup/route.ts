/**
 * POST /api/auth/on-signup
 * 이메일 인증 OFF(즉시 세션 반환) 경우에도 배우 매칭 + role 설정이 되도록 보장.
 * 회원가입 페이지에서 세션이 바로 생성될 때 호출.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { matchActorOnSignup, linkEnrollmentsOnSignup } from '@/lib/actor-matching'

const ELEVATED_ROLES = ['crew_pending', 'crew', 'editor', 'director_pending', 'director', 'admin']

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const name: string = user.user_metadata?.name ?? ''
  const phone: string = user.user_metadata?.phone ?? ''
  const memberType: string = user.user_metadata?.member_type ?? 'actor'

  // 기존 역할 확인 (이미 승급된 역할이면 강등 금지)
  const { data: existing } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const existingRole: string | null = existing?.role ?? null

  let newRole = existingRole
  if (!existingRole || !ELEVATED_ROLES.includes(existingRole)) {
    newRole = memberType === 'director' ? 'user' : 'actor'
  }

  // supabaseAdmin으로 role + name + phone 업데이트 (클라이언트 RLS 우회)
  await supabaseAdmin.from('profiles').upsert(
    {
      id: user.id,
      name: name || null,
      phone: memberType === 'actor' ? (phone || null) : null,
      email: user.email || null,
      role: newRole,
    },
    { onConflict: 'id' }
  )

  // 배우 매칭 (이름 + 전화번호 기준)
  let actorId: string | undefined
  if (name && memberType !== 'director' && phone) {
    try {
      const res = await matchActorOnSignup(user.id, name, phone)
      actorId = res.actorId
    } catch (e) {
      console.error('[on-signup] matching error:', e)
    }
  }

  // 미리 넣어둔 수강 기록 연결
  if (name) {
    try {
      await linkEnrollmentsOnSignup(user.id, name, actorId)
    } catch (e) {
      console.error('[on-signup] enrollment link error:', e)
    }
  }

  return NextResponse.json({ ok: true, role: newRole, matched: !!actorId })
}
