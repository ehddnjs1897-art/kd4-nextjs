import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ActorTabs from '@/components/actors/ActorTabs'
import CastingInquiry from '@/components/actors/CastingInquiry'
import ShareButton from '@/components/actors/ShareButton'
import ActorDownloadButton from '@/components/actors/ActorDownloadButton'
import ActorDbLocked from '@/components/actors/ActorDbLocked'
import { UserRole } from '@/lib/types'
import { canViewActorContact, canViewActorDb, ACTOR_DB_PUBLIC_PROFILE } from '@/lib/access'
import { isR2Configured } from '@/lib/r2'
import { getActorPersonSchema, getActorVideoSchemas, serializeJsonLd } from '@/lib/seo'
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
      id, name, name_en, gender, age_group, height, weight, skills, is_public,
      drive_photo_id, storage_photo_path, profile_photo, email, phone, instagram, profile_doc_path${
        opts.casting ? ',\n      casting_tags, casting_summary, profile_pdf_url' : ''
      }${opts.advancedSkills ? ',\n      advanced_skills' : ''},
      actor_photos ( id, drive_photo_id, url, storage_path, caption, sort_order, photo_type, label ),
      actor_videos ( id, youtube_id, r2_key, title, created_at${opts.videoType ? ', video_type' : ''} ),
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

