import Link from 'next/link'
import type { Metadata } from 'next'
import { getMonologuesCached, getMonologueTotalCount, GENRE_OPTIONS, MEDIUM_OPTIONS, AGE_OPTIONS } from '@/lib/monologues'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildWebPage, buildFaqPage } from '@/lib/seo-schemas'
import MonologuesSearchGrid from '@/components/monologues/MonologuesSearchGrid'

export const revalidate = 300 // 5분 ISR — 크롤러 파이프라인이 새 카드를 계속 추가하므로 적당히 신선하게

// q(검색어)는 클라이언트 전용 필터라 데이터 쿼리(parseFilters)에는 안 씀 —
// MonologuesSearchGrid의 초기값으로만 넘겨 공유 링크(예: ?genre=멜로&q=이별) 첫 렌더에 반영.
type SearchParams = Promise<{ gender?: string; genre?: string; medium?: string; age?: string; q?: string }>

// 타겟 키워드 — 2026-07-17 네이버 자동완성 수요조사 반영:
// 실수요는 "독백 대사"·"여자 독백 대사"·"자유연기 대본"·"연기 (연습) 대본" 계열이 압도적
// ("아카이브"는 수요 없음 — 브랜드명으로만 유지)
const KEYWORDS = [
  '독백 대사', '독백 대사 모음', '슬픈 독백 대사', '드라마 독백 대사',
  '여자 독백 대사', '남자 독백 대사', '여자 희곡 독백',
  '남자독백', '남자독백대본', '남자 독백 대본',
  '여자독백', '여자독백대본', '여자 독백 대본',
  '자유연기 대본', '자유연기 대사', '자유연기 독백', '자유연기 대사 추천',
  '연기 대본', '여자 연기 대본', '독백 연기 대본', '연기 연습 대본',
  '20대독백', '30대독백', '40대독백', '50대독백', '연령대별 독백',
  '오디션독백', '오디션 독백', '오디션 대본',
  '독백대본 모음', '독백 대본', '무료 독백 대본',
  '연기 독백 연습', '독백 연습 사이트', '독백 연습',
  '영화독백', '드라마독백', '연극독백', '뮤지컬 독백',
]

/** 매체 필터별 검색 키워드 라벨 — "영화독백", "드라마독백" 등 실검색어와 일치 */
const MEDIUM_KEYWORD: Record<string, string> = {
  '영화': '영화독백',
  'TV드라마': '드라마독백',
  '연극': '연극독백',
  '뮤지컬': '뮤지컬 독백',
  '웹드라마': '웹드라마 독백',
  '광고': '광고 독백',
}

