/**
 * JSON-LD 구조화 데이터 — AEO/GEO 최적화
 * LocalBusiness + Organization + FAQPage + Course 스키마
 * AI 검색(ChatGPT, Perplexity, Google AI Overview)에서 KD4를 노출시키기 위함
 */
import { CLASSES } from '@/lib/classes'

const SITE_URL = 'https://kd4.club'

/** LocalBusiness + Organization */
function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'PerformingArtsTheater'],
    name: 'KD4 액팅 스튜디오',
    alternateName: 'KD4 Acting Studio',
    description:
      '서울 신촌 마이즈너 테크닉 기반 연기학원. 연기 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지 배우 액셀러레이팅 시스템.',
    url: SITE_URL,
    telephone: '+82-10-8564-0244',
    email: 'uikactors@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '이화여대1안길 12 아리움3차 1층 101호',
      addressLocality: '서울특별시',
      addressRegion: '서대문구',
      postalCode: '03760',
      addressCountry: 'KR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.5577,
      longitude: 126.9465,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '22:00',
    },
    sameAs: [
      'https://www.instagram.com/kd4actingstudio',
      'https://pf.kakao.com/_ximxdqn',
      'https://blog.naver.com/kd4actingstudio',
      'https://www.youtube.com/@kd4actingstudio',
    ],
    priceRange: '₩150,000 ~ ₩450,000',
    image: `${SITE_URL}/og-image.jpg`,
    founder: {
      '@type': 'Person',
      name: '권동원',
      jobTitle: '대표',
    },
  }
}

/** FAQPage — 메인 페이지 FAQ를 구조화 */
function getFaqSchema(faqItems: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

/** Course — 각 클래스를 Course 스키마로 */
function getCourseSchemas() {
  return CLASSES.map((cls) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${cls.nameKo} (${cls.nameEn})`,
    description: cls.quote,
    provider: {
      '@type': 'Organization',
      name: 'KD4 액팅 스튜디오',
      url: SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      price: cls.price.replace(/,/g, ''),
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
    ...(cls.instructor
      ? {
          instructor: {
            '@type': 'Person',
            name: cls.instructor,
          },
        }
      : {}),
    courseMode: 'Offline',
    locationCreated: {
      '@type': 'Place',
      name: 'KD4 액팅 스튜디오',
      address: '서울시 서대문구 이화여대1안길 12',
    },
  }))
}

interface JsonLdProps {
  faqItems?: { q: string; a: string }[]
}

export default function JsonLd({ faqItems }: JsonLdProps) {
  const localBusiness = getLocalBusinessSchema()
  const courses = getCourseSchemas()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      {faqItems && faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqSchema(faqItems)) }}
        />
      )}
      {courses.map((course, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(course) }}
        />
      ))}
    </>
  )
}
