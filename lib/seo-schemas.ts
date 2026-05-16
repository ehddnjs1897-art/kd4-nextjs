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
