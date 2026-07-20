/**
 * 페이지별 JSON-LD 라벨 빌더
 *
 * 사이트 전체 공통(Organization·EducationalOrganization·Person)은
 * components/seo/JsonLd.tsx 에서 한 번만 렌더.
 *
 * @id 식별자는 사이트 전체에서 일관되게 사용:
 *   - '#org'      → Organization (사이트 식별자)
 *   - '#school'   → EducationalOrganization (학원 식별자)
 *   - '#local'    → LocalBusiness (실제 매장 위치)
 *   - '#dongwon'  → Person (권동원 대표)
 */
import type { ClassItem } from './classes'
import { DIRECTOR, SEBIN, HYUNJAE, PROMO_DEADLINE } from './classes'
import { SITE_URL } from './constants'

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '이화여대1안길 12 아리움3차 1층 101호',
  addressLocality: '서대문구',
  addressRegion: '서울특별시',
  postalCode: '03760',
  addressCountry: 'KR',
} as const

const SAMEAS = [
  'https://www.instagram.com/kd4actingstudio',
  'https://pf.kakao.com/_ximxdqn',
  'https://blog.naver.com/kd4actingstudio',
  'https://www.youtube.com/@kd4actingstudio',
] as const

/** Organization — 사이트 전체 식별자 (다른 schema가 @id로 참조) */
export function buildOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#org`,
    name: 'KD4 액팅 스튜디오',
    alternateName: 'KD4 Acting Studio',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/heart-logo.png`,
      width: 400,
      height: 400,
    },
    image: `${SITE_URL}/og-image.jpg`,
    description:
      '서울 신촌 마이즈너 테크닉 기반 연기학원. 마이즈너 정규 클래스·출연영상 제작·캐스팅 연계 운영.',
    sameAs: [...SAMEAS],
    address: ADDRESS,
    founder: { '@id': `${SITE_URL}#dongwon` },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+82-10-8564-0244',
      contactType: 'customer service',
      areaServed: 'KR',
      availableLanguage: 'Korean',
    },
    email: 'uikactors@gmail.com',
    knowsAbout: ['마이즈너 테크닉', '연기 훈련', '출연영상 제작', '캐스팅', '배우 성장 운영', 'Actor Operating System'],
    areaServed: [
      { '@type': 'City', name: '서울특별시' },
      { '@type': 'City', name: '신촌' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'KD4 연기 클래스 전체 목록',
      url: `${SITE_URL}/classes`,
    },
    location: { '@id': `${SITE_URL}#local` },
    subOrganization: [{ '@id': `${SITE_URL}#school` }],
  }
}

/** EducationalOrganization — "우리는 학원이다" 명시 (LocalBusiness만으로는 부족) */
export function buildEducationalOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE_URL}#school`,
    name: 'KD4 액팅 스튜디오',
    alternateName: 'KD4 Acting Studio',
    description:
      '마이즈너 테크닉 기반의 연기 훈련, 출연영상 포트폴리오 제작, 캐스팅 연계를 운영하는 서울 신촌의 연기학원.',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/heart-logo.png`,
      width: 400,
      height: 400,
    },
    image: `${SITE_URL}/og-image.jpg`,
    address: ADDRESS,
    founder: { '@id': `${SITE_URL}#dongwon` },
    sameAs: [...SAMEAS],
    areaServed: ['서울특별시', '서대문구', '신촌', '이화여대', '아현', '충정로'],
    knowsAbout: ['마이즈너 테크닉', '연기 훈련', '출연영상 포트폴리오', '오디션 준비', '캐스팅 연계'],
    telephone: '+82-10-8564-0244',
    email: 'uikactors@gmail.com',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '22:00',
      },
    ],
    parentOrganization: { '@id': `${SITE_URL}#org` },
  }
}

/** Person — 권동원 사이트 전체 식별자 */
export function buildPersonDongwon() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#dongwon`,
    name: DIRECTOR.name,
    alternateName: 'Kwon Dongwon',
    jobTitle: ['액팅 코치', '연기 강사', '배우', 'KD4 대표'],
    gender: 'Male',
    nationality: { '@type': 'Country', name: '대한민국' },
    url: `${SITE_URL}/acting-coaches#dongwon`,
    image: `${SITE_URL}${DIRECTOR.photo}`,
    worksFor: { '@id': `${SITE_URL}#org` },
    knowsAbout: [
      '마이즈너 테크닉',
      '이바나 처벅 테크닉',
      '연기 코칭',
      '캐스팅',
      '연기 훈련',
    ],
    knowsLanguage: ['Korean', 'English'],
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/acting-coaches#webpage` },
    sameAs: [...SAMEAS],
  }
}

