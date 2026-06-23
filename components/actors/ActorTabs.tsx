'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import R2Video from '@/components/actors/R2Video'
import PhotoLightbox from '@/components/actors/PhotoLightbox'
import SignupPromptModal from '@/components/actors/SignupPromptModal'
import YouTubeFacade from '@/components/youtube/YouTubeFacade'

/* ---- 타입 ---- */
interface ActorPhoto {
  id: string
  drive_photo_id: string | null
  url?: string | null
  storage_path?: string | null
  caption: string | null
  sort_order: number
  photo_type?: string | null   // 'profile' | 'current'
  label?: string | null        // '앞면' | '좌측면' | '우측면' | '뒷면'
}

interface ActorVideo {
  id: string
  youtube_id: string | null
  r2_key?: string | null
  title: string | null
  video_type?: string | null  // 'reel' | 'monologue'
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
  /** 본인 or admin: true → 필모그래피 인라인 편집 가능 */
  canEdit?: boolean
  /** true: 비로그인 — 영상 재생 잠금, 클릭 시 회원가입 안내 (2026-06-12 부분공개 정책) */
  videoLocked?: boolean
  /** HERO 메인 프로필 사진 URL — 갤러리에서 동일 URL 중복 노출 방지 (2026-06-12 리디자인) */
  mainPhotoUrl?: string
}

/** 비로그인용 영상 잠금 카드 — 썸네일 위 잠금 오버레이, 클릭 시 회원가입 안내 */
function LockedVideoCard({ thumbUrl, title, onClick }: { thumbUrl: string | null; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} — 회원 전용 영상, 회원가입 안내 보기`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: thumbUrl ? `#000 url("${thumbUrl}") center/cover no-repeat` : 'var(--bg3)',
        cursor: 'pointer',
        padding: 0,
        display: 'block',
      }}
    >
      <span style={{
        position: 'absolute', inset: 0,
        background: 'rgba(17,17,17,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span aria-hidden="true" style={{ fontSize: '1.6rem' }}>🔒</span>
        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em' }}>
          회원 전용 영상
        </span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
          무료 회원가입 후 시청 가능
        </span>
      </span>
    </button>
  )
}

type FilmoCategory = 'drama' | 'film' | 'cf' | 'musical' | 'theater' | 'etc'

const CATEGORY_LABEL: Record<FilmoCategory, string> = {
  drama: '드라마',
  film: '영화',
  cf: 'CF',
  musical: '공연',  // 2026-06-08 연극+뮤지컬 → '공연' 통합 표시
  theater: '공연',
  etc: '기타',
}

const FILM_TYPE_STYLE: Record<string, React.CSSProperties> = {
  '상업': { background: 'rgba(21,72,138,0.08)', color: 'var(--navy)', border: '1px solid rgba(21,72,138,0.2)' },
  '상업영화': { background: 'rgba(21,72,138,0.08)', color: 'var(--navy)', border: '1px solid rgba(21,72,138,0.2)' },
  '독립장편': { background: 'rgba(80,80,80,0.08)', color: 'var(--gray-light)', border: '1px solid var(--border)' },
  '단편': { background: 'rgba(80,80,80,0.06)', color: 'var(--gray)', border: '1px solid var(--border)' },
}

// 실제 수상만 AWARD 섹션 노출 / 영화제 출품·선정·초청·후보는 작품 옆 빨강 표기
const WIN_RE = /(수상|대상|그랑프리|최우수|우수상|신인상|연기상|작품상|남우|여우|특별상|심사위원|감독상|인기상)/
const NOMINEE_RE = /(후보|노미네이트|노미네이션|nominee|nominat)/i
const FEST_RE = /(영화제|페스티벌|출품|선정|초청|상영|경쟁부문|nominee|festival)/i
// 진짜 수상 = 수상 키워드 포함 AND 후보가 아님 (예: "청룡영화제 신인상 후보" → 수상 아님)
function isWinAward(a?: string | null): boolean {
  return !!a && WIN_RE.test(a) && !NOMINEE_RE.test(a)
}

const SECTION_NUMS: Record<FilmoCategory, string> = {
  drama: '03',
  film: '04',
  theater: '05',  // 공연(연극+뮤지컬)
  musical: '05',
  cf: '06',
  etc: '07',
}

