'use client'

import { useState, useMemo } from 'react'
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

const FILM_TYPE_STYLE: Record<string, React.CSSProperties> = {
  '상업': { background: 'rgba(21,72,138,0.08)', color: 'var(--navy)', border: '1px solid rgba(21,72,138,0.2)' },
  '상업영화': { background: 'rgba(21,72,138,0.08)', color: 'var(--navy)', border: '1px solid rgba(21,72,138,0.2)' },
  '독립장편': { background: 'rgba(80,80,80,0.08)', color: 'var(--gray-light)', border: '1px solid var(--border)' },
  '단편': { background: 'rgba(80,80,80,0.06)', color: 'var(--gray)', border: '1px solid var(--border)' },
}

const SECTION_NUMS: Record<FilmoCategory, string> = {
  drama: '03',
  film: '04',
  cf: '05',
  theater: '06',
  musical: '07',
  etc: '08',
}

function photoSrc(p: ActorPhoto): string {
  if (p.url) return p.url
  if (p.storage_path) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/actor-photos/${p.storage_path}`
  }
  if (p.drive_photo_id) return `https://drive.google.com/thumbnail?id=${p.drive_photo_id}&sz=w800`
  return '/placeholder-actor.svg'
}

export default function ActorTabs({ actor, canViewContact, imageProtected, canEdit = false }: Props) {
  // ── 편집 상태 ──
  const [filmo, setFilmo] = useState<FilmoEntry[]>(actor.actor_filmography)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState({ year: '', title: '', role: '', broadcaster: '', film_type: '' })
  const [addingCat, setAddingCat] = useState<FilmoCategory | null>(null)
  const [newEntry, setNewEntry] = useState({ year: '', title: '', role: '', broadcaster: '', film_type: '' })
  const [saving, setSaving] = useState(false)
  const [editErr, setEditErr] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  function startEdit(entry: FilmoEntry) {
    setEditingId(entry.id)
    setEditFields({
      year: entry.year?.toString() ?? '',
      title: entry.title,
      role: entry.role ?? '',
      broadcaster: entry.broadcaster ?? '',
      film_type: entry.film_type ?? '',
    })
    setAddingCat(null)
    setEditErr('')
  }

  async function saveEdit(entry: FilmoEntry) {
    if (!editFields.title.trim()) return
    setSaving(true); setEditErr('')
    try {
      const res = await fetch(`/api/actors/${actor.id}/filmography/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/actors/${actor.id}/filmography/${filmId}`, { method: 'DELETE' })
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

  // 프로필 사진 목록 (profile_photo + actor_photos, 최대 3장)
  const mainPhotoUrl = actor.profile_photo
    ?? (actor.drive_photo_id
      ? `https://drive.google.com/thumbnail?id=${actor.drive_photo_id}&sz=w1200`
      : null)
  const sortedPhotos = [...actor.actor_photos].sort((a, b) => a.sort_order - b.sort_order)

  // 프로필사진: photo_type='profile' 또는 null/undefined
  const profilePhotos = sortedPhotos.filter(p => !p.photo_type || p.photo_type === 'profile')
  const stripPhotos: string[] = []
  if (mainPhotoUrl) stripPhotos.push(mainPhotoUrl)
  for (const p of profilePhotos) {
    const src = photoSrc(p)
    if (src && !stripPhotos.includes(src)) stripPhotos.push(src)
    if (stripPhotos.length >= 3) break
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
      const cat = f.category as FilmoCategory
      if (!map[cat]) map[cat] = []
      map[cat]!.push(f)
    }
    return map
  }, [allFilmo])
  const filmoByCategory = (cat: FilmoCategory) => filmoMap[cat] ?? []

  // 수상이력
  const awardEntries = allFilmo.filter((f) => f.award != null && f.award !== '')

  // 카테고리 순서
  const CATEGORY_ORDER: FilmoCategory[] = ['drama', 'film', 'cf', 'theater', 'musical', 'etc']

  return (
    <div style={s.root}>
      {/* ============ 프로필 사진 스트립 ============ */}
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
                      unoptimized
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ 현재사진 (앞/좌/우/뒤) ============ */}
      {currentPhotos.length > 0 && (
        <section style={s.section}>
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
              return (
                <div key={labelText} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '133%', // 3:4 portrait
                    background: 'var(--bg3)',
                    borderRadius: 6,
                    overflow: 'hidden',
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
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--border-strong)', fontSize: '0.75rem',
                      }}>
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

      {/* ============ 01 · REEL ============ */}
      {reelVideos.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionNum}>01</span>
            <span style={s.sectionTitle}>REEL</span>
          </h2>
          <div style={s.videoGrid}>
            {reelVideos.map((video) =>
              video.youtube_id ? (
                <div key={video.id} style={s.videoItem}>
                  <div style={s.videoWrapper}>
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtube_id}`}
                      title={video.title || actor.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
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

      {/* ============ 전략적 독백 ============ */}
      {monologueVideos.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionHeading}>
            <span style={s.sectionTitle}>전략적 독백</span>
          </h2>
          <div style={s.videoGrid}>
            {monologueVideos.map((video) =>
              video.youtube_id ? (
                <div key={video.id} style={s.videoItem}>
                  <div style={s.videoWrapper}>
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtube_id}`}
                      title={video.title || '전략적 독백'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      style={s.iframe}
                    />
                  </div>
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

      {/* ============ 02 · CURRENT WORKS ============ */}
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
          <section key={cat} style={s.section}>
            <h2 style={s.sectionHeading}>
              <span style={s.sectionNum}>{num}</span>
              <span style={s.sectionTitle}>{CATEGORY_LABEL[cat].toUpperCase()}</span>
              {canEdit && (
                <button
                  onClick={() => { setAddingCat(isAdding ? null : cat); setEditingId(null) }}
                  disabled={saving}
                  style={s.addRowBtn}
                  aria-label="행 추가"
                >＋ 추가</button>
              )}
            </h2>
            <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th scope="col" style={{ ...s.th, width: 52 }}>연도</th>
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
                            style={s.inlineInput} placeholder="연도" type="number" min={1990} max={2099} aria-label="연도" />
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
                          <button onClick={() => saveEdit(entry)} disabled={saving} aria-label="저장" style={{ ...s.saveBtn, color: saving ? 'var(--gray)' : 'var(--gold)' }}>{saving ? '…' : '✓'}</button>
                          <button onClick={() => setEditingId(null)} disabled={saving} aria-label="취소" style={s.cancelBtn}>✕</button>
                          {confirmingDeleteId === entry.id ? (
                            <>
                              <button onClick={() => setConfirmingDeleteId(null)} aria-label="삭제 취소" style={{ ...s.cancelBtn }}>✕</button>
                              <button onClick={() => deleteEntry(entry.id)} disabled={saving} aria-label="삭제 확인" style={{ ...s.deleteBtn, background: '#ef4444', color: '#fff', opacity: 1 }}>✓</button>
                            </>
                          ) : (
                            <button onClick={() => deleteEntry(entry.id)} disabled={saving} aria-label="삭제" style={s.deleteBtn}>🗑</button>
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
                              ...(FILM_TYPE_STYLE[entry.film_type] ?? {}),
                            }}>
                              {entry.film_type}
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td style={{ ...s.td, fontWeight: 600, color: 'var(--white)' }}>
                        {entry.title}
                      </td>
                      <td style={s.td}>{entry.role ?? '—'}</td>
                      {canEdit && (
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                          <button onClick={() => startEdit(entry)} disabled={saving} style={s.editBtn} title="편집" aria-label="편집">✎</button>
                          {confirmingDeleteId === entry.id ? (
                            <>
                              <button onClick={() => setConfirmingDeleteId(null)} style={{ ...s.cancelBtn }} title="취소" aria-label="삭제 취소">✕</button>
                              <button onClick={() => deleteEntry(entry.id)} disabled={saving} style={{ ...s.deleteBtn, background: '#ef4444', color: '#fff', opacity: 1 }} title="삭제 확인" aria-label="삭제 확인">✓</button>
                            </>
                          ) : (
                            <button onClick={() => deleteEntry(entry.id)} disabled={saving} style={s.deleteBtn} title="삭제" aria-label="삭제">🗑</button>
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
                        style={s.inlineInput} placeholder="연도" type="number" min={1990} max={2099} aria-label="연도" />
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
                      <button onClick={() => addEntry(cat)} disabled={saving || !newEntry.title.trim()} style={{ ...s.saveBtn, color: saving ? 'var(--gray)' : 'var(--gold)' }} title="저장" aria-label="저장">{saving ? '…' : '✓'}</button>
                      <button onClick={() => { setAddingCat(null); setNewEntry({ year: '', title: '', role: '', broadcaster: '', film_type: '' }) }} style={s.cancelBtn} title="취소" aria-label="입력 취소">✕</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </section>
        )
      })}
      {/* 필모그래피 수정 오류 — map 밖에 1번만 노출 */}
      {editErr && <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: 8, padding: '6px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6 }}>{editErr}</p>}

      {/* ============ 수상이력 ============ */}
      {awardEntries.length > 0 && (
        <section style={s.section}>
          <h2 style={{ ...s.sectionHeading, borderBottomColor: 'var(--accent-red)' }}>
            <span style={{ ...s.sectionNum, color: 'var(--accent-red)' }}>🏆</span>
            <span style={{ ...s.sectionTitle, color: 'var(--accent-red)' }}>AWARD</span>
          </h2>
          <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 56 }}>연도</th>
                <th style={s.th}>작품명</th>
                <th style={s.th}>수상내역</th>
              </tr>
            </thead>
            <tbody>
              {awardEntries.map((entry) => (
                <tr key={`award-${entry.id}`} style={{ ...s.tr, borderLeft: '3px solid var(--accent-red)' }}>
                  <td style={{ ...s.td, color: 'var(--gray)', fontSize: '0.82rem' }}>
                    {entry.year ?? '—'}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--white)' }}>
                    {entry.title}
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

  /* ---- CURRENT WORKS ---- */
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
  },
  saveBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--gold)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
    fontWeight: 700,
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--gray)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.82rem',
    padding: '2px 4px',
    opacity: 0.5,
  },
}
