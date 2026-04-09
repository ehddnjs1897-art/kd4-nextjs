'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ---- 타입 (actor detail 페이지와 동일) ---- */
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

interface Actor {
  id: string
  name: string
  email: string | null
  phone: string | null
  instagram: string | null
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: FilmoEntry[]
}

interface Props {
  actor: Actor
  isLoggedIn: boolean
}

type Tab = 'photos' | 'videos' | 'filmography' | 'contact'

const CATEGORY_LABEL: Record<FilmoEntry['category'], string> = {
  drama: '드라마',
  film: '영화',
  cf: 'CF',
  musical: '뮤지컬',
  theater: '연극',
  etc: '기타',
}

function photoUrl(drivePhotoId: string) {
  return `https://drive.google.com/thumbnail?id=${drivePhotoId}&sz=w600`
}

export default function ActorTabs({ actor, isLoggedIn }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('photos')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'photos', label: '사진 갤러리', count: actor.actor_photos.length },
    { key: 'videos', label: '영상', count: actor.actor_videos.length },
    { key: 'filmography', label: '필모그래피', count: actor.actor_filmography.length },
    { key: 'contact', label: '연락처' },
  ]

  return (
    <div>
      {/* 탭 헤더 */}
      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.key ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={styles.tabCount}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* 사진 갤러리 */}
      {activeTab === 'photos' && (
        <div>
          {actor.actor_photos.length === 0 ? (
            <p style={styles.empty}>등록된 사진이 없습니다.</p>
          ) : (
            <div style={styles.photoGrid}>
              {actor.actor_photos
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((photo) => (
                  <div key={photo.id} style={styles.photoItem}>
                    <Image
                      src={photoUrl(photo.drive_photo_id)}
                      alt={photo.caption || actor.name}
                      fill
                      sizes="(max-width:640px) 50vw, 33vw"
                      style={{ objectFit: 'cover', objectPosition: 'center top' }}
                      unoptimized
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 영상 */}
      {activeTab === 'videos' && (
        <div>
          {actor.actor_videos.length === 0 ? (
            <p style={styles.empty}>등록된 영상이 없습니다.</p>
          ) : (
            <div style={styles.videoGrid}>
              {actor.actor_videos.map((video) => (
                <div key={video.id} style={styles.videoItem}>
                  <div style={styles.videoWrapper}>
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtube_id}`}
                      title={video.title || actor.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={styles.iframe}
                    />
                  </div>
                  {video.title && (
                    <p style={styles.videoTitle}>{video.title}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 필모그래피 */}
      {activeTab === 'filmography' && (
        <div>
          {actor.actor_filmography.length === 0 ? (
            <p style={styles.empty}>등록된 필모그래피가 없습니다.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>구분</th>
                  <th style={styles.th}>작품명</th>
                  <th style={styles.th}>역할</th>
                  <th style={styles.th}>연도</th>
                  <th style={styles.th}>제작사</th>
                </tr>
              </thead>
              <tbody>
                {actor.actor_filmography
                  .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
                  .map((entry) => (
                    <tr key={entry.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>
                          {CATEGORY_LABEL[entry.category]}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600, color: 'var(--white)' }}>
                        {entry.title}
                      </td>
                      <td style={styles.td}>{entry.role ?? '—'}</td>
                      <td style={styles.td}>{entry.year ?? '—'}</td>
                      <td style={styles.td}>{entry.production ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 연락처 */}
      {activeTab === 'contact' && (
        <div style={styles.contactArea}>
          {!isLoggedIn ? (
            <div style={styles.loginPrompt}>
              <p style={styles.loginPromptText}>
                연락처 정보는 로그인 후 확인할 수 있습니다.
              </p>
              <Link href="/auth/login" style={styles.loginBtn}>
                로그인하기
              </Link>
            </div>
          ) : (
            <dl style={styles.contactList}>
              {actor.phone && (
                <>
                  <dt style={styles.contactKey}>전화번호</dt>
                  <dd style={styles.contactVal}>
                    <a href={`tel:${actor.phone}`} style={styles.contactLink}>
                      {actor.phone}
                    </a>
                  </dd>
                </>
              )}
              {actor.email && (
                <>
                  <dt style={styles.contactKey}>이메일</dt>
                  <dd style={styles.contactVal}>
                    <a href={`mailto:${actor.email}`} style={styles.contactLink}>
                      {actor.email}
                    </a>
                  </dd>
                </>
              )}
              {actor.instagram && (
                <>
                  <dt style={styles.contactKey}>인스타그램</dt>
                  <dd style={styles.contactVal}>
                    <a
                      href={`https://instagram.com/${actor.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.contactLink}
                    >
                      {actor.instagram.startsWith('@')
                        ? actor.instagram
                        : `@${actor.instagram}`}
                    </a>
                  </dd>
                </>
              )}
              {!actor.phone && !actor.email && !actor.instagram && (
                <p style={styles.empty}>등록된 연락처 정보가 없습니다.</p>
              )}
            </dl>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    marginBottom: 24,
    gap: 0,
    overflowX: 'auto' as const,
  },
  tabBtn: {
    padding: '12px 20px',
    fontSize: '0.88rem',
    color: 'var(--gray)',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
    transition: 'color 0.2s',
    marginBottom: -1,
  },
  tabBtnActive: {
    color: 'var(--gold)',
    borderBottom: '2px solid var(--gold)',
    fontWeight: 600,
  },
  tabCount: {
    fontSize: '0.7rem',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    padding: '1px 6px',
    borderRadius: 10,
    color: 'var(--gray)',
  },
  empty: {
    fontSize: '0.9rem',
    color: 'var(--gray)',
    padding: '40px 0',
    textAlign: 'center',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
  },
  photoItem: {
    position: 'relative',
    aspectRatio: '9/16',
    borderRadius: 4,
    overflow: 'hidden',
    background: 'var(--bg3)',
  },
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
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.88rem',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid var(--border)',
    fontWeight: 400,
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '12px 14px',
    color: 'var(--gray)',
    verticalAlign: 'middle' as const,
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(196,165,90,0.1)',
    border: '1px solid rgba(196,165,90,0.25)',
    borderRadius: 3,
    fontSize: '0.72rem',
    color: 'var(--gold-light)',
    letterSpacing: '0.04em',
  },
  contactArea: {
    maxWidth: 480,
  },
  loginPrompt: {
    textAlign: 'center',
    padding: '60px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  loginPromptText: {
    fontSize: '0.9rem',
    color: 'var(--gray)',
  },
  loginBtn: {
    display: 'inline-block',
    padding: '10px 28px',
    background: 'var(--gold)',
    color: '#0a0a0a',
    borderRadius: 5,
    fontSize: '0.88rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    textDecoration: 'none',
  },
  contactList: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    gap: '16px 12px',
    alignItems: 'start',
  },
  contactKey: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
    paddingTop: 2,
  },
  contactVal: {
    fontSize: '0.9rem',
    color: 'var(--white)',
  },
  contactLink: {
    color: 'var(--gold-light)',
    textDecoration: 'none',
  },
}
