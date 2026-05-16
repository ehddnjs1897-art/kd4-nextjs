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
import { DIRECTOR } from './classes'

const SITE_URL = 'https://kd4.club'

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '이화여대1안길 12 아리움3차 1층 101호',
  addressLocality: '서울특별시',
  addressRegion: '서대문구',
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
    logo: `${SITE_URL}/heart-logo.png`,
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
    logo: `${SITE_URL}/heart-logo.png`,
    image: `${SITE_URL}/og-image.jpg`,
    address: ADDRESS,
    founder: { '@id': `${SITE_URL}#dongwon` },
    sameAs: [...SAMEAS],
    areaServed: ['서울특별시', '서대문구', '신촌', '이화여대', '아현', '충정로'],
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
    image: `${SITE_URL}${DIRECTOR.photo}`,
    worksFor: { '@id': `${SITE_URL}#org` },
    knowsAbout: [
      '마이즈너 테크닉',
      '이바나 처벅 테크닉',
      '연기 코칭',
      '캐스팅',
      '연기 훈련',
    ],
    sameAs: [
      'https://www.instagram.com/kd4actingstudio',
      'https://www.youtube.com/@kd4actingstudio',
    ],
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
    description:
      'KD4 액팅 스튜디오 대표. 마이즈너 테크닉 액팅 코치이자 현역 배우로 Disney+ 무빙2, Netflix 중증외상센터 등에 출연 중.',
    url: `${SITE_URL}/acting-coach-dongwon-kwon`,
    image: `${SITE_URL}${DIRECTOR.photo}`,
    worksFor: { '@id': `${SITE_URL}#org` },
    knowsAbout: [
      '마이즈너 테크닉',
      '이바나 처벅 테크닉',
      '연기 코칭',
      '캐스팅',
      '오디션 독백',
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
export function buildFaqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Course — ClassItem을 상세 Course 라벨로 변환 */
export function buildCourseFromClass(cls: ClassItem, opts: { url: string }) {
  const desc = [cls.quote, ...cls.bullets].join(' · ')
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${cls.nameKo} (${cls.nameEn})`,
    description: desc,
    url: opts.url,
    provider: { '@id': `${SITE_URL}#school` },
    offers: {
      '@type': 'Offer',
      price: cls.price.replace(/,/g, ''),
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      url: opts.url,
    },
    ...(cls.instructor ? { instructor: { '@id': `${SITE_URL}#dongwon` } } : {}),
    courseMode: 'Offline',
    inLanguage: 'ko',
    educationalLevel: cls.isHobby ? 'Beginner' : 'Intermediate',
    locationCreated: {
      '@type': 'Place',
      name: 'KD4 액팅 스튜디오',
      address: ADDRESS,
    },
  }
}
