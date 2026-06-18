import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getActorPhotoUrl, shouldOptimize } from '@/lib/actor-photo'
import ActorsSearchGrid from '@/components/actors/ActorsSearchGrid'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'
import { CASTING_TAG_OPTIONS } from '@/lib/actor-tags'

// 배우 목록 데이터 캐시는 getActorsCached(120s, 'actors' tag)에서 관리
// 페이지 컴포넌트는 searchParams 사용으로 dynamic rendering — revalidate ISR은 무효

const VALID_TAGS = new Set<string>(CASTING_TAG_OPTIONS)

// ── 장르 필터 (2026-06-12 대표 지시) ─────────────────────────────────────────
// 직업·감정이 뒤섞인 개별 태그 19개 노출 대신 장르 묶음만 노출.
// 배우별 casting_tags 데이터는 그대로 두고, 장르 → 태그 OR 매핑(.overlaps)으로만 조회.
// 기존 ?tag= URL은 SEO 사이트맵에 등록돼 있어 동작 유지 (UI 비노출).
const GENRE_OPTIONS: { value: string; label: string; tags: string[] }[] = [
  { value: 'romance', label: '멜로·로맨스', tags: ['로맨스', '순수'] },
  { value: 'human', label: '휴먼·일상', tags: ['생활연기', '감정연기', '진지', '엄마', '아빠', '아들', '딸', '주부', '학생', '회사원'] },
  { value: 'comedy', label: '코미디', tags: ['코믹'] },
  { value: 'thriller', label: '스릴러·범죄', tags: ['형사', '악역', '카리스마', '경찰'] },
  { value: 'action', label: '액션', tags: ['액션'] },
  { value: 'medical', label: '메디컬', tags: ['의사'] },
  { value: 'legal', label: '법정', tags: ['변호사'] },
]
const GENRE_BY_VALUE = new Map(GENRE_OPTIONS.map((g) => [g.value, g]))

type FilterParams = { gender?: string | string[]; ageGroup?: string | string[]; tag?: string | string[]; genre?: string | string[] }

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<FilterParams> }
): Promise<Metadata> {
  const params = await searchParams
  const rawGender = Array.isArray(params.gender) ? params.gender[0] : (params.gender ?? '')
  const gender = ['남', '여'].includes(rawGender) ? rawGender : 'all'
  const rawAge = Array.isArray(params.ageGroup) ? params.ageGroup[0] : (params.ageGroup ?? '')
  const ageGroup = ['20대', '30대', '40대', '50대 이상'].includes(rawAge) ? rawAge : 'all'
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : (params.tag ?? '')
  const cleaned = rawTag.replace(/[{}\\"]/g, '').slice(0, 200)
  const tagParts: string[] = cleaned && cleaned !== 'all' ? cleaned.split(',') : []
  const activeTags = Array.from(new Set(tagParts.map((s) => s.trim()).filter((s) => VALID_TAGS.has(s)))).sort().slice(0, 3)
  const rawGenre = Array.isArray(params.genre) ? params.genre[0] : (params.genre ?? '')
  const genreOpt = GENRE_BY_VALUE.get(rawGenre)

  const segments: string[] = []
  if (gender === '남') segments.push('남자')
  else if (gender === '여') segments.push('여자')
  if (genreOpt) segments.push(genreOpt.label)
  if (activeTags.length > 0) segments.push(activeTags.join('·'))
  if (ageGroup !== 'all') segments.push(ageGroup)
  const titlePrefix = segments.length > 0 ? `${segments.join(' ')} 배우 DB` : '배우 DB'

  const qs = new URLSearchParams()
  if (gender !== 'all') qs.set('gender', gender)
  if (ageGroup !== 'all') qs.set('ageGroup', ageGroup)
  if (genreOpt) qs.set('genre', genreOpt.value)
  if (activeTags.length > 0) qs.set('tag', activeTags.join(','))
  const qsStr = qs.toString()
  const canonicalUrl = qsStr ? `${SITE_URL}/actors?${qsStr}` : `${SITE_URL}/actors`

  // 필터 특화 설명 — 중복 콘텐츠 방지, 각 필터 페이지가 고유한 meta description 보유
  const descPrefix = segments.length > 0 ? `${segments.join(' ')} 배우 DB — KD4 액팅 스튜디오` : 'KD4 액팅 스튜디오 배우 데이터베이스'
  const descBody = segments.length > 0
    ? `마이즈너 테크닉으로 훈련한 ${segments.join(' ')} 배우들의 프로필·필모그래피·출연영상`
    : '마이즈너 테크닉으로 훈련한 배우들의 프로필·필모그래피·출연영상을 확인하세요'
  const desc = `${descPrefix}. ${descBody}. 캐스팅 디렉터 전용 연락처 열람 가능.`

  // 필터 특화 키워드 — 상위 필터 키워드를 앞에 배치
  const filterKeywords: string[] = []
  if (gender === '남') filterKeywords.push('남자 배우', '남자 배우 DB', '남자 배우 캐스팅')
  else if (gender === '여') filterKeywords.push('여자 배우', '여자 배우 DB', '여자 배우 캐스팅')
  if (ageGroup !== 'all') filterKeywords.push(`${ageGroup} 배우`, `${ageGroup} 배우 DB`)
  if (genreOpt) filterKeywords.push(`${genreOpt.label} 배우`, `${genreOpt.label} 장르 배우`)
  for (const t of activeTags) filterKeywords.push(`${t} 배우`, `${t} 역할 배우`)
  const keywords = [...filterKeywords, '배우 DB', 'KD4 배우 DB', '마이즈너 배우', '캐스팅 디렉터', '신촌 연기학원 배우']

  return {
    title: titlePrefix,
    description: desc,
    keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: `${titlePrefix} | KD4 액팅 스튜디오`,
      description: desc,
      locale: 'ko_KR',
      siteName: 'KD4 액팅 스튜디오',
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 배우 DB' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titlePrefix} | KD4 액팅 스튜디오`,
      description: desc,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 배우 DB' }],
    },
  }
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
    genre?: string
  }>
}

