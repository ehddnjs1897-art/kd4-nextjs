/**
 * SEO JSON-LD 헬퍼 — 페이지별 구조화 데이터
 *
 * 메인 LocalBusiness/FAQPage/Course 스키마는 components/seo/JsonLd.tsx 에 이미 있음.
 * 이 파일은 페이지별로 추가하는 동적 스키마 (Person, VideoObject 등) 헬퍼.
 */
import { SITE_URL } from './constants'

/**
 * 인스타그램 핸들 정규화 — 다양한 입력 형식을 정규 핸들로 변환.
 * @handle / https://www.instagram.com/handle / m.instagram.com/handle / ?igsh= 등 처리.
 * 유효하지 않은 핸들(경로 포함, 형식 불일치)이면 null 반환.
 */
export function normalizeInstagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^(?:www\.|m\.)?instagram\.com\//i, '')
    .replace(/[?#].*/, '')
    .replace(/\/$/, '')
    .replace(/^@/, '')
    .trim()
  // 인스타그램 아이디: 영문·숫자·점·밑줄, 1~30자
  if (!/^[A-Za-z0-9._]{1,30}$/.test(cleaned)) return null
  return cleaned
}

interface ActorPersonInput {
  id: string
  name: string
  /** 영문 이름 — 지식 그래프 alternateName 및 국제 검색 유입 */
  name_en?: string | null
  gender: '남' | '여' | null
  age_group: string | null
  height: number | null
  weight: number | null
  skills: string[] | null
  // email / phone: PII — JSON-LD에 출력하지 않으므로 타입에서도 제외
  instagram: string | null
  /** 대표 사진 URL (절대경로 권장) */
  imageUrl?: string
  /** 필모그래피 — actor_filmography 테이블 row */
  filmography?: { category?: string | null; title: string; role?: string | null; year?: number | null; production?: string | null; award?: string | null }[]
  /** 출연영상 youtube_id 배열 */
  videoYoutubeIds?: string[]
  /** Gemini 자동 분류 캐스팅 태그 (knowsAbout 매핑) */
  castingTags?: string[] | null
  /** Gemini 자동 생성 한 줄 캐스팅 요약 (description 보강) */
  castingSummary?: string | null
}

/**
 * 배우 상세 페이지 — Person + VideoObject(있으면)
 *
 * Google "people search" / Knowledge Graph 노출 가능성.
 * 한국어 배우명 + 출연작품으로 검색되면 KD4 배우 DB가 source로 잡힘.
 */
export function getActorPersonSchema(actor: ActorPersonInput) {
  if (!actor.name?.trim() || !actor.id?.trim()) return null

  const ageMap: Record<string, string> = { '20대': '20s', '30대': '30s', '40대': '40s', '50대 이상': '50+' }

  const ageDesc = actor.age_group ? `${actor.age_group} ` : ''
  const genderDesc = actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'

  // description: Gemini casting_summary 우선 → 없으면 기본 텍스트
  const description = actor.castingSummary?.trim()
    ? `${actor.name} — ${actor.castingSummary}`
    : `${actor.name} — KD4 액팅 스튜디오 ${ageDesc}${genderDesc}`

  const personSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/actors/${actor.id}#person`,
    name: actor.name,
    ...(actor.name_en?.trim() ? { alternateName: actor.name_en.trim() } : {}),
    url: `${SITE_URL}/actors/${actor.id}`,
    jobTitle: ['배우', 'Actor'],
    description,
    gender: actor.gender === '남' ? 'Male' : actor.gender === '여' ? 'Female' : undefined,
    affiliation: {
      '@type': 'Organization',
      '@id': `${SITE_URL}#org`,
      name: 'KD4 액팅 스튜디오',
      url: SITE_URL,
    },
    // alumniOf — KD4에서 훈련한 배우임을 지식 그래프에 명시 (#school ↔ #person 양방향 연결)
    alumniOf: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}#school`,
      name: 'KD4 액팅 스튜디오',
      url: SITE_URL,
    },
  }

  // placeholder SVG는 Google rich result에 사용 불가 — 실제 이미지만 포함
  if (actor.imageUrl && !actor.imageUrl.endsWith('.svg')) personSchema.image = actor.imageUrl
  if (actor.height) personSchema.height = { '@type': 'QuantitativeValue', value: actor.height, unitCode: 'CMT' }
  if (actor.weight) personSchema.weight = { '@type': 'QuantitativeValue', value: actor.weight, unitCode: 'KGM' }

  // 직업 명시 — Google 지식 그래프 "배우" 직업 인식 강화
  personSchema.hasOccupation = {
    '@type': 'Occupation',
    name: '배우',
    alternateName: 'Actor',
    occupationLocation: { '@type': 'Country', name: '대한민국' },
  }

  // 국적 — 한국 배우임을 명시 (다국어 검색 유입 + 지식 그래프)
  personSchema.nationality = { '@type': 'Country', name: '대한민국' }

  // knowsAbout — skills + casting_tags 합쳐 SEO 강화 (중복 제거)
  const knowsAbout = new Set<string>()
  if (actor.skills) for (const s of actor.skills) knowsAbout.add(s)
  if (actor.castingTags) for (const t of actor.castingTags) knowsAbout.add(t)
  if (knowsAbout.size > 0) personSchema.knowsAbout = Array.from(knowsAbout)

  // 한국어 + 영문 ID 매핑 (필요 시)
  if (actor.age_group && ageMap[actor.age_group]) {
    personSchema.additionalProperty = [
      { '@type': 'PropertyValue', name: 'ageGroup', value: actor.age_group },
    ]
  }

  // sameAs — 외부 플랫폼만 (자기 url은 url 필드로 이미 있음 — 자기참조 중복 금지)
  const igHandle = normalizeInstagramHandle(actor.instagram)
  if (igHandle) personSchema.sameAs = [`https://www.instagram.com/${igHandle}/`]

  // 수상 이력 → award (수상만, 후보·노미네이션 제외)
  if (actor.filmography && actor.filmography.length > 0) {
    const awardStrings = actor.filmography
      .map((f) => f.award?.trim())
      .filter((a): a is string => !!a && /(수상|대상|그랑프리|최우수|우수상|신인상|연기상|작품상|남우|여우|특별상|심사위원|감독상|인기상)/.test(a) && !/(후보|노미네이트|노미네이션|nominee|nominat)/i.test(a))
    if (awardStrings.length > 0) personSchema.award = awardStrings
  }

  // 필모그래피 → performerIn (카테고리별 세부 타입)
  // schema.org 권장 매핑: drama→TVSeries, film→Movie, musical→MusicEvent, theater→TheaterEvent, cf/etc→CreativeWork
  const categoryTypeMap: Record<string, string> = {
    drama: 'TVSeries',
    film: 'Movie',
    musical: 'MusicEvent',
    theater: 'TheaterEvent',
  }
  if (actor.filmography && actor.filmography.length > 0) {
    personSchema.performerIn = actor.filmography.slice(0, 10).map((f) => ({
      '@type': categoryTypeMap[f.category as string] ?? 'CreativeWork',
      name: f.title,
      ...(f.year ? { datePublished: String(f.year) } : {}),
      ...(f.production ? { producer: { '@type': 'Organization', name: f.production } } : {}),
    }))
  }

  return personSchema
}

