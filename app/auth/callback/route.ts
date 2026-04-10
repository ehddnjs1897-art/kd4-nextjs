import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { matchActorOnSignup } from '@/lib/actor-matching'

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
    const initialRole = memberType === 'director' ? 'director' : 'actor'

    await supabase.from('profiles').upsert(
      { id: user.id, name: name || null, email: user.email ?? null, phone: phone || null, role: initialRole },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    if (memberType !== 'director' && name && phone) {
      try {
        await matchActorOnSignup(user.id, name, phone)
      } catch (e) {
        console.error('[auth/callback] 배우 매칭 오류:', e)
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
  // member_type이 없는 OAuth 유저이고, 가입한 지 60초 이내 → 회원 유형 미설정
  const provider = user.app_metadata?.provider ?? 'email'
  const isOAuth = provider === 'google' || provider === 'kakao'

  // profiles 테이블에서 기존 프로필 확인
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  const isNewUser = isOAuth && !existingProfile &&
    (Date.now() - new Date(user.created_at).getTime() < 60_000)

  // 신규 OAuth 유저: 임시 프로필 생성 후 유형 선택 페이지로
  if (isNewUser) {
    await supabase.from('profiles').upsert(
      { id: user.id, name: name || null, email: user.email ?? null, role: 'actor' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    return NextResponse.redirect(`${origin}/auth/setup`)
  }

  // ── 일반 이메일 가입 or 기존 OAuth 재로그인 ──────────────────────────
  const initialRole = memberType === 'director' ? 'director' : (existingProfile?.role ?? 'actor')

  const { error: upsertErr } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      name: name || null,
      email: user.email ?? null,
      phone: phone || null,
      role: initialRole,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  if (upsertErr) {
    console.error('[auth/callback] profiles upsert 실패:', upsertErr.message)
  }

  // 배우 회원만 배우 DB 자동 매칭
  if (memberType !== 'director' && name && phone) {
    try {
      const result = await matchActorOnSignup(user.id, name, phone)
      if (result.matched) {
        console.log(`[auth/callback] 배우 매칭 성공: ${user.id} → ${result.actorId}`)
      }
    } catch (e) {
      console.error('[auth/callback] 배우 매칭 오류:', e)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
