'use client'

import { useState } from 'react'
import Image from 'next/image'
import R2Video from '@/components/actors/R2Video'

/* ---- 타입 ---- */
interface ActorPhoto {
  id: string
  drive_photo_id: string | null
  url?: string | null
  storage_path?: string | null
  caption: string | null
  sort_order: number
}

interface ActorVideo {
  id: string
  youtube_id: string | null
  r2_key?: string | null
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

interface Actor {
  id: string
  name: string
  email: string | null
  phone: string | null
  instagram: string | null
  drive_photo_id: string | null
  profile_photo: string | null
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: FilmoEntry[]
}

interface Props {
  actor: Actor
  /** director / admin: true → 연락처 열람 가능 */
  canViewContact: boolean
  /** true: 이미지 우클릭/드래그 차단 */
  imageProtected: boolean
}

type FilmoCategory = 'drama' | 'film' | 'cf' | 'musical' | 'theater' | 'etc'

const CATEGORY_LABEL: Record<FilmoCategory, string> = {
  drama: '드라마',
  film: '영화',
  cf: 'CF',
  musical: '뮤지컬',
  theater: '연극',
  etc: '기타',
}

function photoSrc(p: ActorPhoto): string {
  if (p.url) return p.url
  if (p.storage_path) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/actor-photos/${p.storage_path}`
  }
  if (p.drive_photo_id) return `https://drive.google.com/thumbnail?id=${p.drive_photo_id}&sz=w800`
  return '/placeholder-actor.svg'
}

export default function ActorTabs({ actor, canViewContact, imageProtected }: Props) {
  // 필모 카테고리 필터
  const allFilmo = [...actor.actor_filmography].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  const availableCategories = (
    ['drama', 'film', 'cf', 'musical', 'theater', 'etc'] as FilmoCategory[]
  ).filter((cat) => allFilmo.some((f) => f.category === cat))
  const [activeFilmoTab, setActiveFilmoTab] = useState<FilmoCategory>(
    availableCategories[0] ?? 'drama'
  )

  // 프로필 사진 목록 (profile_photo + actor_photos, 최대 3장)
  const mainPhotoUrl = actor.profile_photo
    ?? (actor.drive_photo_id
      ? `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w1200`
      : null)
  const sortedPhotos = [...actor.actor_photos].sort((a, b) => a.sort_order - b.sort_order)
  const stripPhotos: string[] = []
  if (mainPhotoUrl) stripPhotos.push(mainPhotoUrl)
  for (const p of sortedPhotos) {
    const src = photoSrc(p)
    if (src && !stripPhotos.includes(src)) stripPhotos.push(src)
    if (stripPhotos.length >= 3) break
  }

  // 영상
  const videos = actor.actor_videos ?? []

  // 최근 출연 (year >= 2025)
  const recentWorks = allFilmo.filter((f) => (f.year ?? 0) >= 2025)

  // 필모그래피 (선택된 카테고리)
  const filmoByCategory = allFilmo.filter((f) => f.category === activeFilmoTab)

  return (
    <div style={s.root}>
      {/* ============ 섹션 1: 프로필 사진 스트립 ============ */}
      {stripPhotos.length > 0 && (
        <section style={s.section}>
          <div
            style={s.photoStrip}
            onContextMenu={imageProtected ? (e) => e.preventDefault() : undefined}
            onDragStart={(e) => e.preventDefault()}
          >
            {stripPhotos.map((url, i) => (
              <div key={i} style={s.photoCard}>
                {imageProtected ? (
                  <>
                    <div
                      style={{
                        ...s.photoImg,
                        backgroundImage: `url("${url}")`,
                      }}
                    />
                    <div style={s.photoProtectOverlay} />
                  </>
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image
                      src={url}
                      alt={`${actor.name} 프로필 ${i + 1}`}
                      fill
                      sizes="(max-width:640px) 100vw, 33vw"
                      style={{ objectFit: 'cover', objectPosition: 'center top' }}
                      unoptimized
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ 섹션 2: 01 · REEL ============ */}
      {videos.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>01</span>
            <span style={s.sectionTitle}>REEL</span>
          </h2>
          <div style={s.videoGrid}>
            {videos.map((video) =>
              video.youtube_id ? (
                <div key={video.id} style={s.videoItem}>
                  <div style={s.videoWrapper}>
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtube_id}`}
                      title={video.title || actor.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={s.iframe}
                    />
                  </div>
                  {video.title && <p style={s.videoTitle}>{video.title}</p>}
                </div>
              ) : video.r2_key ? (
                <R2Video
                  key={video.id}
                  videoId={video.id}
                  title={video.title}
                  poster={actor.profile_photo}
                  allowDownload={canViewContact}
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ============ 섹션 3: 02 · CURRENT WORKS ============ */}
      {recentWorks.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>02</span>
            <span style={s.sectionTitle}>CURRENT WORKS</span>
            <span style={s.sectionSub}>최근 출연 &amp; 방영</span>
          </h2>
          <div style={s.recentGrid}>
            {recentWorks.map((entry) => (
              <div key={entry.id} style={s.recentCard}>
                <span style={s.recentCat}>{CATEGORY_LABEL[entry.category]}</span>
                <p style={s.recentTitle}>{entry.title}</p>
                {entry.role && <p style={s.recentRole}>{entry.role}</p>}
                <p style={s.recentYear}>{entry.year}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ 섹션 4: 03 · FILMOGRAPHY ============ */}
      {allFilmo.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>03</span>
            <span style={s.sectionTitle}>FILMOGRAPHY</span>
          </h2>

          {/* 카테고리 탭 버튼 */}
          {availableCategories.length > 1 && (
            <div style={s.filmoTabBar}>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFilmoTab(cat)}
                  style={{
                    ...s.filmoTabBtn,
                    ...(activeFilmoTab === cat ? s.filmoTabBtnActive : {}),
                  }}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          )}

          {/* 필모 테이블 */}
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 56 }}>연도</th>
                <th style={s.th}>작품명</th>
                <th style={s.th}>역할</th>
              </tr>
            </thead>
            <tbody>
              {filmoByCategory.map((entry) => (
                <tr key={entry.id} style={s.tr}>
                  <td style={{ ...s.td, color: 'var(--gray)', fontSize: '0.82rem' }}>
                    {entry.year ?? '—'}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--white)' }}>
                    {entry.title}
                  </td>
                  <td style={s.td}>{entry.role ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 56,
  },

  /* ---- 섹션 공통 ---- */
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    borderBottom: '1px solid var(--border)',
    paddingBottom: 12,
  },
  sectionNum: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.12em',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--white)',
    letterSpacing: '0.12em',
  },
  sectionSub: {
    fontSize: '0.78rem',
    color: 'var(--gray)',
    letterSpacing: '0.02em',
    marginLeft: 4,
  },

  /* ---- 섹션 1: 프로필 사진 스트립 ---- */
  photoStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  photoCard: {
    position: 'relative',
    aspectRatio: '2 / 3',
    borderRadius: 6,
    overflow: 'hidden',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  photoImg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
  },
  photoProtectOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    cursor: 'default',
  },

  /* ---- 섹션 2: REEL ---- */
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  videoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    borderRadius: 6,
    background: '#000',
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  videoTitle: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
  },

  /* ---- 섹션 3: CURRENT WORKS ---- */
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
  },
  recentCard: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  recentCat: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.68rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.1em',
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: 'var(--white)',
    lineHeight: 1.4,
  },
  recentRole: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
  },
  recentYear: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    marginTop: 2,
    opacity: 0.7,
  },

  /* ---- 섹션 4: FILMOGRAPHY ---- */
  filmoTabBar: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  filmoTabBtn: {
    padding: '6px 16px',
    fontSize: '0.8rem',
    color: 'var(--gray)',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.04em',
    transition: 'color 0.15s, border-color 0.15s',
  },
  filmoTabBtnActive: {
    color: 'var(--gold)',
    borderColor: 'var(--gold)',
    background: 'rgba(196,165,90,0.07)',
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.88rem',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontSize: '0.72rem',
    color: 'var(--gray)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid var(--border)',
    fontWeight: 400,
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '11px 14px',
    color: 'var(--gray)',
    verticalAlign: 'middle' as const,
    fontSize: '0.88rem',
  },
}