/** Person — 권동원 상세 (코치 페이지 전용, alumniOf·award·performerIn 포함) */
export function buildPersonDongwonDetailed() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#dongwon`,
    name: DIRECTOR.name,
    alternateName: 'Kwon Dongwon',
    jobTitle: ['액팅 코치', '연기 강사', '배우', 'KD4 대표'],
    gender: 'Male',
    nationality: { '@type': 'Country', name: '대한민국' },
    description:
      'KD4 액팅 스튜디오 대표. 마이즈너 테크닉 액팅 코치이자 현역 배우로 Disney+ 무빙2, Netflix 중증외상센터 등에 출연 중.',
    url: `${SITE_URL}/acting-coaches#dongwon`,
    image: `${SITE_URL}${DIRECTOR.photo}`,
    worksFor: { '@id': `${SITE_URL}#org` },
    knowsAbout: [
      '마이즈너 테크닉',
      '이바나 처벅 테크닉',
      '연기 코칭',
      '캐스팅',
      '오디션 독백',
    ],
    hasOccupation: [
      { '@type': 'Occupation', name: '배우', alternateName: 'Actor', occupationLocation: { '@type': 'Country', name: '대한민국' } },
      { '@type': 'Occupation', name: '액팅 코치', alternateName: 'Acting Coach', occupationLocation: { '@type': 'Country', name: '대한민국' } },
    ],
    alumniOf: [
      { '@type': 'EducationalOrganization', name: 'LA Meisner Workshop' },
      { '@type': 'EducationalOrganization', name: '한국 마이즈너테크닉 아카데미' },
      { '@type': 'EducationalOrganization', name: '건명원' },
      { '@type': 'EducationalOrganization', name: 'The Chora' },
    ],
    award: [...DIRECTOR.credentials.awards],
    performerIn: [
      ...DIRECTOR.filmography.drama.map((title) => ({
        '@type': 'CreativeWork',
        name: title,
      })),
      ...DIRECTOR.filmography.film.map((title) => ({
        '@type': 'Movie',
        name: title,
      })),
    ],
    knowsLanguage: ['Korean', 'English'],
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/acting-coaches#webpage` },
    sameAs: [...SAMEAS],
  }
}

/** Person — 주세빈 상세 (코치 페이지 전용, alumniOf·performerIn 포함) */
export function buildPersonSebinDetailed() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#sebin`,
    name: SEBIN.name,
    alternateName: SEBIN.nameEn,
    jobTitle: ['액팅 코치', '연기 강사', '배우'],
    gender: 'Female',
    nationality: { '@type': 'Country', name: '대한민국' },
    description: 'KD4 오디션 테크닉 클래스 강사이자 현역 배우. TV조선 닥터신 주연 등 다수 드라마·연극·CF 출연.',
    url: `${SITE_URL}/acting-coaches#sebin`,
    image: `${SITE_URL}${SEBIN.photo}`,
    worksFor: { '@id': `${SITE_URL}#org` },
    knowsAbout: ['오디션 테크닉', '오디션 독백', '연기 코칭', '캐스팅'],
    hasOccupation: [
      { '@type': 'Occupation', name: '배우', alternateName: 'Actor', occupationLocation: { '@type': 'Country', name: '대한민국' } },
      { '@type': 'Occupation', name: '액팅 코치', alternateName: 'Acting Coach', occupationLocation: { '@type': 'Country', name: '대한민국' } },
    ],
    alumniOf: [
      { '@type': 'EducationalOrganization', name: '동국대학교 연극영화과' },
    ],
    performerIn: [
      ...(SEBIN.filmographySections.find((sec) => sec.label === 'DRAMA')?.items ?? []).map((title) => ({ '@type': 'CreativeWork', name: title })),
      ...(SEBIN.filmographySections.find((sec) => sec.label === 'PLAY')?.items ?? []).map((title) => ({ '@type': 'TheaterEvent', name: title })),
    ],
    knowsLanguage: ['Korean', 'English'],
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/acting-coaches#webpage` },
    sameAs: [...SAMEAS],
  }
}

