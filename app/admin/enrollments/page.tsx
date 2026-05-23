import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import AdminEnrollments from '@/components/admin/AdminEnrollments'

export const metadata: Metadata = {
  title: '수강 현황 (관리자)',
  description: 'KD4 수강 현황 (관리자 전용)',
  robots: { index: false, follow: false },
}

export default async function AdminEnrollmentsPage() {
  // auth/role은 app/admin/layout.tsx에서 처리

  const enrollRes = await supabaseAdmin
    .from('enrollments')
    .select('id, name, phone, class_name, year_month, amount, status, payment_status, created_at')
    .order('year_month', { ascending: false })
    .order('created_at', { ascending: false })

  if (enrollRes.error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
        <div className="container">
          <p role="status" style={{ color: 'var(--gray)', fontSize: '0.95rem', marginTop: '40px' }}>
            수강 데이터를 불러오지 못했습니다. 새로고침 해주세요.
          </p>
        </div>
      </div>
    )
  }

  return <AdminEnrollments enrollments={enrollRes.data ?? []} />
}
