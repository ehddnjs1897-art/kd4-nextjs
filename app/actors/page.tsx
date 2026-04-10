import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type UserRole = 'user' | 'actor' | 'editor' | 'director' | 'admin'

interface Actor {
  id: string
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  drive_photo_id: string | null
}

type GenderFilter = 'all' | '남' | '여'
type AgeFilter = 'all' | '20대' | '30대' | '40대' | '50대 이상'

interface PageProps {
  searchParams: Promise<{
    gender?: string
    ageGroup?: string
  }>
}

async function fetchActors(gender: string, ageGroup: string): Promise<Actor[]> {
  let query = supabaseAdmin
    .from('actors')
    .select('id, name, gender, age_group, drive_photo_id')
    .eq('is_public', true)
    .order('age_group', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (gender && gender !== 'all') {
    query = query.eq('gender', gender)
  }
  if (ageGroup && ageGroup !== 'all') {
    query = query.eq('age_group', ageGroup)
  }

  const { data, error } = await query
  if (error) {
    console.error('[ActorsPage] Supabase 오류:', error.message)
    return []
  }
  return (data ?? []) as Actor[]
}

function thumbnailUrl(drivePhotoId: string | null): string {
  if (!drivePhotoId) return '/placeholder-actor.svg'
  return `https://drive.google.com/thumbnail?id=${drivePhotoId}&sz=w600`
}

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '남', label: '남' },
  { value: '여', label: '여' },
]

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '20대', label: '20대' },
  { value: '30대', label: '30대' },
  { value: '40대', label: '40대' },
  { value: '50대 이상', label: '50대+' },
]

/** 배우DB 열람 가능 여부 (배우 회원 이상) */
function canViewActorDb(role: UserRole | null): boolean {
  return role === 'editor' || role === 'director' || role === 'admin'
  // actor(미승인 배우) / user(구형) 는 열람 불가
}

/** 연락처 등 전체 정보 열람 (디렉터/관리자만) */
function isDirectorOrAdmin(role: UserRole | null): boolean {
  return role === 'director' || role === 'admin'
}

