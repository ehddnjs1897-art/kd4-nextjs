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
import { matchActorOnSignup, ensureProfileRow } from '@/lib/actor-matching'

export const metadata: Metadata = {
  title: '프로필 편집',
  robots: { index: false, follow: false },
}

interface Profile {
  role: UserRole
  actor_id: string | null
  name: string | null
  phone: string | null
}

interface ActorRow {
  height: number | null
  weight: number | null
  birth_year: number | null
  skills: string[] | null   // DB 타입: text[] — string | null 이었던 오류 수정
  advanced_skills: string[] | null  // ⭐ 고급 숙련도 (2026-05-29 추가)
  dialects: string[] | null  // 사투리 가능 지역 (2026-06-08 추가)
  preferred_casting_types?: string[] | null  // 오디션 알림 관심분야 (2026-07-09 추가 — 별도 안전 조회로 병합)
  school: string | null  // 학교 (2026-07-02 추가 — 별도 안전 조회로 병합)
  major: string | null   // 전공 (2026-07-02 추가 — 별도 안전 조회로 병합)
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
  photo_type: string | null   // 'current'(전신 각도) 또는 null/'profile'
  label: string | null        // 현재사진일 때 정면/좌측/우측/후면/전신
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
  broadcaster: string | null
  film_type: string | null
  award: string | null
  is_featured?: boolean | null
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
  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .select('role, actor_id, name, phone')
    .eq('id', user.id)
    .maybeSingle()

  if (profileErr) {
    redirect('/dashboard')
  }

  // profiles 행 자체가 없는 경우 즉석 복구 (2026-07-10, 육군길 케이스 — on-signup 호출 유실)
  let profile: Profile | null = profileRow
  if (!profile) {
    const healed = await ensureProfileRow(user)
    if (healed) {
      profile = { role: healed.role as UserRole, actor_id: healed.actor_id, name: healed.name, phone: healed.phone }
    } else {
      console.error('[dashboard/edit] 프로필 행 자가복구 실패 — user.id:', user.id)
      redirect('/dashboard')
    }
  }

  const { role } = profile as Profile
  let actor_id = (profile as Profile).actor_id

  if (role !== 'editor' && role !== 'admin' && role !== 'member' && role !== 'actor') {
    redirect('/dashboard')
  }

  // ── actor_id 없으면, 기존 배우 레코드(이름·전화 일치) 자동 재연결 시도 ──────────
  //    /dashboard 와 동일한 자가복구. 링크만 끊긴 멤버를 새 레코드로 '중복 생성'하지
  //    않도록, 온보딩 폼을 띄우기 전에 먼저 기존 레코드를 찾아 연결한다.
  if (!actor_id) {
    try {
      const healed = await matchActorOnSignup(user.id, (profile as Profile).name ?? '', (profile as Profile).phone ?? '')
      if (healed.matched && healed.actorId) actor_id = healed.actorId
    } catch (e) {
      console.error('[dashboard/edit] 자가 복구 매칭 오류:', e instanceof Error ? e.message : String(e))
    }
  }

