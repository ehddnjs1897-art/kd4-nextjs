/**
 * Auth segment layout — 모든 /auth/* 페이지에 robots: noindex 적용.
 * 로그인/회원가입/비밀번호 재설정 페이지는 검색엔진에 노출될 필요 없음.
 */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
