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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data } = await supabaseAdmin
    .from('enrollments')
    .select('id, name, phone, class_name, year_month, amount, status, payment_status, created_at')
    .order('year_month', { ascending: false })
    .order('created_at', { ascending: false })

  return <AdminEnrollments enrollments={data ?? []} />
}
