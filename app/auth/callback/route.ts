import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { matchActorOnSignup, linkEnrollmentsOnSignup } from '@/lib/actor-matching'

// 신규 가입은 모두 'actor' 기본 역할로 시작한다.
// 디렉터 권한은 자동 부여하지 않고 대시보드에서 승인 신청 → 관리자 승인(director_pending → director).
// 이미 승급된 역할(crew/editor/director/admin 등)은 재로그인·재인증 시 절대 강등하지 않는다.
const ELEVATED_ROLES = ['crew_pending', 'crew', 'editor', 'director_pending', 'director', 'admin']
function resolveInitialRole(memberType: string | undefined, existingRole: string | null | undefined): string {
  if (existingRole && ELEVATED_ROLES.includes(existingRole)) return existingRole
  // 디렉터로 가입 → 'member'(배우DB 잠금, 승인받아야 director).
  // 배우로 가입 → 'actor'(동료 목록·프로필 열람 가능).
  return memberType === 'director' ? 'member' : 'actor'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'recovery' | 'email' | 'invite' | null
  const next = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // ── Case 1: 이메일 인증 링크 클릭 (token_hash) ────────────────────────
  if (token_hash && type) {
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (otpError || !otpData.session) {
      console.error('[auth/callback] OTP 검증 실패:', otpError?.message)
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
    }

    const user = otpData.session.user
    const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? ''
    const phone = user.user_metadata?.phone ?? ''
    const memberType = user.user_metadata?.member_type
    // 기존 역할 조회 — 승급된 역할(director/editor 등) 강등 방지
    const { data: existingForRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const initialRole = resolveInitialRole(memberType, existingForRole?.role)

    // ignoreDuplicates: false → role을 항상 올바르게 덮어씀
    await supabase.from('profiles').upsert(
      { id: user.id, name: name || null, email: user.email ?? null, phone: phone || null, role: initialRole },
      { onConflict: 'id' }
    )

    if (name) {
      try {
        const res =
          memberType !== 'director' && phone
            ? await matchActorOnSignup(user.id, name, phone)
            : { actorId: undefined as string | undefined }
        // 미리 넣어둔 수강 기록(user_id 없는)을 이름으로 연결
        await linkEnrollmentsOnSignup(user.id, name, res.actorId)
      } catch (e) {
        console.error('[auth/callback] 매칭/수강연결 오류:', e)
      }
    }

    // 비밀번호 재설정 타입이면 reset 페이지로
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/reset?verified=1`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── Case 2: OAuth 코드 교환 (code) ────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] 코드 교환 실패:', error?.message)
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`)
  }

  const user = data.session.user

  const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? ''
  const phone = user.user_metadata?.phone ?? ''
  const memberType = user.user_metadata?.member_type // 이메일 가입 시에만 존재

  // ── OAuth(구글/카카오) 신규 가입 감지 ─────────────────────────────────
  const provider = user.app_metadata?.provider ?? 'email'
  const isOAuth = provider === 'google' || provider === 'kakao'

  // profiles 테이블에서 기존 프로필 확인
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  const isNewUser = isOAuth && !existingProfile &&
    (Date.now() - new Date(user.created_at).getTime() < 60_000)

  // 신규 OAuth 유저: 임시 프로필 생성 후 유형 선택 페이지로
  if (isNewUser) {
    await supabase.from('profiles').upsert(
      { id: user.id, name: name || null, email: user.email ?? null, role: 'actor' },
      { onConflict: 'id' }
    )
    return NextResponse.redirect(`${origin}/auth/setup`)
  }

  // ── 이메일 가입 콜백 or 기존 OAuth 재로그인 ──────────────────────────
  // member_type이 있으면(이메일 가입) role을 우선 적용, 없으면(OAuth 재로그인) 기존 role 유지
  // 신규는 actor/member 기본, 기존 승급 역할은 유지 (디렉터 자동부여 X — 승인 절차로만)
  const initialRole = resolveInitialRole(memberType, existingProfile?.role)

  const { error: upsertErr } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      name: name || null,
      email: user.email ?? null,
      phone: phone || null,
      role: initialRole,
    },
    { onConflict: 'id' }
  )

  if (upsertErr) {
    console.error('[auth/callback] profiles upsert 실패:', upsertErr.message)
  }

  // 배우 DB + 미리 넣어둔 수강기록 자동 연결 (이름 기준)
  if (name) {
    try {
      const res =
        memberType !== 'director' && phone
          ? await matchActorOnSignup(user.id, name, phone)
          : { actorId: undefined as string | undefined }
      await linkEnrollmentsOnSignup(user.id, name, res.actorId)
    } catch (e) {
      console.error('[auth/callback] 매칭/수강연결 오류:', e)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
