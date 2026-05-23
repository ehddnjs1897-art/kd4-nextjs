import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // OPTIONS preflight — CORS 핸들링은 route별로 처리, 미들웨어 세션 로직 불필요
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // 정적 자산은 대소문자 그대로 유지 (Vercel은 대소문자 구분 — KoPub*.woff2 등)
  // 폰트·이미지·CSS·JS·맵 등 모든 정적 확장자
  // /fonts/ 는 대소문자 무시 (case-insensitive) — /Fonts/, /FONTS/ 우회 방지
  if (
    /^\/fonts\//i.test(pathname) ||
    pathname.startsWith('/images/') ||
    /\.(woff2?|ttf|otf|eot|css|js|map|json|webmanifest)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Vercel 프리뷰 배포에서 관리자 페이지 차단 — 프로덕션 도메인(kd4.club) 전용
  // 프리뷰 배포는 동일 env var 공유 → 관리자 기능 오픈 방지
  // 주의: /api/admin/* 는 matcher가 api/ 전체를 제외하므로 이 미들웨어에 도달하지 않음.
  //       /api/admin/* 보호는 각 route 내 requireAdmin()에서 처리함.
  const host = request.headers.get('host') ?? ''
  if (host.endsWith('.vercel.app') && pathname.startsWith('/admin')) {
    return NextResponse.json(
      { error: '관리자 접근은 프로덕션 도메인에서만 허용됩니다.' },
      { status: 403 }
    )
  }

  // 대소문자 오타 정규화 — /Join → /join 등 (308 루프 없이 안전)
  const lowered = pathname.toLowerCase()
  if (pathname !== lowered) {
    const url = request.nextUrl.clone()
    url.pathname = lowered
    return NextResponse.redirect(url, 308)
  }

  // 광고 랜딩 · 공개 페이지 — Supabase 완전 격리 (어떤 외부 장애도 영향 없음)
  // 주의: /actors 는 회원 전용으로 잠금되어 세션 판별이 필요하므로 제외 (페이지 단에서 권한 처리)
  const PUBLIC_PATHS = ['/', '/join']
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // 환경변수 미설정 시 — production: fail-closed (로그인 리다이렉트), 그 외: skip
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[middleware] ⚠️ Supabase env vars missing in production — fail-closed')
      // /auth/* 는 통과 — 로그인 페이지 자체 차단 시 무한 리다이렉트 방지
      if (pathname.startsWith('/auth/')) return NextResponse.next()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url, 307)
    }
    console.warn('[middleware] Supabase env vars missing — auth checks disabled (preview/local)')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      // server.ts와 동일한 쿠키 보안 옵션 — httpOnly + Secure 누락 방지
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 + 인증 체크 — Supabase 오류 시 통과 (무한 리다이렉트 방지)
  // supabaseResponse 반환: 쿠키 갱신 유지 (NextResponse.next() 반환 시 쿠키 드롭됨)
  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return supabaseResponse
  }

  // 회원 전용 경로 — 비로그인 시 로그인 페이지로 리다이렉트
  // /actors, /board 는 페이지 단에서 세부 권한 처리 (일부 공개 가능)
  const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/ai-tools', '/insights', '/game', '/enroll']
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url, 307)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 정적 파일 및 API 경로 제외.
     * /api/* 는 각 route.ts 내부에서 자체적으로 getUser() 호출 → 중복 세션 갱신 불필요.
     * ⚠️ 신규 API route 추가 시 반드시 supabase.auth.getUser() 또는 requireAdmin() 포함 필수.
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts/|images/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf|otf|eot|css|js|map|json|webmanifest|ico)$).*)',
  ],
}
