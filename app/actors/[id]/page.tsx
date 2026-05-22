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
}

interface ActorVideo {
  id: string
  youtube_id: string | null
  r2_key: string | null
  title: string | null
}

interface FilmoEntry {
  id: string
  category: 'drama' | 'film' | 'cf' | 'musical' | 'theater' | 'etc'
  title: string
  role: string | null
  year: number | null
  production: string | null
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
      actor_photos ( id, drive_photo_id, url, storage_path, caption, sort_order ),
      actor_videos ( id, youtube_id, r2_key, title ),
      actor_filmography ( id, category, title, role, year, production )
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
      actor_photos ( id, drive_photo_id, url, storage_path, caption, sort_order ),
      actor_videos ( id, youtube_id, r2_key, title ),
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
  if (!actor) return { title: 'KD4 액팅 스튜디오' }

  const SITE_URL = 'https://kd4.club'
  const ogImage = `${SITE_URL}/api/og/actor/${actor.id}`
  const pageUrl = `${SITE_URL}/actors/${actor.id}`

  const genderLabel =
    actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'
  const subline = [actor.age_group, genderLabel].filter(Boolean).join(' · ')

  const description = actor.casting_summary?.trim()
    ? `${actor.name} — ${actor.casting_summary}`
    : actor.casting_tags && actor.casting_tags.length > 0
      ? `${actor.name} · ${subline} · ${actor.casting_tags.slice(0, 3).join('·')} | KD4 액팅 스튜디오`
      : `${actor.name} · ${subline} | KD4 액팅 스튜디오`

  const title = `배우 ${actor.name} | ${actor.age_group ?? ''} | KD4 액팅 스튜디오`

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
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
          alt: `${actor.name} 캐스팅 카드 — KD4 액팅 스튜디오`,
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
    <div style={styles.page}>
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

      <div style={styles.container}>
        {/* ---- 상단 헤더 영역 ---- */}
        <header style={styles.header}>
          {/* 배우 이름 */}
          <div style={styles.nameBlock}>
            <h1 style={styles.actorName}>{actor.name}</h1>
            {actor.name_en && <p style={styles.actorNameEn}>{actor.name_en}</p>}
            <p style={styles.actorSubLine}>
              {genderLabel}
              {actor.age_group ? ` · ${actor.age_group}` : ''}
            </p>
          </div>

          {/* 캐스팅 서머리 */}
          {actor.casting_summary && (
            <p style={styles.castingSummary}>{actor.casting_summary}</p>
          )}

          {/* 캐스팅 태그 */}
          {actor.casting_tags && actor.casting_tags.length > 0 && (
            <div style={styles.castingTagsWrap}>
              {actor.casting_tags.map((t) => (
                <span key={t} style={styles.castingTag}>{t}</span>
              ))}
            </div>
          )}

          {/* 기본 스펙 */}
          <div style={styles.specsRow}>
            {actor.height && (
              <span style={styles.specItem}>
                <span style={styles.specKey}>신장</span>
                <span style={styles.specVal}>{actor.height} cm</span>
              </span>
            )}
            {actor.weight && (
              <span style={styles.specItem}>
                <span style={styles.specKey}>체중</span>
                <span style={styles.specVal}>{actor.weight} kg</span>
              </span>
            )}
          </div>

          {/* 스킬 */}
          {actor.skills && actor.skills.length > 0 && (
            <div style={styles.skillsRow}>
              {actor.skills.map((sk, i) => (
                <span key={i} style={styles.skillTag}>{sk}</span>
              ))}
            </div>
          )}

          {/* 구분선 */}
          <div style={styles.divider} />

