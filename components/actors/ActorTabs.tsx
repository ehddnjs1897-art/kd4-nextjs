'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ---- 타입 ---- */
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
  drive_photo_id: string | null
  profile_photo: string | null
  actor_photos: ActorPhoto[]
  actor_videos: ActorVideo[]
  actor_filmography: FilmoEntry[]
}

interface Props {
  actor: Actor
  /** director / admin: true → 연락처 탭 열람 가능 */
  canViewContact: boolean
  /** true(배우 회원): 이미지 저장 전면 차단 / false(디렉터): 다운로드 버튼 제공 */
  imageProtected: boolean
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

function thumbUrl(drivePhotoId: string) {
  return `https://drive.google.com/thumbnail?id=${drivePhotoId}&sz=w800`
}

function downloadUrl(drivePhotoId: string) {
  return `https://drive.google.com/uc?id=${drivePhotoId}&export=download`
}

export default function ActorTabs({ actor, canViewContact, imageProtected }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('photos')

  // 메인 프로필 이미지를 1페이지로, actor_photos를 추가 페이지로
  const mainPhotoUrl = actor.profile_photo
    ?? (actor.drive_photo_id ? `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w1200` : null)

  const sortedPhotos = [...actor.actor_photos].sort((a, b) => a.sort_order - b.sort_order)

  // 갤러리 총 페이지 수 (메인 + actor_photos)
  const totalPhotoCount = (mainPhotoUrl ? 1 : 0) + sortedPhotos.length

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'photos', label: '프로필', count: totalPhotoCount },
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

      {/* ---- 프로필 갤러리 (1페이지 = 메인, 2페이지+ = actor_photos) ---- */}
      {activeTab === 'photos' && (
        <div>
          {imageProtected && (
            <p style={styles.protectNotice}>
              🔒 이미지 저작권 보호 적용 — 저장 및 다운로드가 제한됩니다.
            </p>
          )}

          {totalPhotoCount === 0 ? (
            <p style={styles.empty}>등록된 프로필이 없습니다.</p>
          ) : (
            <div style={styles.photoGrid}>
              {/* 1페이지: 메인 프로필 이미지 */}
              {mainPhotoUrl && (
                imageProtected ? (
                  <div
                    style={{
                      ...styles.photoItem,
                      backgroundImage: `url("${mainPhotoUrl}")`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div style={styles.photoOverlay} />
                    <span style={styles.pageLabel}>01</span>
                  </div>
                ) : (
                  <div style={styles.photoItemDirector}>
                    <div style={{ ...styles.photoItem, position: 'relative' }}>
                      <Image
                        src={mainPhotoUrl}
                        alt={`${actor.name} 프로필 1페이지`}
                        fill
                        sizes="(max-width:640px) 100vw, 50vw"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        unoptimized
                      />
                      <span style={styles.pageLabel}>01</span>
                    </div>
                    {actor.drive_photo_id && (
                      <a
                        href={downloadUrl(actor.drive_photo_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.downloadBtn}
                      >
                        ↓ 프로필 저장
                      </a>
                    )}
                  </div>
                )
              )}

              {/* 2페이지+: actor_photos */}
              {sortedPhotos.map((photo, idx) =>
                imageProtected ? (
                  <div
                    key={photo.id}
                    style={{
                      ...styles.photoItem,
                      backgroundImage: `url("${thumbUrl(photo.drive_photo_id)}")`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div style={styles.photoOverlay} />
                    <span style={styles.pageLabel}>{String(idx + 2).padStart(2, '0')}</span>
                  </div>
                ) : (
                  <div key={photo.id} style={styles.photoItemDirector}>
                    <div style={{ ...styles.photoItem, position: 'relative' }}>
                      <Image
                        src={thumbUrl(photo.drive_photo_id)}
                        alt={photo.caption || `${actor.name} ${idx + 2}페이지`}
                        fill
                        sizes="(max-width:640px) 100vw, 50vw"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        unoptimized
                      />
                      <span style={styles.pageLabel}>{String(idx + 2).padStart(2, '0')}</span>
                    </div>
                    <a
                      href={downloadUrl(photo.drive_photo_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.downloadBtn}
                    >
                      ↓ 저장
                    </a>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- 영상 ---- */}
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
                  {video.title && <p style={styles.videoTitle}>{video.title}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- 필모그래피 ---- */}
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

      {/* ---- 연락처 ---- */}
      {activeTab === 'contact' && (
        <div style={styles.contactArea}>
          {!canViewContact ? (
            <div style={styles.lockedPrompt}>
              <p style={styles.lockIcon}>🔒</p>
              <p style={styles.lockedText}>
                연락처 정보는{' '}
                <strong style={{ color: 'var(--gold)' }}>디렉터 회원</strong>만
                열람할 수 있습니다.
              </p>
              <Link href="/auth/signup" style={styles.upgradeBtn}>
                디렉터 회원으로 가입
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
                      {actor.instagram.startsWith('@') ? actor.instagram : `@${actor.instagram}`}
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
  protectNotice: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    padding: '7px 12px',
    marginBottom: 12,
    letterSpacing: '0.02em',
  },
  empty: {
    fontSize: '0.9rem',
    color: 'var(--gray)',
    padding: '40px 0',
    textAlign: 'center',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: 14,
  },
  /* 프로필 슬라이드: landscape 비율 */
  photoItem: {
    position: 'relative',
    aspectRatio: '3/2',
    borderRadius: 6,
    overflow: 'hidden',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  /* 투명 오버레이: 드래그/클릭 차단 */
  photoOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    cursor: 'default',
  },
  /* 페이지 번호 뱃지 */
  pageLabel: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 2,
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'rgba(196,165,90,0.9)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.1em',
    pointerEvents: 'none',
  },
  /* 디렉터: 이미지 + 다운로드 버튼 묶음 */
  photoItemDirector: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  downloadBtn: {
    display: 'block',
    textAlign: 'center',
    padding: '5px 0',
    fontSize: '0.75rem',
    color: 'var(--gold)',
    textDecoration: 'none',
    border: '1px solid rgba(196,165,90,0.3)',
    borderRadius: 3,
    background: 'rgba(196,165,90,0.06)',
    letterSpacing: '0.04em',
    transition: 'background 0.15s',
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  videoItem: { display: 'flex', flexDirection: 'column', gap: 8 },
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
  videoTitle: { fontSize: '0.85rem', color: 'var(--gray)' },
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
  tr: { borderBottom: '1px solid var(--border)' },
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
  contactArea: { maxWidth: 480 },
  lockedPrompt: {
    textAlign: 'center',
    padding: '60px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  lockIcon: { fontSize: '2rem' },
  lockedText: { fontSize: '0.9rem', color: 'var(--gray)', lineHeight: 1.7 },
  upgradeBtn: {
    display: 'inline-block',
    padding: '10px 28px',
    border: '1px solid var(--gold)',
    color: 'var(--gold)',
    borderRadius: 5,
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    textDecoration: 'none',
    marginTop: 4,
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
  contactVal: { fontSize: '0.9rem', color: 'var(--white)' },
  contactLink: { color: 'var(--gold-light)', textDecoration: 'none' },
}
