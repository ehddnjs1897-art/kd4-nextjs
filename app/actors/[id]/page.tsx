import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ActorTabs from '@/components/actors/ActorTabs'
import ShareButton from '@/components/actors/ShareButton'
import ActorDownloadButton from '@/components/actors/ActorDownloadButton'
import FavoriteButton from '@/components/actors/FavoriteButton'
import ActorDbLocked from '@/components/actors/ActorDbLocked'
import { UserRole } from '@/lib/types'
import { canViewActorContact, canViewActorDb, ACTOR_DB_PUBLIC_PROFILE, SHOW_CASTING_TAGS } from '@/lib/access'
import { getActorPersonSchema, getActorVideoSchemas, getActorProfilePageSchema, serializeJsonLd, normalizeInstagramHandle } from '@/lib/seo'
import { buildBreadcrumb } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

/* ---- 타입 정의 ---- */
interface Actor {
  id: string
  name: string
  name_en?: string | null
  gender: '남' | '여' | null
  age_group: string
  height: number | null
  weight: number | null
  skills: string[]
  advanced_skills: string[] | null
  dialects: string[] | null
  drive_photo_id: string | null
  storage_photo_path: string | null
  profile_photo: string | null
  updated_at?: string | null
  email: string | null
  phone: string | null
  instagram: string | null
  casting_tags: string[] | null
  casting_summary: string | null
  profile_pdf_url: string | null
  profile_doc_path: string | null
  is_public: boolean | null
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: FilmoEntry[]
}

interface ActorPhoto {
  id: string
  drive_photo_id: string | null
  url: string | null
  storage_path: string | null
  caption: string | null
  sort_order: number
  photo_type?: string | null
  label?: string | null
}

interface ActorVideo {
  id: string
  youtube_id: string | null
  r2_key: string | null
  title: string | null
  created_at?: string | null
  video_type?: string | null
}

interface FilmoEntry {
  id: string
  category: 'drama' | 'film' | 'cf' | 'musical' | 'theater' | 'etc'
  title: string
  role: string | null
  year: number | null
  production: string | null
  broadcaster?: string | null
  film_type?: string | null
  award?: string | null
}

const UUID_RE_ACTOR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* HERO 최근 출연 표기용 카테고리 라벨 — 방송사/구분 값이 없을 때 폴백 */
const HERO_CAT_LABEL: Record<FilmoEntry['category'], string> = {
  drama: '드라마', film: '영화', cf: 'CF', musical: '공연', theater: '공연', etc: '기타',
}

/* ---- 강제 동적 렌더링 — cookies() 사용으로 정적 사전 렌더 불가 ----
   generateStaticParams + createClient(cookies()) 조합은 빌드 시 cookies() 호출로
   Next.js가 오류를 throw하고 정적 404 페이지로 저장됨.
   force-dynamic으로 모든 요청을 서버에서 동적 처리 → 비로그인 접근 정상 작동.
   (2026-06-09 R288: 배우 상세 404 긴급 복구) */
export const dynamic = 'force-dynamic'

/* ---- 데이터 fetch (admin 클라이언트 — is_public 포함, 페이지에서 접근 제어) ---- */
function isUndefinedColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42703' || /column .* does not exist/i.test(err.message ?? '')
}

// 운영 DB에 일부 컬럼이 누락돼 있어도(마이그레이션 미적용) 상세 페이지가 죽지 않도록
// 단계적으로 select 컬럼을 줄여가며 재조회한다. (42703 → 다음 단계)
function actorSelect(opts: { casting: boolean; videoType: boolean; filmExtra: boolean; advancedSkills: boolean }): string {
  return `
      id, name, name_en, gender, age_group, height, weight, skills, is_public, updated_at,
      drive_photo_id, storage_photo_path, profile_photo, email, phone, instagram, profile_doc_path${
        opts.casting ? ',\n      casting_tags, casting_summary, profile_pdf_url' : ''
      }${opts.advancedSkills ? ',\n      advanced_skills' : ''},
      actor_photos ( id, drive_photo_id, url, storage_path, caption, sort_order, photo_type, label ),
      actor_videos ( id, youtube_id, r2_key, title${opts.videoType ? ', video_type' : ''} ),
      actor_filmography ( id, category, title, role, year, production${
        opts.filmExtra ? ', broadcaster, film_type, award' : ''
      } )
    `
}

async function getActor(id: string): Promise<Actor | null> {
  const core = await getActorCore(id)
  if (!core) return null
  // dialects(사투리)는 신규 컬럼 — 정교한 폴백을 건드리지 않도록 별도 안전 조회.
  // 마이그레이션 미실행이면 컬럼 없음 → 빈 배열(표시 안 함).
  let dialects: string[] = []
  try {
    const dq = await supabaseAdmin.from('actors').select('dialects').eq('id', id).maybeSingle()
    const d = (dq.data as { dialects?: unknown } | null)?.dialects
    if (!dq.error && Array.isArray(d)) dialects = d.filter((x): x is string => typeof x === 'string')
  } catch { /* 컬럼 미존재 등 — 무시 */ }
  return { ...core, dialects } as Actor
}

