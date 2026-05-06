/**
 * 관리자 대시보드 (서버 컴포넌트)
 * - 로그인 + role=admin 체크
 * - 회원 관리 / 배우 목록 / 게시판 관리 / 수강신청 목록
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import AdminDashboard from './AdminDashboard'

// ─── 타입 ────────────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string
  name: string | null
  email: string | null
  role: string
  created_at: string
  actor_id: string | null
}

export interface AdminActor {
  id: string
  name: string
  gender: string | null
  age_group: string | null
  is_public: boolean
}

export interface AdminPost {
  id: string
  title: string
  author_name: string | null
  created_at: string
  category: string | null
}

export interface AdminApplication {
  id: string
  name: string
  email: string
  phone: string | null
  class_name: string | null
  status: string
  created_at: string
}

// ─── 데이터 fetch 함수들 ─────────────────────────────────────────────────────

async function fetchProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role, created_at, actor_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin] profiles fetch 오류:', error.message)
    return []
  }
  return (data ?? []) as AdminProfile[]
}

async function fetchActors(): Promise<AdminActor[]> {
  const { data, error } = await supabaseAdmin
    .from('actors')
    .select('id, name, gender, age_group, is_public')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin] actors fetch 오류:', error.message)
    return []
  }
  return (data ?? []) as AdminActor[]
}

async function fetchRecentPosts(): Promise<AdminPost[]> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, author_name, created_at, category')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[admin] posts fetch 오류:', error.message)
    return []
  }
  return (data ?? []) as AdminPost[]
}

async function fetchApplications(): Promise<AdminApplication[]> {
  // /join · /contact 등 광고 랜딩에서 들어오는 상담 신청은 consultations 테이블에 누적됨
  // (applications 테이블은 회원가입·일반 신청용, 별도)
  const { data, error } = await supabaseAdmin
    .from('consultations')
    .select('id, name, email, phone, class_name, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin] consultations fetch 오류:', error.message)
    return []
  }
  return (data ?? []) as AdminApplication[]
}

// ─── 페이지 ──────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  // 로그인 확인
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // role 확인
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/')
  }

  // 데이터 병렬 fetch
  const [profiles, actors, posts, applications] = await Promise.all([
    fetchProfiles(),
    fetchActors(),
    fetchRecentPosts(),
    fetchApplications(),
  ])

  return (
    <AdminDashboard
      profiles={profiles}
      actors={actors}
      posts={posts}
      applications={applications}
    />
  )
}