async function getActorCore(id: string): Promise<Actor | null> {
  const fetchWith = (cols: string) =>
    supabaseAdmin.from('actors').select(cols).eq('id', id).maybeSingle()

  // 1차: 전체 스키마 (advanced_skills 포함)
  const full = await fetchWith(actorSelect({ casting: true, videoType: true, filmExtra: true, advancedSkills: true }))
  if (full.data) return full.data as unknown as Actor
  // maybeSingle: data=null + error=null → not found
  if (!full.error) return null
  // 컬럼 누락(42703)이 아닌 실제 오류 → not found 처리
  if (!isUndefinedColumnError(full.error)) return null

  // 1.5차: advanced_skills만 누락된 경우 (2026-05-29 마이그레이션 미실행)
  console.warn('[ActorDetail] advanced_skills 컬럼 미존재 — 제외하고 재조회')
  const noAdvanced = await fetchWith(actorSelect({ casting: true, videoType: true, filmExtra: true, advancedSkills: false }))
  if (noAdvanced.data) return { ...(noAdvanced.data as unknown as Record<string, unknown>), advanced_skills: null } as unknown as Actor
  if (!noAdvanced.error) return null
  if (!isUndefinedColumnError(noAdvanced.error)) return null

  // 2차: video_type 컬럼 미존재 대응 (운영 DB 마이그레이션 미적용) — 나머지 컬럼은 유지
  console.warn('[ActorDetail] 확장 컬럼 미존재 — video_type 제외하고 재조회')
  const noVideoType = await fetchWith(actorSelect({ casting: true, videoType: false, filmExtra: true, advancedSkills: false }))
  if (noVideoType.data) return { ...(noVideoType.data as unknown as Record<string, unknown>), advanced_skills: null } as unknown as Actor
  if (!noVideoType.error) return null
  if (!isUndefinedColumnError(noVideoType.error)) return null

  // 3차: 캐스팅/필모 확장 컬럼까지 누락된 레거시 DB 대응 (기본 스키마)
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

// 배우 상세는 공유 데이터 → 120초 캐시 (id별).
// 'actors' 태그: 전체 무효화. `actor-${id}` 태그: 해당 배우만 무효화 (cache stampede 방지).
function getActorCached(id: string) {
  return unstable_cache(
    () => getActor(id),
    ['actor-detail-v2', id],
    { revalidate: 120, tags: ['actors', `actor-${id}`] }
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

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'KD4 액팅 스튜디오',
      type: 'profile',
      locale: 'ko_KR',
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
  const [{ data: { user } }, actor] = await Promise.all([
    supabase.auth.getUser(),
    getActorCached(id),
  ])
  if (!actor) notFound()

  // (A) 역할/소유권 계산 — 로그인 사용자만 (비로그인은 기본값 사용)
  let role: UserRole = 'user'
  let isOwner = false
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, actor_id')
      .eq('id', user.id)
      .maybeSingle()
    role = (profile?.role ?? 'user') as UserRole
    isOwner = profile?.actor_id === id || role === 'admin'
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
  //     단, 부분공개 정책에서는 비로그인은 이미 (C)에서 통과 → 여기는 로그인 사용자만 적용
  if (user && !canViewActorDb(role) && !isOwner) {
    return <ActorDbLocked role={role} nextUrl={`/actors/${id}`} />
  }

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
  let profileDocUrl: string | null = null
  const downloadVideoIds: string[] = []
  if (canContact) {
    const hasProfileDoc =
      (!!actor.profile_doc_path && isR2Configured()) || !!actor.profile_pdf_url
    if (hasProfileDoc) {
      profileDocUrl = `/api/actors/${actor.id}/profile`
    }
    for (const v of actor.actor_videos ?? []) {
      if (v.r2_key) downloadVideoIds.push(v.id)
    }
  }

  const pageUrl = `${SITE_URL}/actors/${actor.id}`

  /* ── SEO: Person + VideoObject JSON-LD ── */
  const personSchema = getActorPersonSchema({
    id: actor.id,
    name: actor.name.slice(0, 100),
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
      title: f.title.slice(0, 100),
      production: f.production?.slice(0, 100) ?? null,
    })),
    castingTags: actor.casting_tags,
    castingSummary: actor.casting_summary?.slice(0, 200),
  })
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 100 }}>
      {/* JSON-LD */}
      {personSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personSchema) }} />}
      {videoSchemas.map((v, i) => (
        <script key={`vid-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(v) }} />
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumb([
        { name: '홈', url: SITE_URL },
        { name: '배우 DB', url: `${SITE_URL}/actors` },
        { name: actor.name, url: pageUrl },
      ])) }} />

      {/* 반응형 헬퍼 */}
      <style>{`
        .actor-profile-wrap { display:flex; flex-direction:column; gap:36px; align-items:center; }
        .actor-profile-top { max-width:680px; margin:0 auto; width:100%; }
        /* 정보 영역도 이미지와 동일 폭 가운데 정렬 — 좌측 쏠림 방지 */
        .actor-profile-info { max-width:680px; margin:0 auto; width:100%; }
      `}</style>

      {/* 배우 프로필 헤더 */}
      <div style={{ paddingTop: 80 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px clamp(20px,4vw,32px) 40px' }}>
          <div className="actor-profile-wrap">

            {/* 상단: 프로필/이력서 이미지 — 가로형 전체 표시 (자르지 않음) */}
            <div className="actor-profile-top">
              <div style={{
                borderRadius: 10,
                overflow: 'hidden',
                background: 'var(--bg2)',
                boxShadow: '0 4px 18px rgba(21,72,138,0.10)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {photoUrl !== '/placeholder-actor.svg' ? (
                  // 이력서/프로필 이미지는 가로·세로 비율이 제각각 → 자연 비율 그대로 노출(잘림 방지).
                  // 알 수 없는 비율이라 next/image fill·고정크기 대신 일반 img가 정확. (eslint 경고는 빌드 차단 아님)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={`${actor.name} 배우 프로필`}
                    style={{ width: '100%', height: 'auto', maxHeight: '82vh', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div style={{ aspectRatio: '3/2', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', fontSize: '3rem' }}>
                    <span className="sr-only">{actor.name} 프로필 사진 없음</span>
                    <span aria-hidden="true">👤</span>
                  </div>
                )}
              </div>
              {/* 공유/다운로드 — 이미지 아래 */}
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <ShareButton webUrl={pageUrl} />
                {canContact && <ActorDownloadButton profileUrl={profileDocUrl} videoIds={downloadVideoIds} />}
              </div>
            </div>

            {/* 정보 */}
            <div className="actor-profile-info" style={{ paddingTop: 8 }}>

              {/* 캐스팅 태그 */}
              {actor.casting_tags && actor.casting_tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                  {actor.casting_tags.map(t => (
                    <span key={t} style={{
                      fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.09em',
                      color: 'var(--gold)',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.20)',
                      borderRadius: 3, padding: '3px 10px',
                      fontFamily: 'var(--font-display)',
                    }}>{t}</span>
                  ))}
                </div>
              )}

              {/* 이름 */}
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 800, color: 'var(--white)',
                letterSpacing: '0.01em', lineHeight: 1.05,
                margin: '0 0 10px',
              }}>{actor.name}</h1>

              {/* 서브라인 */}
              <p style={{ fontSize: '0.86rem', color: 'var(--gray-light)', letterSpacing: '0.04em', marginBottom: 28 }}>
                {genderLabel}{actor.age_group ? ` · ${actor.age_group}` : ''}{actor.name_en ? <> · <span lang="en">{actor.name_en}</span></> : ''}
              </p>

              {/* 한줄소개 */}
              {actor.casting_summary && (
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.97rem', color: 'var(--white)',
                  fontWeight: 400, lineHeight: 1.8,
                  marginBottom: 28, paddingBottom: 28,
                  borderBottom: '1px solid var(--border)',
                }}>
                  &ldquo;{actor.casting_summary}&rdquo;
                </p>
              )}

              {/* 스펙 */}
              {(actor.height || actor.weight) && (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
                  {actor.height && (
                    <span style={{ fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--gray)', marginRight: 7, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>신장</span>
                      <strong style={{ color: 'var(--white)', fontWeight: 600 }}>{actor.height} cm</strong>
                    </span>
                  )}
                  {actor.weight && (
                    <span style={{ fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--gray)', marginRight: 7, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>체중</span>
                      <strong style={{ color: 'var(--white)', fontWeight: 600 }}>{actor.weight} kg</strong>
                    </span>
                  )}
                </div>
              )}

              {/* 특기 */}
              {actor.skills && actor.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 28 }}>
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
              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 22 }} />

              {/* 연락처 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                {canContact ? (
                  <>
                    {actor.phone && <a href={`tel:${actor.phone}`} aria-label={`전화하기 ${actor.phone}`} style={{ fontSize: '0.9rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}><span aria-hidden="true">☎ </span>{actor.phone}</a>}
                    {actor.email && <a href={`mailto:${actor.email}`} aria-label={`이메일 보내기 ${actor.email}`} style={{ fontSize: '0.9rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}><span aria-hidden="true">✉ </span>{actor.email}</a>}
                  </>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
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
                {actor.instagram && (
                  <a href={actor.instagram.startsWith('http') ? actor.instagram : `https://instagram.com/${actor.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    aria-label={`인스타그램 @${actor.instagram.replace('@', '')} (새 탭에서 열림)`}
                    style={{ fontSize: '0.85rem', color: 'var(--gray)', textDecoration: 'none' }}>
                    @ {actor.instagram.startsWith('@') ? actor.instagram.slice(1) : actor.instagram}
                  </a>
                )}
              </div>

              {/* 캐스팅 문의 폼 — 연락처 블록 바로 아래 */}
              <CastingInquiry
                actorId={actor.id}
                actorName={actor.name}
                actorAgeGroup={actor.age_group}
                actorGender={actor.gender}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 구분선 */}
      <div style={{ borderTop: '2px solid var(--border)' }} />

      {/* 하이라이트 strip — 수상·최근출연·특이 스킬 (있을 때만 노출) */}
      {(() => {
        // 진짜 수상만 하이라이트 (영화제 출품·선정·후보는 제외 — 필모 표에서 작품 옆 빨강 표기)
        const awards = (actor.actor_filmography ?? []).filter(f =>
          f.award && f.award.trim()
          && /(수상|대상|그랑프리|최우수|우수상|신인상|연기상|작품상|남우|여우|특별상|심사위원|감독상|인기상)/.test(f.award)
          && !/(후보|노미네이트|노미네이션|nominee|nominat)/i.test(f.award))
        const currentYear = new Date().getFullYear()
        const recent = (actor.actor_filmography ?? [])
          .filter(f => (f.year ?? 0) >= currentYear - 1 && f.title)
          .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
          .slice(0, 2)
        const featuredSkills = (actor.skills ?? []).slice(0, 4)
        const hasHighlight = awards.length > 0 || recent.length > 0 || featuredSkills.length > 0 || (actor.casting_tags && actor.casting_tags.length > 0)
        if (!hasHighlight) return null

        return (
          <section
            aria-label={`${actor.name} 하이라이트`}
            style={{
              maxWidth: 960,
              margin: '0 auto',
              padding: '32px clamp(20px,4vw,32px) 0',
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}>
              {recent.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 8 }}>
                    <span lang="en">NOW PLAYING</span>
                  </p>
                  <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {recent.map((f) => (
                      <li key={f.id} style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--white)', lineHeight: 1.4 }}>
                        {f.title}
                        {f.role && <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: '0.78rem' }}> · {f.role}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {awards.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 8 }}>
                    <span lang="en">AWARDS</span>
                  </p>
                  <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {awards.slice(0, 3).map((f) => (
                      <li key={f.id} style={{ fontSize: '0.85rem', color: 'var(--white)', lineHeight: 1.4 }}>
                        {f.award}
                        {f.title && <span style={{ color: 'var(--gray)', fontSize: '0.78rem' }}> · {f.title}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {featuredSkills.length > 0 && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 8 }}>
                    <span lang="en">SPECIAL SKILLS</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {featuredSkills.map((sk) => {
                      const isAdvanced = (actor.advanced_skills ?? []).includes(sk)
                      return (
                        <span key={sk} style={{
                          fontSize: '0.78rem',
                          background: isAdvanced ? 'rgba(199,62,62,0.08)' : 'rgba(21,72,138,0.08)',
                          border: isAdvanced ? '1px solid rgba(199,62,62,0.3)' : '1px solid rgba(21,72,138,0.18)',
                          color: isAdvanced ? 'var(--accent-red)' : 'var(--gold)',
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontWeight: isAdvanced ? 700 : 400,
                        }}>
                          {isAdvanced && <span role="img" aria-label="고급 숙련도">⭐ </span>}{sk}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {/* ActorTabs — 전체 폭 */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(20px,4vw,32px)', paddingTop: 44 }}>
        <ActorTabs actor={actorForClient} canViewContact={canContact} imageProtected={!canContact} canEdit={isOwner} />
      </div>
    </div>
  )
}