/**
 * 출연영상 — VideoObject (배우 상세에 inline)
 *
 * uploadDate 미상 시 키 자체를 omit (Google이 undefined 키를 missing required로 판정).
 * title이 있으면 영상마다 고유한 name/description으로 boilerplate 회피.
 */
interface ActorVideoInput {
  youtubeId: string
  title?: string | null
  /** ISO8601 — actor_videos.created_at 같은 값 (있으면 채울 것) */
  uploadDate?: string | null
}

export function getActorVideoSchemas(
  actor: { id: string; name: string },
  videos: ActorVideoInput[]
) {
  return videos
    .filter((v) => Boolean(v.youtubeId))
    .map((v) => {
      const videoName = v.title?.trim() ? `${actor.name} — ${v.title}` : `${actor.name} 배우 출연영상`
      const videoDesc = v.title?.trim()
        ? `${actor.name} 배우의 출연영상: ${v.title} — KD4 액팅 스튜디오 포트폴리오`
        : `${actor.name} — KD4 액팅 스튜디오 출연영상 포트폴리오`

      const schema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: videoName,
        description: videoDesc,
        thumbnailUrl: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
        contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
        publisher: {
          '@type': 'Organization',
          name: 'KD4 액팅 스튜디오',
          url: SITE_URL,
        },
      }

      // Google VideoObject rich result requires uploadDate — fall back to floor date if unknown
      schema.uploadDate = v.uploadDate ?? '2024-01-01'

      return schema
    })
}

/**
 * ProfilePage — 배우 상세 페이지 래퍼 (Google People 검색 결과 노출 강화)
 * Person 엔티티를 mainEntity로 참조. @id는 Person의 #person과 쌍을 이룸.
 */
export function getActorProfilePageSchema(actor: {
  id: string
  name: string
  description?: string
  /** ISO8601 timestamp — actors.updated_at (신선도 신호) */
  updatedAt?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/actors/${actor.id}#page`,
    url: `${SITE_URL}/actors/${actor.id}`,
    name: `${actor.name} 배우 프로필 — KD4 액팅 스튜디오`,
    ...(actor.description ? { description: actor.description } : {}),
    inLanguage: 'ko',
    ...(actor.updatedAt ? { dateModified: actor.updatedAt } : {}),
    isPartOf: { '@id': `${SITE_URL}#website` },
    mainEntity: { '@id': `${SITE_URL}/actors/${actor.id}#person` },
  }
}

/**
 * <script type="application/ld+json"> 직렬화 헬퍼
 * </script> 시퀀스를 Unicode 이스케이프로 치환 — JSON-LD XSS 방지
 * (JSON.stringify 단독 사용 시 </script> 포함 데이터가 스크립트 블록을 탈출 가능)
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
}
