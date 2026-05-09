import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ActorTabs from '@/components/actors/ActorTabs'
import ShareButton from '@/components/actors/ShareButton'
import ProfilePhotoWrapper from '@/components/actors/ProfilePhotoWrapper'
import { UserRole } from '@/lib/types'
import { getActorPersonSchema, getActorVideoSchemas, serializeJsonLd } from '@/lib/seo'

/** 배우DB 열람 가능 여부 */
function canViewActorDb(role: UserRole | null): boolean {
  return role === 'editor' || role === 'director' || role === 'admin' || role === 'crew'
}

/** 연락처 등 전체 정보 열람 (디렉터/관리자만) */
function isDirectorOrAdmin(role: UserRole | null): boolean {
  return role === 'director' || role === 'admin'
}

/* ---- 타입 정의 ---- */
interface Actor {
  id: string
  name: string
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
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: FilmoEntry[]
}

interface ActorPhoto {
  id: string
  drive_photo_id: string
  caption: string | null
  sort_order: number
}

interface ActorVideo {
  id: string
  youtube_id: string
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
      id, name, gender, age_group, height, weight, skills,
      drive_photo_id, storage_photo_path, profile_photo, email, phone, instagram,
      casting_tags, casting_summary, profile_pdf_url,
      actor_photos ( id, drive_photo_id, caption, sort_order ),
      actor_videos ( id, youtube_id, title ),
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
      id, name, gender, age_group, height, weight, skills,
      drive_photo_id, storage_photo_path, profile_photo, email, phone, instagram,
      actor_photos ( id, drive_photo_id, caption, sort_order ),
      actor_videos ( id, youtube_id, title ),
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

/* ---- generateMetadata ---- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const actor = await getActor(id)
  if (!actor) return { title: 'KD4 액팅 스튜디오' }

  const imageUrl = profilePhotoUrl(actor)
  return {
    title: `${actor.name} | KD4 액팅 스튜디오`,
    description: `${actor.name} 배우 갤러리 — KD4 액팅 스튜디오`,
    openGraph: {
      title: `${actor.name} | KD4 액팅 스튜디오`,
      description: `${actor.name} 배우 갤러리`,
      images: [{ url: imageUrl, width: 900, height: 1600, alt: actor.name }],
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
    data: { user },
  } = await supabase.auth.getUser()

  // 역할 조회 (로그인 시에만, 비로그인은 null)
  let role: UserRole | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    role = (profile?.role ?? 'user') as UserRole
  }

  /* ---- 데이터 fetch ---- */
  const actor = await getActor(id)
  if (!actor) notFound()

  const photoUrl = profilePhotoUrl(actor)
  const pageUrl =
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/actors/${actor.id}`
      : `https://kd4studio.com/actors/${actor.id}`

