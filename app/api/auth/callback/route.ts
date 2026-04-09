/**
 * GET /api/auth/callback
 *
 * Supabase Auth OAuth / Magic Link 콜백 핸들러.
 * Supabase 대시보드의 Redirect URL에 이 경로를 등록해야 함.
 * 예) https://kd4actingstudio.com/api/auth/callback
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 로그인 성공 후 이동할 경로 (기본값: 홈)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      console.error('[auth/callback] exchangeCodeForSession 오류:', error.message)
    } catch (err) {
      console.error('[auth/callback] 예상치 못한 오류:', err)
    }
  }

  // code 없음 or 교환 실패 → 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
