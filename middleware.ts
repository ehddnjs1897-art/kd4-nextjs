import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 정적 자산은 대소문자 그대로 유지 (Vercel은 대소문자 구분 — KoPub*.woff2 등)
  // 폰트·이미지·CSS·JS·맵 등 모든 정적 확장자
  if (
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/') ||
    /\.(woff2?|ttf|otf|eot|css|js|map|json|webmanifest)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  // 대소문자 오타 정규화 — /Join → /join 등 (308 루프 없이 안전)
  const lowered = pathname.toLowerCase()
  if (pathname !== lowered) {
    const url = request.nextUrl.clone()
    url.pathname = lowered
    return NextResponse.redirect(url, 308)
  }

  // 광고 랜딩 · 공개 페이지 — Supabase 완전 격리 (어떤 외부 장애도 영향 없음)
  const PUBLIC_PATHS = ['/', '/join', '/actors']
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // 환경변수 미설정 시 (preview 등) 미들웨어 스킵
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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

  // 세션 갱신 — Supabase 429/네트워크 에러 시 그냥 통과 (무한 리다이렉트 방지)
  try {
    await supabase.auth.getUser()
  } catch {
    return NextResponse.next()
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * /auth/callback, /api/* 등 정적 파일 제외한 모든 경로에서 세션 갱신
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf|otf|eot|css|js|map|json|webmanifest|ico)$).*)',
  ],
}
