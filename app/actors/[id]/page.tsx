import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ActorTabs from '@/components/actors/ActorTabs'
import ShareButton from '@/components/actors/ShareButton'
import ActorDownloadButton from '@/components/actors/ActorDownloadButton'
import { UserRole } from '@/lib/types'
import { canViewActorContact } from '@/lib/access'
import { getVideoSignedUrl, isR2Configured } from '@/lib/r2'
import { getActorPersonSchema, getActorVideoSchemas, serializeJsonLd } from '@/lib/seo'

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

/* ---- 데이터 fetch (admin 클라이언트로 공개 조회) ---- */
function isUndefinedColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42703' || /column .* does not exist/i.test(err.message ?? '')
}

async function getActor(id: string): Promise<Actor | null> {
  // 1차: 새 스키마 (casting_tags/summary/profile_pdf_url)
  const newSchema = await supabaseAdmin
    .from('actors')
    .select(
      `
      id, name, name_en, gender, age_group, height, weight, skills,
      drive_photo_id, storage_photo_path, profile_photo, email, phone, instagram, profile_doc_path,
      casting_tags, casting_summary, profile_pdf_url,
      actor_photos ( id, drive_photo_id, url, storage_path, caption, sort_order, photo_type, label ),
      actor_videos ( id, youtube_id, r2_key, title, video_type ),
      actor_filmography ( id, category, title, role, year, production, broadcaster, film_type, award )
    `
    )
    .eq('id', id)
    .single()

  if (!newSchema.error && newSchema.data) return newSchema.data as Actor
  if (newSchema.error && !isUndefinedColumnError(newSchema.error)) return null

  // 2차: fallback (마이그레이션 미실행 시 — 새 컬럼 없이)
  console.warn('[ActorDetail] casting_tags 컬럼 미존재 — fallback 스키마로 조회')
  const oldSchema = await supabaseAdmin
    .from('actors')
    .select(
      `
      id, name, name_en, gender, age_group, height, weight, skills,
      drive_photo_id, storage_photo_path, profile_photo, email, phone, instagram, profile_doc_path,
      actor_photos ( id, drive_photo_id, url, storage_path, caption, sort_order, photo_type, label ),
      actor_videos ( id, youtube_id, r2_key, title, video_type ),
      actor_filmography ( id, category, title, role, year, production )
    `
    )
    .eq('id', id)
    .single()

  if (oldSchema.error || !oldSchema.data) return null
  return {
    ...(oldSchema.data as Omit<Actor, 'casting_tags' | 'casting_summary' | 'profile_pdf_url'>),
    casting_tags: null,
    casting_summary: null,
    profile_pdf_url: null,
  }
}

// 배우 상세는 공유 데이터 → 120초 캐시 (id별). 'actors' 태그로 즉시 갱신 가능.
const getActorCached = unstable_cache(getActor, ['actor-detail-v2'], {
  revalidate: 120,
  tags: ['actors'],
})

function profilePhotoUrl(actor: Actor): string {
  // 우선순위: profile_photo (수동 업로드) → Storage → Drive → 플레이스홀더
  if (actor.profile_photo) return actor.profile_photo
  if (actor.storage_photo_path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (base) return `${base}/storage/v1/object/public/actor-photos/${actor.storage_photo_path}`
  }
  if (actor.drive_photo_id)
    return `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w900`
  return '/placeholder-actor.svg'
}