          {/* 연락처 */}
          <div style={styles.contactRow}>
            {canContact ? (
              <>
                {actor.phone && (
                  <a href={`tel:${actor.phone}`} style={styles.contactItem}>
                    <span style={styles.contactIcon}>☎</span>
                    {actor.phone}
                  </a>
                )}
                {actor.email && (
                  <a href={`mailto:${actor.email}`} style={styles.contactItem}>
                    <span style={styles.contactIcon}>✉</span>
                    {actor.email}
                  </a>
                )}
              </>
            ) : (
              <p style={styles.contactLocked}>
                {user
                  ? '연락처 열람은 디렉터 회원 전용입니다.'
                  : '연락처 및 자료 다운로드는 KD4 멤버 전용입니다.'}
                {!user && (
                  <Link href="/auth/login" style={styles.loginLink}> 로그인</Link>
                )}
              </p>
            )}
            {/* 인스타그램 — 항상 공개 */}
            {actor.instagram && (
              <a
                href={`https://instagram.com/${actor.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.instaLink}
              >
                <span style={styles.contactIcon}>@</span>
                {actor.instagram.startsWith('@') ? actor.instagram : `@${actor.instagram}`}
              </a>
            )}
          </div>

          {/* 액션 버튼 */}
          <div style={styles.actionRow}>
            <div style={styles.actionHalf}>
              <ShareButton webUrl={pageUrl} />
            </div>
            {canContact && (
              <div style={styles.actionHalf}>
                <ActorDownloadButton profileUrl={profileDocUrl} videoIds={downloadVideoIds} />
              </div>
            )}
          </div>
        </header>

        {/* ---- 구분선 ---- */}
        <div style={styles.mainDivider} />

        {/* ---- 콘텐츠 섹션 (ActorTabs) ---- */}
        <ActorTabs
          actor={actor}
          canViewContact={canContact}
          imageProtected={!canContact}
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 80,
    paddingBottom: 100,
  },
  container: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
  },

  /* ---- 헤더 ---- */
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  actorName: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.6rem',
    fontWeight: 700,
    color: 'var(--white)',
    letterSpacing: '0.04em',
    lineHeight: 1.15,
  },
  actorNameEn: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '1rem',
    color: 'var(--gray)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginTop: 2,
  },
  actorSubLine: {
    fontSize: '0.88rem',
    color: 'var(--gray)',
    marginTop: 4,
  },
  castingSummary: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1rem',
    color: 'var(--white)',
    fontWeight: 600,
    lineHeight: 1.6,
    padding: '14px 18px',
    background: 'rgba(196,165,90,0.05)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: 4,
    letterSpacing: '0.01em',
  },
  castingTagsWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  castingTag: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--gold)',
    background: 'rgba(196,165,90,0.08)',
    border: '1px solid rgba(196,165,90,0.25)',
    borderRadius: 3,
    padding: '4px 10px',
  },
  specsRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap' as const,
  },
  specItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'baseline',
  },
  specKey: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
  },
  specVal: {
    fontSize: '0.92rem',
    color: 'var(--white)',
    fontWeight: 600,
  },
  skillsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  skillTag: {
    padding: '4px 12px',
    background: 'rgba(196,165,90,0.10)',
    border: '1px solid rgba(196,165,90,0.28)',
    borderRadius: 3,
    fontSize: '0.78rem',
    color: 'var(--gold-light, var(--gold))',
    letterSpacing: '0.03em',
  },
  divider: {
    borderTop: '1px solid var(--border)',
    marginTop: 4,
  },
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    alignItems: 'center',
  },
  contactItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.9rem',
    color: 'var(--white)',
    textDecoration: 'none',
    padding: '6px 14px',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    transition: 'border-color 0.15s',
  },
  contactIcon: {
    fontSize: '0.8rem',
    color: 'var(--gold)',
  },
  instaLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.9rem',
    color: 'var(--gold-light, var(--gold))',
    textDecoration: 'none',
    padding: '6px 14px',
    background: 'var(--bg2)',
    border: '1px solid rgba(196,165,90,0.3)',
    borderRadius: 5,
  },
  contactLocked: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  loginLink: {
    color: 'var(--gold)',
    textDecoration: 'underline',
  },
  actionRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  actionHalf: {
    flex: '1 1 200px',
    minWidth: 0,
  },
  mainDivider: {
    borderTop: '1px solid var(--border)',
  },
}
