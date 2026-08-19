/**
 * JSON-LD 구조화 데이터 — AEO/GEO 최적화
 * WebSite + Organization + EducationalOrganization + Person(권동원) + LocalBusiness
 * AI 검색(ChatGPT, Perplexity, Google AI Overview)에서 KD4를 노출시키기 위함
 *
 * @id 체계 (그래프 연결):
 *   - kd4.club#website  → WebSite
 *   - kd4.club#org      → Organization
 *   - kd4.club#school   → EducationalOrganization
 *   - kd4.club#local    → LocalBusiness
 *   - kd4.club#dongwon  → Person (권동원)
 *
 * FAQPage·Course는 각 페이지 PageJsonLd에서만 출력 (Google 가이드: 보이는 콘텐츠와 일치 필요)
 */
import {
  buildOrganization,
  buildEducationalOrganization,
  buildPersonDongwon,
} from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
import { serializeJsonLd } from '@/lib/seo'

/** LocalBusiness + EducationalOrganization — 실제 매장 위치.
 *  극장(PerformingArtsTheater)이 아니라 학원이라 업종 타입을 교정 (2026-08-19). */
function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': `${SITE_URL}#local`,
    name: 'KD4 액팅 스튜디오',
    alternateName: 'KD4 Acting Studio',
    description:
      '서울 신촌 마이즈너 테크닉 기반 연기학원. 연기 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지 배우의 성장을 운영하는 시스템.',
    url: SITE_URL,
    telephone: '+82-10-8564-0244',
    email: 'uikactors@gmail.com',
    parentOrganization: { '@id': `${SITE_URL}#org` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '이화여대1안길 12 아리움3차 1층 101호',
      addressLocality: '서대문구',
      addressRegion: '서울특별시',
      postalCode: '03760',
      addressCountry: 'KR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.5577,
      longitude: 126.9465,
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '22:00',
    }],
    sameAs: [
      'https://www.instagram.com/kd4actingstudio',
      'https://pf.kakao.com/_ximxdqn',
      'https://blog.naver.com/kd4actingstudio',
      'https://www.youtube.com/@kd4actingstudio',
    ],
    priceRange: '₩150,000 ~ ₩450,000',
    image: `${SITE_URL}/og-image.jpg`,
    founder: { '@id': `${SITE_URL}#dongwon` },
    hasMap: 'https://maps.google.com/maps?q=37.5577,126.9465',
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/sinchon-acting-academy#webpage` },
  }
}

// Course·FAQPage는 각 페이지(PageJsonLd)에서만 출력 — 글로벌 중복 선언 방지

/** WebSite schema — 사이트 식별자(#website). 다른 페이지의 WebPage가 isPartOf로 참조한다.
 *  SearchAction(Sitelinks Searchbox)은 제거 — /actors?q= 가 실제로 서버 검색을 하지 않아
 *  선언대로 동작하지 않는 액션이었다(동작하는 검색 URL이 생기면 다시 넣을 것). */
function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: 'KD4 액팅 스튜디오',
    url: SITE_URL,
  }
}

export default function JsonLd() {
  const website = getWebSiteSchema()
  const organization = buildOrganization()
  const school = buildEducationalOrganization()
  const localBusiness = getLocalBusinessSchema()
  // 기본 Person — #dongwon @id를 모든 페이지에서 확정 (Organization.founder 참조 해소).
  // 상세 이력(필모·수상·학력)은 acting-coach 페이지의 buildPersonDongwonDetailed()에서만 출력.
  const person = buildPersonDongwon()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(school) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(person) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(localBusiness) }}
      />
    </>
  )
}
