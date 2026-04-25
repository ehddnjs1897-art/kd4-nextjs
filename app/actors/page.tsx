import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

async function fetchActors(gender: string, ageGroup: string): Promise<{ actors: Actor[]; dbError: boolean }> {
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
    return { actors: [], dbError: true }
  }
  return { actors: (data ?? []) as Actor[], dbError: false }
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

export default async function ActorsPage({ searchParams }: PageProps) {
  /* ---- 데이터 fetch ---- */
  const params = await searchParams
  const gender = params.gender ?? 'all'
  const ageGroup = params.ageGroup ?? 'all'
  const { actors, dbError } = await fetchActors(gender, ageGroup)

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams()
    if (key !== 'gender') next.set('gender', gender)
    if (key !== 'ageGroup') next.set('ageGroup', ageGroup)
    next.set(key, value)
    return `/actors?${next.toString()}`
  }

  return (
    <div style={styles.page}>
      <style>{`
        @media (max-width: 640px) {
          .actors-grid { grid-template-columns: 1fr !important; }
          .actor-card:hover { transform: none !important; }
        }
        .actor-card:hover {
          border-color: rgba(196,165,90,0.5) !important;
          transform: translateY(-2px);
        }
      `}</style>
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
        <p style={styles.resultCount}>{dbError ? '—' : `총 ${actors.length}명`}</p>

        {/* 배우 그리드 */}
        {dbError ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>데이터베이스 연결 오류가 발생했습니다.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '8px' }}>
              잠시 후 다시 시도해 주세요.
            </p>
          </div>
        ) : actors.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>해당 조건의 배우가 없습니다.</p>
            <Link href="/actors" style={styles.resetLink}>필터 초기화</Link>
          </div>
        ) : (
          <div style={styles.grid} className="actors-grid">
            {actors.map((actor) => (
              <Link key={actor.id} href={`/actors/${actor.id}`} style={styles.card} className="actor-card">
                <div style={styles.imageWrap}>
                  <Image
                    src={thumbnailUrl(actor.drive_photo_id)}
                    alt={actor.name}
                    fill
                    sizes="(max-width:640px) 100vw, 50vw"
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
    color: '#ffffff',
    border: '1px solid var(--gold)',
    fontWeight: 700,
  },
  resultCount: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  card: {
    display: 'block',
    textDecoration: 'none',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    transition: 'border-color 0.2s, transform 0.2s',
    aspectRatio: '3/2',
    position: 'relative',
    background: 'var(--bg3)',
  },
  imageWrap: {
    position: 'absolute',
    inset: 0,
    background: 'var(--bg3)',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '40px 18px 16px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--white)',
    letterSpacing: '0.04em',
  },
  cardMeta: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.65)',
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
