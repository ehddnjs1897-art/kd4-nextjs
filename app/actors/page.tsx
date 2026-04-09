import Image from 'next/image'
import Link from 'next/link'

interface Actor {
  id: string
  name: string
  gender: 'M' | 'F'
  age_group: string
  drive_photo_id: string | null
}

interface ActorsResponse {
  actors: Actor[]
  total: number
}

type GenderFilter = 'all' | 'M' | 'F'
type AgeFilter = 'all' | '20' | '30' | '40' | '50+'

interface PageProps {
  searchParams: Promise<{
    gender?: string
    age?: string
  }>
}

async function fetchActors(gender: string, age: string): Promise<Actor[]> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

  const params = new URLSearchParams()
  if (gender && gender !== 'all') params.set('gender', gender)
  if (age && age !== 'all') params.set('age', age)

  try {
    const res = await fetch(`${base}/api/actors?${params.toString()}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data: ActorsResponse = await res.json()
    return data.actors ?? []
  } catch {
    return []
  }
}

function thumbnailUrl(drivePhotoId: string | null): string {
  if (!drivePhotoId) return '/placeholder-actor.jpg'
  return `https://drive.google.com/thumbnail?id=${drivePhotoId}&sz=w400`
}

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'M', label: '남' },
  { value: 'F', label: '여' },
]

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '20', label: '20대' },
  { value: '30', label: '30대' },
  { value: '40', label: '40대' },
  { value: '50+', label: '50대 이상' },
]

export default async function ActorsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const gender = params.gender ?? 'all'
  const age = params.age ?? 'all'
  const actors = await fetchActors(gender, age)

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams()
    if (key !== 'gender') next.set('gender', gender)
    if (key !== 'age') next.set('age', age)
    next.set(key, value)
    return `/actors?${next.toString()}`
  }

  return (
    <div style={styles.page}>
      <div className="container">
        {/* 페이지 헤더 */}
        <div style={styles.header}>
          <p style={styles.eyebrow}>ACTOR ROSTER</p>
          <h1 style={styles.pageTitle}>배우 목록</h1>
          <p style={styles.subtitle}>
            KD4 액팅 스튜디오 소속 배우들을 만나보세요.
          </p>
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
                  href={filterHref('age', opt.value)}
                  style={{
                    ...styles.filterBtn,
                    ...(age === opt.value ? styles.filterBtnActive : {}),
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
            <Link href="/actors" style={styles.resetLink}>
              필터 초기화
            </Link>
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
                    sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center top',
                    }}
                    unoptimized={!!actor.drive_photo_id}
                  />
                  <div style={styles.cardOverlay} />
                </div>
                <div style={styles.cardInfo}>
                  <span style={styles.cardName}>{actor.name}</span>
                  <span style={styles.cardMeta}>
                    {actor.gender === 'M' ? '남' : '여'} · {actor.age_group}
                  </span>
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
    gap: 20,
    marginBottom: 20,
    padding: '20px 24px',
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
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  filterBtnGroup: {
    display: 'flex',
    gap: 6,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  card: {
    display: 'block',
    textDecoration: 'none',
    borderRadius: 6,
    overflow: 'hidden',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    transition: 'transform 0.25s, border-color 0.25s',
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: '9/16',
    overflow: 'hidden',
    background: 'var(--bg3)',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
  },
  cardInfo: {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--white)',
    letterSpacing: '0.03em',
  },
  cardMeta: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
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
