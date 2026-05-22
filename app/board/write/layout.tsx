import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '글 쓰기 — KD4 커뮤니티',
  robots: { index: false, follow: false },
}

export default async function BoardWriteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/board/write')
  return <>{children}</>
}
