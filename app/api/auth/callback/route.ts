/**
 * GET /api/auth/callback
 *
 * Supabase Auth OAuth / Magic Link 콜백 핸들러.
 * Supabase 대시보드의 Redirect URL에 이 경로를 등록해야 함.
 * 예) https://kd4actingstudio.com/api/auth/callback
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = SITE_URL  // Host-header 스푸핑 방지: SITE_URL 고정
  const code = searchParams.get('code')
  // 로그인 성공 후 이동할 경로 — 오픈 리다이렉트 방지: '/'로 시작하고 '//evil.com' 형식 아닌 것만 허용
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  // OAuth 공급자가 에러를 돌려준 경우 (access_denied, mismatched_state 등)
  const oauthError = searchParams.get('error')
  if (oauthError) {
    const desc = searchParams.get('error_description') ?? oauthError
    console.error('[auth/callback] OAuth 오류:', oauthError, desc)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(oauthError)}`,
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`, { headers: { 'Cache-Control': 'no-store' } })
      }

      console.error('[auth/callback] exchangeCodeForSession 오류:', error.message)
    } catch (err) {
      console.error('[auth/callback] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    }
  }

  // code 없음 or 교환 실패 → 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`, { headers: { 'Cache-Control': 'no-store' } })
}
