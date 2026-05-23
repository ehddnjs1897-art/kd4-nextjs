import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * /onboarding → /dashboard/edit 로 통합됨
 */
export default function OnboardingPage() {
  redirect('/dashboard/edit')
}