export default async function ActorsPage({ searchParams }: PageProps) {
  /* ---- 인증 확인 ---- */
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 비로그인 → 로그인 페이지로
  if (!user) {
    redirect('/auth/login?next=/actors')
  }

  // 역할 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'actor') as UserRole

  // 배우 회원 / 일반 회원 → 접근 불가 안내
  if (!canViewActorDb(role)) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.deniedBox}>
            <p style={styles.deniedIcon}>🔒</p>
            <h1 style={styles.deniedTitle}>열람 권한 없음</h1>
            <p style={styles.deniedDesc}>
              배우 DB는 KD4 소속 배우 또는<br />
              <strong style={{ color: 'var(--gold)' }}>디렉터 회원</strong>만 열람할 수 있습니다.
            </p>
            <div style={styles.deniedBtns}>
              <Link href="/auth/signup" style={styles.btnPrimary}>
                디렉터 회원으로 가입
              </Link>
              <Link href="/" style={styles.btnSecondary}>
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ---- 데이터 fetch (디렉터/관리자만 여기 도달) ---- */
  const params = await searchParams
  const gender = params.gender ?? 'all'
  const ageGroup = params.ageGroup ?? 'all'
  const actors = await fetchActors(gender, ageGroup)

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams()
    if (key !== 'gender') next.set('gender', gender)
    if (key !== 'ageGroup') next.set('ageGroup', ageGroup)
    next.set(key, value)
    return `/actors?${next.toString()}`
  }

  return (
    <div style={styles.page}>
      <div className="container">
        {/* 페이지 헤더 */}
        <div style={styles.header}>
          <p style={styles.eyebrow}>ACTOR ROSTER</p>
          <h1 style={styles.pageTitle}>배우 DB</h1>
          <p style={styles.subtitle}>KD4 액팅 스튜디오 배우들을 만나보세요.</p>
        </div>

        {/* 필터바 */}
        <div style={styles.filterSection}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>성별</span>
            <div style={styles.filterBtnGroup}>
              {GENDER_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={filterHref('gender', opt.value)}
                  style={{
                    ...styles.filterBtn,
                    ...(gender === opt.value ? styles.filterBtnActive : {}),
                  }}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>연령대</span>
            <div style={styles.filterBtnGroup}>
              {AGE_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={filterHref('ageGroup', opt.value)}
                  style={{
                    ...styles.filterBtn,
                    ...(ageGroup === opt.value ? styles.filterBtnActive : {}),
                  }}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 수 */}
        <p style={styles.resultCount}>총 {actors.length}명</p>

        {/* 배우 그리드 */}
        {actors.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>해당 조건의 배우가 없습니다.</p>
            <Link href="/actors" style={styles.resetLink}>필터 초기화</Link>
          </div>
        ) : (
          <div style={styles.grid}>
            {actors.map((actor) => (
              <Link key={actor.id} href={`/actors/${actor.id}`} style={styles.card}>
                <div style={styles.imageWrap}>
                  <Image
                    src={thumbnailUrl(actor.drive_photo_id)}
                    alt={actor.name}
                    fill
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover', objectPosition: 'center top' }}
                    unoptimized={!!actor.drive_photo_id}
                  />
                  <div style={styles.cardOverlay}>
                    <span style={styles.cardName}>{actor.name}</span>
                    <span style={styles.cardMeta}>
                      {actor.gender ?? ''}{actor.gender && actor.age_group ? ' · ' : ''}{actor.age_group ?? ''}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 80,
    paddingBottom: 80,
  },
  /* ---- 접근 불가 ---- */
  deniedBox: {
    maxWidth: 480,
    margin: '80px auto',
    textAlign: 'center',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '60px 40px',
  },
  deniedIcon: {
    fontSize: '2.8rem',
    marginBottom: 16,
  },
  deniedTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: 16,
  },
  deniedDesc: {
    fontSize: '0.95rem',
    color: 'var(--gray)',
    lineHeight: 1.8,
    marginBottom: 12,
  },
  deniedSub: {
    fontSize: '0.82rem',
    color: 'var(--gray)',
    marginBottom: 28,
  },
  deniedLink: {
    color: 'var(--gold)',
    textDecoration: 'underline',
  },
  deniedBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
  },
  btnPrimary: {
    display: 'block',
    background: 'var(--gold)',
    color: '#0a0a0a',
    borderRadius: 6,
    padding: '12px 0',
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  btnSecondary: {
    display: 'block',
    border: '1px solid var(--border)',
    color: 'var(--gray)',
    borderRadius: 6,
    padding: '11px 0',
    fontSize: '0.88rem',
    textDecoration: 'none',
  },
  /* ---- 목록 ---- */
  header: {
    textAlign: 'center',
    marginBottom: 48,
  },
  eyebrow: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gold)',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--gray)',
  },
  filterSection: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 16,
    marginBottom: 20,
    padding: '16px 20px',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  filterLabel: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  filterBtnGroup: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: '0.82rem',
    color: 'var(--gray)',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    transition: 'all 0.2s',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },
  filterBtnActive: {
    background: 'var(--gold)',
    color: '#0a0a0a',
    border: '1px solid var(--gold)',
    fontWeight: 600,
  },
  resultCount: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  card: {
    display: 'block',
    textDecoration: 'none',
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    transition: 'transform 0.25s, border-color 0.25s',
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: '16/9',
    overflow: 'hidden',
    background: 'var(--bg3)',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '32px 14px 14px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  cardName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--white)',
    letterSpacing: '0.03em',
  },
  cardMeta: {
    fontSize: '0.72rem',
    color: 'rgba(240,240,240,0.7)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 0',
  },
  emptyText: {
    fontSize: '0.95rem',
    color: 'var(--gray)',
    marginBottom: 16,
  },
  resetLink: {
    display: 'inline-block',
    padding: '8px 20px',
    border: '1px solid var(--gold)',
    borderRadius: 4,
    color: 'var(--gold)',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
}
