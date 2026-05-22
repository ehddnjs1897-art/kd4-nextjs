import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export const metadata: Metadata = {
  title: '프로필 등록 | KD4 액팅 스튜디오',
  robots: { index: false, follow: false }, // 비공개 온보딩
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/onboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.name || (user.user_metadata?.name as string | undefined) || ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
      <OnboardingForm userId={user.id} userName={name} />
    </div>
  )
}
