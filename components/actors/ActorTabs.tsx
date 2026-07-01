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
  '숏폼': { background: 'rgba(199,62,62,0.08)', color: 'var(--accent-red)', border: '1px solid rgba(199,62,62,0.25)' },  // 드라마 숏폼 구분
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

  // 세로형 헤드샷 갤러리 — 회원이 직접 업로드한 사진(actor_photos)만 (최대 10장, 2026-07-01 대표 지시로 4→7→10).
  // 상단 헤더가 메인 프로필/이력서 이미지를 이미 크게 보여주므로, 여기서는 중복 없이 헤드샷만 노출.
  const MAX_GALLERY_PHOTOS = 10
  const sortedPhotos = [...actor.actor_photos].sort((a, b) => a.sort_order - b.sort_order)

  // 프로필사진: photo_type='profile' 또는 null/undefined
  // mainPhotoUrl과 동일한 URL은 skip — HERO 메인사진이 갤러리에 또 나오는 중복 방지 (2026-06-12 대표 지시)
  const profilePhotos = sortedPhotos.filter(p => !p.photo_type || p.photo_type === 'profile')
  const stripPhotos: string[] = []
  for (const p of profilePhotos) {
    const src = photoSrc(p)
    if (src && src !== mainPhotoUrl && !stripPhotos.includes(src)) stripPhotos.push(src)
    if (stripPhotos.length >= MAX_GALLERY_PHOTOS) break
  }

  // 현재사진: photo_type='current'
  const currentPhotos = sortedPhotos.filter(p => p.photo_type === 'current')
  const CURRENT_LABELS = ['정면', '좌측', '우측', '후면', '전신']

  // 영상 분리
  const reelVideos = (actor.actor_videos ?? []).filter(v => !v.video_type || v.video_type === 'reel').slice(0, 2)
  const monologueVideos = (actor.actor_videos ?? []).filter(v => v.video_type === 'monologue').slice(0, 1)

  // 최근 출연 — CF만 제외, 드라마 전체 + 영화 전체(단편·독립장편·상업, 구분 배지로 명확히). 드라마/영화로 분류 (2026-07-01 대표 지시).
  const recentYearMin = new Date().getFullYear() - 1
  const recentDrama = allFilmo.filter((f) => (f.year ?? 0) >= recentYearMin && f.category === 'drama')
  const recentFilm = allFilmo.filter((f) => (f.year ?? 0) >= recentYearMin && f.category === 'film')  // 단편·독립장편·상업 모두 포함, 구분 배지로 명확히 (2026-07-01 대표 지시)
  const recentGroups = [{ label: '드라마', items: recentDrama }, { label: '영화', items: recentFilm }].filter((g) => g.items.length > 0)

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

  // 수상이력 — 실제 수상 + 영화제 출품/상영까지 모두 포함 (2026-07-01 대표 지시). 연도 내림차순.
  const awardEntries = allFilmo
    .filter((f) => !!f.award && f.award.trim().length > 0)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))

  // 카테고리 순서
  // 표시 순서: 드라마 → 영화 → 공연(연극+뮤지컬) → CF. 기타·뮤지컬단독 제외, CF는 공연 아래 (2026-06-08)
  const CATEGORY_ORDER: FilmoCategory[] = ['drama', 'film', 'theater', 'cf']

  return (
    <div style={s.root}>
      {/* ============ 수상 — 최상단 (2026-07-01 대표 지시: 프로필 제일 먼저). 실제 수상 + 영화제 출품/상영 포함 ============ */}
      {awardEntries.length > 0 && (
        <section aria-label="수상 이력" style={s.section}>
          <h2 style={{ ...s.sectionHeading, borderBottomColor: 'var(--accent-red)' }}>
            <span aria-hidden="true" style={{ ...s.sectionNum, color: 'var(--accent-red)' }}>🏆</span>
            <span style={{ ...s.sectionTitle, color: 'var(--accent-red)' }}>수상 · 영화제</span>
            <span lang="en" style={{ ...s.sectionEn, color: 'var(--accent-red)' }}>AWARDS</span>
          </h2>
          <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <caption className="sr-only">수상 및 영화제 이력</caption>
            <thead>
              <tr>
                <th scope="col" style={{ ...s.th, width: 56 }}>연도</th>
                <th scope="col" style={s.th}>작품명</th>
                <th scope="col" style={s.th}>수상 · 영화제</th>
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

      {/* ============ 출연영상 — 수상 다음 (2026-07-01 대표 지시: 수상→출연영상→프로필→현재사진) ============ */}
      {/* 영상 없음 안내 */}
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

      {/* 01 · REEL */}
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

      {/* 독백 */}
      {monologueVideos.length > 0 && (
        <section style={s.section} aria-label={`${actor.name} 독백 영상`}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionTitle}>독백</span>
          </h2>
          <div style={s.videoGrid}>
            {monologueVideos.map((video) =>
              videoLocked ? (
                (video.youtube_id || video.r2_key) && (
                  <div key={video.id} style={s.videoItem}>
                    <LockedVideoCard
                      thumbUrl={video.youtube_id ? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg` : actor.profile_photo}
                      title={video.title || '독백'}
                      onClick={() => setSignupPromptOpen(true)}
                    />
                  </div>
                )
              ) : video.youtube_id ? (
                <div key={video.id} style={s.videoItem}>
                  <YouTubeFacade
                    videoId={video.youtube_id}
                    title={video.title || '독백'}
                    containerStyle={{ borderRadius: 6, background: '#000' }}
                  />
                </div>
              ) : video.r2_key ? (
                <R2Video
                  key={video.id}
                  videoId={video.id}
                  title="독백"
                  poster={actor.profile_photo}
                  allowDownload={canViewContact}
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ============ 프로필 사진 스트립 ============ */}
      {stripPhotos.length > 0 && (
        <section style={s.section} aria-label={`${actor.name} 프로필 사진`}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionTitle}>프로필 사진</span>
          </h2>
          {/* 장수와 무관하게 균일한 그리드 — 3:4 세로 셀 + cover (2026-07-01 대표 지시: 몇 장이든 정렬되게).
              기존 '자연 크기 flex + 가로사진 우측정렬'이 장수·비율에 따라 들쭉날쭉하던 것 교체. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}
            onContextMenu={imageProtected ? (e) => e.preventDefault() : undefined}
            onDragStart={(e) => e.preventDefault()}
          >
            {stripPhotos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox({ source: 'profile', index: i })}
                aria-label={`${actor.name} 프로필 사진 ${i + 1} 확대 보기`}
                style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', padding: 0, border: 'none', background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden', cursor: 'zoom-in' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${actor.name} 프로필 ${i + 1}`}
                  loading="lazy"
                  draggable={false}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                />
                {imageProtected && <div style={{ ...s.photoProtectOverlay, borderRadius: 6 }} />}
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
          {/* 현재사진은 프로필 사진보다 작게 — 작은 멀티열 타일 (2026-07-01 대표 지시) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 8,
            maxWidth: 560,
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
                          unoptimized
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

      {/* 출연영상·수상 섹션은 상단으로 이동됨 (2026-07-01 대표 지시: 수상 → 출연영상 → 프로필 → 현재사진) */}

      {/* ============ 02 · CURRENT WORKS ============ */}
      {recentGroups.length > 0 && (
        <section aria-label="최근 출연" style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>02</span>
            <span style={s.sectionTitle}>최근 출연</span>
            <span lang="en" style={s.sectionEn}>CURRENT WORKS</span>
            {canEdit && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, alignSelf: 'center' }}>작품 클릭 → 편집 ✎</span>}
          </h2>
          {/* CF 제외·상업영화만 + 드라마/영화 분류 (2026-06-30 대표 지시) */}
          {recentGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--gold)', margin: '2px 0 6px' }}>{group.label}</p>
              {group.items.map((entry) => {
                const isDramaRow = entry.category === 'drama'
                const bcast = isDramaRow ? (entry.broadcaster ?? null) : null
                // 영화: 단편/독립장편/상업 구분 배지로 명확히. 드라마: 숏폼 등 구분이 있으면 배지 (2026-07-01 대표 지시)
                const typeTag = entry.category === 'film' ? (entry.film_type ?? null) : (isDramaRow ? (entry.film_type ?? null) : null)
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
                      {typeTag && <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 3, fontSize: '0.7rem', fontWeight: 600, marginRight: 6, verticalAlign: 'middle', ...(FILM_TYPE_STYLE[typeTag] ?? { background: 'var(--bg3)', color: 'var(--gray)', border: '1px solid var(--border)' }) }}>{typeTag}</span>}
                      {bcast && <span style={s.recentPrefix}>{bcast}</span>}
                      {entry.title}
                    </p>
                    {entry.role && <p className="recent-work-role" style={s.recentRole}>{entry.role}</p>}
                  </div>
                )
              })}
            </div>
          ))}
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
                          {/* 드라마 구분(숏폼 등) 배지 + 방송사 (2026-07-01 대표 지시) */}
                          {entry.film_type && (
                            <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 3, fontSize: '0.72rem', fontWeight: 600, marginRight: 6, ...(FILM_TYPE_STYLE[entry.film_type] ?? { background: 'var(--bg3)', color: 'var(--gray)', border: '1px solid var(--border)' }) }}>{entry.film_type}</span>
                          )}
                          {entry.broadcaster ?? (entry.film_type ? '' : '—')}
                        </td>
                      )}
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--white)' }}>
                        {entry.title}
                        {/* 영화제/수상은 최상단 '수상·영화제' 섹션으로 일원화 (2026-07-01 대표 지시) */}
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
    // 한 줄 flex — 고정 높이·자연 너비라 사진마다 하나씩(2단 쌓기 X), 넘치면 줄바꿈. 세로 먼저·가로는 order로 우측
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'flex-start',
  },
  photoCard: {
    position: 'relative',
    flex: '0 0 auto',
    borderRadius: 6,
    overflow: 'hidden',
    userSelect: 'none',
    WebkitUserSelect: 'none',
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
    textAlign: 'left' as const,
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