function photoSrc(p: ActorPhoto): string {
  if (p.url) return p.url
  if (p.storage_path) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/actor-photos/${p.storage_path}`
  }
  if (p.drive_photo_id) return `https://drive.google.com/thumbnail?id=${p.drive_photo_id}&sz=w800`
  return '/placeholder-actor.svg'
}

export default function ActorTabs({ actor, canViewContact, imageProtected, canEdit = false, videoLocked = false, mainPhotoUrl }: Props) {
  // 비로그인 영상 클릭 → 회원가입 안내 모달
  const [signupPromptOpen, setSignupPromptOpen] = useState(false)
  // ── 편집 상태 ──
  const [filmo, setFilmo] = useState<FilmoEntry[]>(actor.actor_filmography)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState({ year: '', title: '', role: '', broadcaster: '', film_type: '' })
  const [addingCat, setAddingCat] = useState<FilmoCategory | null>(null)
  const [newEntry, setNewEntry] = useState({ year: '', title: '', role: '', broadcaster: '', film_type: '' })
  const [saving, setSaving] = useState(false)
  const [editErr, setEditErr] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  // 라이트박스 상태 — 'profile' 또는 'current' + 인덱스
  const [lightbox, setLightbox] = useState<{ source: 'profile' | 'current'; index: number } | null>(null)
  const editErrRef = useRef<HTMLDivElement>(null)

  // 필모그래피 편집 오류 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (editErr) editErrRef.current?.focus() }, [editErr])

  function startEdit(entry: FilmoEntry) {
    setEditingId(entry.id)
    setEditFields({
      year: entry.year?.toString() ?? '',
      title: entry.title ?? '',
      role: entry.role ?? '',
      broadcaster: entry.broadcaster ?? '',
      film_type: entry.film_type ?? '',
    })
    setAddingCat(null)
    setEditErr('')
  }

  // 최근출연 행에서 편집 진입 — 해당 작품을 편집모드로 열고 아래 카테고리 표로 스크롤 (2026-06-23)
  function editFromRecent(entry: FilmoEntry) {
    startEdit(entry)
    setTimeout(() => {
      const catId = entry.category === 'musical' ? 'theater' : entry.category
      document.getElementById(`filmo-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  async function saveEdit(entry: FilmoEntry) {
    if (!editFields.title.trim()) return
    setSaving(true); setEditErr('')
    try {
      const res = await fetch(`/api/actors/${actor.id}/filmography/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          year: editFields.year ? parseInt(editFields.year) : null,
          title: editFields.title.trim(),
          role: editFields.role || null,
          broadcaster: editFields.broadcaster || null,
          film_type: editFields.film_type || null,
        }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || '저장 실패') }
      setFilmo(prev => prev.map(f => f.id === entry.id ? {
        ...f,
        year: editFields.year ? parseInt(editFields.year) : null,
        title: editFields.title.trim(),
        role: editFields.role || null,
        broadcaster: editFields.broadcaster || null,
        film_type: editFields.film_type || null,
      } : f))
      setEditingId(null)
    } catch (e) { setEditErr(e instanceof Error ? e.message : '오류') }
    finally { setSaving(false) }
  }

  async function deleteEntry(filmId: string) {
    if (confirmingDeleteId !== filmId) { setConfirmingDeleteId(filmId); return }
    setConfirmingDeleteId(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/actors/${actor.id}/filmography/${filmId}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || '삭제 실패') }
      setFilmo(prev => prev.filter(f => f.id !== filmId))
      if (editingId === filmId) setEditingId(null)
    } catch (e) { setEditErr(e instanceof Error ? e.message : '삭제 오류') }
    finally { setSaving(false) }
  }

  async function addEntry(cat: FilmoCategory) {
    if (!newEntry.title.trim()) return
    setSaving(true); setEditErr('')
    try {
      const res = await fetch(`/api/actors/${actor.id}/filmography`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          category: cat,
          year: newEntry.year ? parseInt(newEntry.year) : null,
          title: newEntry.title.trim(),
          role: newEntry.role || null,
          broadcaster: newEntry.broadcaster || null,
          film_type: newEntry.film_type || null,
        }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || '추가 실패')
      setFilmo(prev => [...prev, {
        id: j.id, category: cat,
        year: newEntry.year ? parseInt(newEntry.year) : null,
        title: newEntry.title.trim(),
        role: newEntry.role || null,
        production: null,
        broadcaster: newEntry.broadcaster || null,
        film_type: newEntry.film_type || null,
        award: null,
      }])
      setAddingCat(null)
      setNewEntry({ year: '', title: '', role: '', broadcaster: '', film_type: '' })
    } catch (e) { setEditErr(e instanceof Error ? e.message : '추가 오류') }
    finally { setSaving(false) }
  }

  // 필모 전체 (연도 내림차순) — 렌더마다 재정렬 방지
  const allFilmo = useMemo(() => [...filmo].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)), [filmo])

  // 세로형 헤드샷 갤러리 — 회원이 직접 업로드한 사진(actor_photos)만 (최대 4장).
  // 상단 헤더가 메인 프로필/이력서 이미지를 이미 크게 보여주므로, 여기서는 중복 없이 헤드샷만 노출.
  const sortedPhotos = [...actor.actor_photos].sort((a, b) => a.sort_order - b.sort_order)

  // 프로필사진: photo_type='profile' 또는 null/undefined
  // mainPhotoUrl과 동일한 URL은 skip — HERO 메인사진이 갤러리에 또 나오는 중복 방지 (2026-06-12 대표 지시)
  const profilePhotos = sortedPhotos.filter(p => !p.photo_type || p.photo_type === 'profile')
  const stripPhotos: string[] = []
  for (const p of profilePhotos) {
    const src = photoSrc(p)
    if (src && src !== mainPhotoUrl && !stripPhotos.includes(src)) stripPhotos.push(src)
    if (stripPhotos.length >= 4) break
  }

  // 현재사진: photo_type='current'
  const currentPhotos = sortedPhotos.filter(p => p.photo_type === 'current')
  const CURRENT_LABELS = ['앞면', '좌측면', '우측면', '뒷면']

  // 영상 분리
  const reelVideos = (actor.actor_videos ?? []).filter(v => !v.video_type || v.video_type === 'reel').slice(0, 2)
  const monologueVideos = (actor.actor_videos ?? []).filter(v => v.video_type === 'monologue').slice(0, 1)

  // 최근 출연 (최근 2년 이내 동적 기준)
  const recentWorks = allFilmo.filter((f) => (f.year ?? 0) >= new Date().getFullYear() - 1)

  // 카테고리별 필모 (memoized Map — 렌더마다 6번 filter 방지)
  const filmoMap = useMemo(() => {
    const map: Partial<Record<FilmoCategory, typeof allFilmo>> = {}
    for (const f of allFilmo) {
      // 뮤지컬은 '공연'(theater) 섹션으로 통합 (2026-06-08)
      const cat = (f.category === 'musical' ? 'theater' : f.category) as FilmoCategory
      if (!map[cat]) map[cat] = []
      map[cat]!.push(f)
    }
    return map
  }, [allFilmo])
  const filmoByCategory = (cat: FilmoCategory) => filmoMap[cat] ?? []

  // 수상이력
  const awardEntries = allFilmo.filter((f) => isWinAward(f.award))

  // 카테고리 순서
  // 표시 순서: 드라마 → 영화 → 공연(연극+뮤지컬) → CF. 기타·뮤지컬단독 제외, CF는 공연 아래 (2026-06-08)
  const CATEGORY_ORDER: FilmoCategory[] = ['drama', 'film', 'theater', 'cf']

  return (
    <div style={s.root}>
      {/* ============ 프로필 사진 스트립 ============ */}
      {stripPhotos.length > 0 && (
        <section style={s.section} aria-label={`${actor.name} 프로필 사진`}>
          <h2 className="sr-only">프로필 사진</h2>
          <div
            style={s.photoStrip}
            onContextMenu={imageProtected ? (e) => e.preventDefault() : undefined}
            onDragStart={(e) => e.preventDefault()}
          >
            {stripPhotos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox({ source: 'profile', index: i })}
                aria-label={`${actor.name} 프로필 사진 ${i + 1} 확대 보기`}
                style={{ ...s.photoCard, padding: 0, border: 'none', background: 'transparent', cursor: 'zoom-in' }}
              >
                {imageProtected ? (
                  <>
                    <div
                      role="img"
                      aria-label={`${actor.name} 프로필 사진 ${i + 1}`}
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
                      unoptimized={!url.includes('.supabase.co/storage/')}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ 현재사진 (앞/좌/우/뒤) ============ */}
      {currentPhotos.length > 0 && (
        <section aria-label="현재사진" style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionTitle}>현재사진</span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
            onContextMenu={imageProtected ? (e) => e.preventDefault() : undefined}
            onDragStart={(e) => e.preventDefault()}
          >
            {CURRENT_LABELS.map((labelText) => {
              const photo = currentPhotos.find(p => p.label === labelText)
              const src = photo ? photoSrc(photo) : null
              // 라이트박스 인덱스: 이 라벨까지 src 존재하는 사진 카운트 - 1
              const existingBeforeMe = CURRENT_LABELS
                .slice(0, CURRENT_LABELS.indexOf(labelText))
                .filter(l => {
                  const p = currentPhotos.find(p => p.label === l)
                  return p && photoSrc(p)
                }).length
              const lightboxIdx = src ? existingBeforeMe : -1
              const openLightbox = src ? () => setLightbox({ source: 'current', index: lightboxIdx }) : undefined
              return (
                <div key={labelText} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    onClick={openLightbox}
                    onKeyDown={openLightbox ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox() } } : undefined}
                    role={openLightbox ? 'button' : undefined}
                    tabIndex={openLightbox ? 0 : undefined}
                    aria-label={openLightbox ? `${actor.name} ${labelText} 확대 보기` : undefined}
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '133%', // 3:4 portrait
                      background: 'var(--bg3)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: openLightbox ? 'zoom-in' : 'default',
                  }}>
                    {src ? (
                      imageProtected ? (
                        <div
                          role="img"
                          aria-label={`${actor.name} ${labelText}`}
                          style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: `url("${src}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center top',
                          }}
                        />
                      ) : (
                        <Image
                          src={src}
                          alt={`${actor.name} ${labelText}`}
                          fill
                          sizes="(max-width:640px) 50vw, 25vw"
                          style={{ objectFit: 'cover', objectPosition: 'center top' }}
                          unoptimized={!photo?.storage_path}
                        />
                      )
                    ) : (
                      <div
                        role="img"
                        aria-label={`${labelText} 사진 없음`}
                        style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--border-strong)', fontSize: '0.75rem',
                        }}
                      >
                        {labelText}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gray)', textAlign: 'center', letterSpacing: '0.05em' }}>
                    {labelText}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ============ 영상 없음 안내 ============ */}
      {reelVideos.length === 0 && monologueVideos.length === 0 && (
        <section style={s.section} aria-label="영상 없음">
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>01</span>
            <span style={s.sectionTitle}>출연 영상</span>
            <span lang="en" style={s.sectionEn}>REEL</span>
          </h2>
          <p role="status" style={{ fontSize: '0.85rem', color: 'var(--gray)', textAlign: 'center', padding: '24px 0' }}>
            현재 업로드된 영상이 없습니다.
          </p>
        </section>
      )}

      {/* ============ 01 · REEL ============ */}
      {reelVideos.length > 0 && (
        <section style={s.section} aria-label={`${actor.name} REEL 영상`}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>01</span>
            <span style={s.sectionTitle}>출연 영상</span>
            <span lang="en" style={s.sectionEn}>REEL</span>
          </h2>
          <div style={s.videoGrid}>
            {reelVideos.map((video) =>
              videoLocked ? (
                (video.youtube_id || video.r2_key) && (
                  <div key={video.id} style={s.videoItem}>
                    <LockedVideoCard
                      thumbUrl={video.youtube_id ? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg` : actor.profile_photo}
                      title={video.title || `${actor.name} 출연영상`}
                      onClick={() => setSignupPromptOpen(true)}
                    />
                    {video.title && <p style={s.videoTitle}>{video.title}</p>}
                  </div>
                )
              ) : video.youtube_id ? (
                <div key={video.id} style={s.videoItem}>
                  <YouTubeFacade
                    videoId={video.youtube_id}
                    title={video.title || `${actor.name} 출연영상`}
                    containerStyle={{ borderRadius: 6, background: '#000' }}
                  />
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

      {/* ============ 전략적 독백 ============ */}
      {monologueVideos.length > 0 && (
        <section style={s.section} aria-label={`${actor.name} 전략적 독백 영상`}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionTitle}>전략적 독백</span>
          </h2>
          <div style={s.videoGrid}>
            {monologueVideos.map((video) =>
              videoLocked ? (
                (video.youtube_id || video.r2_key) && (
                  <div key={video.id} style={s.videoItem}>
                    <LockedVideoCard
                      thumbUrl={video.youtube_id ? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg` : actor.profile_photo}
                      title={video.title || '전략적 독백'}
                      onClick={() => setSignupPromptOpen(true)}
                    />
                  </div>
                )
              ) : video.youtube_id ? (
                <div key={video.id} style={s.videoItem}>
                  <YouTubeFacade
                    videoId={video.youtube_id}
                    title={video.title || '전략적 독백'}
                    containerStyle={{ borderRadius: 6, background: '#000' }}
                  />
                </div>
              ) : video.r2_key ? (
                <R2Video
                  key={video.id}
                  videoId={video.id}
                  title="전략적 독백"
                  poster={actor.profile_photo}
                  allowDownload={canViewContact}
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ============ 수상이력 — 영상 아래·최근출연 위 (2026-06-12 리디자인 순서) ============ */}
      {awardEntries.length > 0 && (
        <section aria-label="수상 이력" style={s.section}>
          <h2 style={{ ...s.sectionHeading, borderBottomColor: 'var(--accent-red)' }}>
            <span aria-hidden="true" style={{ ...s.sectionNum, color: 'var(--accent-red)' }}>🏆</span>
            <span style={{ ...s.sectionTitle, color: 'var(--accent-red)' }}>수상</span>
            <span lang="en" style={{ ...s.sectionEn, color: 'var(--accent-red)' }}>AWARD</span>
          </h2>
          <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <caption className="sr-only">수상 이력</caption>
            <thead>
              <tr>
                <th scope="col" style={{ ...s.th, width: 56 }}>연도</th>
                <th scope="col" style={s.th}>작품명</th>
                <th scope="col" style={s.th}>수상내역</th>
              </tr>
            </thead>
            <tbody>
              {awardEntries.map((entry) => (
                <tr key={`award-${entry.id}`} style={{ ...s.tr, borderLeft: '3px solid var(--accent-red)' }}>
                  <td style={{ ...s.td, color: 'var(--gray)', fontSize: '0.82rem' }}>
                    {entry.year ?? '—'}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--white)' }}>
                    {/* 작품명 비표기 수상(대표 지시로 title 없이 입력된 row)은 — 처리 */}
                    {entry.title || '—'}
                  </td>
                  <td style={{ ...s.td, color: 'var(--accent-red)', fontWeight: 600 }}>
                    {entry.award}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {/* ============ 02 · CURRENT WORKS ============ */}
      {recentWorks.length > 0 && (
        <section aria-label="최근 출연" style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>02</span>
            <span style={s.sectionTitle}>최근 출연</span>
            <span lang="en" style={s.sectionEn}>CURRENT WORKS</span>
            {canEdit && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, alignSelf: 'center' }}>작품 클릭 → 편집 ✎</span>}
          </h2>
          {/* 박스 카드 → 에디토리얼 행 리스트 (2026-06-12 대표 피드백 "더 잘보이게") */}
          <div>
            {recentWorks.map((entry) => {
              const prefix = entry.category === 'drama'
                ? (entry.broadcaster ?? null)
                : entry.category === 'film'
                  ? (entry.film_type ?? null)
                  : null
              return (
                <div
                  key={entry.id}
                  className="recent-work-row"
                  {...(canEdit ? {
                    role: 'button' as const,
                    tabIndex: 0,
                    onClick: () => editFromRecent(entry),
                    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editFromRecent(entry) } },
                    style: { cursor: 'pointer' },
                    title: '클릭하면 아래 작품 표에서 편집할 수 있어요',
                  } : {})}
                >
                  <span style={s.recentYear}>{entry.year}</span>
                  <span style={s.recentCat}>{CATEGORY_LABEL[entry.category]}</span>
                  <p className="recent-work-title" style={s.recentTitle}>
                    {prefix && <span style={s.recentPrefix}>{prefix}</span>}
                    {entry.title}
                  </p>
                  {entry.role && <p className="recent-work-role" style={s.recentRole}>{entry.role}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ============ 필모그래피 카테고리별 독립 섹션 ============ */}
      {(canEdit
        ? CATEGORY_ORDER  // 편집 모드에선 빈 카테고리도 표시 (추가 가능)
        : CATEGORY_ORDER.filter((cat) => filmoByCategory(cat).length > 0)
      ).map((cat) => {
        const entries = filmoByCategory(cat)
        const num = SECTION_NUMS[cat]
        const isDrama = cat === 'drama'
        const isFilm = cat === 'film'
        const isAdding = addingCat === cat

        return (
          <section key={cat} id={`filmo-${cat}`} aria-label={CATEGORY_LABEL[cat]} style={s.section}>
            <h2 style={s.sectionHeading}>
              <span style={s.sectionNum}>{num}</span>
              <span lang={cat === 'cf' ? 'en' : undefined} style={s.sectionTitle}>{CATEGORY_LABEL[cat].toUpperCase()}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => { setAddingCat(isAdding ? null : cat); setEditingId(null) }}
                  disabled={saving}
                  style={s.addRowBtn}
                  aria-label={`${CATEGORY_LABEL[cat]} 행 추가`}
                >＋ 추가</button>
              )}
            </h2>
            <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <caption className="sr-only">{CATEGORY_LABEL[cat]} 필모그래피</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ ...s.th, width: 72 }}>연도</th>
                  {isDrama && <th scope="col" style={{ ...s.th, width: 76 }}>방송사</th>}
                  {isFilm && <th scope="col" style={{ ...s.th, width: 68 }}>구분</th>}
                  <th scope="col" style={s.th}>작품명</th>
                  <th scope="col" style={s.th}>역할</th>
                  {canEdit && <th scope="col" style={{ ...s.th, width: 64 }}></th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isEditing = editingId === entry.id
                  if (isEditing) {
                    return (
                      <tr key={entry.id} style={{ ...s.tr, background: 'rgba(255,215,0,0.04)' }}>
                        <td style={s.td}>
                          <input value={editFields.year} onChange={e => setEditFields(p => ({ ...p, year: e.target.value }))}
                            style={{ ...s.inlineInput, minWidth: 56 }} placeholder="연도" type="number" inputMode="numeric" min={1990} max={2099} aria-label="연도" />
                        </td>
                        {isDrama && (
                          <td style={s.td}>
                            <input value={editFields.broadcaster} onChange={e => setEditFields(p => ({ ...p, broadcaster: e.target.value }))}
                              style={s.inlineInput} placeholder="방송사" aria-label="방송사" />
                          </td>
                        )}
                        {isFilm && (
                          <td style={s.td}>
                            <select value={editFields.film_type} onChange={e => setEditFields(p => ({ ...p, film_type: e.target.value }))}
                              style={s.inlineInput} aria-label="영화 구분">
                              <option value="">구분</option>
                              <option value="상업">상업</option>
                              <option value="독립장편">독립장편</option>
                              <option value="단편">단편</option>
                            </select>
                          </td>
                        )}
                        <td style={s.td}>
                          <input value={editFields.title} onChange={e => setEditFields(p => ({ ...p, title: e.target.value }))}
                            style={{ ...s.inlineInput, fontWeight: 600 }} placeholder="작품명 *" aria-label="작품명" />
                        </td>
                        <td style={s.td}>
                          <input value={editFields.role} onChange={e => setEditFields(p => ({ ...p, role: e.target.value }))}
                            style={s.inlineInput} placeholder="역할" aria-label="역할" />
                        </td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                          <button type="button" onClick={() => saveEdit(entry)} disabled={saving} aria-busy={saving} aria-label="저장" style={{ ...s.saveBtn, color: saving ? 'var(--gray)' : 'var(--gold)' }}>{saving ? '…' : <span aria-hidden="true">✓</span>}</button>
                          <button type="button" onClick={() => setEditingId(null)} disabled={saving} aria-label="취소" style={s.cancelBtn}><span aria-hidden="true">✕</span></button>
                          {confirmingDeleteId === entry.id ? (
                            <>
                              <button type="button" onClick={() => setConfirmingDeleteId(null)} aria-label="삭제 취소" style={{ ...s.cancelBtn }}><span aria-hidden="true">✕</span></button>
                              <button type="button" onClick={() => deleteEntry(entry.id)} disabled={saving} aria-busy={saving} aria-label="삭제 확인" style={{ ...s.deleteBtn, background: '#ef4444', color: '#fff', opacity: 1 }}><span aria-hidden="true">✓</span></button>
                            </>
                          ) : (
                            <button type="button" onClick={() => deleteEntry(entry.id)} disabled={saving} aria-label="삭제" style={s.deleteBtn}><span aria-hidden="true">🗑</span></button>
                          )}
                        </td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={entry.id} style={s.tr}>
                      <td style={{ ...s.td, color: 'var(--gray)', fontSize: '0.82rem' }}>
                        {entry.year ?? '—'}
                      </td>
                      {isDrama && (
                        <td style={{ ...s.td, color: 'var(--gray)', fontSize: '0.82rem' }}>
                          {entry.broadcaster ?? '—'}
                        </td>
                      )}
                      {isFilm && (
                        <td style={s.td}>
                          {entry.film_type ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 3,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              letterSpacing: '0.03em',
                              ...(FEST_RE.test(entry.film_type)
                                ? { color: 'var(--accent-red)', border: '1px solid rgba(199,62,62,0.3)', background: 'rgba(199,62,62,0.08)' }
                                : (FILM_TYPE_STYLE[entry.film_type] ?? {})),
                            }}>
                              {entry.film_type}
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--white)' }}>
                        {entry.title}
                        {entry.award && !isWinAward(entry.award) && (
                          <span style={{ display: 'block', marginTop: 3, fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-red)', lineHeight: 1.35 }}>
                            {entry.award}
                          </span>
                        )}
                      </td>
                      <td style={s.td}>{entry.role ?? '—'}</td>
                      {canEdit && (
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                          <button type="button" onClick={() => startEdit(entry)} disabled={saving} style={s.editBtn} aria-label="편집"><span aria-hidden="true">✎</span></button>
                          {confirmingDeleteId === entry.id ? (
                            <>
                              <button type="button" onClick={() => setConfirmingDeleteId(null)} style={{ ...s.cancelBtn }} aria-label="삭제 취소"><span aria-hidden="true">✕</span></button>
                              <button type="button" onClick={() => deleteEntry(entry.id)} disabled={saving} aria-busy={saving} style={{ ...s.deleteBtn, background: '#ef4444', color: '#fff', opacity: 1 }} aria-label="삭제 확인"><span aria-hidden="true">✓</span></button>
                            </>
                          ) : (
                            <button type="button" onClick={() => deleteEntry(entry.id)} disabled={saving} style={s.deleteBtn} aria-label="삭제"><span aria-hidden="true">🗑</span></button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}

                {/* 새 행 추가 폼 */}
                {isAdding && (
                  <tr style={{ ...s.tr, background: 'rgba(255,215,0,0.06)' }}>
                    <td style={s.td}>
                      <input value={newEntry.year} onChange={e => setNewEntry(p => ({ ...p, year: e.target.value }))}
                        style={{ ...s.inlineInput, minWidth: 56 }} placeholder="연도" type="number" inputMode="numeric" min={1990} max={2099} aria-label="연도" />
                    </td>
                    {isDrama && (
                      <td style={s.td}>
                        <input value={newEntry.broadcaster} onChange={e => setNewEntry(p => ({ ...p, broadcaster: e.target.value }))}
                          style={s.inlineInput} placeholder="방송사" aria-label="방송사" />
                      </td>
                    )}
                    {isFilm && (
                      <td style={s.td}>
                        <select value={newEntry.film_type} onChange={e => setNewEntry(p => ({ ...p, film_type: e.target.value }))}
                          style={s.inlineInput} aria-label="영화 구분">
                          <option value="">구분</option>
                          <option value="상업">상업</option>
                          <option value="독립장편">독립장편</option>
                          <option value="단편">단편</option>
                        </select>
                      </td>
                    )}
                    <td style={s.td}>
                      <input value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))}
                        style={{ ...s.inlineInput, fontWeight: 600 }} placeholder="작품명 *" aria-label="작품명" />
                    </td>
                    <td style={s.td}>
                      <input value={newEntry.role} onChange={e => setNewEntry(p => ({ ...p, role: e.target.value }))}
                        style={s.inlineInput} placeholder="역할" aria-label="역할" />
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={() => addEntry(cat)} disabled={saving || !newEntry.title.trim()} aria-busy={saving} style={{ ...s.saveBtn, color: saving ? 'var(--gray)' : 'var(--gold)' }} aria-label="저장">{saving ? '…' : <span aria-hidden="true">✓</span>}</button>
                      <button type="button" onClick={() => { setAddingCat(null); setNewEntry({ year: '', title: '', role: '', broadcaster: '', film_type: '' }) }} style={s.cancelBtn} aria-label="입력 취소"><span aria-hidden="true">✕</span></button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </section>
        )
      })}
      {/* 필모그래피 수정 오류 — 항상 DOM에 유지 (persistent live region — WCAG 4.1.3) + 포커스 이동 (WCAG 2.4.3) */}
      <div
        ref={editErrRef}
        id="actor-edit-error"
        tabIndex={-1}
        role="alert"
        aria-atomic="true"
        style={{ outline: 'none', ...(editErr ? { color: '#f87171', fontSize: '0.82rem', marginTop: 8, padding: '6px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6 } : {}) }}
      >{editErr}</div>

      {/* 사진 라이트박스 — 프로필 + 현재사진 통합 */}
      {lightbox && (() => {
        const sourcePhotos = lightbox.source === 'profile'
          ? stripPhotos.map((url, i) => ({ url, alt: `${actor.name} 프로필 사진 ${i + 1}` }))
          : (() => {
              const items: { url: string; alt: string }[] = []
              for (const label of CURRENT_LABELS) {
                const photo = currentPhotos.find(p => p.label === label)
                const src = photo ? photoSrc(photo) : null
                if (src) items.push({ url: src, alt: `${actor.name} ${label}` })
              }
              return items
            })()
        return (
          <PhotoLightbox
            photos={sourcePhotos}
            activeIndex={lightbox.index}
            imageProtected={imageProtected}
            onClose={() => setLightbox(null)}
            onChange={(next) => setLightbox({ source: lightbox.source, index: next })}
          />
        )
      })()}

      {/* 비로그인 영상 클릭 → 회원가입 안내 */}
      <SignupPromptModal
        open={signupPromptOpen}
        onClose={() => setSignupPromptOpen(false)}
        message="출연 영상은 KD4 회원 전용입니다. 무료 회원가입 후 모든 배우의 영상을 바로 보실 수 있어요."
        nextUrl={`/actors/${actor.id}`}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,   // 2026-06-12 대표 지시 — 섹션 간 여백 축소 (44 → 28)
  },

  /* ---- 섹션 공통 ---- */
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    borderBottom: '1px solid var(--border)',
    paddingBottom: 10,
  },
  sectionNum: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.12em',
  },
  sectionTitle: {                              // 한글 주(主) 라벨
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--white)',
    letterSpacing: '0.04em',                   // 한글은 자간 좁게
  },
  sectionEn: {                                 // 영어 보조 eyebrow
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.66rem',
    fontWeight: 600,
    color: 'var(--gray)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },
  sectionSub: {
    fontSize: '0.78rem',
    color: 'var(--gray)',
    letterSpacing: '0.02em',
    marginLeft: 4,
  },

  /* ---- 프로필 사진 스트립 ---- */
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

  /* ---- REEL ---- */
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
  videoTitle: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
  },

  /* ---- CURRENT WORKS — 에디토리얼 행 리스트 (2026-06-12 박스 카드 제거)
     행 레이아웃·모바일(680px)은 globals.css .recent-work-row 참고 ---- */
  recentYear: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--gray)',
    letterSpacing: '0.08em',
    fontVariantNumeric: 'tabular-nums',
  },
  recentCat: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.66rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.14em',
  },
  recentTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.02rem',
    fontWeight: 700,
    color: 'var(--white)',
    lineHeight: 1.45,
  },
  recentPrefix: {
    fontFamily: 'var(--font-display), Oswald, sans-serif',
    fontSize: '0.74rem',
    fontWeight: 500,
    color: 'var(--gray)',
    letterSpacing: '0.05em',
    marginRight: 8,
  },
  recentRole: {
    fontSize: '0.8rem',
    fontWeight: 400,
    color: 'var(--gray)',
    textAlign: 'right' as const,
  },

  /* ---- 필모 테이블 공통 ---- */
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

  /* ---- 인라인 편집 ---- */
  inlineInput: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '4px 8px',
    color: 'var(--white)',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    width: '100%',
    minWidth: 0,
  },
  addRowBtn: {
    marginLeft: 'auto',
    padding: '3px 10px',
    minHeight: 44,
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--gold)',
    fontSize: '0.72rem',
    fontFamily: 'var(--font-display), inherit',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    fontWeight: 700,
  },
  editBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--gray)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
    opacity: 0.7,
    minHeight: 44,
    minWidth: 44,
  },
  saveBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--gold)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
    fontWeight: 700,
    minHeight: 44,
    minWidth: 44,
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--gray)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
    minHeight: 44,
    minWidth: 44,
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.82rem',
    padding: '2px 4px',
    opacity: 0.5,
    minHeight: 44,
    minWidth: 44,
  },
}