  // ── 그래도 actor_id 없으면 온보딩 폼 표시 (자료 올리기) ───────────────────────
  if (!actor_id) {
    const userName = (profile as Profile).name || user.user_metadata?.name || ''

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
      .select('height, weight, birth_year, skills, advanced_skills, dialects, instagram, casting_summary, profile_doc_path')
      .eq('id', actor_id)
      .maybeSingle()
      .then(async (r) => {
        // 신규 컬럼(advanced_skills/dialects) 미존재(42703) — 마이그레이션 미실행 시 단계적 fallback
        if (r.error && r.error.code === '42703') {
          // 1) dialects만 제외 (advanced_skills는 존재할 수 있음)
          const f1 = await supabaseAdmin
            .from('actors')
            .select('height, weight, birth_year, skills, advanced_skills, instagram, casting_summary, profile_doc_path')
            .eq('id', actor_id)
            .maybeSingle()
          if (!f1.error && f1.data) return { data: { ...f1.data, dialects: null }, error: null }
          // 2) 둘 다 제외
          const f2 = await supabaseAdmin
            .from('actors')
            .select('height, weight, birth_year, skills, instagram, casting_summary, profile_doc_path')
            .eq('id', actor_id)
            .maybeSingle()
          if (f2.data) return { data: { ...f2.data, advanced_skills: null, dialects: null }, error: null }
          return f2
        }
        return r
      }),
    supabaseAdmin
      .from('actor_photos')
      .select('id, url, is_profile, storage_path, photo_type, label')
      .eq('actor_id', actor_id)
      .order('is_profile', { ascending: false }),
    supabaseAdmin
      .from('actor_videos')
      .select('id, youtube_id, title')
      .eq('actor_id', actor_id)
      .not('youtube_id', 'is', null)
      // actor_videos에 created_at 컬럼 없음(42703) → 쿼리 전체 실패로 영상이 빈 목록으로 보이던 버그
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('actor_filmography')
      // broadcaster/film_type 미조회 시 저장할 때 null로 덮어써져 기존 방송사 데이터 소실
      // is_featured(대표출연작)는 신규 컬럼 — 미존재(42703) 시 아래에서 제외하고 재조회
      .select('id, category, year, title, role, broadcaster, film_type, award, is_featured')
      .eq('actor_id', actor_id)
      .order('year', { ascending: false }),
    supabaseAdmin
      .from('actor_videos')
      .select('id, r2_key, title, video_type')
      .eq('actor_id', actor_id)
      .not('r2_key', 'is', null)
      .order('sort_order', { ascending: true }),
  ])

  // actorRes.data가 null이면 orphaned actor_id — 빈 초기값으로 폼 표시 (덮어쓰기 방지)
  // actorRes.error이면 DB 오류 → error boundary로 전달 (빈 값 덮어쓰기 방지)
  if (actorRes.error) {
    console.error('[dashboard/edit] actor 조회 오류:', actorRes.error)
    throw new Error(`배우 정보를 불러오지 못했습니다: ${actorRes.error.message}`)
  }
  const actor = (actorRes.data ?? {}) as ActorRow
  // school/major(학교·전공) — 신규 컬럼. 위 actorRes select 문자열에 합치면 컬럼 미존재 시
  // 전체 조회가 깨지므로(단일 select 문자열) 별도 안전 조회로 분리해 병합한다.
  try {
    const sq = await supabaseAdmin.from('actors').select('school, major').eq('id', actor_id).maybeSingle()
    const row = sq.data as { school?: unknown; major?: unknown } | null
    if (!sq.error && row) {
      if (typeof row.school === 'string') actor.school = row.school
      if (typeof row.major === 'string') actor.major = row.major
    }
  } catch { /* 컬럼 미존재 등 — 무시 */ }
  // preferred_casting_types(오디션 알림 관심분야) — 신규 컬럼, 마이그레이션 전 미존재 가능 → 동일 안전 조회 패턴
  try {
    const pq = await supabaseAdmin.from('actors').select('preferred_casting_types').eq('id', actor_id).maybeSingle()
    const row = pq.data as { preferred_casting_types?: unknown } | null
    if (!pq.error && row && Array.isArray(row.preferred_casting_types)) {
      actor.preferred_casting_types = row.preferred_casting_types as string[]
    }
  } catch { /* 컬럼 미존재 등 — 무시 */ }
  const allPhotos = (photosRes.data ?? []) as PhotoRow[]
  // 프로필 사진(일반)과 현재사진(전신 각도, photo_type='current')을 분리해 폼에 전달
  const photos = allPhotos.filter((p) => p.photo_type !== 'current')
  const currentPhotosRows = allPhotos.filter((p) => p.photo_type === 'current')
  const videos = (videosRes.data ?? []) as VideoRow[]
  let filmography = (filmRes.data ?? []) as FilmRow[]
  // is_featured 컬럼 미존재(42703) 등으로 조회 실패 시 → 해당 컬럼 제외하고 재조회 (마이그레이션 전 안전)
  if (filmRes.error) {
    const retry = await supabaseAdmin
      .from('actor_filmography')
      .select('id, category, year, title, role, broadcaster, film_type, award')
      .eq('actor_id', actor_id)
      .order('year', { ascending: false })
    filmography = (retry.data ?? []) as FilmRow[]
  }
  const r2Videos = (r2VideosRes.data ?? []) as R2VideoRow[]

  const initialData = {
    height: actor.height ?? undefined,
    weight: actor.weight ?? undefined,
    birthYear: actor.birth_year ?? undefined,
    skills: actor.skills?.join(', ') ?? undefined,  // text[] → 쉼표 구분 문자열 (폼 표시용)
    dialects: actor.dialects ?? undefined,  // text[] 그대로 (멀티선택)
    preferredCastingTypes: actor.preferred_casting_types ?? undefined,
    school: actor.school ?? undefined,
    major: actor.major ?? undefined,
    instagram: actor.instagram ?? undefined,
    castingSummary: actor.casting_summary ?? undefined,
    profileDocPath: actor.profile_doc_path ?? null,
    photos: photos.map((p) => ({
      id: p.id,
      url: p.url,
      is_profile: p.is_profile ?? false,
    })),
    currentPhotos: currentPhotosRows.map((p) => ({
      id: p.id,
      url: p.url,
      label: p.label ?? '',
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
      category: f.category ?? 'drama', // select option value는 영문 — '드라마' fallback은 불일치
      year: f.year ?? new Date().getFullYear(),
      title: f.title,
      role: f.role ?? '',
      broadcaster: f.broadcaster ?? undefined,
      film_type: f.film_type ?? undefined,
      award: f.award ?? undefined,
      is_featured: f.is_featured ?? false,
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
