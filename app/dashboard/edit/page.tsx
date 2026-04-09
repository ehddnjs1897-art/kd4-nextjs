/**
 * /dashboard/edit — 배우 갤러리 편집 페이지 (서버 컴포넌트)
 *
 * - role: editor 또는 admin 만 접근 가능
 * - actor_id 없으면 안내 메시지
 * - 실제 편집 UI는 GalleryEditForm(클라이언트) 위임
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import GalleryEditForm from '@/components/dashboard/GalleryEditForm'

type UserRole = 'user' | 'editor' | 'admin'

interface Profile {
  role: UserRole
  actor_id: string | null
}

interface ActorRow {
  height: number | null
  weight: number | null
  skills: string | null
  instagram: string | null
}

interface PhotoRow {
  id: string
  url: string
  is_profile: boolean
  storage_path: string | null
}

interface VideoRow {
  id: string
  youtube_id: string
  title: string | null
}

interface FilmRow {
  id: string
  category: string | null
  year: number | null
  title: string
  role: string | null
}

export default async function GalleryEditPage() {
  const supabase = await createClient()

  // ── 인증 확인 ──────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    redirect('/auth/login')
  }

  // ── 프로필 · 역할 확인 ─────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, actor_id')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    redirect('/dashboard')
  }

  const { role, actor_id } = profile as Profile

  if (role !== 'editor' && role !== 'admin') {
    redirect('/dashboard')
  }

  // ── actor_id 미매칭 ────────────────────────────────────────────────────────
  if (!actor_id) {
    return (
      <div style={styles.page}>
        <div className="container">
          <header style={styles.header}>
            <p style={styles.eyebrow}>GALLERY EDIT</p>
            <h1 style={styles.pageTitle}>갤러리 편집</h1>
          </header>
          <div style={styles.notice}>
            <p style={styles.noticeTitle}>배우 DB와 매칭되지 않았습니다</p>
            <p style={styles.noticeDesc}>
              관리자에게 문의하여 계정을 배우 프로필과 연결해 주세요.
              <br />
              연결이 완료되면 갤러리 편집 기능을 이용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── 초기 데이터 로드 ───────────────────────────────────────────────────────
  const [actorRes, photosRes, videosRes, filmRes] = await Promise.all([
    supabaseAdmin
      .from('actors')
      .select('height, weight, skills, instagram')
      .eq('id', actor_id)
      .single(),
    supabaseAdmin
      .from('actor_photos')
      .select('id, url, is_profile, storage_path')
      .eq('actor_id', actor_id)
      .order('is_profile', { ascending: false }),
    supabaseAdmin
      .from('actor_videos')
      .select('id, youtube_id, title')
      .eq('actor_id', actor_id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('actor_filmography')
      .select('id, category, year, title, role')
      .eq('actor_id', actor_id)
      .order('year', { ascending: false }),
  ])

  const actor = (actorRes.data ?? {}) as ActorRow
  const photos = (photosRes.data ?? []) as PhotoRow[]
  const videos = (videosRes.data ?? []) as VideoRow[]
  const filmography = (filmRes.data ?? []) as FilmRow[]

  const initialData = {
    height: actor.height ?? undefined,
    weight: actor.weight ?? undefined,
    skills: actor.skills ?? undefined,
    instagram: actor.instagram ?? undefined,
    photos: photos.map((p) => ({
      id: p.id,
      url: p.url,
      is_profile: p.is_profile ?? false,
    })),
    videos: videos.map((v) => ({
      id: v.id,
      youtube_id: v.youtube_id,
      title: v.title ?? '',
    })),
    filmography: filmography.map((f) => ({
      id: f.id,
      category: f.category ?? '드라마',
      year: f.year ?? new Date().getFullYear(),
      title: f.title,
      role: f.role ?? '',
    })),
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <header style={styles.header}>
          <p style={styles.eyebrow}>GALLERY EDIT</p>
          <h1 style={styles.pageTitle}>갤러리 편집</h1>
          <p style={styles.subtitle}>내 배우 프로필을 직접 관리하세요.</p>
        </header>

        <GalleryEditForm actorId={actor_id} initialData={initialData} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 80,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 48,
  },
  eyebrow: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gold)',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--gray)',
  },
  notice: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '40px 36px',
    maxWidth: 520,
  },
  noticeTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--white)',
    marginBottom: 14,
  },
  noticeDesc: {
    fontSize: '0.88rem',
    color: 'var(--gray)',
    lineHeight: 1.8,
  },
}
