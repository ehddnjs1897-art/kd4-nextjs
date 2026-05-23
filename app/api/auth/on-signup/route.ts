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

// 인메모리 레이트 리밋: 같은 userId로 60초 내 재요청 차단 (반복 DB 스캔 방어)
const signupMap = new Map<string, number>()
const COOLDOWN_MS = 60_000

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  // 레이트 리밋: 60초 내 재호출 차단 (반복 actor-matching DB 스캔 방어)
  const now = Date.now()
  const last = signupMap.get(user.id)
  if (last && now - last < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: true })
  }
  signupMap.set(user.id, now)
  // 만료 항목 정리 — 500건 초과 시만 정리 (매 write마다 전체 순회 방지)
  if (signupMap.size > 500) {
    for (const [k, ts] of signupMap) { if (now - ts > COOLDOWN_MS) signupMap.delete(k) }
  }

  // 사용자 메타데이터는 신뢰할 수 없는 입력 — 길이 제한 적용
  const name: string = (user.user_metadata?.name ?? '').toString().slice(0, 100)
  const rawPhone: string = (user.user_metadata?.phone ?? '').toString().slice(0, 20)
  // 전화번호 형식 검증 — 잘못된 데이터가 actor-matching에 쓰이는 것을 방지
  const phone: string = /^[+]?[\d\s\-().]{7,20}$/.test(rawPhone) ? rawPhone : ''
  // 사용자 메타데이터는 신뢰할 수 없는 값 — 허용 목록 외 값은 기본값으로 강제
  const ALLOWED_MEMBER_TYPES = new Set(['actor', 'director'])
  const rawMemberType: string = user.user_metadata?.member_type ?? 'actor'
  const memberType: string = ALLOWED_MEMBER_TYPES.has(rawMemberType) ? rawMemberType : 'actor'

  // 기존 역할 확인 (이미 승급된 역할이면 강등 금지)
  const { data: existing } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const existingRole: string | null = existing?.role ?? null

  let newRole = existingRole
  if (!existingRole || !ELEVATED_ROLES.includes(existingRole)) {
    newRole = memberType === 'director' ? 'member' : 'actor'
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

  return NextResponse.json({ ok: true })
}