/* ---- generateMetadata — 카카오톡 캐스팅 카드 미리보기용 ---- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const actor = await getActorCached(id)
  if (!actor) return { title: '배우 프로필 | kd4.club' }

  const SITE_URL = 'https://kd4.club'
  const ogImage = `${SITE_URL}/api/og/actor/${actor.id}`
  const pageUrl = `${SITE_URL}/actors/${actor.id}`

  const genderLabel =
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'
  const subline = [actor.age_group, genderLabel].filter(Boolean).join(' · ')

  const description = actor.casting_summary?.trim()
    ? `${actor.name} — ${actor.casting_summary}`
    : actor.casting_tags && actor.casting_tags.length > 0
      ? `${actor.name} · ${subline} · ${actor.casting_tags.slice(0, 3).join(' · ')}`
      : `${actor.name} · ${subline}`

  const title = actor.age_group
    ? `${actor.name} · ${actor.age_group} 배우`
    : `${actor.name} · 배우`

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'kd4.club',
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
      images: [ogImage],
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

  /* ---- 비로그인도 접근 가능 (공개 페이지) ---- */
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // 역할 조회 (로그인 시에만, 비로그인은 null)
  let role: UserRole | null = null
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    role = (profile?.role ?? 'user') as UserRole
  }

  /* ---- 데이터 fetch ---- */
  const actor = await getActorCached(id)
  if (!actor) notFound()

  const photoUrl = profilePhotoUrl(actor)
  const canContact = canViewActorContact(role)

  // 다운로드용 URL/ID (디렉터/관리자만)
  let profileDocUrl: string | null = null
  const downloadVideoIds: string[] = []
  if (canContact) {
    if (actor.profile_doc_path && isR2Configured()) {
      try {
        const ext = actor.profile_doc_path.split('.').pop() || 'pdf'
        profileDocUrl = await getVideoSignedUrl(actor.profile_doc_path, 3600, `${actor.name} 프로필.${ext}`)
      } catch (e) {
        console.error('[actor] 프로필 문서 signed URL 실패:', e)
      }
    } else if (actor.profile_pdf_url) {
      profileDocUrl = actor.profile_pdf_url
    }
    for (const v of actor.actor_videos ?? []) {
      if (v.r2_key) downloadVideoIds.push(v.id)
    }
  }

  const pageUrl =
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/actors/${actor.id}`
      : `https://kd4.club/actors/${actor.id}`

  /* ── SEO: Person + VideoObject JSON-LD ── */
  const personSchema = getActorPersonSchema({
    id: actor.id,
    name: actor.name,
    gender: actor.gender,
    age_group: actor.age_group ?? null,
    height: actor.height,
    weight: actor.weight,
    skills: actor.skills ?? null,
    email: actor.email,
    phone: actor.phone,
    instagram: actor.instagram,
    imageUrl: photoUrl.startsWith('http') ? photoUrl : `https://kd4.club${photoUrl}`,
    filmography: actor.actor_filmography ?? [],
    castingTags: actor.casting_tags,
    castingSummary: actor.casting_summary,
  })
  const videoSchemas = getActorVideoSchemas(
    { id: actor.id, name: actor.name },
    (actor.actor_videos ?? []).filter((v) => v.youtube_id).map((v) => ({
      youtubeId: v.youtube_id as string,
      title: v.title,
    }))
  )

  const genderLabel =
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 100 }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personSchema) }}
      />
      {videoSchemas.map((v, i) => (
        <script
          key={`vid-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(v) }}
        />
      ))}

      {/* 히어로 배너 — 네이비 다크 배경 + 배우 사진 */}
      <div style={{ paddingTop: 70 }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: 460,
          overflow: 'hidden',
          background: '#1A1F2B',
        }}>
          {/* 배우 사진 배경 */}
          {photoUrl !== '/placeholder-actor.svg' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${photoUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }} />
          )}
          {/* 다크 그라디언트 오버레이 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15,20,30,0.97) 0%, rgba(15,20,30,0.45) 50%, rgba(15,20,30,0.1) 100%)',
          }} />
          {/* 하단 텍스트 */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 clamp(20px,4vw,48px) 36px' }}>
            {/* 캐스팅 태그 */}
            {actor.casting_tags && actor.casting_tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {actor.casting_tags.map(t => (
                  <span key={t} style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.88)',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 3, padding: '3px 10px',
                    fontFamily: 'var(--font-display)',
                  }}>{t}</span>
                ))}
              </div>
            )}
            {/* 이름 */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 7vw, 3.6rem)',
              fontWeight: 800, color: '#ffffff',
              letterSpacing: '0.01em', lineHeight: 1.05, margin: 0,
            }}>{actor.name}</h1>
            {/* 서브라인 */}
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', marginTop: 8, letterSpacing: '0.04em' }}>
              {genderLabel}{actor.age_group ? ` · ${actor.age_group}` : ''}{actor.name_en ? `  ·  ${actor.name_en}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 정보 + 콘텐츠 컨테이너 */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(20px,4vw,32px)', paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* 캐스팅 서머리 */}
        {actor.casting_summary && (
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem', color: 'var(--white)', fontWeight: 600, lineHeight: 1.7,
            padding: '14px 20px',
            background: 'var(--navy-tint-1)',
            borderLeft: '3px solid var(--navy)',
            borderRadius: 4,
          }}>{actor.casting_summary}</p>
        )}

        {/* 스펙 + 스킬 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(actor.height || actor.weight) && (
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {actor.height && <span style={{ fontSize: '0.88rem' }}><span style={{ color: 'var(--gray)', marginRight: 8, fontSize: '0.75rem', letterSpacing: '0.05em' }}>신장</span><strong style={{ color: 'var(--white)', fontWeight: 600 }}>{actor.height} cm</strong></span>}
              {actor.weight && <span style={{ fontSize: '0.88rem' }}><span style={{ color: 'var(--gray)', marginRight: 8, fontSize: '0.75rem', letterSpacing: '0.05em' }}>체중</span><strong style={{ color: 'var(--white)', fontWeight: 600 }}>{actor.weight} kg</strong></span>}
            </div>
          )}
          {actor.skills && actor.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {actor.skills.map((sk, i) => (
                <span key={i} style={{ padding: '4px 12px', background: 'var(--navy-tint-1)', border: '1px solid var(--navy-tint-3)', borderRadius: 3, fontSize: '0.78rem', color: 'var(--navy)', letterSpacing: '0.03em' }}>{sk}</span>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* 연락처 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {canContact ? (
            <>
              {actor.phone && <a href={`tel:${actor.phone}`} style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>☎ {actor.phone}</a>}
              {actor.email && <a href={`mailto:${actor.email}`} style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>✉ {actor.email}</a>}
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
              {user ? '연락처 열람은 디렉터 회원 전용입니다.' : '연락처 및 자료 다운로드는 KD4 멤버 전용입니다.'}
              {!user && <Link href="/auth/login" style={{ color: 'var(--navy)', marginLeft: 6 }}>로그인</Link>}
            </p>
          )}
          {actor.instagram && (
            <a href={`https://instagram.com/${actor.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.88rem', color: 'var(--gray)', textDecoration: 'none' }}>
              @ {actor.instagram.startsWith('@') ? actor.instagram.slice(1) : actor.instagram}
            </a>
          )}
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}><ShareButton webUrl={pageUrl} /></div>
          {canContact && <div style={{ flex: 1, minWidth: 140 }}><ActorDownloadButton profileUrl={profileDocUrl} videoIds={downloadVideoIds} /></div>}
        </div>

        {/* 메인 구분선 */}
        <div style={{ borderTop: '2px solid var(--border)' }} />

        {/* ActorTabs */}
        <ActorTabs actor={actor} canViewContact={canContact} imageProtected={!canContact} />
      </div>
    </div>
  )
}
