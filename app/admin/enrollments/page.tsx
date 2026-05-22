import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import AdminEnrollments from '@/components/admin/AdminEnrollments'

export const metadata = { title: '수강 현황 (관리자) | KD4', robots: { index: false, follow: false } }

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 권한 확인 + 데이터 병렬 조회
  const [{ data: profile }, enrollRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabaseAdmin
      .from('enrollments')
      .select('id, name, phone, class_name, year_month, amount, status, payment_status, created_at')
      .order('year_month', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (!profile || profile.role !== 'admin') redirect('/')

  if (enrollRes.error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
        <div className="container">
          <p role="alert" style={{ color: 'var(--gray)', fontSize: '0.95rem', marginTop: '40px' }}>
            수강 데이터를 불러오지 못했습니다. 새로고침 해주세요.
          </p>
        </div>
      </div>
    )
  }

  return <AdminEnrollments enrollments={enrollRes.data ?? []} />
}
