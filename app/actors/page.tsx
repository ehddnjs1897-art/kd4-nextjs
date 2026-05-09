import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getActorPhotoUrl, shouldOptimize } from '@/lib/actor-photo'

interface Actor {
  id: string
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  drive_photo_id: string | null
  storage_photo_path: string | null
  casting_tags: string[] | null
  casting_summary: string | null
}

type GenderFilter = 'all' | '남' | '여'
type AgeFilter = 'all' | '20대' | '30대' | '40대' | '50대 이상'

interface PageProps {
  searchParams: Promise<{
    gender?: string
    ageGroup?: string
    tag?: string
  }>
}

/** Postgres 'undefined_column' (42703) — 마이그레이션 미실행 시 발생 */
function isUndefinedColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42703' || /column .* does not exist/i.test(err.message ?? '')
}

async function fetchActors(gender: string, ageGroup: string, tag: string): Promise<{ actors: Actor[]; dbError: boolean; allTags: string[] }> {
  // 새 컬럼(casting_tags/summary) 포함 쿼리 — 마이그레이션 미실행 시 fallback
  const buildQuery = (cols: string) => {
    let q = supabaseAdmin
      .from('actors')
      .select(cols)
      .eq('is_public', true)
      .order('age_group', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (gender && gender !== 'all') q = q.eq('gender', gender)
    if (ageGroup && ageGroup !== 'all') q = q.eq('age_group', ageGroup)
    return q
  }

  // 1차: 새 스키마 시도
  let actors: Actor[] = []
  let castingSchemaAvailable = true
  {
    let query = buildQuery('id, name, gender, age_group, drive_photo_id, storage_photo_path, casting_tags, casting_summary')
    if (tag && tag !== 'all') query = query.contains('casting_tags', [tag])
    const { data, error } = await query
    if (error && isUndefinedColumnError(error)) {
      console.warn('[ActorsPage] casting_tags 컬럼 미존재 — 마이그레이션 미실행. 기본 스키마로 fallback')
      castingSchemaAvailable = false
    } else if (error) {
      console.error('[ActorsPage] Supabase 오류:', error.message)
      return { actors: [], dbError: true, allTags: [] }
    } else {
      actors = (data ?? []) as unknown as Actor[]
    }
  }

  // 2차: fallback (구 스키마, casting 컬럼 없이)
  if (!castingSchemaAvailable) {
    const { data, error } = await buildQuery('id, name, gender, age_group, drive_photo_id, storage_photo_path')
    if (error) {
      console.error('[ActorsPage] Fallback Supabase 오류:', error.message)
      return { actors: [], dbError: true, allTags: [] }
    }
    actors = ((data ?? []) as unknown as Array<Omit<Actor, 'casting_tags' | 'casting_summary'>>)
      .map((a) => ({ ...a, casting_tags: null, casting_summary: null }))
  }

  // 필터 UI용 distinct 태그 (마이그레이션 안 됐으면 빈 배열)
  let allTags: string[] = []
  if (castingSchemaAvailable) {
    let tagsQuery = supabaseAdmin
      .from('actors')
      .select('casting_tags')
      .eq('is_public', true)
      .not('casting_tags', 'is', null)
    if (gender && gender !== 'all') tagsQuery = tagsQuery.eq('gender', gender)
    if (ageGroup && ageGroup !== 'all') tagsQuery = tagsQuery.eq('age_group', ageGroup)
    const { data: tagsData } = await tagsQuery
    const tagSet = new Set<string>()
    for (const row of (tagsData ?? []) as Array<{ casting_tags: string[] | null }>) {
      if (row.casting_tags) for (const t of row.casting_tags) tagSet.add(t)
    }
    allTags = Array.from(tagSet).sort()
  }

  return { actors, dbError: false, allTags }
}

// 사진 URL은 lib/actor-photo의 getActorPhotoUrl 사용 (Storage 우선, Drive 폴백)

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
  const tag = params.tag ?? 'all'
  const { actors, dbError, allTags } = await fetchActors(gender, ageGroup, tag)

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams()
    if (key !== 'gender') next.set('gender', gender)
    if (key !== 'ageGroup') next.set('ageGroup', ageGroup)
    if (key !== 'tag') next.set('tag', tag)
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

          {/* 캐스팅 타입 — 자동 분류된 태그 (회사원/형사/엄마 등) */}
          {(allTags.length > 0 || tag !== 'all') && (
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>캐스팅 타입</span>
              <div style={styles.filterBtnGroup}>
                <Link
                  href={filterHref('tag', 'all')}
                  style={{
                    ...styles.filterBtn,
                    ...(tag === 'all' ? styles.filterBtnActive : {}),
                  }}
                >
                  전체
                </Link>
                {allTags.map((t) => (
                  <Link
                    key={t}
                    href={filterHref('tag', t)}
                    style={{
                      ...styles.filterBtn,
                      ...(tag === t ? styles.filterBtnActive : {}),
                    }}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          )}
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
                    src={getActorPhotoUrl(actor)}
                    alt={actor.name}
                    fill
                    sizes="(max-width:640px) 100vw, 50vw"
                    style={{ objectFit: 'cover', objectPosition: 'center top' }}
                    unoptimized={!shouldOptimize(actor)}
                  />
                  <div style={styles.cardOverlay}>
                    <span style={styles.cardName}>{actor.name}</span>
                    <span style={styles.cardMeta}>
                      {actor.gender ?? ''}{actor.gender && actor.age_group ? ' · ' : ''}{actor.age_group ?? ''}
                    </span>
                    {/* 캐스팅 태그 — 자동 분류 결과 (있을 때만, 최대 3개) */}
                    {actor.casting_tags && actor.casting_tags.length > 0 && (
                      <div style={styles.cardTags}>
                        {actor.casting_tags.slice(0, 3).map((t) => (
                          <span key={t} style={styles.cardTag}>{t}</span>
                        ))}
                      </div>
                    )}
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
    padding: '10px 16px', // 44px touch target (5px → 10px)
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 22,
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
  cardTags: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
    marginTop: 6,
  },
  cardTag: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.92)',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 3,
    padding: '2px 7px',
    letterSpacing: '0.02em',
    backdropFilter: 'blur(4px)',
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
