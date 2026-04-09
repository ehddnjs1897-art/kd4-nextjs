import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ActorTabs from '@/components/actors/ActorTabs'
import ShareButton from '@/components/actors/ShareButton'

/* ---- 타입 정의 ---- */
interface Actor {
  id: string
  name: string
  gender: 'M' | 'F'
  age_group: string
  height: number | null
  weight: number | null
  skills: string[]
  drive_photo_id: string | null
  profile_photo: string | null
  email: string | null
  phone: string | null
  instagram: string | null
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

/* ---- 데이터 fetch ---- */
async function getActor(id: string): Promise<Actor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actors')
    .select(
      `
      id, name, gender, age_group, height, weight, skills,
      drive_photo_id, profile_photo, email, phone, instagram,
      actor_photos ( id, drive_photo_id, caption, sort_order ),
      actor_videos ( id, youtube_id, title ),
      actor_filmography ( id, category, title, role, year, production )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Actor
}

function profilePhotoUrl(actor: Actor): string {
  if (actor.profile_photo) return actor.profile_photo
  if (actor.drive_photo_id)
    return `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w900`
  return '/placeholder-actor.jpg'
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
  const actor = await getActor(id)
  if (!actor) notFound()

  /* 로그인 여부 확인 (연락처 노출 제어) */
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const photoUrl = profilePhotoUrl(actor)
  const pageUrl =
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/actors/${actor.id}`
      : `https://kd4studio.com/actors/${actor.id}`

  return (
    <div style={styles.page}>
      <div className="container">
        <div style={styles.layout}>
          {/* ---- 좌측: 프로필 ---- */}
          <aside style={styles.sidebar}>
            <div style={styles.profileImageWrap}>
              <Image
                src={photoUrl}
                alt={actor.name}
                fill
                sizes="(max-width:768px) 100vw, 340px"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                unoptimized={photoUrl.includes('drive.google.com')}
                priority
              />
            </div>

            <div style={styles.profileInfo}>
              <h1 style={styles.actorName}>{actor.name}</h1>
              <p style={styles.actorSubName}>
                {actor.gender === 'M' ? '남자 배우' : '여자 배우'} · {actor.age_group}
              </p>

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
              <ShareButton
                title={`${actor.name} | KD4 액팅 스튜디오`}
                description={`${actor.name} 배우 갤러리를 확인해 보세요.`}
                imageUrl={photoUrl}
                webUrl={pageUrl}
              />
            </div>
          </aside>

          {/* ---- 우측: 탭 콘텐츠 ---- */}
          <div style={styles.content}>
            <ActorTabs
              actor={actor}
              isLoggedIn={isLoggedIn}
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 40,
    alignItems: 'start',
  },
  sidebar: {
    position: 'sticky',
    top: 80,
  },
  profileImageWrap: {
    position: 'relative',
    aspectRatio: '9/16',
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg3)',
    marginBottom: 20,
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