  /* ── SEO: Person + VideoObject JSON-LD (검색 노출용) ── */
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
    (actor.actor_videos ?? []).map((v) => ({
      youtubeId: v.youtube_id,
      title: v.title,
      // uploadDate: actor_videos.created_at 컬럼이 추가되면 여기로 ISO8601 전달
    }))
  )

  return (
    <div style={styles.page}>
      {/* Person JSON-LD — Google Knowledge Graph 노출 후보 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(personSchema) }}
      />
      {/* VideoObject JSON-LD — 출연영상 */}
      {videoSchemas.map((v, i) => (
        <script
          key={`vid-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(v) }}
        />
      ))}
      <div className="container">
        <div className="actor-detail-layout">
          {/* ---- 좌측: 프로필 ---- */}
          <aside style={styles.sidebar} className="actor-detail-sidebar">
            <div style={styles.profileImageWrap} className="actor-detail-profile-img">
              <ProfilePhotoWrapper
                src={photoUrl}
                alt={actor.name}
                imageProtected={!isDirectorOrAdmin(role)}
                downloadHref={
                  isDirectorOrAdmin(role) && actor.drive_photo_id
                    ? `https://drive.google.com/uc?id=${actor.drive_photo_id}&export=download`
                    : undefined
                }
              />
            </div>

            <div style={styles.profileInfo}>
              <h1 style={styles.actorName}>{actor.name}</h1>
              <p style={styles.actorSubName}>
                {actor.gender === '남' ? '남자 배우' : actor.gender === '여' ? '여자 배우' : '배우'}
                {actor.age_group ? ` · ${actor.age_group}` : ''}
              </p>

              {/* 캐스팅 자동 분류 — 캐스팅 디렉터가 1초 안에 판단할 정보 */}
              {actor.casting_summary && (
                <p style={styles.castingSummary}>{actor.casting_summary}</p>
              )}
              {actor.casting_tags && actor.casting_tags.length > 0 && (
                <div style={styles.castingTagsWrap}>
                  {actor.casting_tags.map((t) => (
                    <span key={t} style={styles.castingTag}>{t}</span>
                  ))}
                </div>
              )}

              <dl style={styles.specList}>
                {actor.height && (
                  <>
                    <dt style={styles.specKey}>신장</dt>
                    <dd style={styles.specVal}>{actor.height} cm</dd>
                  </>
                )}
                {actor.weight && (
                  <>
                    <dt style={styles.specKey}>체중</dt>
                    <dd style={styles.specVal}>{actor.weight} kg</dd>
                  </>
                )}
              </dl>

              {actor.skills && actor.skills.length > 0 && (
                <div style={styles.skillsWrap}>
                  <p style={styles.skillsLabel}>스킬</p>
                  <div style={styles.skillTags}>
                    {actor.skills.map((sk, i) => (
                      <span key={i} style={styles.skillTag}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 카카오 공유 버튼 */}
              <ShareButton webUrl={pageUrl} />

              {/* 프로필 PDF 다운로드 (있을 때만 노출) */}
              {actor.profile_pdf_url && (
                <a
                  href={actor.profile_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.pdfButton}
                >
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                  프로필 PDF 다운로드
                </a>
              )}
            </div>
          </aside>

          {/* ---- 우측: 탭 콘텐츠 ---- */}
          <div style={styles.content}>
            <ActorTabs
              actor={actor}
              canViewContact={isDirectorOrAdmin(role)}
              imageProtected={!isDirectorOrAdmin(role)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 80,
    paddingBottom: 80,
  },
  /* ---- 접근 불가 ---- */
  deniedBox: {
    maxWidth: 480,
    margin: '60px auto',
    textAlign: 'center',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '60px 40px',
  },
  deniedIcon: {
    fontSize: '2.8rem',
    marginBottom: 16,
  },
  deniedTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: 16,
  },
  deniedDesc: {
    fontSize: '0.95rem',
    color: 'var(--gray)',
    lineHeight: 1.8,
    marginBottom: 12,
  },
  deniedSub: {
    fontSize: '0.82rem',
    color: 'var(--gray)',
    marginBottom: 28,
  },
  deniedLink: {
    color: 'var(--gold)',
    textDecoration: 'underline',
  },
  deniedBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
  },
  btnPrimary: {
    display: 'block',
    background: 'var(--gold)',
    color: '#ffffff',
    borderRadius: 6,
    padding: '12px 0',
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  btnSecondary: {
    display: 'block',
    border: '1px solid var(--border)',
    color: 'var(--gray)',
    borderRadius: 6,
    padding: '11px 0',
    fontSize: '0.88rem',
    textDecoration: 'none',
  },
  layout: {
    /* layout handled by .actor-detail-layout CSS class */
  },
  sidebar: {
    position: 'sticky',
    top: 80,
  },
  profileImageWrap: {
    marginBottom: 20, /* aspect-ratio / overflow는 ProfilePhotoWrapper 내부에서 처리 */
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  actorName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--white)',
    letterSpacing: '0.05em',
  },
  actorSubName: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
    marginTop: -8,
  },
  castingSummary: {
    fontFamily: 'var(--font-serif)',
    fontSize: '0.95rem',
    color: 'var(--white)',
    fontWeight: 600,
    lineHeight: 1.5,
    padding: '12px 14px',
    background: 'rgba(21,72,138,0.06)',
    borderLeft: '3px solid var(--gold)',
    borderRadius: 4,
    marginTop: 4,
    letterSpacing: '0.005em',
  },
  castingTagsWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 4,
  },
  castingTag: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--gold)',
    background: 'rgba(21,72,138,0.1)',
    border: '1px solid rgba(21,72,138,0.25)',
    borderRadius: 3,
    padding: '4px 10px',
  },
  pdfButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 16px',
    background: 'transparent',
    color: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textDecoration: 'none',
    marginTop: 8,
  },
  specList: {
    display: 'grid',
    gridTemplateColumns: '60px 1fr',
    gap: '6px 8px',
    alignItems: 'baseline',
  },
  specKey: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
  },
  specVal: {
    fontSize: '0.9rem',
    color: 'var(--white)',
  },
  skillsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  skillsLabel: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
  },
  skillTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  skillTag: {
    padding: '3px 10px',
    background: 'rgba(196,165,90,0.12)',
    border: '1px solid rgba(196,165,90,0.3)',
    borderRadius: 3,
    fontSize: '0.75rem',
    color: 'var(--gold-light)',
    letterSpacing: '0.03em',
  },
  content: {
    minWidth: 0,
  },
}
