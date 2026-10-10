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

/** 기관(KD4) 공식 채널 — Organization·EducationalOrganization·LocalBusiness 전용.
 *  사람(Person) 노드에는 쓰지 않는다: 코치 Person이 KD4 기관 채널을 가리키면
 *  "이 사람 = KD4 인스타" 라는 잘못된 동일인 신호가 된다(2026-10-11 AEO 감사).
 *  당근은 프로필 정보가 사이트와 달라(업계 탑·notion 링크 등) 정정 전까지 넣지 않는다.
 *  TODO: 유튜브 채널 소개도 '홍대'로 적혀 있음 — 채널 정보 정정은 대표 화면 작업(AEO 감사 C2). */
export const ORG_SAMEAS = [
  'https://www.instagram.com/kd4actingstudio',
  'https://pf.kakao.com/_ximxdqn',
  'https://blog.naver.com/kd4actingstudio',
  'https://www.youtube.com/@kd4actingstudio',
  'https://map.naver.com/p/entry/place/2046656507',
  'https://place.map.kakao.com/702739563',
] as const

/** 브랜드 표기 이름 — #org·#school·#local 공통 (법인명 '유익액터스'는 #org에만) */
export const BRAND_ALT_NAMES = ['KD4 Acting Studio', 'KD4 액팅스튜디오'] as const

/** 신규 멤버가 아닌 수료자 전용 클래스 — 상담 폼(/join) 대신 카카오채널로 신청 (대표 2026-10-06) */
const KAKAO_CHANNEL = 'https://pf.kakao.com/_ximxdqn'
const KAKAO_APPLY_CLASSES = new Set(['출연영상 심화 클래스', '출연영상 1달 완성 클래스'])

/** Organization — 사이트 전체 식별자 (다른 schema가 @id로 참조) */
export function buildOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#org`,
    name: 'KD4 액팅 스튜디오',
    // 검색·AI가 같은 곳으로 묶어 읽도록 실제로 쓰이는 이름만 나열 (2026-10-11)
    alternateName: [...BRAND_ALT_NAMES, '유익액터스'],
    // 사업자 정보 — 사이트 푸터 공개값과 동일. 사업자 구조가 바뀌면 함께 갱신
    legalName: '유익액터스',
    taxID: '284-11-02669',
    disambiguatingDescription: '서울 서대문구 이대역 인근의 마이즈너 테크닉 기반 연기 스튜디오. 유익액터스가 운영한다.',
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
    sameAs: [...ORG_SAMEAS],
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
    alternateName: [...BRAND_ALT_NAMES],
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
    sameAs: [...ORG_SAMEAS],
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
      '연기 코칭',
      '캐스팅',
      '연기 훈련',
    ],
    knowsLanguage: ['Korean', 'English'],
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/acting-coaches#webpage` },
    // sameAs 없음 — 기관 채널을 사람에 붙이지 않는다(본인 확인된 개인 프로필만 추가)
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
    // sameAs 없음 — 기관 채널을 사람에 붙이지 않는다(본인 확인된 개인 프로필만 추가)
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
      ...(SEBIN.filmographySections.find((sec) => sec.label === 'PLAY')?.items ?? []).map((title) => ({ '@type': 'CreativeWork', name: title })),
    ],
    knowsLanguage: ['Korean', 'English'],
    subjectOf: { '@type': 'WebPage', '@id': `${SITE_URL}/acting-coaches#webpage` },
    // sameAs 없음 — 기관 채널을 사람에 붙이지 않는다(본인 확인된 개인 프로필만 추가)
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
    // sameAs 없음 — 기관 채널을 사람에 붙이지 않는다(본인 확인된 개인 프로필만 추가)
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

/** 독백 상세 — Article + 원작 CreativeWork 참조. 무료·한국어·원작 메타를 명시해 AI 검색 인용 대상이 되게 한다 */
export function buildMonologueArticle(m: {
  id: string
  role: string
  work: string
  medium: string
  genre: string
  target: string
  emotion: string
  body: string
  card_image_url: string | null
  created_at: string
  updated_at?: string | null
}) {
  const url = `${SITE_URL}/monologues/${m.id}`
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: `${m.role} - ${m.work} 독백 대사${m.target ? ` (${m.target})` : ''}`,
    description: `${m.medium}·${m.genre}${m.target ? ` ${m.target}` : ''} 독백 대본. ${(m.body ?? '').slice(0, 80)}`,
    url,
    mainEntityOfPage: url,
    inLanguage: 'ko',
    isAccessibleForFree: true,
    // author는 @id 참조만 두면 일부 검사기가 Organization 이름을 못 붙인다 — 인라인으로 명시
    author: { '@type': 'Organization', '@id': `${SITE_URL}#org`, name: 'KD4 액팅 스튜디오' },
    publisher: { '@id': `${SITE_URL}#org` },
    datePublished: m.created_at,
    dateModified: m.updated_at ?? m.created_at,
    isPartOf: { '@id': `${SITE_URL}/monologues#webpage` },
    mentions: [{ '@id': `${SITE_URL}/meisner-technique-class#course-meisner-technique-class` }],
  }
  if (m.genre) schema.genre = m.genre
  if (m.work) schema.about = { '@type': 'CreativeWork', name: m.work }
  if (m.card_image_url) schema.image = m.card_image_url
  return schema
}

