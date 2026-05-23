/**
 * /admin/users — 회원 관리 전용 페이지 (admin 전용)
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import UsersManagementTable from './UsersManagementTable'

export const metadata = {
  title: '회원 관리 — KD4 Admin',
  robots: { index: false, follow: false },
}

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: string
  created_at: string
  actor_id: string | null
}

async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role, created_at, actor_id')
    .order('created_at', { ascending: false })
    .limit(500)  // 전체 테이블 dump 방지 — 500명 이상 시 /api/admin/users 페이지네이션 사용
  if (error) {
    console.error('[admin/users] profiles 조회 오류:', error.message)
    return []
  }
  return (data ?? []) as Profile[]
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/users')

  // 권한 확인 + 전체 profiles 병렬 조회
  const [{ data: myProfile }, profiles] = await Promise.all([
    supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    fetchProfiles(),
  ])
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <Link href="/admin" style={{ fontSize: '0.82rem', color: 'var(--gray)', textDecoration: 'none' }}>
              ← 관리자 홈
            </Link>
          </div>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            ADMIN
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--white)' }}>
            회원 관리
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: 6 }}>
            총 {profiles.length}명 · 역할 클릭으로 순환 변경
          </p>
        </div>

        <UsersManagementTable profiles={profiles} />
      </div>
    </div>
  )
}