function parseFilters(params: { gender?: string; genre?: string; medium?: string; age?: string }) {
  return {
    gender: params.gender && ['남성', '여성'].includes(params.gender) ? params.gender : undefined,
    genre: params.genre && GENRE_OPTIONS.includes(params.genre) ? params.genre : undefined,
    medium: params.medium && MEDIUM_OPTIONS.includes(params.medium) ? params.medium : undefined,
    age: params.age && AGE_OPTIONS.some((o) => o.value === params.age) ? params.age : undefined,
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { gender, genre, medium, age } = parseFilters(await searchParams)
  const monologues = await getMonologuesCached(gender, genre, medium, age)
  const count = monologues.length

  const baseUrl = `${SITE_URL}/monologues`
  let title: string
  let desc: string
  let canonicalUrl = baseUrl

  if (gender && !genre && !medium && !age) {
    // 성별 단독 필터 — "남자독백 대본"·"여자독백 대본" 검색어 전용 인덱스 페이지 (self-canonical)
    const g = gender === '남성' ? '남자' : '여자'
    title = `${g} 독백 대사·대본 ${count}편 무료 — 오디션·자유연기 ${g}독백 모음 | KD4 액팅 스튜디오`
    desc = `${g} 독백 대사·${g}독백 대본 ${count}편 무료, 매주 새 대본 추가. 영화·드라마·연극·뮤지컬 속 ${g} 배역 독백을 20대~50대 연령대·장르·감정선별로 찾아보세요. 오디션·자유연기 대본 선정에 바로 활용할 수 있습니다.`
    canonicalUrl = `${baseUrl}?gender=${encodeURIComponent(gender)}`
  } else if (age && !gender && !genre && !medium) {
    // 연령대 단독 필터 — "20대독백"·"30대독백" 등 검색어 전용 (self-canonical)
    const label = AGE_OPTIONS.find((o) => o.value === age)?.label ?? age
    title = `${label} 독백 대본 ${count}편 무료 — 오디션·연습용 ${label} 독백 모음 | KD4 액팅 스튜디오`
    desc = `${label} 독백 대사·대본 ${count}편 무료, 매주 새 대본 추가. 남자독백·여자독백, 영화·드라마·연극·뮤지컬 장르별로 찾는 ${label} 독백 모음. 오디션·자유연기 준비에 바로 쓸 수 있습니다.`
    canonicalUrl = `${baseUrl}?age=${encodeURIComponent(age)}`
  } else if (medium && !gender && !genre && !age) {
    // 매체 단독 필터 — "영화독백"·"드라마독백"·"연극독백" 검색어 전용 (self-canonical)
    const kw = MEDIUM_KEYWORD[medium] ?? `${medium} 독백`
    title = `${kw} 대본 ${count}편 무료 — 오디션·연습용 ${medium} 독백 모음 | KD4 액팅 스튜디오`
    desc = `${kw} 대사·대본 ${count}편 무료, 매주 새 대본 추가. 남자독백·여자독백, 20대~50대 연령대, 장르·감정선별로 찾는 ${medium} 독백 대본 모음. 오디션·자유연기 준비에 바로 쓸 수 있습니다.`
    canonicalUrl = `${baseUrl}?medium=${encodeURIComponent(medium)}`
  } else if (gender || genre || medium || age) {
    const ageLabel = age ? AGE_OPTIONS.find((o) => o.value === age)?.label ?? age : undefined
    const parts = [gender, ageLabel, medium, genre].filter(Boolean)
    title = `독백 대본 아카이브 — ${parts.join(' · ')} | KD4 액팅 스튜디오`
    desc = `오디션·연습용 ${parts.join(' ')} 독백 대본 ${count}편. 배역·감정선·연령대로 찾는 독백 대본 아카이브.`
  } else {
    title = `독백 대사·독백 대본 ${count}편 무료 — 여자·남자 독백, 자유연기 대본 | KD4 액팅 스튜디오`
    desc = `독백 대사·독백 대본 ${count}편 무료, 매주 새 대본 추가. 여자 독백 대사·남자 독백·자유연기 대본·연기 연습 대본을 20대~50대 연령대, 영화·드라마·연극 장르, 감정선별로 검색하세요.`
  }

  return {
    // 루트 layout의 title template(%s | KD4 액팅 스튜디오) 중복 방지 — 여기서 완성형으로 지정
    title: { absolute: title },
    description: desc,
    keywords: KEYWORDS,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description: desc,
      locale: 'ko_KR',
      siteName: 'KD4 액팅 스튜디오',
      images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 독백 대본 아카이브' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [`${SITE_URL}/og-heart.jpg`],
    },
  }
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: '0.82rem',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
        background: active ? 'var(--navy)' : 'transparent',
        color: active ? '#fff' : 'var(--gray)',
        transition: 'var(--transition)',
      }}
    >
      {label}
    </Link>
  )
}

