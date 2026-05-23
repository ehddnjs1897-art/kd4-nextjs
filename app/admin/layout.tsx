/**
 * Admin segment layout — 공통 인증 가드
 * 모든 /admin/* 페이지는 이 레이아웃을 통과.
 * role=admin 미충족 시 여기서 일찍 redirect → 각 page.tsx의 중복 auth 제거 가능 (점진적 마이그레이션).
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// 관리자 세그먼트 전체 noindex — 신규 페이지 추가 시 자동 적용
export const metadata: Metadata = {
  description: 'KD4 액팅 스튜디오 관리자 패널',
  robots: { index: false, follow: false },
  openGraph: { siteName: 'KD4 액팅 스튜디오' },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return <>{children}</>
}
