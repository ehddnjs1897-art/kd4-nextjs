import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // .trim() — env 값 끝 개행/공백 방어 (2026-06-08 OAuth 사고)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) throw new Error('Supabase client env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set')

  return createServerClient(
    url,
    key,
    {
      // 쿠키 보안: secure + sameSite 유지. httpOnly는 설정하지 않음(기본 false) —
      // createBrowserClient(브라우저)가 document.cookie로 세션을 읽어야 로그인이 유지됨.
      // httpOnly:true면 서버만 인식하고 클라이언트(Navbar 등)는 영구 비로그인 처리되어
      // "로그인했는데 로그인 버튼이 계속 뜨는" 증상 발생 (2026-06-18 수정).
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 쿠키 설정 불가 — 무시
          }
        },
      },
    }
  )
}
