/**
 * /admin/users — 회원 관리 전용 페이지 (admin 전용)
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import UsersManagementTable from './UsersManagementTable'

export const metadata: Metadata = {
  title: '회원 관리',
  description: 'KD4 회원 관리 (관리자 전용)',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: string
  created_at: string
  actor_id: string | null
  /** 디렉터 신청자가 직접 적은 소속·용도 (auth user_metadata) — 승인 판단용 */
  affiliation?: string | null
  purpose?: string | null
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
  const rows = (data ?? []) as Profile[]
  // 디렉터 관련 역할만 auth 메타데이터를 붙인다 (대상이 소수라 개별 조회로 충분)
  const targets = rows.filter((r) => ['director_pending', 'director', 'member'].includes(r.role))
  await Promise.all(targets.map(async (r) => {
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.id)
      const m = (u?.user?.user_metadata ?? {}) as Record<string, unknown>
      r.affiliation = typeof m.affiliation === 'string' ? m.affiliation : null
      r.purpose = typeof m.purpose === 'string' ? m.purpose : null
    } catch { /* 메타 조회 실패는 표시만 생략 */ }
  }))
  return rows
}

export default async function AdminUsersPage() {
  // auth/role은 app/admin/layout.tsx에서 처리
  const profiles = await fetchProfiles()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <Link href="/admin" style={{ fontSize: '0.82rem', color: 'var(--gray)', textDecoration: 'none' }}>
              <span aria-hidden="true">← </span>관리자 홈
            </Link>
          </div>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
            <span lang="en">ADMIN</span>
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
