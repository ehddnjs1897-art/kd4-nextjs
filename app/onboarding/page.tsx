import { redirect } from 'next/navigation'

/**
 * /onboarding → /dashboard/edit 로 통합됨
 */
export default function OnboardingPage() {
  redirect('/dashboard/edit')
}
