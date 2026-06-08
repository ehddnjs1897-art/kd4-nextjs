/**
 * /dashboard/edit — 배우 갤러리 편집 페이지 (서버 컴포넌트)
 *
 * - role: member/actor/editor/admin 접근 가능 (본인 프로필만)
 * - actor_id 없으면 안내 메시지
 * - 실제 편집 UI는 GalleryEditForm(클라이언트) 위임
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import GalleryEditForm from '@/components/dashboard/GalleryEditForm'
import OnboardingForm from '@/components/onboarding/OnboardingForm'
import { UserRole } from '@/lib/types'

export const metadata: Metadata = {
  title: '프로필 편집',
  robots: { index: false, follow: false },
}

interface Profile {
  role: UserRole
  actor_id: string | null
}

interface ActorRow {
  height: number | null
  weight: number | null
  skills: string[] | null   // DB 타입: text[] — string | null 이었던 오류 수정
  advanced_skills: string[] | null  // ⭐ 고급 숙련도 (2026-05-29 추가)
  dialects: string[] | null  // 사투리 가능 지역 (2026-06-08 추가)
  instagram: string | null
  casting_summary: string | null
  profile_doc_path: string | null
}

interface R2VideoRow {
  id: string
  r2_key: string
  title: string | null
  video_type: string | null
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
    redirect('/auth/login?next=/dashboard/edit')
  }

  // ── 프로필 · 역할 확인 ─────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, actor_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileErr || !profile) {
    redirect('/dashboard')
  }

  const { role, actor_id } = profile as Profile

  if (role !== 'editor' && role !== 'admin' && role !== 'member' && role !== 'actor') {
    redirect('/dashboard')
  }

  // ── actor_id 없으면 온보딩 폼 표시 ────────────────────────────────────────
  if (!actor_id) {
    const { data: profileData } = await supabaseAdmin
      .from('profiles').select('name').eq('id', user.id).maybeSingle()
    const userName = profileData?.name || user.user_metadata?.name || ''

    return (
      <div style={styles.page}>
        <div className="container">
          <header style={styles.header}>
            <p style={styles.eyebrow}><span lang="en">PROFILE SETUP</span></p>
            <h1 style={styles.pageTitle}>프로필 등록</h1>
            <p style={styles.subtitle}>
              자료를 올려 주세요. 검토 후 배우 DB에 공개됩니다.
            </p>
          </header>
          <OnboardingForm userId={user.id} userName={userName} />
        </div>
      </div>
    )
  }

  // ── 초기 데이터 로드 ───────────────────────────────────────────────────────
  const [actorRes, photosRes, videosRes, filmRes, r2VideosRes] = await Promise.all([
    supabaseAdmin
      .from('actors')
      .select('height, weight, skills, advanced_skills, dialects, instagram, casting_summary, profile_doc_path')
      .eq('id', actor_id)
      .maybeSingle()
      .then(async (r) => {
        // 신규 컬럼(advanced_skills/dialects) 미존재(42703) — 마이그레이션 미실행 시 단계적 fallback
        if (r.error && r.error.code === '42703') {
          // 1) dialects만 제외 (advanced_skills는 존재할 수 있음)
          const f1 = await supabaseAdmin
            .from('actors')
            .select('height, weight, skills, advanced_skills, instagram, casting_summary, profile_doc_path')
            .eq('id', actor_id)
            .maybeSingle()
          if (!f1.error && f1.data) return { data: { ...f1.data, dialects: null }, error: null }
          // 2) 둘 다 제외
          const f2 = await supabaseAdmin
            .from('actors')
            .select('height, weight, skills, instagram, casting_summary, profile_doc_path')
            .eq('id', actor_id)
            .maybeSingle()
          if (f2.data) return { data: { ...f2.data, advanced_skills: null, dialects: null }, error: null }
          return f2
        }
        return r
      }),
    supabaseAdmin
      .from('actor_photos')
      .select('id, url, is_profile, storage_path')
      .eq('actor_id', actor_id)
      .order('is_profile', { ascending: false }),
    supabaseAdmin
      .from('actor_videos')
      .select('id, youtube_id, title')
      .eq('actor_id', actor_id)
      .not('youtube_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('actor_filmography')
      .select('id, category, year, title, role')
      .eq('actor_id', actor_id)
      .order('year', { ascending: false }),
    supabaseAdmin
      .from('actor_videos')
      .select('id, r2_key, title, video_type')
      .eq('actor_id', actor_id)
      .not('r2_key', 'is', null)
      .order('created_at', { ascending: false }),
  ])

  // actorRes.data가 null이면 orphaned actor_id — 빈 초기값으로 폼 표시 (덮어쓰기 방지)
  // actorRes.error이면 DB 오류 → error boundary로 전달 (빈 값 덮어쓰기 방지)
  if (actorRes.error) {
    console.error('[dashboard/edit] actor 조회 오류:', actorRes.error)
    throw new Error(`배우 정보를 불러오지 못했습니다: ${actorRes.error.message}`)
  }
  const actor = (actorRes.data ?? {}) as ActorRow
  const photos = (photosRes.data ?? []) as PhotoRow[]
  const videos = (videosRes.data ?? []) as VideoRow[]
  const filmography = (filmRes.data ?? []) as FilmRow[]
  const r2Videos = (r2VideosRes.data ?? []) as R2VideoRow[]

  const initialData = {
    height: actor.height ?? undefined,
    weight: actor.weight ?? undefined,
    skills: actor.skills?.join(', ') ?? undefined,  // text[] → 쉼표 구분 문자열 (폼 표시용)
    advancedSkills: actor.advanced_skills?.join(', ') ?? undefined,
    dialects: actor.dialects ?? undefined,  // text[] 그대로 (멀티선택)
    instagram: actor.instagram ?? undefined,
    castingSummary: actor.casting_summary ?? undefined,
    profileDocPath: actor.profile_doc_path ?? null,
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
    r2Videos: r2Videos.map((v) => ({
      id: v.id,
      r2_key: v.r2_key,
      title: v.title ?? '',
      video_type: v.video_type ?? 'reel',
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
          <p style={styles.eyebrow}><span lang="en">GALLERY EDIT</span></p>
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
}
