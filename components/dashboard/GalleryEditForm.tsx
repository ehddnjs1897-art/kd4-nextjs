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

import { useState, useRef, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

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

interface R2VideoItem {
  id: string
  r2_key: string
  title: string
  video_type: string
}

interface FilmItem {
  id: string
  category: string
  year: number
  title: string
  role: string
  broadcaster?: string
  film_type?: string
}

interface InitialData {
  height?: number
  weight?: number
  skills?: string
  instagram?: string
  castingSummary?: string
  profileDocPath?: string | null
  photos: PhotoItem[]
  videos: VideoItem[]
  r2Videos: R2VideoItem[]
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

// 컴포넌트 외부 순수 함수 — 렌더마다 재생성되지 않도록
function newFilm(): FilmItem {
  return {
    id: crypto.randomUUID(),
    category: 'drama',
    year: new Date().getFullYear(),
    title: '',
    role: '',
  }
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
    minHeight: 44,
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
    minHeight: 44,
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
  const [castingSummary, setCastingSummary] = useState(initialData.castingSummary ?? '')
  const [infoMsg, setInfoMsg] = useState('')
  const [infoSaving, setInfoSaving] = useState(false)

  // 사진
  const [photos, setPhotos] = useState<PhotoItem[]>(initialData.photos)
  const [photoMsg, setPhotoMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // PPTX
  const pptRef = useRef<HTMLInputElement>(null)
  const [pptUploading, setPptUploading] = useState(false)
  const [pptMsg, setPptMsg] = useState('')
  const [hasPpt, setHasPpt] = useState(!!initialData.profileDocPath)

  // 유튜브 영상
  const [videos, setVideos] = useState<VideoItem[]>(initialData.videos)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoMsg, setVideoMsg] = useState('')
  const [videoAdding, setVideoAdding] = useState(false)

  // R2 업로드 영상
  const [r2Videos, setR2Videos] = useState<R2VideoItem[]>(initialData.r2Videos)
  const r2VideoRef = useRef<HTMLInputElement>(null)
  const [r2Uploading, setR2Uploading] = useState(false)
  const [r2UploadStatus, setR2UploadStatus] = useState('')
  const [r2VideoMsg, setR2VideoMsg] = useState('')

  // 필모그래피
  const [filmography, setFilmography] = useState<FilmItem[]>(initialData.filmography)
  const [filmMsg, setFilmMsg] = useState('')
  const [filmSaving, setFilmSaving] = useState(false)
  // newFilm은 컴포넌트 외부 순수 함수로 이동 (렌더마다 재생성 방지)

  // inline 확인 상태 (삭제 2단계 확인)
  const [confirmingPhotoId, setConfirmingPhotoId] = useState<string | null>(null)
  const [confirmingVideoId, setConfirmingVideoId] = useState<string | null>(null)
  const [confirmingR2VideoId, setConfirmingR2VideoId] = useState<string | null>(null)
  const [confirmingFilmIdx, setConfirmingFilmIdx] = useState<number | null>(null)

  // ── 타이머 관리 (언마운트 시 clearTimeout으로 메모리 누수 방지) ──────────────
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const flashMsg = (setter: (v: string) => void, delay = 3000) => {
    const id = setTimeout(() => setter(''), delay)
    timerIds.current.push(id)
  }
  useEffect(() => {
    return () => timerIds.current.forEach(clearTimeout)
  }, [])

  // ── 기본 정보 저장 ──────────────────────────────────────────────────────────
  async function saveInfo() {
    setInfoSaving(true)
    setInfoMsg('')
    try {
      const res = await fetch(`/api/actors/${actorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height: height || null, weight: weight || null, skills: skills || null, instagram: instagram || null, casting_summary: castingSummary.trim() || null }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패')
      setInfoMsg('저장되었습니다.')
    } catch (e) {
      setInfoMsg((e as Error).message)
    } finally {
      setInfoSaving(false)
      flashMsg(setInfoMsg)
    }
  }

  // ── PPTX 업로드 ────────────────────────────────────────────────────────────
  async function uploadPpt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setPptMsg('10MB 이하 파일만 가능합니다.'); return }
    setPptUploading(true); setPptMsg('')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pptx'
      const path = `${actorId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('actor-docs').upload(path, file, { upsert: true })
      if (upErr) {
        // RLS 오류 → 사용자 친화적 메시지
        const msg = upErr.message.toLowerCase()
        if (msg.includes('policy') || msg.includes('permission') || msg.includes('not authorized') || msg.includes('violates')) {
          throw new Error('업로드 권한 확인 중입니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.')
        }
        throw new Error(upErr.message)
      }
      const res = await fetch(`/api/actors/${actorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_doc_path: path }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패')
      setHasPpt(true)
      setPptMsg(`✓ ${file.name} 업로드 완료`)
    } catch (e) {
      setPptMsg((e as Error).message)
    } finally {
      setPptUploading(false)
      if (pptRef.current) pptRef.current.value = ''
      flashMsg(setPptMsg, 5000)
    }
  }

  // ── R2 영상 업로드 ──────────────────────────────────────────────────────────
  async function uploadR2Video(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 300 * 1024 * 1024) { setR2VideoMsg('300MB 이하 파일만 가능합니다.'); return }
    setR2Uploading(true); setR2UploadStatus('업로드 URL 발급 중...')
    try {
      const urlRes = await fetch('/api/r2/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'video/mp4', size: file.size }),
      })
      if (urlRes.status === 401) { window.location.href = '/auth/login'; return }
      if (!urlRes.ok) throw new Error('URL 발급 실패')
      const { uploadUrl, key } = await urlRes.json()
      setR2UploadStatus(`업로드 중... (${(file.size / 1024 / 1024).toFixed(0)}MB, 용량이 크면 시간이 걸려요)`)
      const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'video/mp4' } })
      if (!put.ok) throw new Error('업로드 실패')
      setR2UploadStatus('기록 중...')
      const res = await fetch(`/api/actors/${actorId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r2_key: key, title: file.name }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '기록 실패')
      const row = await res.json()
      setR2Videos(prev => [...prev, { id: row.id, r2_key: key, title: file.name, video_type: 'reel' }])
      setR2VideoMsg('영상 업로드 완료.')
    } catch (e) {
      setR2VideoMsg((e as Error).message)
    } finally {
      setR2Uploading(false); setR2UploadStatus('')
      if (r2VideoRef.current) r2VideoRef.current.value = ''
      flashMsg(setR2VideoMsg, 5000)
    }
  }

  async function deleteR2Video(id: string) {
    if (confirmingR2VideoId !== id) { setConfirmingR2VideoId(id); return }
    setConfirmingR2VideoId(null)
    try {
      const res = await fetch(`/api/actors/${actorId}/videos/${id}`, { method: 'DELETE' })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      setR2Videos(prev => prev.filter(v => v.id !== id))
    } catch (e) {
      setR2VideoMsg((e as Error).message)
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
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '업로드 실패')
      const { url, id } = await res.json()
      setPhotos(prev => [...prev, { id, url, is_profile: prev.length === 0 }])
      setPhotoMsg('업로드 완료.')
    } catch (e) {
      setPhotoMsg((e as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
      flashMsg(setPhotoMsg)
    }
  }

  async function deletePhoto(id: string, isProfile: boolean) {
    if (confirmingPhotoId !== id) { setConfirmingPhotoId(id); return }
    setConfirmingPhotoId(null)
    try {
      const res = await fetch(`/api/actors/${actorId}/photos/${id}`, { method: 'DELETE' })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      setPhotos(prev => {
        const next = prev.filter(p => p.id !== id)
        if (isProfile && next.length > 0) next[0] = { ...next[0], is_profile: true }
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
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '변경 실패')
      setPhotos(prev => prev.map(p => ({ ...p, is_profile: p.id === id })))
    } catch (e) {
      setPhotoMsg((e as Error).message)
    }
  }

  // ── 영상 추가 ───────────────────────────────────────────────────────────────
  async function addVideo() {
    if (videoAdding) return
    const yid = extractYoutubeId(videoUrl.trim())
    if (!yid) {
      setVideoMsg('유효한 유튜브 URL 또는 영상 ID를 입력하세요.')
      return
    }
    setVideoAdding(true)
    try {
      const res = await fetch(`/api/actors/${actorId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_id: yid, title: videoTitle.trim() || null }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '추가 실패')
      const row = await res.json()
      setVideos(prev => [{ id: row.id, youtube_id: yid, title: videoTitle.trim() }, ...prev])
      setVideoUrl('')
      setVideoTitle('')
      setVideoMsg('영상 추가 완료.')
    } catch (e) {
      setVideoMsg((e as Error).message)
    } finally {
      setVideoAdding(false)
      flashMsg(setVideoMsg)
    }
  }

  async function deleteVideo(id: string) {
    if (confirmingVideoId !== id) { setConfirmingVideoId(id); return }
    setConfirmingVideoId(null)
    try {
      const res = await fetch(`/api/actors/${actorId}/videos/${id}`, { method: 'DELETE' })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
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

  async function saveAllFilms() {
    const hasContent = filmography.some(f => f.title.trim())
    if (!hasContent) { setFilmMsg('저장할 항목이 없습니다.'); return }
    setFilmSaving(true); setFilmMsg('')
    try {
      const items = filmography
        .filter(f => f.title.trim())
        .map(f => ({
          id: f.id || undefined,
          category: f.category,
          year: f.year ? Number(f.year) : undefined,
          title: f.title.trim(),
          role: f.role?.trim() || undefined,
          broadcaster: f.broadcaster?.trim() || undefined,
          film_type: f.film_type?.trim() || undefined,
        }))
      const res = await fetch(`/api/actors/${actorId}/filmography/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      const data = await res.json()
      if (!res.ok) {
        setFilmMsg(data.error || '저장 중 오류가 발생했습니다.')
      } else {
        // 새로 삽입된 항목에 DB id 반영
        const insertResults = (data.results ?? []).filter((r: { id: string; ok: boolean; originalIdx?: number }) => r.originalIdx !== undefined)
        if (insertResults.length > 0) {
          const updated = [...filmography]
          let insertIdx = 0
          for (let i = 0; i < updated.length; i++) {
            if (!updated[i].id && updated[i].title.trim() && insertResults[insertIdx]) {
              updated[i] = { ...updated[i], id: insertResults[insertIdx].id }
              insertIdx++
            }
          }
          setFilmography(updated)
        }
        const errors = data.errors ?? 0
        setFilmMsg(errors > 0 ? `${errors}개 항목 저장 실패` : '저장되었습니다.')
      }
    } catch {
      setFilmMsg('네트워크 오류가 발생했습니다.')
    } finally {
      setFilmSaving(false)
      flashMsg(setFilmMsg)
    }
  }

  async function deleteFilm(idx: number) {
    const f = filmography[idx]
    if (confirmingFilmIdx !== idx) { setConfirmingFilmIdx(idx); return }
    setConfirmingFilmIdx(null)
    if (f.id) {
      try {
        const res = await fetch(`/api/actors/${actorId}/filmography/${f.id}`, { method: 'DELETE' })
        if (res.status === 401) { window.location.href = '/auth/login'; return }
        if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      } catch (e) {
        setFilmMsg((e as Error).message)
        return
      }
    }
    setFilmography(prev => prev.filter((_, i) => i !== idx))
  }

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  // 프로필 완성도 계산 (저장된 값 기준 + 실시간 state)
  // useMemo: 관련 state가 변할 때만 재계산 (키보드 입력마다 재계산 방지)
  const completionItems = useMemo(() => [
    { label: '프로필 사진', done: photos.length > 0, icon: '📸' },
    { label: '출연 영상', done: videos.length > 0 || r2Videos.length > 0, icon: '🎬' },
    { label: '필모그래피', done: filmography.length > 0, icon: '📋' },
    { label: '한줄소개', done: castingSummary.trim().length > 0, icon: '✍️' },
  ], [photos.length, videos.length, r2Videos.length, filmography.length, castingSummary])
  const completionCount = completionItems.filter(i => i.done).length
  const completionPct = Math.round((completionCount / completionItems.length) * 100)

  return (
    <div style={{ maxWidth: 820 }}>

      {/* ── 프로필 완성도 ── */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>Profile Completion</p>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700, color: completionPct === 100 ? '#4ade80' : 'var(--white)' }}>{completionPct}%</span>
        </div>
        {/* 프로그레스 바 */}
        <div style={{ height: 4, borderRadius: 4, background: 'var(--bg3)', marginBottom: 14, overflow: 'hidden' }}>
          <div
            role="progressbar"
            aria-valuenow={completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="프로필 완성도"
            style={{
              height: '100%',
              width: `${completionPct}%`,
              borderRadius: 4,
              background: completionPct === 100 ? '#4ade80' : 'var(--gold)',
              transition: 'width 0.3s ease',
            }} />
        </div>
        {/* 항목별 체크리스트 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {completionItems.map(item => (
            <span key={item.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              fontSize: '0.75rem', fontWeight: 600,
              background: item.done ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${item.done ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
              color: item.done ? '#4ade80' : 'var(--gray)',
            }}>
              <span>{item.done ? '✓' : '○'}</span>
              <span>{item.icon} {item.label}</span>
            </span>
          ))}
        </div>
        {completionPct === 100 && (
          <p style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: 10, fontWeight: 500 }}>
            ✨ 프로필이 완성됐어요! 관리자 검토 후 배우 DB에 공개됩니다.
          </p>
        )}
        {completionPct === 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: 10 }}>
            아래 항목을 채우면 캐스팅 디렉터들에게 더 잘 노출됩니다.
          </p>
        )}
      </div>

      {/* ── 기본 정보 ── */}
      <section style={s.section} aria-labelledby="gallery-section-info">
        <h2 id="gallery-section-info" style={s.sectionTitle}>기본 정보</h2>
        <div style={{ ...s.row, marginBottom: 20 }}>
          <div style={{ ...s.field, flex: '1 1 120px' }}>
            <label htmlFor="actor-height" style={s.label}>신장 (cm)</label>
            <input id="actor-height" type="number" value={height} onChange={e => setHeight(e.target.value)} style={s.input} placeholder="170" />
          </div>
          <div style={{ ...s.field, flex: '1 1 120px' }}>
            <label htmlFor="actor-weight" style={s.label}>체중 (kg)</label>
            <input id="actor-weight" type="number" value={weight} onChange={e => setWeight(e.target.value)} style={s.input} placeholder="60" />
          </div>
          <div style={{ ...s.field, flex: '2 1 240px' }}>
            <label htmlFor="actor-skills" style={s.label}>특기</label>
            <input id="actor-skills" value={skills} onChange={e => setSkills(e.target.value)} style={s.input} placeholder="수영, 검도, 피아노..." />
          </div>
        </div>
        <div style={{ ...s.field, marginBottom: 20 }}>
          <label htmlFor="actor-instagram" style={s.label}>인스타그램 ID</label>
          <input id="actor-instagram" value={instagram} onChange={e => setInstagram(e.target.value)} style={{ ...s.input, maxWidth: 280 }} placeholder="@username" />
        </div>
        <div style={{ ...s.field, marginBottom: 20 }}>
          <label htmlFor="actor-casting-summary" style={s.label}>한줄소개 <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--gray)' }}>(캐스팅 디렉터에게 보이는 자기소개, 50자 내외)</span></label>
          <textarea
            id="actor-casting-summary"
            value={castingSummary}
            onChange={e => setCastingSummary(e.target.value)}
            maxLength={120}
            rows={2}
            placeholder='예: "장르를 넘나드는 탄탄한 기본기의 배우"'
            style={{ ...s.input, resize: 'vertical', minHeight: 64, lineHeight: 1.6, fontFamily: 'inherit' }}
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--gray)', textAlign: 'right' }}>{castingSummary.length}/120</span>
        </div>
        <button type="button" onClick={saveInfo} disabled={infoSaving} aria-busy={infoSaving} style={{ ...s.btn, ...s.btnPrimary, opacity: infoSaving ? 0.6 : 1 }}>
          {infoSaving ? '저장 중…' : '저장'}
        </button>
        {infoMsg && <p role={infoMsg.includes('실패') || infoMsg.includes('오류') ? 'alert' : 'status'} aria-live={infoMsg.includes('실패') || infoMsg.includes('오류') ? 'assertive' : 'polite'} style={{ ...s.msg, color: infoMsg.includes('실패') || infoMsg.includes('오류') ? '#ef4444' : 'var(--gold)', marginTop: 10 }}>{infoMsg}</p>}
      </section>

      {/* ── 프로필 자료 (PPTX) ── */}
      <section style={s.section} aria-labelledby="gallery-section-ppt">
        <h2 id="gallery-section-ppt" style={s.sectionTitle}>프로필 문서</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 6, background: 'rgba(196,165,90,0.12)',
            border: '1px solid rgba(196,165,90,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
          }}>
            📄
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--white)', fontWeight: 600, marginBottom: 2 }}>
              {hasPpt ? '프로필 PPTX 등록됨' : '프로필 PPTX 미등록'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
              {hasPpt ? '새 파일을 올리면 기존 파일이 교체됩니다.' : '.pptx 형식, 10MB 이하'}
            </p>
          </div>
        </div>
        <input ref={pptRef} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={uploadPpt} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => pptRef.current?.click()} disabled={pptUploading} aria-busy={pptUploading} style={{ ...s.btn, ...s.btnGhost, opacity: pptUploading ? 0.6 : 1 }}>
          {pptUploading ? '업로드 중…' : <><span aria-hidden="true">📄</span>{hasPpt ? ' 파일 교체' : ' 파일 올리기'}</>}
        </button>
        {pptMsg && <p role={pptMsg.includes('완료') ? 'status' : 'alert'} aria-live={pptMsg.includes('완료') ? 'polite' : 'assertive'} style={{ ...s.msg, color: pptMsg.includes('완료') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{pptMsg}</p>}
      </section>

      {/* ── 사진 ── */}
      <section style={s.section} aria-labelledby="gallery-section-photos">
        <h2 id="gallery-section-photos" style={s.sectionTitle}>사진</h2>
        <div style={s.photoGrid}>
          {photos.map((p, idx) => (
            <div key={p.id} style={s.photoCard}>
              <Image src={p.url} alt={p.is_profile ? '대표 프로필 사진' : `배우 사진 ${idx + 1}`} fill style={{ objectFit: 'cover' }} sizes="160px" />
              {p.is_profile && <span style={s.profileBadge}>대표</span>}
              <div style={s.photoActions}>
                {confirmingPhotoId === p.id ? (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button type="button" onClick={() => setConfirmingPhotoId(null)} style={{ ...s.btn, ...s.btnGhost, padding: '8px 10px', minHeight: 44 }}>취소</button>
                    <button type="button" onClick={() => deletePhoto(p.id, p.is_profile)} style={{ ...s.btn, background: '#ef4444', color: '#fff', padding: '8px 10px', minHeight: 44, border: 'none' }}>확인</button>
                  </div>
                ) : (
                  <>
                    {!p.is_profile && (
                      <button type="button" onClick={() => setProfile(p.id)} aria-label={`사진 ${idx + 1} 대표로 지정`} style={{ ...s.btn, ...s.btnGhost, padding: '4px 10px', fontSize: '0.72rem', minHeight: 44 }}>
                        대표 지정
                      </button>
                    )}
                    <button type="button" onClick={() => deletePhoto(p.id, p.is_profile)} aria-label={p.is_profile ? '대표 프로필 사진 삭제' : `사진 ${idx + 1} 삭제`} style={{ ...s.btn, ...s.btnDanger }}>
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} aria-hidden="true" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-busy={uploading} style={{ ...s.btn, ...s.btnPrimary, opacity: uploading ? 0.6 : 1 }}>
            {uploading ? '업로드 중…' : '+ 사진 추가'}
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>JPG·PNG, 최대 5MB · 9:16 비율 권장</span>
        </div>
        {photoMsg && <p role={photoMsg.includes('완료') ? 'status' : 'alert'} aria-live={photoMsg.includes('완료') ? 'polite' : 'assertive'} style={{ ...s.msg, color: photoMsg.includes('완료') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{photoMsg}</p>}
      </section>

      {/* ── 영상 ── */}
      <section style={s.section} aria-labelledby="gallery-section-videos">
        <h2 id="gallery-section-videos" style={s.sectionTitle}>영상</h2>

        {/* R2 업로드 영상 */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: 12 }}>📁 직접 업로드 영상</p>
          {r2Videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {r2Videos.map(v => (
                <div key={v.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '10px 14px' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎬</span>
                  <p style={{ flex: 1, fontSize: '0.84rem', color: 'var(--white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title || v.r2_key.split('/').pop()}
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray)', marginLeft: 6 }}>
                      {v.video_type === 'monologue' ? '독백' : '출연영상'}
                    </span>
                  </p>
                  {confirmingR2VideoId === v.id ? (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button type="button" onClick={() => setConfirmingR2VideoId(null)} style={{ ...s.btn, ...s.btnGhost, padding: '8px 10px', minHeight: 44 }}>취소</button>
                      <button type="button" onClick={() => deleteR2Video(v.id)} style={{ ...s.btn, background: '#ef4444', color: '#fff', padding: '8px 10px', minHeight: 44, border: 'none' }}>확인</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => deleteR2Video(v.id)} aria-label={`${v.title || '영상'} 삭제`} style={{ ...s.btn, ...s.btnDanger, flexShrink: 0 }}>삭제</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div>
            <input ref={r2VideoRef} type="file" accept="video/*" onChange={uploadR2Video} style={{ display: 'none' }} aria-hidden="true" />
            <button type="button" onClick={() => r2VideoRef.current?.click()} disabled={r2Uploading} aria-busy={r2Uploading} style={{ ...s.btn, ...s.btnGhost, opacity: r2Uploading ? 0.6 : 1 }}>
              {r2Uploading ? r2UploadStatus || '업로드 중…' : '+ 영상 파일 업로드'}
            </button>
            <span style={{ fontSize: '0.74rem', color: 'var(--gray)', marginLeft: 12 }}>mp4 권장, 최대 300MB</span>
          </div>
          {r2VideoMsg && <p role={r2VideoMsg.includes('완료') ? 'status' : 'alert'} aria-live={r2VideoMsg.includes('완료') ? 'polite' : 'assertive'} style={{ ...s.msg, color: r2VideoMsg.includes('완료') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{r2VideoMsg}</p>}
        </div>

        {/* 유튜브 연결 영상 */}
        <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: 12 }}>🎬 유튜브 영상 연결</p>
          {videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {videos.map(v => (
                <div key={v.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ width: 60, height: 34, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title || ''} fill sizes="60px" style={{ objectFit: 'cover' }} />
                  </div>
                  <p style={{ flex: 1, fontSize: '0.84rem', color: 'var(--white)', margin: 0 }}>
                    {v.title || v.youtube_id}
                  </p>
                  {confirmingVideoId === v.id ? (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button type="button" onClick={() => setConfirmingVideoId(null)} style={{ ...s.btn, ...s.btnGhost, padding: '8px 10px', minHeight: 44 }}>취소</button>
                      <button type="button" onClick={() => deleteVideo(v.id)} style={{ ...s.btn, background: '#ef4444', color: '#fff', padding: '8px 10px', minHeight: 44, border: 'none' }}>확인</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => deleteVideo(v.id)} aria-label={`${v.title || v.youtube_id} 삭제`} style={{ ...s.btn, ...s.btnDanger, flexShrink: 0 }}>삭제</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ ...s.field, flex: '2 1 200px' }}>
              <label htmlFor="video-url" style={s.label}>유튜브 URL 또는 ID</label>
              <input id="video-url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={s.input} placeholder="https://youtu.be/..." />
            </div>
            <div style={{ ...s.field, flex: '1 1 140px' }}>
              <label htmlFor="video-title" style={s.label}>제목 (선택)</label>
              <input id="video-title" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} style={s.input} placeholder="단편영화 주연" />
            </div>
            <button type="button" onClick={addVideo} disabled={videoAdding} aria-busy={videoAdding} style={{ ...s.btn, ...s.btnPrimary, marginBottom: 0, opacity: videoAdding ? 0.6 : 1 }}>{videoAdding ? '추가 중…' : '추가'}</button>
          </div>
          {videoMsg && <p role={videoMsg.includes('완료') ? 'status' : 'alert'} aria-live={videoMsg.includes('완료') ? 'polite' : 'assertive'} style={{ ...s.msg, color: videoMsg.includes('완료') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{videoMsg}</p>}
        </div>
      </section>

      {/* ── 필모그래피 ── */}
      <section style={s.section} aria-labelledby="gallery-section-filmography">
        <h2 id="gallery-section-filmography" style={s.sectionTitle}>필모그래피</h2>

        {filmography.length > 0 && (
          <div style={{ marginBottom: 20, overflowX: 'auto' }}>
            <div style={{ minWidth: 460 }}>
            <div style={{ ...s.filmRow, marginBottom: 4 }}>
              {['구분', '연도', '작품명', '배역', ''].map(h => (
                <span key={h} style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {filmography.map((f, i) => (
              <div key={f.id || i} style={s.filmRow}>
                <select aria-label={`필모그래피 ${i + 1}번 구분`} value={f.category} onChange={e => updateFilm(i, 'category', e.target.value)} style={{ ...s.input, padding: '8px 10px' }}>
                  <option value="drama">드라마</option>
                  <option value="film">영화</option>
                  <option value="cf">CF</option>
                  <option value="theater">연극</option>
                  <option value="musical">뮤지컬</option>
                  <option value="etc">기타</option>
                </select>
                <input aria-label={`필모그래피 ${i + 1}번 연도`} type="number" value={f.year} onChange={e => updateFilm(i, 'year', e.target.value)} style={{ ...s.input, padding: '8px 10px' }} />
                <input aria-label={`필모그래피 ${i + 1}번 작품명`} value={f.title} onChange={e => updateFilm(i, 'title', e.target.value)} style={{ ...s.input, padding: '8px 10px' }} placeholder="작품명" />
                <input aria-label={`필모그래피 ${i + 1}번 배역`} value={f.role} onChange={e => updateFilm(i, 'role', e.target.value)} style={{ ...s.input, padding: '8px 10px' }} placeholder="배역" />
                {confirmingFilmIdx === i ? (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button type="button" onClick={() => setConfirmingFilmIdx(null)} style={{ ...s.btn, ...s.btnGhost, padding: '8px 10px', minHeight: 44 }}>취소</button>
                    <button type="button" onClick={() => deleteFilm(i)} style={{ ...s.btn, background: '#ef4444', color: '#fff', padding: '8px 10px', minHeight: 44, border: 'none' }}>확인</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => deleteFilm(i)} aria-label={`필모그래피 ${i + 1}번 삭제`} style={{ ...s.btn, ...s.btnDanger }}>삭제</button>
                )}
              </div>
            ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setFilmography(prev => [newFilm(), ...prev])} style={{ ...s.btn, ...s.btnGhost }}>
            + 항목 추가
          </button>
          {filmography.length > 0 && (
            <button type="button" onClick={saveAllFilms} disabled={filmSaving} aria-busy={filmSaving} style={{ ...s.btn, ...s.btnPrimary, opacity: filmSaving ? 0.6 : 1 }}>
              {filmSaving ? '저장 중…' : '저장'}
            </button>
          )}
        </div>
        {filmMsg && <p role={filmMsg.includes('저장') ? 'status' : 'alert'} aria-live={filmMsg.includes('저장') ? 'polite' : 'assertive'} style={{ ...s.msg, color: filmMsg.includes('저장') ? 'var(--gold)' : '#ef4444', marginTop: 8 }}>{filmMsg}</p>}
      </section>
    </div>
  )
}
