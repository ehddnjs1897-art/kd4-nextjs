import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '글 수정',
  description: 'KD4 커뮤니티 — 게시글 수정',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ id: string }>; children: React.ReactNode }

export default async function EditLayout({ params, children }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/board/${id}/edit`)
  return <>{children}</>
}