async function getActorCore(id: string, allowPrivate = false): Promise<Actor | null> {
  // R298 핵심 수정: 2-step 쿼리로 RLS 우회 문제 해결
  // — 1단계: is_public=true 조건 추가 → admin/anon 모두 공개 배우 조회 가능
  // — 2단계: 공개 조회 실패 AND allowPrivate=true(오너/관리자)면 조건 없이 재조회
  // 배경: 프로덕션에서 SUPABASE_SERVICE_ROLE_KEY 미설정 시 admin client가 anon으로 동작,
  //       is_public 필터 없는 조회가 RLS에 막혀 null 반환했던 문제 근본 해결.
  const fetchWith = (cols: string, publicOnly = true) => {
    const q = supabaseAdmin.from('actors').select(cols).eq('id', id)
    return (publicOnly ? q.eq('is_public', true) : q).maybeSingle()
  }

  // 공개 배우 1차 조회 (is_public=true 조건 포함)
  const result = await _queryActorWithFallbacks(id, fetchWith)
  if (result) return result

  // 공개 조회 실패 AND allowPrivate=true(오너/관리자) → is_public 조건 없이 재조회
  if (allowPrivate) {
    console.warn(`[ActorDetail] 공개 조회 null — allowPrivate 모드로 재시도 (id=${id})`)
    const fetchWithoutPublicFilter = (cols: string) =>
      supabaseAdmin.from('actors').select(cols).eq('id', id).maybeSingle()
    return _queryActorWithFallbacks(id, fetchWithoutPublicFilter)
  }

  console.error(`[ActorDetail] getActorCore(${id}): 공개 배우 조회 null — DB에 없거나 is_public=false`)
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActorFetcher = (cols: string) => PromiseLike<{ data: any; error: { code?: string; message?: string } | null }>

// 컬럼 호환성 폴백 cascade (공개/비공개 공통)
async function _queryActorWithFallbacks(
  id: string,
  fetchWith: ActorFetcher
): Promise<Actor | null> {
  // 1차: 전체 스키마 (advanced_skills 포함)
  const full = await fetchWith(actorSelect({ casting: true, videoType: true, filmExtra: true, advancedSkills: true }))
  if (full.data) return full.data as unknown as Actor
  if (!full.error) return null
  console.error(`[ActorDetail] _queryActorWithFallbacks(${id}): DB 오류 code=${full.error.code} message=${full.error.message}`)
  if (!isUndefinedColumnError(full.error)) return null

  // 1.5차: advanced_skills만 누락된 경우
  console.warn('[ActorDetail] advanced_skills 컬럼 미존재 — 제외하고 재조회')
  const noAdvanced = await fetchWith(actorSelect({ casting: true, videoType: true, filmExtra: true, advancedSkills: false }))
  if (noAdvanced.data) return { ...(noAdvanced.data as unknown as Record<string, unknown>), advanced_skills: null } as unknown as Actor
  if (!noAdvanced.error) return null
  if (!isUndefinedColumnError(noAdvanced.error)) return null

  // 2차: video_type 컬럼 미존재 대응
  console.warn('[ActorDetail] 확장 컬럼 미존재 — video_type 제외하고 재조회')
  const noVideoType = await fetchWith(actorSelect({ casting: true, videoType: false, filmExtra: true, advancedSkills: false }))
  if (noVideoType.data) return { ...(noVideoType.data as unknown as Record<string, unknown>), advanced_skills: null } as unknown as Actor
  if (!noVideoType.error) return null
  if (!isUndefinedColumnError(noVideoType.error)) return null

  // 3차: 레거시 기본 스키마
  console.warn('[ActorDetail] casting/filmography 확장 컬럼 미존재 — 기본 스키마로 fallback')
  const base = await fetchWith(actorSelect({ casting: false, videoType: false, filmExtra: false, advancedSkills: false }))
  if (!base.data) return null
  return {
    ...(base.data as unknown as Omit<Actor, 'casting_tags' | 'casting_summary' | 'profile_pdf_url' | 'advanced_skills'>),
    casting_tags: null,
    casting_summary: null,
    profile_pdf_url: null,
    advanced_skills: null,
  }
}

// 배우 상세는 공유 데이터 → 30초 캐시 (id별).
// 'actors' 태그: 전체 무효화. `actor-${id}` 태그: 해당 배우만 무효화 (cache stampede 방지).
// v3: R296 긴급 수정 — 구캐시 강제 무효화 + revalidate 30초 단축 + 쿼리 디버그 로깅
function getActorCached(id: string) {
  return unstable_cache(
    async () => {
      const result = await getActor(id)
      if (!result) {
        console.error(`[ActorDetail] getActor(${id}) returned null — DB query failed or actor not found`)
      } else {
        console.log(`[ActorDetail] getActor(${id}) OK — name=${result.name}, is_public=${result.is_public}`)
      }
      return result
    },
    ['actor-detail-v3', id],
    { revalidate: 30, tags: ['actors', `actor-${id}`] }
  )()
}

type RelatedActor = {
  id: string; name: string; gender: string | null; age_group: string | null
  casting_tags: string[] | null
  storage_photo_path: string | null; drive_photo_id: string | null; profile_photo: string | null
}

function relatedPhotoUrl(a: RelatedActor): string | null {
  if (a.profile_photo) return a.profile_photo
  if (a.storage_photo_path) {
    if (a.storage_photo_path.split('/').some((seg) => seg === '..' || seg === '.')) return null
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (base) return `${base}/storage/v1/object/public/actor-photos/${a.storage_photo_path}`
  }
  if (a.drive_photo_id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(a.drive_photo_id)}&sz=w400`
  return null
}

function getRelatedActorsCached(
  actorId: string,
  castingTags: string[],
  actorGender: string | null,
  actorAgeGroup: string | null
) {
  const sortedTags = [...castingTags].sort().join(',')
  return unstable_cache(
    async (): Promise<RelatedActor[]> => {
      const { data: relData } = await supabaseAdmin
        .from('actors')
        .select('id,name,gender,age_group,casting_tags,storage_photo_path,drive_photo_id,profile_photo')
        .eq('is_public', true)
        .neq('id', actorId)
        .overlaps('casting_tags', castingTags)
        .order('created_at', { ascending: true })
        .limit(50)
      if (!relData) return []
      const tagSet = new Set(castingTags)
      const scored = (relData as RelatedActor[]).map((a) => {
        let score = 0
        // 나이대 일치: +3점 (가장 높은 가중치)
        if (a.age_group && a.age_group === actorAgeGroup) score += 3
        // 성별 일치: +2점
        if (a.gender && a.gender === actorGender) score += 2
        // casting_tags 공통 수: +1점/개
        score += (a.casting_tags ?? []).filter((t) => tagSet.has(t)).length
        return { ...a, _score: score }
      })
      scored.sort((a, b) => b._score - a._score)
      return scored.slice(0, 4).map(({ _score: _, ...rest }) => rest)
    },
    ['actor-related-v3', actorId, sortedTags],
    { revalidate: 30, tags: ['actors', `actor-${actorId}`] }
  )()
}

function profilePhotoUrl(actor: Actor): string {
  // 우선순위: profile_photo (수동 업로드) → Storage → Drive → 플레이스홀더
  if (actor.profile_photo) return actor.profile_photo
  if (actor.storage_photo_path) {
    if (actor.storage_photo_path.split('/').some((seg: string) => seg === '..' || seg === '.')) return '/placeholder-actor.svg'
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (base) return `${base}/storage/v1/object/public/actor-photos/${actor.storage_photo_path}`
  }
  if (actor.drive_photo_id)
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(actor.drive_photo_id)}&sz=w900`
  return '/placeholder-actor.svg'
}

/* ---- generateMetadata — 카카오톡 캐스팅 카드 미리보기용 ---- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE_ACTOR.test(id)) return { title: '배우 프로필', robots: { index: false, follow: false } }
  const actor = await getActorCached(id)
  if (!actor) return { title: '배우 프로필', robots: { index: false, follow: false } }
  // 비공개 배우 — 크롤러가 메타데이터를 읽어도 인덱싱 차단 (페이지 컴포넌트는 notFound() 반환)
  if (!actor.is_public) return { title: '배우 프로필', robots: { index: false, follow: false } }

  const ogImage = `${SITE_URL}/api/og/actor/${actor.id}`
  const pageUrl = `${SITE_URL}/actors/${actor.id}`

  const genderLabel =
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'
  const subline = [actor.age_group, genderLabel].filter(Boolean).join(' · ')

  const description = actor.casting_summary?.trim()
    ? `${actor.name} — ${actor.casting_summary}`
    : actor.casting_tags && actor.casting_tags.length > 0
      ? `${actor.name} · ${subline} · ${actor.casting_tags.slice(0, 3).join(' · ')}`
      : `${actor.name} · ${subline} · KD4 액팅 스튜디오 배우 프로필`

  const title = actor.age_group
    ? `${actor.name} · ${actor.age_group} 배우`
    : `${actor.name} · 배우`

  // keywords: 이름 + 캐스팅 태그 + 연령대/성별 + 브랜드
  const keywords = [
    actor.name,
    ...(actor.casting_tags ?? []),
    actor.age_group ? `${actor.age_group} 배우` : null,
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : null,
    'KD4 배우', 'KD4 액팅 스튜디오',
  ].filter((v): v is string => !!v)

  return {
    title,
    description,
    keywords,
    alternates: { canonical: pageUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'KD4 액팅 스튜디오',
      type: 'profile',
      locale: 'ko_KR',
      // og:profile 추가 속성 — 인스타그램 handle + 성별 (OG 리치 카드 강화)
      ...(normalizeInstagramHandle(actor.instagram) ? { username: normalizeInstagramHandle(actor.instagram)! } : {}),
      ...(actor.gender === '남' ? { gender: 'male' } : actor.gender === '여' ? { gender: 'female' } : {}),
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: `${actor.name} 배우 프로필`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: ogImage, alt: `${actor.name} 배우 프로필` }],
    },
  }
}

/* ---- 페이지 컴포넌트 ---- */
export default async function ActorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE_ACTOR.test(id)) notFound()

  /* ---- 배우 프로필 접근 제어 ---- */
  const supabase = await createClient()

  // getUser() + actor 병렬 조회 — getUser는 서버에서 JWT 검증 (getSession은 조작 쿠키 우회 가능)
  // R298: 공개 배우 캐시 조회 → null 시 인증 사용자면 비공개 포함 재조회 (오너/admin용)
  const [{ data: { user } }, publicActor] = await Promise.all([
    supabase.auth.getUser(),
    getActorCached(id),
  ])
  // 공개 조회 실패 → 로그인 사용자면 비공개 포함 재시도 (오너/admin이 자기 프로필 보는 케이스)
  const actor = publicActor ?? (user ? await getActorCore(id, true) : null)
  if (!actor) notFound()

  // (A) 역할/소유권 계산 — 로그인 사용자만 (비로그인은 기본값 사용)
  let role: UserRole = 'user'
  let isOwner = false
  let isSelfMember = false  // 본인 멤버(admin 아닌 자기 배우) — 편집은 마이페이지로 일원화(2026-06-23)
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, actor_id')
      .eq('id', user.id)
      .maybeSingle()
    role = (profile?.role ?? 'user') as UserRole
    isSelfMember = profile?.actor_id === id
    isOwner = isSelfMember || role === 'admin'
  }

  // (B) 비공개 배우 안전장치 — 비로그인 포함 전부 차단 (is_public=false + 본인/admin 아님)
  //     단, ACTOR_DB_PUBLIC_PROFILE=true 시 is_public 무관하게 열람 허용 (전체공개 모드)
  if (!actor.is_public && !isOwner && !ACTOR_DB_PUBLIC_PROFILE) notFound()

  // (C) 부분공개 정책: ACTOR_DB_PUBLIC_PROFILE=true → 비로그인도 본문 열람 가능
  //     정책 OFF 시에만 기존 통짜 잠금으로 폴백 (킬스위치)
  if (!ACTOR_DB_PUBLIC_PROFILE && !user) {
    return <ActorDbLocked role={null} nextUrl={`/actors/${id}`} />
  }

  // (D) 로그인 사용자 중 비허용 역할 제한 (일반 user/member 등)
  //     2026-06-12 대표 지시: 부분공개 정책에서는 로그인 사용자도 비로그인과 동일하게 본문 열람 허용
  //     (배우·신규가입자가 로그인했는데 "권한없음" 뜨던 모순 해소 — 영상·다운로드만 잠금)
  //     정책 OFF(킬스위치) 시에만 기존 역할 게이트로 폴백
  if (!ACTOR_DB_PUBLIC_PROFILE && user && !canViewActorDb(role) && !isOwner) {
    return <ActorDbLocked role={role} nextUrl={`/actors/${id}`} />
  }

  // 비슷한 배우: 접근 허용 확정 후 쿼리 (A~D 통과 이후) — 30s unstable_cache
  const relatedActors: RelatedActor[] =
    actor.casting_tags && actor.casting_tags.length > 0
      ? await getRelatedActorsCached(actor.id, actor.casting_tags, actor.gender, actor.age_group)
      : []

  const photoUrl = profilePhotoUrl(actor)
  const canContact = canViewActorContact(role)

  // PII 방어: 비연락처 권한 유저에게 직렬화(Client Component prop)로 phone/email 노출 방지
  // phone/email 필드를 삭제해 Client Component 번들에 PII가 포함되지 않도록 함
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { phone: _actorPhone, email: _actorEmail, ...actorWithoutPII } = actor
  const actorForClient = (canContact ? actor : actorWithoutPII) as unknown as typeof actor

  // 다운로드용 URL/ID (디렉터/관리자만)
  // 프로필 문서는 same-origin 프록시(/api/actors/[id]/profile)로 받는다.
  // R2 presigned 직링크는 브라우저가 inline 렌더해 강제 다운로드가 안 되기 때문.
  // 문서는 Supabase Storage(셀프제출) 또는 R2(마이그레이션)에 있고, 프록시 라우트가 위치를 알아서 해석.
  // (R2 설정 여부로 게이트하면 셀프제출 Supabase 문서의 버튼이 잘못 숨겨짐 — 2026-06-24 수정)
  const hasProfileDoc = !!actor.profile_doc_path || !!actor.profile_pdf_url
  const r2VideoCount = (actor.actor_videos ?? []).filter((v) => v.r2_key).length
  let profileDocUrl: string | null = null
  const downloadVideoIds: string[] = []
  if (canContact) {
    if (hasProfileDoc) {
      profileDocUrl = `/api/actors/${actor.id}/profile`
    }
    for (const v of actor.actor_videos ?? []) {
      if (v.r2_key) downloadVideoIds.push(v.id)
    }
  }

  const pageUrl = `${SITE_URL}/actors/${actor.id}`

  /* ── SEO: Person + VideoObject + ProfilePage JSON-LD ── */
  const personSchema = getActorPersonSchema({
    id: actor.id,
    name: actor.name.slice(0, 100),
    name_en: actor.name_en ?? null,
    gender: actor.gender,
    age_group: actor.age_group ?? null,
    height: actor.height,
    weight: actor.weight,
    skills: actor.skills ?? null,
    instagram: actor.instagram,
    imageUrl: photoUrl.startsWith('http') ? photoUrl : `${SITE_URL}${photoUrl}`,
    // 타이틀·제작사 길이 제한 — 과도한 DB 문자열이 inline JSON-LD 스크립트를 비대하게 만드는 것 방지
    filmography: (actor.actor_filmography ?? []).map((f) => ({
      ...f,
      title: (f.title ?? '').slice(0, 100),
      production: f.production?.slice(0, 100) ?? null,
    })),
    castingTags: actor.casting_tags,
    castingSummary: actor.casting_summary?.slice(0, 200),
  })
  const profilePageDescription = actor.casting_summary?.trim()
    ? `${actor.name} — ${actor.casting_summary}`.slice(0, 200)
    : undefined
  const profilePageSchema = getActorProfilePageSchema({ id: actor.id, name: actor.name, description: profilePageDescription, updatedAt: actor.updated_at })
  const videoSchemas = getActorVideoSchemas(
    { id: actor.id, name: actor.name },
    (actor.actor_videos ?? []).filter((v) => v.youtube_id).map((v) => ({
      youtubeId: v.youtube_id as string,
      title: v.title,
      uploadDate: v.created_at ?? null, // VideoObject.uploadDate — Google Rich Results 권장
    }))
  )

  const genderLabel =
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'

  // HERO 우측 최근 출연 — 최근 2년 내 작품 최대 3편 (방송사·구분 + 작품명 compact 표기)
  const currentYear = new Date().getFullYear()
  const heroRecent = (actor.actor_filmography ?? [])
    .filter((f) => f.title && (f.year ?? 0) >= currentYear - 1)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 72 }}>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(profilePageSchema) }} />
      {personSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personSchema) }} />}
      {videoSchemas.map((v, i) => (
        <script key={`vid-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(v) }} />
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumb([
        { name: '홈', url: SITE_URL },
        { name: '배우 DB', url: `${SITE_URL}/actors` },
        { name: actor.name, url: pageUrl },
      ])) }} />
      {relatedActors.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${pageUrl}#related`,
          name: `${actor.name}${(actor.name.charCodeAt(actor.name.length - 1) - 0xAC00) % 28 ? '과' : '와'} 비슷한 KD4 배우`,
          numberOfItems: relatedActors.length,
          itemListElement: relatedActors.map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'Person', name: a.name, url: `${SITE_URL}/actors/${a.id}` },
          })),
        }) }} />
      )}

      {/* 반응형 헬퍼 — HERO 2컬럼 (사진 좌 / 정보 우), 680px 이하 세로 스택 (2026-06-12 대표 지시 리디자인) */}
      <style>{`
        .actor-hero { display:grid; grid-template-columns:minmax(260px,400px) minmax(0,1fr); gap:clamp(24px,4vw,44px); align-items:start; }
        /* 세로형 증명사진 프레임 — 2/3 비율 고정, 최대높이 70vh (max-width로 비율 유지한 채 제한) */
        .actor-hero-photo { position:relative; width:100%; max-width:calc(70vh * 2 / 3); aspect-ratio:2/3; margin:0 auto; }
        /* 우측 정보 열 — 자식(연락처·공유/다운로드·캐스팅문의)이 세로로 일정 간격 쌓이게.
           이 정의가 없어 버튼들이 서로 겹쳐 보이던 버그 수정 (2026-06-23) */
        .actor-hero-info { display:flex; flex-direction:column; gap:16px; align-items:stretch; }
        @media (max-width:680px) {
          .actor-hero { grid-template-columns:1fr; gap:20px; }
        }
      `}</style>

      {/* 배우 프로필 HERO — 좌 사진 / 우 핵심 정보 (스크롤 없이 한 화면) */}
      <div style={{ paddingTop: 80 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(20px,4vw,32px) 32px' }}>
          {/* 시각적 브레드크럼 */}
          <nav aria-label="위치" style={{ marginBottom: 18 }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
              <li><Link href="/" style={{ color: 'var(--gray)', fontSize: '0.78rem', textDecoration: 'none' }}>홈</Link></li>
              <li aria-hidden="true" style={{ color: 'var(--border)', fontSize: '0.78rem' }}>›</li>
              <li><Link href="/actors" style={{ color: 'var(--gray)', fontSize: '0.78rem', textDecoration: 'none' }}>배우 DB</Link></li>
              <li aria-hidden="true" style={{ color: 'var(--border)', fontSize: '0.78rem' }}>›</li>
              <li aria-current="page"><span style={{ color: 'var(--secondary)', fontSize: '0.78rem' }}>{actor.name}</span></li>
            </ol>
          </nav>
          <div className="actor-hero">

            {/* 좌: 세로형 증명사진 — 2/3 고정 프레임, cover 크롭 (얼굴 상단 기준) */}
            <div className="actor-hero-photo" style={{
              borderRadius: 10,
              overflow: 'hidden',
              background: 'var(--bg2)',
              boxShadow: '0 4px 18px rgba(21,72,138,0.10)',
              border: '1px solid var(--border)',
            }}>
              {photoUrl !== '/placeholder-actor.svg' ? (
                // 증명사진 프레임(2/3) 고정 크롭 — 원본 비율을 알 수 없어 next/image 고정크기 대신 일반 img 사용. (eslint 경고는 빌드 차단 아님)
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={`${actor.name} 배우 프로필`}
                  fetchPriority="high"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', fontSize: '3rem' }}>
                  <span className="sr-only">{actor.name} 프로필 사진 없음</span>
                  <span aria-hidden="true">👤</span>
                </div>
              )}
            </div>

            {/* 우: 핵심 정보 — 세로 스크롤 없이 한 화면에 compact */}
            <div className="actor-hero-info">

              {/* 캐스팅 태그 — 클릭 시 해당 태그 필터 목록으로 이동 (내부 링크 + UX) */}
              {SHOW_CASTING_TAGS && actor.casting_tags && actor.casting_tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {actor.casting_tags.map(t => (
                    <Link key={t} href={`/actors?tag=${encodeURIComponent(t)}`} style={{
                      fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.09em',
                      color: 'var(--gold)',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.20)',
                      borderRadius: 3, padding: '3px 10px',
                      fontFamily: 'var(--font-display)',
                      textDecoration: 'none',
                    }}>{t}</Link>
                  ))}
                </div>
              )}

              {/* 이름 */}
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
                fontWeight: 800, color: 'var(--white)',
                letterSpacing: '0.01em', lineHeight: 1.08,
                margin: '0 0 8px',
              }}>{actor.name}</h1>

              {/* 서브라인 — 성별 · 나이대 · 신장/체중 한 줄 compact */}
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', letterSpacing: '0.03em', marginBottom: 14 }}>
                {genderLabel}
                {actor.age_group ? ` · ${actor.age_group}` : ''}
                {actor.height ? ` · ${actor.height}cm` : ''}
                {actor.weight ? ` · ${actor.weight}kg` : ''}
                {actor.name_en ? <> · <span lang="en">{actor.name_en}</span></> : ''}
              </p>

              {/* 한줄소개 */}
              {actor.casting_summary && (
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.95rem', color: 'var(--white)',
                  fontWeight: 400, lineHeight: 1.7,
                  marginBottom: 16, paddingBottom: 16,
                  borderBottom: '1px solid var(--border)',
                }}>
                  &ldquo;{actor.casting_summary}&rdquo;
                </p>
              )}

              {/* 최근 출연 — 방송사+작품명 간단 표기 (최근 2년, 최대 3편) */}
              {heroRecent.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 7 }}>최근 출연</p>
                  <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {heroRecent.map((f) => {
                      const prefix = (f.category === 'drama' ? f.broadcaster : f.category === 'film' ? f.film_type : null) || HERO_CAT_LABEL[f.category]
                      return (
                        <li key={f.id} style={{ fontSize: '0.85rem', color: 'var(--white)', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--gray)', marginRight: 6 }}>{prefix}</span>
                          <strong style={{ fontWeight: 600 }}>{f.title}</strong>
                          {f.year ? <span style={{ color: 'var(--gray)', fontSize: '0.78rem' }}> · {f.year}</span> : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* 특기 */}
              {actor.skills && actor.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {actor.skills.map((sk) => {
                    const isAdvanced = (actor.advanced_skills ?? []).includes(sk)
                    return (
                      <span key={sk} style={{
                        padding: '4px 12px',
                        background: isAdvanced ? 'rgba(199,62,62,0.08)' : 'rgba(21,72,138,0.06)',
                        border: isAdvanced ? '1px solid rgba(199,62,62,0.3)' : '1px solid var(--border)',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                        color: isAdvanced ? 'var(--accent-red)' : 'var(--gray)',
                        letterSpacing: '0.03em',
                        fontWeight: isAdvanced ? 700 : 400,
                      }}>
                        {isAdvanced && <span role="img" aria-label="고급 숙련도">⭐ </span>}{sk}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* 사투리 */}
              {actor.dialects && actor.dialects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray)', letterSpacing: '0.05em', marginRight: 2 }}>사투리</span>
                  {actor.dialects.map((d) => (
                    <span key={d} style={{
                      padding: '4px 12px',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.25)',
                      borderRadius: 4,
                      fontSize: '0.78rem',
                      color: 'var(--gold)',
                      letterSpacing: '0.03em',
                      fontWeight: 600,
                    }}>{d}</span>
                  ))}
                </div>
              )}

              {/* 구분선 */}
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 14 }} />

              {/* 연락처 — 라벨+값 행 구조 (전화·이메일·인스타 구분.
                  2026-06-12 대표 지시: 한 줄 뭉침 ☎✉@ 가 구분이 안 가 재디자인) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', rowGap: 8, columnGap: 18, alignItems: 'baseline', marginBottom: 18 }}>
                {canContact ? (
                  <>
                    {actor.phone && (
                      <>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>전화</span>
                        <a href={`tel:${actor.phone}`} aria-label={`전화하기 ${actor.phone}`} style={{ fontSize: '0.9rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>{actor.phone}</a>
                      </>
                    )}
                    {actor.email && (
                      <>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>이메일</span>
                        <a href={`mailto:${actor.email}`} aria-label={`이메일 보내기 ${actor.email}`} style={{ fontSize: '0.9rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}>{actor.email}</a>
                      </>
                    )}
                  </>
                ) : (
                  <p style={{ gridColumn: '1 / -1', fontSize: '0.82rem', color: 'var(--gray)', margin: 0 }}>
                    {user
                      ? <>연락처 열람은 디렉터 회원 전용입니다.{' '}
                          <Link href="/dashboard" aria-label="디렉터 권한 신청하기 (마이페이지로 이동)" style={{ color: 'var(--gold)' }}>마이페이지에서 신청 <span aria-hidden="true">→</span></Link>
                        </>
                      : <>연락처 및 자료 다운로드는 KD4 멤버 전용입니다.{' '}
                          <Link href={`/auth/login?next=/actors/${actor.id}`} aria-label="연락처 열람을 위해 로그인" style={{ color: 'var(--gold)' }}>로그인</Link>
                        </>
                    }
                  </p>
                )}
                {normalizeInstagramHandle(actor.instagram) && (
                  <>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>인스타그램</span>
                    <a href={`https://www.instagram.com/${normalizeInstagramHandle(actor.instagram)}/`} target="_blank" rel="noopener noreferrer"
                      aria-label={`인스타그램 @${normalizeInstagramHandle(actor.instagram)} (새 탭에서 열림)`}
                      style={{ fontSize: '0.9rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                      @{normalizeInstagramHandle(actor.instagram)}
                    </a>
                  </>
                )}
              </div>

              {/* 공유 / 다운로드 — 나란히 (링크 복사는 전원, 다운로드는 디렉터/관리자 — 비권한자 클릭 시 안내) */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {canContact && <FavoriteButton actorId={actor.id} actorName={actor.name} variant="inline" />}
                <ShareButton webUrl={pageUrl} />
                {canContact ? (
                  <div style={{ flex: '1 1 200px' }}>
                    <ActorDownloadButton profileUrl={profileDocUrl} videoIds={downloadVideoIds} />
                  </div>
                ) : (hasProfileDoc || r2VideoCount > 0) ? (
                  <div style={{ flex: '1 1 200px' }}>
                    <ActorDownloadButton
                      profileUrl={null}
                      videoIds={[]}
                      locked={user ? 'member' : 'guest'}
                      nextUrl={`/actors/${actor.id}`}
                    />
                  </div>
                ) : null}
              </div>

              {/* 캐스팅 문의 — 디렉터/관리자만 노출, 배우 전화 직통 연결 */}
              {canContact && actor.phone && (
                <a href={`tel:${actor.phone}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--navy)', color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.35)', borderRadius: 8,
                  padding: '12px 20px', fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em',
                  textDecoration: 'none', width: '100%', justifyContent: 'center',
                  minHeight: 44,
                }}>
                  📞 캐스팅 문의 (직통 전화)
                </a>
              )}
              {canContact && !actor.phone && (
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 8 }}>
                  배우 전화번호가 등록되지 않았습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 구분선 */}
      <div style={{ borderTop: '2px solid var(--border)' }} />

      {/* ActorTabs — 전체 폭 (갤러리 → 영상 → AWARDS → 최근출연 → 필모그래피)
          mainPhotoUrl: HERO 메인사진과 동일 URL은 갤러리에서 중복 제거 */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(20px,4vw,32px)', paddingTop: 28 }}>
        {/* ① 편집 경로 통합(2026-06-23) — 일반 멤버 본인은 배우페이지 인라인 편집 대신
            마이페이지(/dashboard/edit)에서 사진·소개·작품을 한 곳에서 편집하도록 유도.
            admin은 배우페이지 직접 편집 유지(관리용). */}
        {isSelfMember && role !== 'admin' && (
          <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(21,72,138,0.05)', border: '1px solid rgba(21,72,138,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--gray)', fontFamily: 'var(--font-sans)' }}>내 프로필 수정은 마이페이지에서 한 번에 — 사진·소개·작품 전부 여기서 편집해요.</span>
            <Link href="/dashboard/edit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--navy)', color: '#fff', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>✏️ 마이페이지에서 편집</Link>
          </div>
        )}
        <ActorTabs
          actor={actorForClient}
          canViewContact={canContact}
          imageProtected={!canContact}
          canEdit={role === 'admin'}
          videoLocked={!user}
          mainPhotoUrl={photoUrl !== '/placeholder-actor.svg' ? photoUrl : undefined}
        />
      </div>

      {/* 비슷한 배우 — 같은 캐스팅 타입 배우 탐색 (tag overlap 기준) */}
      {relatedActors.length > 0 && (
        <section
          aria-label="비슷한 배우"
          style={{ maxWidth: 960, margin: '0 auto', padding: '32px clamp(20px,4vw,32px) 40px' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 20, fontWeight: 700, padding: 0 }}>
            <span lang="en">SIMILAR ACTORS</span>
            <span style={{ marginLeft: 10, fontFamily: 'var(--font-body)', letterSpacing: 'normal', textTransform: 'none', color: 'var(--gray)' }}>비슷한 배우</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {relatedActors.map((a) => {
              const relPhoto = relatedPhotoUrl(a)
              return (
                <Link
                  key={a.id}
                  href={`/actors/${a.id}`}
                  aria-label={[a.name, a.gender, a.age_group, '배우 프로필 보기'].filter(Boolean).join(' · ')}
                  style={{
                    display: 'block',
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, transform 0.2s',
                    overflow: 'hidden',
                  }}
                  className="kd4-card-hover"
                >
                  {/* 썸네일 — 가로형(3/2) */}
                  <div style={{ aspectRatio: '3/2', background: 'var(--bg3)', overflow: 'hidden' }}>
                    {relPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={relPhoto}
                        alt={`${a.name} 배우`}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border)', fontSize: '1.5rem' }}>
                        <span aria-hidden="true">👤</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)', marginBottom: 4, margin: '0 0 4px', padding: 0 }}>
                      {a.name}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginBottom: 8 }}>
                      {[a.gender, a.age_group].filter(Boolean).join(' · ')}
                    </p>
                    {SHOW_CASTING_TAGS && a.casting_tags && a.casting_tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {a.casting_tags.slice(0, 3).map((t) => (
                          <span key={t} style={{
                            fontSize: '0.7rem',
                            background: 'rgba(21,72,138,0.08)',
                            border: '1px solid rgba(21,72,138,0.18)',
                            color: 'var(--gold)',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          {/* 태그 기반 더보기 링크 — 배우 DB 필터 페이지로 */}
          {SHOW_CASTING_TAGS && actor.casting_tags && actor.casting_tags.length > 0 && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Link
                href={`/actors?tag=${encodeURIComponent(actor.casting_tags[0])}`}
                style={{
                  fontSize: '0.8rem', color: 'var(--gray)',
                  textDecoration: 'none', borderBottom: '1px solid var(--border)',
                  paddingBottom: 2,
                }}
              >
                {actor.casting_tags[0]} 배우 더보기 →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 본인 프로필 플로팅 편집 버튼 */}
      {isOwner && (
        <Link
          href="/dashboard"
          style={{
            position: 'fixed', bottom: 28, right: 20, zIndex: 80,
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--navy)', color: 'var(--cream)',
            border: '1px solid var(--gold)',
            borderRadius: 999, padding: '10px 18px',
            fontSize: '0.82rem', fontFamily: 'var(--font-body)',
            fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
          aria-label="내 프로필 편집하기"
        >
          ✏️ 내 프로필 편집
        </Link>
      )}
    </div>
  )
}