/** Person — 이현재 상세 (코치 페이지 전용) */
export function buildPersonHyunjaeDetailed() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#hyunjae`,
    name: HYUNJAE.name,
    alternateName: HYUNJAE.nameEn,
    jobTitle: ['액팅 코치', '연기 강사', '배우'],
    gender: 'Male',
    nationality: { '@type': 'Country', name: '대한민국' },
    description: 'KD4 액팅 코치이자 현역 배우. 중국 iQIYI 영화부문 신인상(한국인 최초) 수상, 한국과 중화권 영화·드라마 다수 출연.',
    url: `${SITE_URL}/acting-coaches#hyunjae`,
    image: `${SITE_URL}${HYUNJAE.photo}`,
    worksFor: { '@id': `${SITE_URL}#org` },
    knowsAbout: ['연기 코칭', '연기 훈련'],
    hasOccupation: [
      { '@type': 'Occupation', name: '배우', alternateName: 'Actor', occupationLocation: { '@type': 'Country', name: '대한민국' } },
      { '@type': 'Occupation', name: '액팅 코치', alternateName: 'Acting Coach', occupationLocation: { '@type': 'Country', name: '대한민국' } },
    ],
    alumniOf: [
      { '@type': 'EducationalOrganization', name: '청주대학교 예술대학원 연극영화학과' },
    ],
    award: [...(HYUNJAE.awards ?? [])],
    performerIn: [
      ...(HYUNJAE.filmographySections.find((sec) => sec.label === 'OVERSEAS FILM & DRAMA')?.items ?? []).map((title) => ({ '@type': 'CreativeWork', name: title })),
      ...(HYUNJAE.filmographySections.find((sec) => sec.label === 'KOREA FILM & DRAMA')?.items ?? []).map((title) => ({ '@type': 'CreativeWork', name: title })),
    ],
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/acting-coaches#webpage` },
    sameAs: [...SAMEAS],
  }
}

/** BreadcrumbList — 페이지 네비 구조 (검색결과 빵부스러기 노출) */
export function buildBreadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

/** FAQPage — 페이지 FAQ 데이터를 검색엔진용 라벨로 */
export function buildFaqPage(items: { q: string; a: string }[], pageUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(pageUrl ? { '@id': `${pageUrl}#faq` } : {}),
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** WebPage — inLanguage + isPartOf 포함 표준 웹페이지 스키마 빌더 */
export function buildWebPage(opts: {
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'ItemPage' | 'ProfilePage'
  /** 전체 @id (fragments 포함), 예: '/about#webpage' */
  idPath: string
  url: string
  name: string
  description?: string
  /** AboutPage용 subject entity */
  about?: { '@id': string }
  /** ProfilePage용 mainEntity */
  mainEntity?: { '@id': string }
  /** 마지막 콘텐츠 수정일 (ISO 8601 날짜 문자열, 예: '2026-06-11') */
  dateModified?: string
  /** AEO/음성검색용 — 페이지에서 읽어줄 핵심 CSS 셀렉터 목록 */
  speakableCssSelectors?: string[]
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': opts.type ?? 'WebPage',
    '@id': `${SITE_URL}${opts.idPath}`,
    url: opts.url,
    name: opts.name,
    inLanguage: 'ko',
    isPartOf: { '@id': `${SITE_URL}#website` },
  }
  if (opts.description) schema.description = opts.description
  if (opts.about) schema.about = opts.about
  if (opts.mainEntity) schema.mainEntity = opts.mainEntity
  if (opts.dateModified) schema.dateModified = opts.dateModified
  if (opts.speakableCssSelectors?.length) {
    schema.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: opts.speakableCssSelectors,
    }
  }
  return schema
}

/** Course — ClassItem을 상세 Course 라벨로 변환 */
export function buildCourseFromClass(cls: ClassItem, opts: { url: string; image?: string }) {
  const desc = [cls.quote, ...cls.bullets].join(' · ')
  const courseSlug = cls.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
  const capacityNum = parseInt(cls.capacity)
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${opts.url}#course-${courseSlug}`,
    name: `${cls.nameKo} (${cls.nameEn})`,
    description: desc,
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    provider: { '@id': `${SITE_URL}#school` },
    teaches: cls.bullets,
    audience: {
      '@type': 'Audience',
      audienceType: cls.isHobby ? '취미 연기 입문자' : '배우 지망생·현역 배우',
      geographicArea: { '@type': 'Country', name: '대한민국' },
    },
    offers: {
      '@type': 'Offer',
      price: Number(cls.price.replace(/,/g, '')),
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      category: 'Paid',
      url: opts.url,
      ...(cls.originalPrice ? { priceValidUntil: PROMO_DEADLINE } : {}),
    },
    ...(cls.instructor ? { instructor: { '@id': `${SITE_URL}#dongwon` } } : {}),
    potentialAction: {
      '@type': 'RegisterAction',
      target: `${SITE_URL}/join`,
    },
    courseMode: 'Onsite',
    inLanguage: 'ko',
    educationalLevel: cls.isHobby ? 'Beginner' : 'Intermediate',
    locationCreated: {
      '@type': 'Place',
      name: 'KD4 액팅 스튜디오',
      address: ADDRESS,
    },
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'Onsite',
        ...(cls.instructor ? { instructor: { '@id': `${SITE_URL}#dongwon` } } : {}),
        inLanguage: 'ko',
        courseWorkload: `${cls.schedule} · 회당 ${cls.duration}`,
        ...(Number.isFinite(capacityNum) ? { maximumAttendeeCapacity: capacityNum } : {}),
        location: {
          '@type': 'Place',
          name: 'KD4 액팅 스튜디오',
          address: ADDRESS,
        },
      },
    ],
  }
}
