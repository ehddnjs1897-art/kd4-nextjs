/**
 * 사이트 전역 상수
 * URL 등 여러 곳에서 반복되는 값은 여기서 중앙 관리
 */

export const SITE_URL = 'https://kd4.club'

/**
 * OAuth/이메일 인증 리다이렉트용 origin.
 *
 * ⚠️ NEXT_PUBLIC_SITE_URL 환경변수에 끝 개행(\n)·공백이 섞이면
 * `https://kd4.club\n/auth/callback` 같은 깨진 URL이 만들어져
 * 구글·카카오 로그인이 콜백으로 못 돌아온다 (2026-06-08 사고).
 * → 어떤 값이 와도 trim + 끝 슬래시 제거로 방어한다.
 *
 * 우선순위: env(정리) → 브라우저 origin(dev/preview) → SITE_URL(서버 폴백)
 */
export function getRedirectOrigin(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? '')
    .trim()
    .replace(/\s+/g, '')      // 중간/끝 공백·개행 전부 제거
    .replace(/\/+$/, '')      // 끝 슬래시 제거
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') return window.location.origin
  return SITE_URL
}
