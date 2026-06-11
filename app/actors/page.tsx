import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getActorPhotoUrl, shouldOptimize } from '@/lib/actor-photo'
import ActorsSearchGrid from '@/components/actors/ActorsSearchGrid'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'

// revalidateTag('actors') 호출 시 즉시 갱신, 실패 시 최대 1시간 후 자동 재렌더
export const revalidate = 3600

export const metadata: Metadata = {
  title: '배우 DB',
  description: 'KD4 액팅 스튜디오 배우 데이터베이스. 마이즈너 테크닉으로 훈련한 배우들의 프로필·필모그래피·출연영상을 확인하세요. 캐스팅 디렉터 전용 연락처 열람 가능.',
  keywords: ['배우 DB', 'KD4 배우 DB', '마이즈너 배우', '캐스팅 디렉터', '배우 프로필', '신촌 연기학원 배우', 'KD4 액팅 스튜디오 배우'],
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/actors` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/actors`,
    title: '배우 DB | KD4 액팅 스튜디오',
    description: 'KD4 액팅 스튜디오 배우 데이터베이스. 마이즈너 테크닉으로 훈련한 배우들의 프로필·필모그래피·출연영상을 확인하세요. 캐스팅 디렉터 전용 연락처 열람 가능.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 배우 DB' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '배우 DB | KD4 액팅 스튜디오',
    description: 'KD4 액팅 스튜디오 배우 데이터베이스. 마이즈너 테크닉으로 훈련한 배우들의 프로필·필모그래피·출연영상을 확인하세요. 캐스팅 디렉터 전용 연락처 열람 가능.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 배우 DB' }],
  },
}

interface Actor {
  id: string
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  drive_photo_id: string | null
  storage_photo_path: string | null
  profile_photo: string | null
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

/** casting_tags 컬럼 미존재 경고 — 콜드스타트 당 1회만 출력 */
let _castingTagsWarnedOnce = false

/** Postgres 'undefined_column' (42703) — 마이그레이션 미실행 시 발생 */
function isUndefinedColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42703' || /column .* does not exist/i.test(err.message ?? '')
}

async function fetchActors(gender: string, ageGroup: string, tag: string): Promise<{ actors: Actor[]; dbError: boolean; allTags: string[]; videoActorIds: string[] }> {
  // 출연영상 보유 배우 id — 배우 목록 쿼리와 독립이므로 병렬 시작 (waterfall 제거)
  // 테이블/컬럼 없으면 빈 배열 폴백 (페이지 안 깨지게)
  const videoIdsPromise: Promise<string[]> = (async () => {
    try {
      const { data: vids, error: vErr } = await supabaseAdmin.from('actor_videos').select('actor_id')
      if (vErr || !vids) return []
      return Array.from(
        new Set((vids as Array<{ actor_id: string | null }>).map((v) => v.actor_id).filter((x): x is string => !!x))
      )
    } catch {
      return [] // actor_videos 미존재 등 — 필터 비활성
    }
  })()

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
    return q.limit(500)  // Supabase 기본 1,000행 캡 — 명시적 상한으로 silent truncation 방지
  }

  // 1차: 새 스키마 시도
  let actors: Actor[] = []
  let castingSchemaAvailable = true
  {
    let query = buildQuery('id, name, gender, age_group, drive_photo_id, storage_photo_path, profile_photo, casting_tags, casting_summary')
    // tag는 콤마 구분 여러 태그 가능 (예: "형사,카리스마") — AND 조건
    const tagArr = tag && tag !== 'all' ? tag.split(',').filter(Boolean) : []
    if (tagArr.length > 0) query = query.contains('casting_tags', tagArr)
    const { data, error } = await query
    if (error && isUndefinedColumnError(error)) {
      if (!_castingTagsWarnedOnce) {
        console.warn('[ActorsPage] casting_tags 컬럼 미존재 — 마이그레이션 미실행. 기본 스키마로 fallback')
        _castingTagsWarnedOnce = true
      }
      castingSchemaAvailable = false
    } else if (error) {
      console.error('[ActorsPage] Supabase 오류:', error.message)
      return { actors: [], dbError: true, allTags: [], videoActorIds: [] }
    } else {
      actors = (data ?? []) as unknown as Actor[]
    }
  }

  // 2차: fallback (구 스키마, casting 컬럼 없이)
  if (!castingSchemaAvailable) {
    const { data, error } = await buildQuery('id, name, gender, age_group, drive_photo_id, storage_photo_path, profile_photo')
    if (error) {
      console.error('[ActorsPage] Fallback Supabase 오류:', error.message)
      return { actors: [], dbError: true, allTags: [], videoActorIds: [] }
    }
    actors = ((data ?? []) as unknown as Array<Omit<Actor, 'casting_tags' | 'casting_summary'>>)
      .map((a) => ({ ...a, casting_tags: null, casting_summary: null }))
  }

  // 필터 UI용 distinct 태그 (마이그레이션 안 됐으면 빈 배열)
  // 최적화: tag 필터가 없으면 이미 가져온 actors 배열에서 파생 (DB 왕복 1회 절약)
  //         tag 필터가 있으면 필터 미적용 별도 쿼리로 전체 태그 목록 조회
  let allTags: string[] = []
  if (castingSchemaAvailable) {
    if (!tag || tag === 'all') {
      // 태그 필터 없음 → 이미 가져온 actors에서 직접 추출
      const tagSet = new Set<string>()
      for (const actor of actors) {
        if (actor.casting_tags) for (const t of actor.casting_tags) tagSet.add(t)
      }
      allTags = Array.from(tagSet).sort()
    } else {
      // 태그 필터 활성화 → gender/ageGroup 기준으로만 필터링한 전체 태그 조회
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
  }

  // 병렬 시작해둔 영상 보유 배우 id 회수 (실패 시 빈 배열 — 필터 비활성)
  const videoActorIds = await videoIdsPromise

  return { actors, dbError: false, allTags, videoActorIds }
}