function FilterGroup({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '13px 16px',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          color: 'var(--gray)',
          marginBottom: 9,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

function buildHref(base: Record<string, string | undefined>, key: string, value: string | undefined) {
  const next = { ...base, [key]: value }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) {
    if (v) qs.set(k, v)
  }
  const s = qs.toString()
  return s ? `/monologues?${s}` : '/monologues'
}

/** 하단 AEO 문답 — 질문 1개 = 답 1~2문장. 화면과 FAQPage JSON-LD가 같은 데이터를 씀.
 *  {count}는 렌더 시 실제 편수로 치환 */
const RUN_BY_Q = '누가 운영하나요?'
const MONOLOGUE_FAQ = [
  {
    q: '독백 대본, 무료인가요?',
    a: '네. {count}편 전부 무료이고 매주 새 대본이 추가됩니다.',
  },
  {
    q: '나에게 맞는 독백은 어떻게 찾나요?',
    a: '성별·연령대·미디어·장르 필터로 바로 검색됩니다. 대본마다 배역·작품·감정선이 정리되어 있습니다.',
  },
  {
    q: '어디에 쓸 수 있나요?',
    a: '오디션 독백, 자유연기 대본, 연기 연습에 그대로 쓰세요. 대사 전문 복사와 카드 이미지 저장을 지원합니다.',
  },
  {
    q: RUN_BY_Q,
    a: '서울 신촌의 마이즈너 테크닉 연기 스튜디오 KD4 액팅 스튜디오가 직접 만듭니다. 독백 연습 다음 단계는 연기 클래스에서 카메라 앞 훈련으로 이어가세요.',
  },
]

/** 하단 SEO 안내 섹션의 키워드 내부 링크 */
const SEO_LINKS = [
  { label: '남자독백 대본 전체보기', href: '/monologues?gender=%EB%82%A8%EC%84%B1' },
  { label: '여자독백 대본 전체보기', href: '/monologues?gender=%EC%97%AC%EC%84%B1' },
  { label: '20대 독백', href: '/monologues?age=20%EB%8C%80' },
  { label: '30대 독백', href: '/monologues?age=30%EB%8C%80' },
  { label: '40대 독백', href: '/monologues?age=40%EB%8C%80' },
  { label: '50대+ 독백', href: '/monologues?age=50%EB%8C%80%EC%9D%B4%EC%83%81' },
  { label: '영화독백', href: '/monologues?medium=%EC%98%81%ED%99%94' },
  { label: '드라마독백', href: '/monologues?medium=TV%EB%93%9C%EB%9D%BC%EB%A7%88' },
  { label: '연극독백', href: '/monologues?medium=%EC%97%B0%EA%B7%B9' },
  { label: '뮤지컬 독백', href: '/monologues?medium=%EB%AE%A4%EC%A7%80%EC%BB%AC' },
]

export default async function MonologuesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const { gender, genre, medium, age } = parseFilters(sp)
  const initialQuery = sp.q?.trim() || ''

  const [monologues, totalCount] = await Promise.all([
    getMonologuesCached(gender, genre, medium, age),
    getMonologueTotalCount(),
  ])
  const current = { gender, genre, medium, age }
  const hasFilter = Boolean(gender || genre || medium || age)

  return (
    <main style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '48px 20px 80px' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '독백 대본 아카이브', url: `${SITE_URL}/monologues` },
          ]),
          buildWebPage({
            type: 'CollectionPage',
            idPath: '/monologues#webpage',
            url: `${SITE_URL}/monologues`,
            name: '독백 대본 아카이브 — 독백 대사·자유연기 대본 무료 모음',
            description: `오디션·연습용 독백 대사·대본 ${totalCount}편 무료, 매주 새 대본 추가. 남자독백·여자독백·자유연기 대본, 20대~50대 연령대, 영화·드라마·연극·뮤지컬 장르별 독백 모음.`,
            mainEntity: { '@id': `${SITE_URL}/monologues#itemlist` },
          }),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            '@id': `${SITE_URL}/monologues#itemlist`,
            name: '오디션·연습용 독백 대본 목록',
            description: '남자독백·여자독백, 연령대·장르별 무료 독백 대본 아카이브',
            numberOfItems: monologues.length,
            // JSON-LD 페이로드 억제 — 상위 100편만 나열 (전체 URL은 sitemap.xml이 커버)
            itemListElement: monologues.slice(0, 100).map((m, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `${m.role} - ${m.work} 독백 대사`,
              url: `${SITE_URL}/monologues/${m.id}`,
            })),
          },
          // AEO — 하단 문답 섹션과 동일 데이터의 FAQPage (AI 검색엔진 인용용)
          buildFaqPage(
            MONOLOGUE_FAQ.map((f) => ({ q: f.q, a: f.a.replace('{count}', String(totalCount)) })),
            `${SITE_URL}/monologues`,
          ),
        ]}
      />

      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 700,
            color: 'var(--navy-deep)',
            marginBottom: 8,
          }}
        >
          독백 대본 아카이브
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-warm)', fontSize: '0.95rem' }}>
          {hasFilter
            ? `오디션·연습용 독백 ${totalCount}편 중 ${monologues.length}편 — 배역·작품·장르·감정선으로 찾아보세요.`
            : `오디션·자유연기용 독백 대사·대본 ${totalCount}편 무료, 매주 새 대본 추가 — 남자·여자, 연령대·작품·장르·감정선으로 찾아보세요.`}
        </p>
      </header>

      {/* 필터 — 그룹별 레이블 + 구분선 (Apple HIG 스타일). sr-only h2 = 검색 키워드 헤딩 */}
      <section
        style={{
          marginBottom: 32,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        <h2 className="sr-only">성별로 찾기 — 남자독백 · 여자독백</h2>
        <FilterGroup label="성별" first>
          <FilterPill label="전체" href={buildHref(current, 'gender', undefined)} active={!gender} />
          <FilterPill label="여성" href={buildHref(current, 'gender', '여성')} active={gender === '여성'} />
          <FilterPill label="남성" href={buildHref(current, 'gender', '남성')} active={gender === '남성'} />
        </FilterGroup>

        <h2 className="sr-only">연령대별 독백 — 20대 독백 · 30대 독백 · 40대 독백 · 50대 독백</h2>
        <FilterGroup label="연령대">
          <FilterPill label="전체 연령" href={buildHref(current, 'age', undefined)} active={!age} />
          {AGE_OPTIONS.map((o) => (
            <FilterPill key={o.value} label={o.label} href={buildHref(current, 'age', o.value)} active={age === o.value} />
          ))}
        </FilterGroup>

        <h2 className="sr-only">매체별 독백 — 영화독백 · 드라마독백 · 연극독백 · 뮤지컬 독백</h2>
        <FilterGroup label="미디어">
          <FilterPill label="전체 미디어" href={buildHref(current, 'medium', undefined)} active={!medium} />
          {MEDIUM_OPTIONS.map((m) => (
            <FilterPill key={m} label={m} href={buildHref(current, 'medium', m)} active={medium === m} />
          ))}
        </FilterGroup>

        <h2 className="sr-only">장르별 독백 대본 — 드라마 · 멜로 · 코미디 · 스릴러 · 사극</h2>
        <FilterGroup label="장르">
          <FilterPill label="전체 장르" href={buildHref(current, 'genre', undefined)} active={!genre} />
          {GENRE_OPTIONS.map((g) => (
            <FilterPill key={g} label={g} href={buildHref(current, 'genre', g)} active={genre === g} />
          ))}
        </FilterGroup>
      </section>

      <MonologuesSearchGrid monologues={monologues} initialQuery={initialQuery} />

      {/* 하단 AEO 안내 섹션 — 질문 소제목 + 한 줄 답변 구조.
          AI 검색엔진(ChatGPT·퍼플렉시티)이 문답 단위로 인용하기 좋고 사람도 스캔하기 좋게.
          필터 상태와 무관하게 기본(전체) 페이지에서만 노출해 필터 페이지 중복 콘텐츠 방지 */}
      {!hasFilter && (
        <section
          aria-labelledby="monologue-guide-heading"
          style={{ marginTop: 72, paddingTop: 36, borderTop: '1px solid var(--border)' }}
        >
          <h2
            id="monologue-guide-heading"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--navy-deep)',
              marginBottom: 18,
            }}
          >
            독백 대본 아카이브, 이렇게 쓰세요
          </h2>
          {MONOLOGUE_FAQ.map((item) => (
            <div key={item.q} style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--navy-deep)',
                  marginBottom: 4,
                  wordBreak: 'keep-all',
                }}
              >
                {item.q}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  lineHeight: 1.8,
                  color: 'var(--text-warm)',
                  wordBreak: 'keep-all',
                }}
              >
                {item.q === RUN_BY_Q ? (
                  <>
                    서울 신촌의 마이즈너 테크닉 연기 스튜디오{' '}
                    <Link href="/about" style={{ color: 'var(--navy)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                      KD4 액팅 스튜디오
                    </Link>
                    가 직접 만듭니다. 독백 연습 다음 단계는{' '}
                    <Link href="/classes" style={{ color: 'var(--navy)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                      연기 클래스
                    </Link>
                    에서 카메라 앞 훈련으로 이어가세요.
                  </>
                ) : (
                  item.a.replace('{count}', String(totalCount))
                )}
              </p>
            </div>
          ))}
          <nav aria-label="독백 대본 바로가기" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SEO_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--navy)',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </section>
      )}
    </main>
  )
}