/** 코치 이름 → 사이트 전역 Person @id (JsonLd.tsx·buildPerson*Detailed가 선언한 식별자) */
const COACH_ID: Record<string, string> = {
  권동원: '#dongwon',
  주세빈: '#sebin',
  이현재: '#hyunjae',
}

/**
 * classes.ts의 instructor 문자열("권동원 대표", "주세빈·이현재 강사")을 Person 라벨로.
 * 전역에 Person @id가 있는 코치는 @id 참조(중복 정의 금지), 없는 사람은 이름만 가진 Person.
 */
function buildInstructors(instructor: string) {
  const people = instructor
    .split('·')
    .map((raw) => raw.replace(/\s*(액팅\s*)?(대표|리더|강사|코치)(\s*·\s*액팅\s*코치)?\s*$/, '').trim())
    .filter(Boolean)
    .map((name) =>
      // 코치 상세 Person은 /acting-coaches에만 있어서 다른 페이지에선 @id만으로는 이름이 안 보인다 → 이름을 함께 둔다
      COACH_ID[name] ? { '@type': 'Person', '@id': `${SITE_URL}${COACH_ID[name]}`, name } : { '@type': 'Person', name }
    )
  if (people.length === 0) return undefined
  return people.length === 1 ? people[0] : people
}

/**
 * "월 4회" + "4시간" → ISO 8601 기간(PT16H, 월 단위 학습량).
 * 숫자를 못 읽는 값("상시", "영상 제작 전용", "일정 협의")은 키를 만들지 않는다 —
 * courseWorkload는 ISO 8601만 유효해서 한글 문구를 넣으면 구조화데이터 검사에서 에러.
 */
function buildCourseWorkload(schedule: string, duration: string): string | undefined {
  const sessions = schedule.match(/(\d+)\s*회/)
  const hours = duration.match(/(\d+)\s*시간/)
  if (!sessions || !hours) return undefined
  const total = Number(sessions[1]) * Number(hours[1])
  if (!Number.isFinite(total) || total <= 0) return undefined
  return `PT${total}H`
}

function registerTarget(cls: ClassItem, pageUrl: string): string | undefined {
  if (cls.isNewMemberOpen) return `${SITE_URL}/join`
  if (KAKAO_APPLY_CLASSES.has(cls.nameKo)) return KAKAO_CHANNEL
  if (cls.nameKo === '오디션 테크닉 클래스' && pageUrl.endsWith('/audition-technique-class')) return pageUrl
  return undefined
}

/** Course — ClassItem을 상세 Course 라벨로 변환 */
export function buildCourseFromClass(cls: ClassItem, opts: { url: string; image?: string }) {
  const desc = [cls.quote, ...cls.bullets].join(' · ')
  const courseSlug = cls.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
  const capacityNum = parseInt(cls.capacity)
  const instructors = cls.instructor ? buildInstructors(cls.instructor) : undefined
  const workload = buildCourseWorkload(cls.schedule, cls.duration)
  // 월 N회 클래스는 가격이 «월 수강료», courseWorkload가 «월 기준 수업 시간»이다 (2026-10-11 AEO F01)
  const monthly = /^월\s*\d+\s*회/.test(cls.schedule)
  const monthlyHours = workload ? Number(workload.replace(/\D/g, '')) : NaN
  const workloadNote = monthly && Number.isFinite(monthlyHours)
    ? `${cls.schedule} · 회당 ${cls.duration} · 월 ${monthlyHours}시간 기준${cls.course ? ` · ${cls.course}` : ''}`
    : undefined
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
      // 월 수강료임을 단위로 밝힌다 — 총 코스 금액은 계산해 넣지 않는다(일시납·할인은 정본 확인 사항)
      ...(monthly
        ? {
            description: `월 수강료 (${cls.schedule}${cls.course ? ` · ${cls.course}` : ''})`,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: Number(cls.price.replace(/,/g, '')),
              priceCurrency: 'KRW',
              unitCode: 'MON',
              unitText: '월',
              referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
            },
          }
        : {}),
      availability: 'https://schema.org/InStock',
      category: 'Paid',
      url: opts.url,
      ...(cls.originalPrice ? { priceValidUntil: PROMO_DEADLINE } : {}),
    },
    ...(instructors ? { instructor: instructors } : {}),
    // 신청 경로를 실제와 맞춘다: 신규 멤버 클래스 = 상담 폼, 수료자 전용 = 카카오채널,
    // 오디션 테크닉 = 페이지 안 신청 폼. 그 외(리더·움직임·개인 레슨)는 신청 경로가 정해지지 않아 생략
    ...(registerTarget(cls, opts.url)
      ? { potentialAction: { '@type': 'RegisterAction', target: registerTarget(cls, opts.url) } }
      : {}),
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
        ...(instructors ? { instructor: instructors } : {}),
        inLanguage: 'ko',
        // courseWorkload(ISO 8601)는 «월 기준» 수업 시간 — 총 코스 시간이 아님을 description이 함께 밝힌다
        ...(workload ? { courseWorkload: workload } : {}),
        ...(workloadNote ? { description: workloadNote } : {}),
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
