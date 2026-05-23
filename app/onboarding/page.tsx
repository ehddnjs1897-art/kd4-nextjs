import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '온보딩',
  description: 'KD4 멤버 온보딩 — 프로필 초기 설정',
  robots: { index: false, follow: false },
}

/**
 * /onboarding → /dashboard/edit 로 통합됨
 */
export default function OnboardingPage() {
  redirect('/dashboard/edit')
}