// 배우 목록은 모든 회원에게 동일(공개 데이터) → 120초 캐시.
// 매 요청마다 DB 조회 X → 캐시 1회 + 메모리 반환 (속도 대폭 개선).
// 배우 추가/수정 시 revalidateTag('actors')로 즉시 갱신 가능.
// keyParts에 필터 조합 포함 → gender/ageGroup/tag 조합별로 독립 캐시 슬롯 보장.
function getActorsCached(gender: string, ageGroup: string, tag: string) {
  return unstable_cache(
    fetchActors,
    ['actors-list-v1', gender, ageGroup, tag],
    { revalidate: 120, tags: ['actors'] }
  )(gender, ageGroup, tag)
}

// 사진 URL은 lib/actor-photo의 getActorPhotoUrl 사용 (Storage 우선, Drive 폴백)

// casting_tags 허용 목록 20개 — 화이트리스트 외 값 제거 (캐시 슬롯 폭발 방지)
const VALID_TAGS = new Set(['회사원','학생','주부','의사','변호사','경찰','형사','악역','코믹','진지','카리스마','순수','엄마','아빠','딸','아들','생활연기','감정연기','액션','로맨스'])

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
  /* ---- 배우 목록은 누구나 열람 가능 (비회원 포함). 연락처·다운로드만 디렉터/관리자 전용 ---- */
  const params = await searchParams
  // 캐시 슬롯 폭발 방지 (PERF-1): 허용 값 이외는 'all'로 정규화 + tag 길이 제한
  const VALID_GENDERS = new Set(['all', '남', '여'])
  const VALID_AGE_GROUPS = new Set(['all', '20대', '30대', '40대', '50대 이상'])
  const gender = VALID_GENDERS.has(params.gender ?? '') ? (params.gender ?? 'all') : 'all'
  const ageGroup = VALID_AGE_GROUPS.has(params.ageGroup ?? '') ? (params.ageGroup ?? 'all') : 'all'
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : (params.tag ?? 'all')
  const cleanedTag = rawTag.replace(/[{}\\"]/g, '').slice(0, 200)  // 콤마는 태그 구분자 — 제거 금지
  // 화이트리스트 필터 + 공백 trim + 중복제거 + 가나다순 정렬 → 캐시 슬롯 일관성 + 임의값 차단
  const rawParts: string[] = cleanedTag === 'all' || !cleanedTag ? [] : cleanedTag.split(',')
  const activeTags: string[] = Array.from(new Set(rawParts.map((s) => s.trim()).filter((s) => VALID_TAGS.has(s)))).sort().slice(0, 3)
  const tag = activeTags.length > 0 ? activeTags.join(',') : 'all'  // 정렬된 키 → 캐시 슬롯 최소화

  const { actors, dbError, allTags, videoActorIds } = await getActorsCached(gender, ageGroup, tag)
  const videoIdSet = new Set(videoActorIds)

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams()
    const g = key === 'gender' ? value : gender
    const ag = key === 'ageGroup' ? value : ageGroup
    const t = key === 'tag' ? value : (activeTags.length > 0 ? activeTags.join(',') : 'all')
    if (g !== 'all') next.set('gender', g)
    if (ag !== 'all') next.set('ageGroup', ag)
    if (t !== 'all') next.set('tag', t)
    return `/actors?${next.toString()}`
  }

  // 태그 토글: 이미 선택된 태그면 제거, 없으면 추가 (최대 3개 AND 조합)
  function tagToggleHref(t: string) {
    const next = new URLSearchParams()
    if (gender !== 'all') next.set('gender', gender)
    if (ageGroup !== 'all') next.set('ageGroup', ageGroup)
    const newTags = activeTags.includes(t)
      ? activeTags.filter((x) => x !== t)
      : [...activeTags, t].slice(0, 3)
    if (newTags.length > 0) next.set('tag', newTags.join(','))
    return `/actors?${next.toString()}`
  }

  return (
    <div style={styles.page}>
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '배우 DB', url: `${SITE_URL}/actors` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${SITE_URL}/actors#list`,
          name: 'KD4 배우 DB',
          url: `${SITE_URL}/actors`,
          numberOfItems: actors.length,
          itemListElement: actors.slice(0, 15).map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/actors/${a.id}`,
            name: a.name,
          })),
        },
      ]} />
      <style>{`
        /* 가로형 3/2 카드 — 데스크톱 2열, 모바일 1열 (세로형 금지: 가로 프로필 썸네일) */
        @media (max-width: 640px) {
          .actors-grid { grid-template-columns: 1fr !important; }
          .actor-card:hover { transform: none !important; }
        }
        .actor-card:hover {
          border-color: rgba(21,72,138,0.5) !important;
          transform: translateY(-2px);
        }
      `}</style>
      <div className="container">
        {/* 페이지 헤더 */}
        <div style={styles.header}>
          <p style={styles.eyebrow}><span lang="en">ACTOR ROSTER</span></p>
          <h1 style={styles.pageTitle}>배우 DB</h1>
          <p style={styles.subtitle}>KD4 액팅 스튜디오 배우들을 만나보세요.</p>
        </div>

        {/* 필터바 */}
        <div style={styles.filterSection}>
          <div style={styles.filterGroup}>
            <span id="filter-label-gender" style={styles.filterLabel}>성별</span>
            <div role="group" aria-labelledby="filter-label-gender" style={styles.filterBtnGroup}>
              {GENDER_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={filterHref('gender', opt.value)}
                  aria-current={gender === opt.value ? "true" : undefined}
                  aria-label={gender === opt.value ? `${opt.label} (선택됨)` : opt.label}
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
            <span id="filter-label-age" style={styles.filterLabel}>연령대</span>
            <div role="group" aria-labelledby="filter-label-age" style={styles.filterBtnGroup}>
              {AGE_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  href={filterHref('ageGroup', opt.value)}
                  aria-current={ageGroup === opt.value ? "true" : undefined}
                  aria-label={ageGroup === opt.value ? `${opt.label} (선택됨)` : opt.label}
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

          {/* 캐스팅 타입 — 자동 분류된 태그 (회사원/형사/엄마 등), 다중 선택(AND 조합) 가능 */}
          {(allTags.length > 0 || activeTags.length > 0) && (
            <div style={styles.filterGroup}>
              <span id="filter-label-tag" style={styles.filterLabel}>
                캐스팅 타입{activeTags.length > 1 ? ` (${activeTags.length}개 AND)` : ''}
              </span>
              <div role="group" aria-labelledby="filter-label-tag" style={styles.filterBtnGroup}>
                <Link
                  href={filterHref('tag', 'all')}
                  aria-current={activeTags.length === 0 ? "true" : undefined}
                  aria-label={activeTags.length === 0 ? '전체 (선택됨)' : '전체'}
                  style={{
                    ...styles.filterBtn,
                    ...(activeTags.length === 0 ? styles.filterBtnActive : {}),
                  }}
                >
                  전체
                </Link>
                {allTags.map((t) => {
                  const isActive = activeTags.includes(t)
                  const isDisabled = !isActive && activeTags.length >= 3
                  return (
                    <Link
                      key={t}
                      href={tagToggleHref(t)}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={isActive ? `${t} (선택됨)` : isDisabled ? `${t} (최대 3개 선택됨)` : t}
                      aria-disabled={isDisabled ? "true" : undefined}
                      tabIndex={isDisabled ? -1 : undefined}
                      style={{
                        ...styles.filterBtn,
                        ...(isActive ? styles.filterBtnActive : {}),
                        ...(isDisabled ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' as const } : {}),
                      }}
                    >
                      {t}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 온보딩 CTA — 배우 등록 신청 + 캐스팅 문의 진입경로 */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end',
          marginBottom: 20,
        }}>
          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="배우 DB 등록 신청 (카카오 채널로 이동)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6,
              fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
              background: 'var(--navy-tint-1)',
              color: 'var(--navy)',
              border: '1px solid var(--navy-tint-3)',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            배우 등록 신청 →
          </a>
          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="캐스팅 문의 (카카오 채널로 이동)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6,
              fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
              background: 'var(--bg2)',
              color: 'var(--secondary)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            캐스팅 문의 →
          </a>
        </div>

        {/* 배우 그리드 + 검색 (클라이언트 컴포넌트) */}
        {dbError ? (
          <div role="status" aria-live="polite" aria-atomic="true" style={styles.emptyState}>
            <p style={styles.emptyText}>데이터베이스 연결 오류가 발생했습니다.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '8px' }}>
              잠시 후 다시 시도해 주세요. 문제가 계속되면 카카오 채널로 알려주세요.
            </p>
            <div style={{ marginTop: 16, display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href="https://pf.kakao.com/_ximxdqn"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.resetLink}
              >
                카카오 채널 문의
              </a>
            </div>
          </div>
        ) : actors.length === 0 ? (
          <div role="status" aria-live="polite" style={styles.emptyState}>
            <p style={styles.emptyText}>해당 조건의 배우가 없습니다.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 6, lineHeight: 1.6 }}>
              {[
                gender !== 'all' && `성별 ${gender}`,
                ageGroup !== 'all' && `연령대 ${ageGroup}`,
                tag !== 'all' && `태그 ${tag}`,
              ].filter(Boolean).join(' · ')}
            </p>
            <div style={{ marginTop: 16, display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/actors" style={styles.resetLink}>전체 필터 초기화</Link>
              <Link href="/about" style={{ ...styles.resetLink, borderColor: 'var(--border)', color: 'var(--gray)' }}>스튜디오 소개로</Link>
            </div>
          </div>
        ) : (
          <ActorsSearchGrid
            actors={actors.map((actor) => ({
              id: actor.id,
              name: actor.name,
              gender: actor.gender,
              age_group: actor.age_group,
              casting_tags: actor.casting_tags,
              casting_summary: actor.casting_summary,
              photoSrc: getActorPhotoUrl(actor),
              unoptimized: !shouldOptimize(actor),
              hasVideo: videoIdSet.has(actor.id),
            }))}
            totalBeforeSearch={actors.length}
          />
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
    minHeight: 44,
  },
}
