'use client'

/**
 * GalleryEditForm — 배우 갤러리 편집 클라이언트 컴포넌트
 *
 * 기능:
 * 1. 기본 정보 편집 (신장, 체중, 특기, 인스타그램)
 * 2. 사진 업로드 / 삭제 / 프로필 지정
 * 3. 유튜브 영상 추가 / 삭제
 * 4. 필모그래피 CRUD
 */

import { useState, useRef } from 'react'
import Image from 'next/image'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface PhotoItem {
  id: string
  url: string
  is_profile: boolean
}

interface VideoItem {
  id: string
  youtube_id: string
  title: string
}

interface FilmItem {
  id: string
  category: string
  year: number
  title: string
  role: string
}

interface InitialData {
  height?: number
  weight?: number
  skills?: string
  instagram?: string
  photos: PhotoItem[]
  videos: VideoItem[]
  filmography: FilmItem[]
}

interface Props {
  actorId: string
  initialData: InitialData
}

// ─── 유튜브 ID 추출 ───────────────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 48,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '32px 28px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    fontWeight: 400,
    letterSpacing: '0.25em',
    color: 'var(--gold)',
    textTransform: 'uppercase' as const,
    marginBottom: 24,
  },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 500 },
  input: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '10px 14px',
    color: 'var(--white)',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'opacity 0.15s',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#ffffff',
  },
  btnGhost: {
    background: 'transparent',
    color: 'var(--gray)',
    border: '1px solid var(--border)',
  },
  btnDanger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)',
    padding: '6px 14px',
    fontSize: '0.78rem',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  },
  photoCard: {
    position: 'relative' as const,
    aspectRatio: '9/16',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg3)',
  },
  profileBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    background: 'var(--gold)',
    color: '#0a0a0a',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  photoActions: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
    padding: '24px 8px 8px',
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
  },
  filmRow: {
    display: 'grid',
    gridTemplateColumns: '100px 70px 1fr 1fr auto',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  msg: { fontSize: '0.82rem', padding: '8px 0', minHeight: 24 },
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function GalleryEditForm({ actorId, initialData }: Props) {
  // 기본 정보
  const [height, setHeight] = useState(initialData.height ?? '')
  const [weight, setWeight] = useState(initialData.weight ?? '')
  const [skills, setSkills] = useState(initialData.skills ?? '')
  const [instagram, setInstagram] = useState(initialData.instagram ?? '')
  const [infoMsg, setInfoMsg] = useState('')
  const [infoSaving, setInfoSaving] = useState(false)

  // 사진
  const [photos, setPhotos] = useState<PhotoItem[]>(initialData.photos)
  const [photoMsg, setPhotoMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // 영상
  const [videos, setVideos] = useState<VideoItem[]>(initialData.videos)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoMsg, setVideoMsg] = useState('')

  // 필모그래피
  const [filmography, setFilmography] = useState<FilmItem[]>(initialData.filmography)
  const [filmMsg, setFilmMsg] = useState('')
  const newFilm = (): FilmItem => ({
    id: '',
    category: '드라마',
    year: new Date().getFullYear(),
    title: '',
    role: '',
  })

  // ── 기본 정보 저장 ──────────────────────────────────────────────────────────
  async function saveInfo() {
    setInfoSaving(true)
    setInfoMsg('')
    try {
      const res = await fetch(`/api/actors/${actorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height: height || null, weight: weight || null, skills: skills || null, instagram: instagram || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패')
      setInfoMsg('저장되었습니다.')
    } catch (e) {
      setInfoMsg((e as Error).message)
    } finally {
      setInfoSaving(false)
      setTimeout(() => setInfoMsg(''), 3000)
    }
  }

  // ── 사진 업로드 ─────────────────────────────────────────────────────────────
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg('파일 크기는 5MB 이하이어야 합니다.')
      return
    }
    setUploading(true)
    setPhotoMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('actorId', actorId)
      fd.append('bucket', 'actor-photos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error || '업로드 실패')
      const { url, id } = await res.json()
      setPhotos(prev => [...prev, { id, url, is_profile: prev.length === 0 }])
      setPhotoMsg('업로드 완료.')
    } catch (e) {
      setPhotoMsg((e as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setPhotoMsg(''), 3000)
    }
  }

  async function deletePhoto(id: string, isProfile: boolean) {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/actors/${actorId}/photos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      setPhotos(prev => {
        const next = prev.filter(p => p.id !== id)
        if (isProfile && next.length > 0) next[0].is_profile = true
        return next
      })
    } catch (e) {
      setPhotoMsg((e as Error).message)
    }
  }

  async function setProfile(id: string) {
    try {
      const res = await fetch(`/api/actors/${actorId}/photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_profile: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error || '변경 실패')
      setPhotos(prev => prev.map(p => ({ ...p, is_profile: p.id === id })))
    } catch (e) {
      setPhotoMsg((e as Error).message)
    }
  }

  // ── 영상 추가 ───────────────────────────────────────────────────────────────
  async function addVideo() {
    const yid = extractYoutubeId(videoUrl.trim())
    if (!yid) {
      setVideoMsg('유효한 유튜브 URL 또는 영상 ID를 입력하세요.')
      return
    }
    try {
      const res = await fetch(`/api/actors/${actorId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_id: yid, title: videoTitle.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error || '추가 실패')
      const row = await res.json()
      setVideos(prev => [{ id: row.id, youtube_id: yid, title: videoTitle.trim() }, ...prev])
      setVideoUrl('')
      setVideoTitle('')
      setVideoMsg('영상 추가 완료.')
    } catch (e) {
      setVideoMsg((e as Error).message)
    } finally {
      setTimeout(() => setVideoMsg(''), 3000)
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm('영상을 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/actors/${actorId}/videos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      setVideos(prev => prev.filter(v => v.id !== id))
    } catch (e) {
      setVideoMsg((e as Error).message)
    }
  }

  // ── 필모그래피 ──────────────────────────────────────────────────────────────
  function updateFilm(idx: number, field: keyof FilmItem, val: string | number) {
    setFilmography(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: val }
      return next
    })
  }

  async function saveFilm(idx: number) {
    const f = filmography[idx]
    if (!f.title.trim()) {
      setFilmMsg('작품명을 입력하세요.')
      return
    }
    try {
      const body = { category: f.category, year: Number(f.year), title: f.title.trim(), role: f.role.trim() }
      if (f.id) {
        const res = await fetch(`/api/actors/${actorId}/filmography/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error((await res.json()).error || '저장 실패')
      } else {
        const res = await fetch(`/api/actors/${actorId}/filmography`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error((await res.json()).error || '저장 실패')
        const row = await res.json()
        setFilmography(prev => { const next = [...prev]; next[idx] = { ...next[idx], id: row.id }; return next })
      }
      setFilmMsg('저장되었습니다.')
    } catch (e) {
      setFilmMsg((e as Error).message)
    } finally {
      setTimeout(() => setFilmMsg(''), 3000)
    }
  }

  async function deleteFilm(idx: number) {
    const f = filmography[idx]
    if (!confirm('필모그래피 항목을 삭제하시겠습니까?')) return
    if (f.id) {
      try {
        const res = await fetch(`/api/actors/${actorId}/filmography/${f.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      } catch (e) {
        setFilmMsg((e as Error).message)
        return
      }
    }
    setFilmography(prev => prev.filter((_, i) => i !== idx))
  }

  // ── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 820 }}>

      {/* ── 기본 정보 ── */}
      <section style={s.section}>
        <p style={s.sectionTitle}>Basic Info</p>
        <div style={{ ...s.row, marginBottom: 20 }}>
          <div style={{ ...s.field, flex: '1 1 120px' }}>
            <label style={s.label}>신장 (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} style={s.input} placeholder="170" />
          </div>
          <div style={{ ...s.field, flex: '1 1 120px' }}>
            <label style={s.label}>체중 (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={s.input} placeholder="60" />
          </div>
          <div style={{ ...s.field, flex: '2 1 240px' }}>
            <label style={s.label}>특기</label>
            <input value={skills} onChange={e => setSkills(e.target.value)} style={s.input} placeholder="수영, 검도, 피아노..." />
          </div>
        </div>
        <div style={{ ...s.field, marginBottom: 20 }}>
          <label style={s.label}>인스타그램 ID</label>
          <input value={instagram} onChange={e => setInstagram(e.target.value)} style={{ ...s.input, maxWidth: 280 }} placeholder="@username" />
        </div>
        <button onClick={saveInfo} disabled={infoSaving} style={{ ...s.btn, ...s.btnPrimary, opacity: infoSaving ? 0.6 : 1 }}>
          {infoSaving ? '저장 중…' : '저장'}
        </button>
        {infoMsg && <p style={{ ...s.msg, color: infoMsg.includes('실패') || infoMsg.includes('오류') ? '#ef4444' : 'var(--gold)', marginTop: 10 }}>{infoMsg}</p>}
      </section>

      {/* ── 사진 ── */}
      <section style={s.section}>
        <p style={s.sectionTitle}>Photos</p>
        <div style={s.photoGrid}>
          {photos.map(p => (
            <div key={p.id} style={s.photoCard}>
              <Image src={p.url} alt="배우 사진" fill style={{ objectFit: 'cover' }} sizes="160px" />
              {p.is_profile && <span style={s.profileBadge}>대표</span>}
              <div style={s.photoActions}>
                {!p.is_profile && (
                  <button onClick={() => setProfile(p.id)} style={{ ...s.btn, ...s.btnGhost, padding: '4px 10px', fontSize: '0.72rem' }}>
                    대표 지정
                  </button>
                )}
                <button onClick={() => deletePhoto(p.id, p.is_profile)} style={{ ...s.btn, ...s.btnDanger }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...s.btn, ...s.btnPrimary, opacity: uploading ? 0.6 : 1 }}>
            {uploading ? '업로드 중…' : '+ 사진 추가'}
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>JPG·PNG, 최대 5MB · 9:16 비율 권장</span>
        </div>
        {photoMsg && <p style={{ ...s.msg, color: photoMsg.includes('완료') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{photoMsg}</p>}
      </section>

      {/* ── 영상 ── */}
      <section style={s.section}>
        <p style={s.sectionTitle}>Videos</p>

        {videos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {videos.map(v => (
              <div key={v.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ width: 60, height: 34, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={{ flex: 1, fontSize: '0.85rem', color: 'var(--white)', margin: 0 }}>
                  {v.title || v.youtube_id}
                </p>
                <button onClick={() => deleteVideo(v.id)} style={{ ...s.btn, ...s.btnDanger }}>삭제</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ ...s.field, flex: '2 1 240px' }}>
            <label style={s.label}>유튜브 URL 또는 영상 ID</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={s.input} placeholder="https://youtu.be/..." />
          </div>
          <div style={{ ...s.field, flex: '1 1 160px' }}>
            <label style={s.label}>제목 (선택)</label>
            <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} style={s.input} placeholder="단편영화 주연" />
          </div>
          <button onClick={addVideo} style={{ ...s.btn, ...s.btnPrimary, marginBottom: 0 }}>추가</button>
        </div>
        {videoMsg && <p style={{ ...s.msg, color: videoMsg.includes('완료') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{videoMsg}</p>}
      </section>

      {/* ── 필모그래피 ── */}
      <section style={s.section}>
        <p style={s.sectionTitle}>Filmography</p>

        {filmography.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...s.filmRow, marginBottom: 4 }}>
              {['구분', '연도', '작품명', '배역', ''].map(h => (
                <span key={h} style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {filmography.map((f, i) => (
              <div key={i} style={s.filmRow}>
                <select value={f.category} onChange={e => updateFilm(i, 'category', e.target.value)} style={{ ...s.input, padding: '8px 10px' }}>
                  <option>드라마</option>
                  <option>영화</option>
                  <option>CF</option>
                  <option>연극</option>
                  <option>뮤지컬</option>
                  <option>기타</option>
                </select>
                <input type="number" value={f.year} onChange={e => updateFilm(i, 'year', e.target.value)} style={{ ...s.input, padding: '8px 10px' }} />
                <input value={f.title} onChange={e => updateFilm(i, 'title', e.target.value)} style={{ ...s.input, padding: '8px 10px' }} placeholder="작품명" />
                <input value={f.role} onChange={e => updateFilm(i, 'role', e.target.value)} style={{ ...s.input, padding: '8px 10px' }} placeholder="배역" />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => saveFilm(i)} style={{ ...s.btn, padding: '6px 14px', fontSize: '0.78rem', background: 'rgba(196,165,90,0.15)', color: 'var(--gold)', border: '1px solid var(--gold)' }}>저장</button>
                  <button onClick={() => deleteFilm(i)} style={{ ...s.btn, ...s.btnDanger }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setFilmography(prev => [newFilm(), ...prev])} style={{ ...s.btn, ...s.btnGhost }}>
          + 항목 추가
        </button>
        {filmMsg && <p style={{ ...s.msg, color: filmMsg.includes('저장') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{filmMsg}</p>}
      </section>
    </div>
  )
}
