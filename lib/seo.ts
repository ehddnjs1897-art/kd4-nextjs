/**
 * SEO JSON-LD 헬퍼 — 페이지별 구조화 데이터
 *
 * 메인 LocalBusiness/FAQPage/Course 스키마는 components/seo/JsonLd.tsx 에 이미 있음.
 * 이 파일은 페이지별로 추가하는 동적 스키마 (Person, VideoObject 등) 헬퍼.
 */

const SITE_URL = 'https://kd4.club'

interface ActorPersonInput {
  id: string
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  height: number | null
  weight: number | null
  skills: string[] | null
  email: string | null
  phone: string | null
  instagram: string | null
  /** 대표 사진 URL (절대경로 권장) */
  imageUrl?: string
  /** 필모그래피 — actor_filmography 테이블 row */
  filmography?: { title: string; role?: string | null; year?: number | null; production?: string | null }[]
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
    name: actor.name,
    url: `${SITE_URL}/actors/${actor.id}`,
    jobTitle: ['배우', 'Actor'],
    description,
    gender: actor.gender === '남' ? 'Male' : actor.gender === '여' ? 'Female' : undefined,
    affiliation: {
      '@type': 'Organization',
      name: 'KD4 액팅 스튜디오',
      url: SITE_URL,
    },
  }

  if (actor.imageUrl) personSchema.image = actor.imageUrl
  if (actor.height) personSchema.height = `${actor.height} cm`
  if (actor.weight) personSchema.weight = `${actor.weight} kg`

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

  // SNS — 공개된 인스타그램만 (이메일/전화는 PII 보호 차원에서 제외)
  if (actor.instagram) {
    personSchema.sameAs = [actor.instagram.startsWith('http') ? actor.instagram : `https://instagram.com/${actor.instagram.replace(/^@/, '')}`]
  }

  // 필모그래피 → performerIn (creativeWork)
  if (actor.filmography && actor.filmography.length > 0) {
    personSchema.performerIn = actor.filmography.slice(0, 10).map((f) => ({
      '@type': 'CreativeWork',
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

      if (v.uploadDate) schema.uploadDate = v.uploadDate

      return schema
    })
}

/**
 * <script type="application/ld+json"> 직렬화 헬퍼
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
}