/** casting_tags 컬럼 미존재 경고 — 콜드스타트 당 1회만 출력 */
let _castingTagsWarnedOnce = false

/** Postgres 'undefined_column' (42703) — 마이그레이션 미실행 시 발생 */
function isUndefinedColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42703' || /column .* does not exist/i.test(err.message ?? '')
}

async function fetchActors(gender: string, ageGroup: string, tag: string, genre: string): Promise<{ actors: Actor[]; dbError: boolean; allTags: string[]; videoActorIds: string[] }> {
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
    // tag는 콤마 구분 여러 태그 가능 (예: "형사,카리스마") — AND 조건 (레거시 ?tag= URL용)
    const tagArr = tag && tag !== 'all' ? tag.split(',').filter(Boolean) : []
    if (tagArr.length > 0) query = query.contains('casting_tags', tagArr)
    // 장르 필터 — 장르에 속한 태그 중 하나라도 보유하면 매칭 (OR, .overlaps)
    const genreTags = GENRE_BY_VALUE.get(genre)?.tags ?? []
    if (genreTags.length > 0) query = query.overlaps('casting_tags', genreTags)
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
function getActorsCached(gender: string, ageGroup: string, tag: string, genre: string) {
  return unstable_cache(
    fetchActors,
    ['actors-list-v2', gender, ageGroup, tag, genre],
    { revalidate: 120, tags: ['actors'] }
  )(gender, ageGroup, tag, genre)
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
  /* ---- 배우 목록은 누구나 열람 가능 (비회원 포함). 연락처·다운로드만 디렉터/관리자 전용 ---- */
  const params = await searchParams
  // 캐시 슬롯 폭발 방지 (PERF-1): 허용 값 이외는 'all'로 정규화 + tag 길이 제한
  const VALID_GENDERS = new Set(['all', '남', '여'])
  const VALID_AGE_GROUPS = new Set(['all', '20대', '30대', '40대', '50대 이상'])
  const rawGender = Array.isArray(params.gender) ? params.gender[0] : (params.gender ?? '')
  const gender = VALID_GENDERS.has(rawGender) ? rawGender : 'all'
  const rawAge = Array.isArray(params.ageGroup) ? params.ageGroup[0] : (params.ageGroup ?? '')
  const ageGroup = VALID_AGE_GROUPS.has(rawAge) ? rawAge : 'all'
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : (params.tag ?? 'all')
  const cleanedTag = rawTag.replace(/[{}\\"]/g, '').slice(0, 200)  // 콤마는 태그 구분자 — 제거 금지
  // 화이트리스트 필터 + 공백 trim + 중복제거 + 가나다순 정렬 → 캐시 슬롯 일관성 + 임의값 차단
  const rawParts: string[] = cleanedTag === 'all' || !cleanedTag ? [] : cleanedTag.split(',')
  const activeTags: string[] = Array.from(new Set(rawParts.map((s) => s.trim()).filter((s) => VALID_TAGS.has(s)))).sort().slice(0, 3)
  const tag = activeTags.length > 0 ? activeTags.join(',') : 'all'  // 정렬된 키 → 캐시 슬롯 최소화
  // 장르 — 단일 선택 (화이트리스트 외 값은 'all')
  const rawGenre = Array.isArray(params.genre) ? params.genre[0] : (params.genre ?? '')
  const genre = GENRE_BY_VALUE.has(rawGenre) ? rawGenre : 'all'
  const activeGenre = genre !== 'all' ? GENRE_BY_VALUE.get(genre) : undefined

  const { actors, dbError, videoActorIds } = await getActorsCached(gender, ageGroup, tag, genre)
  const videoIdSet = new Set(videoActorIds)

  // 동적 H1 — 필터 활성 시 "여자 멜로·로맨스 30대 배우 DB", 기본 "배우 DB"
  const h1Segments: string[] = []
  if (gender === '남') h1Segments.push('남자')
  else if (gender === '여') h1Segments.push('여자')
  if (activeGenre) h1Segments.push(activeGenre.label)
  if (activeTags.length > 0) h1Segments.push(activeTags.join('·'))
  if (ageGroup !== 'all') h1Segments.push(ageGroup)
  const dynamicH1 = h1Segments.length > 0 ? `${h1Segments.join(' ')} 배우 DB` : '배우 DB'
  const dynamicSubtitle = !dbError && actors.length > 0
    ? h1Segments.length > 0
      ? `KD4 액팅 스튜디오의 ${h1Segments.join(' ')} 배우 ${actors.length}명을 만나보세요.`
      : `KD4 액팅 스튜디오의 배우 ${actors.length}명을 만나보세요.`
    : h1Segments.length > 0
      ? `KD4 액팅 스튜디오의 ${h1Segments.join(' ')} 배우들을 만나보세요.`
      : 'KD4 액팅 스튜디오 배우들을 만나보세요.'

  function filterHref(key: string, value: string) {
    const next = new URLSearchParams()
    const g = key === 'gender' ? value : gender
    const ag = key === 'ageGroup' ? value : ageGroup
    const gen = key === 'genre' ? value : genre
    const t = key === 'tag' ? value : (activeTags.length > 0 ? activeTags.join(',') : 'all')
    if (g !== 'all') next.set('gender', g)
    if (ag !== 'all') next.set('ageGroup', ag)
    if (gen !== 'all') next.set('genre', gen)
    if (t !== 'all') next.set('tag', t)
    return `/actors?${next.toString()}`
  }

  // 장르 토글: 이미 선택된 장르를 다시 누르면 전체로
  function genreToggleHref(value: string) {
    return filterHref('genre', genre === value ? 'all' : value)
  }

  // 필터 상태에 맞는 정규화된 canonical URL 구성 (generateMetadata와 동일 로직)
  const canonicalQs = new URLSearchParams()
  if (gender !== 'all') canonicalQs.set('gender', gender)
  if (ageGroup !== 'all') canonicalQs.set('ageGroup', ageGroup)
  if (activeGenre) canonicalQs.set('genre', activeGenre.value)
  if (activeTags.length > 0) canonicalQs.set('tag', activeTags.join(','))
  const canonicalUrl = canonicalQs.toString() ? `${SITE_URL}/actors?${canonicalQs.toString()}` : `${SITE_URL}/actors`
  const listName = activeGenre
    ? `KD4 배우 DB — ${activeGenre.label}`
    : activeTags.length > 0
      ? `KD4 배우 DB — ${activeTags.join('·')}`
      : 'KD4 배우 DB'

  return (
    <div style={styles.page}>
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '배우 DB', url: `${SITE_URL}/actors` },
          ...(h1Segments.length > 0 ? [{ name: dynamicH1, url: canonicalUrl }] : []),
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${canonicalUrl}#page`,
          url: canonicalUrl,
          name: listName,
          inLanguage: 'ko',
          isPartOf: { '@id': `${SITE_URL}#website` },
          mainEntity: { '@id': `${canonicalUrl}#list` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${canonicalUrl}#list`,
          name: listName,
          url: canonicalUrl,
          numberOfItems: actors.length,
          itemListElement: actors.slice(0, 20).map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Person',
              '@id': `${SITE_URL}/actors/${a.id}#person`,
              name: a.name,
              url: `${SITE_URL}/actors/${a.id}`,
            },
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
        {/* 브레드크럼 */}
        <nav aria-label="위치" style={{ marginBottom: 20 }}>
          <ol style={{ display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
            <li><Link href="/" style={styles.breadcrumb}>홈</Link></li>
            <li aria-hidden="true" style={styles.breadcrumbSep}>›</li>
            {h1Segments.length > 0 ? (
              <>
                <li><Link href="/actors" style={styles.breadcrumb}>배우 DB</Link></li>
                <li aria-hidden="true" style={styles.breadcrumbSep}>›</li>
                <li aria-current="page"><span style={styles.breadcrumbActive}>{dynamicH1}</span></li>
              </>
            ) : (
              <li aria-current="page"><span style={styles.breadcrumbActive}>배우 DB</span></li>
            )}
          </ol>
        </nav>

        {/* 페이지 헤더 */}
        <div style={styles.header}>
          <p style={styles.eyebrow}><span lang="en">ACTOR ROSTER</span></p>
          <h1 style={styles.pageTitle}>{dynamicH1}</h1>
          <p style={styles.subtitle}>{dynamicSubtitle}</p>
        </div>

        {/* 진입 CTA — 배우 등록 신청 + 캐스팅 문의 (필터·검색 위로 이동: 필터바↔검색창 근접 배치, 2026-06-18 UX) */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end',
          marginBottom: 16,
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

          {/* 장르 — 단일 선택 (2026-06-12 대표 지시: 개별 태그 19개 노출 대신 장르 묶음만)
              세부 키워드(형사·의사 등)는 아래 검색창에서 검색 가능. 레거시 ?tag= URL은 계속 동작 */}
          <div style={styles.filterGroup}>
            <span id="filter-label-genre" style={styles.filterLabel}>장르</span>
            <div role="group" aria-labelledby="filter-label-genre" style={styles.filterBtnGroup}>
              <Link
                href={filterHref('genre', 'all')}
                aria-current={!activeGenre ? "true" : undefined}
                aria-label={!activeGenre ? '전체 (선택됨)' : '전체'}
                style={{
                  ...styles.filterBtn,
                  ...(!activeGenre ? styles.filterBtnActive : {}),
                }}
              >
                전체
              </Link>
              {GENRE_OPTIONS.map((g) => {
                const isActive = genre === g.value
                return (
                  <Link
                    key={g.value}
                    href={genreToggleHref(g.value)}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={isActive ? `${g.label} (선택됨)` : g.label}
                    style={{
                      ...styles.filterBtn,
                      ...(isActive ? styles.filterBtnActive : {}),
                    }}
                  >
                    {g.label}
                  </Link>
                )
              })}
            </div>
          </div>
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
  breadcrumb: {
    fontSize: '0.78rem',
    color: 'var(--gray)',
    textDecoration: 'none',
  },
  breadcrumbSep: {
    fontSize: '0.78rem',
    color: 'var(--border)',
  },
  breadcrumbActive: {
    fontSize: '0.78rem',
    color: 'var(--secondary)',
  },
}
