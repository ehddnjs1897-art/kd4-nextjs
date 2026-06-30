'use client'

/**
 * GalleryEditForm — 배우 갤러리 편집 클라이언트 컴포넌트
 *
 * 기능:
 * 1. 기본 정보 편집 (신장, 체중, 특기, 인스타그램)
 * 2. 사진 업로드 / 삭제 / 프로필 지정
 * 3. 유튜브 영상 추가 / 삭제
 * 4. 필모그래피 CRUD
 *
 * 2026-06 직관 UI 개편 (Apple iOS 설정/Contacts 그룹 리스트 참고):
 *  - 흰 카드 그룹 + 얇은 구분선 + 작은 네이비 아이콘 + 값 오른쪽 정렬 + 작은 ›
 *  ⚠️ 모든 핸들러/상태 로직은 보존, 렌더·스타일만 교체. 접수 폼(OnboardingForm)과 톤 통일.
 */

import { useState, useRef, useMemo, useEffect } from 'react'
import { DIALECT_OPTIONS, DIALECT_NONE } from '@/lib/dialects'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { prepareImageForUpload } from '@/lib/prepare-image'

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface PhotoItem {
  id: string
  url: string
  is_profile: boolean
}

// 현재사진(전신 각도) — 라벨별 1장 (정면/좌측/우측/후면/전신)
interface CurrentPhotoItem {
  id: string
  url: string
  label: string
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
  isNew?: boolean  // 클라이언트에서 새로 추가한 행 — 저장 시 클라 UUID를 서버에 보내지 않음(신규 삽입 처리)
}

interface InitialData {
  height?: number
  weight?: number
  skills?: string
  dialects?: string[]
  instagram?: string
  castingSummary?: string
  profileDocPath?: string | null
  photos: PhotoItem[]
  currentPhotos?: CurrentPhotoItem[]
  videos: VideoItem[]
  r2Videos: R2VideoItem[]
  filmography: FilmItem[]
}

// 현재사진 각도 라벨 — /api/upload 화이트리스트와 일치 (2026-07-01 대표 지시)
const CURRENT_PHOTO_LABELS = ['정면', '좌측', '우측', '후면', '전신'] as const

interface Props {
  actorId: string
  initialData: InitialData
}

// ─── 유튜브 ID 추출 ───────────────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const patterns = [
    // watch / 단축 / embed / shorts / live URL 모두 지원 (멤버들이 shorts 링크를 많이 씀)
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
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
    id: crypto.randomUUID(),  // React key 안정성용 — 서버 전송 시엔 제외(isNew)
    category: 'drama',
    year: new Date().getFullYear(),
    title: '',
    role: '',
    isNew: true,
  }
}

// 이미지 준비(HEIC→JPEG 변환 + 대용량 리사이즈/압축)는 공용 유틸로 이동 → @/lib/prepare-image

// ─── Apple식 라인 아이콘 ───────────────────────────────────────────────────────
const iconProps = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const FileIcon = () => <svg {...iconProps}><path d="M14 2.5H7A2 2 0 005 4.5v15a2 2 0 002 2h10a2 2 0 002-2V7.5z" /><path d="M14 2.5v5h5" /></svg>
const Chevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>

// ─── Apple식 스타일 ───────────────────────────────────────────────────────────
const a: Record<string, React.CSSProperties> = {
  caption: { fontSize: 13, color: 'var(--gray)', margin: '0 6px 8px', fontWeight: 500 },
  card: { background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  cardPad: { background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 8 },
  sep: { borderTop: '1px solid #ECEAE0' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', minHeight: 54, boxSizing: 'border-box' },
  rowBtn: { display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', padding: '13px 16px', minHeight: 56, boxSizing: 'border-box', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  rowBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  tile: { flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, color: 'var(--white)', fontWeight: 400 },
  sub: { fontSize: 13, color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chev: { flexShrink: 0, color: '#C7C3B9', display: 'flex', alignItems: 'center' },
  inlineInput: { flex: 1, minWidth: 0, border: 'none', background: 'transparent', textAlign: 'right', fontSize: 16, color: 'var(--white)', fontFamily: 'inherit', padding: '4px 2px', borderRadius: 6 },
  unit: { fontSize: 16, color: 'var(--gray)', flexShrink: 0 },
  opt: { fontSize: 12, fontWeight: 400, color: 'var(--gray)', marginLeft: 4 },
  blockLabel: { display: 'block', fontSize: 16, color: 'var(--white)', fontWeight: 500, marginBottom: 8 },
  help: { fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 10 },
  boxInput: { display: 'block', width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--white)', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' },
  smallInput: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 11px', color: 'var(--white)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' },
  primary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 22px', minHeight: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, background: 'var(--navy)', color: '#fff', fontFamily: 'inherit' },
  ghost: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', minHeight: 44, borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 500, background: 'transparent', color: 'var(--navy)', border: '1px solid var(--border)', fontFamily: 'inherit' },
  danger: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 13px', minHeight: 36, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'transparent', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)', fontFamily: 'inherit' },
  msg: { fontSize: 14, padding: '6px 0', minHeight: 22 },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 },
  // 미리보기 = 실제 배우 DB 카드와 동일한 세로 3:4 (얼굴 상단 기준으로 안 잘리게)
  photoCard: { position: 'relative', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg3)' },
  profileBadge: { position: 'absolute', top: 8, left: 8, background: 'var(--navy)', color: '#fff', fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20 },
  photoActions: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 7px 7px', display: 'flex', gap: 6, justifyContent: 'center' },
  listRow: { display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg)', borderRadius: 10, padding: '10px 14px' },
  filmRow: { display: 'grid', gridTemplateColumns: '100px 70px 1.2fr 1fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 },
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function GalleryEditForm({ actorId, initialData }: Props) {
  // 기본 정보
  const [height, setHeight] = useState(initialData.height ?? '')
  const [weight, setWeight] = useState(initialData.weight ?? '')
  const [skills, setSkills] = useState(initialData.skills ?? '')
  const [dialects, setDialects] = useState<string[]>(initialData.dialects ?? [])
  const [instagram, setInstagram] = useState(initialData.instagram ?? '')
  const [castingSummary, setCastingSummary] = useState(initialData.castingSummary ?? '')
  const [infoMsg, setInfoMsg] = useState('')
  const [infoSaving, setInfoSaving] = useState(false)

  // 사진
  const [photos, setPhotos] = useState<PhotoItem[]>(initialData.photos)
  const [photoMsg, setPhotoMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // 현재사진(전신 각도) — 라벨별 1장
  const [currentPhotos, setCurrentPhotos] = useState<CurrentPhotoItem[]>(initialData.currentPhotos ?? [])
  const [cpUploadingLabel, setCpUploadingLabel] = useState<string | null>(null)
  const [cpMsg, setCpMsg] = useState('')
  const cpFileRef = useRef<HTMLInputElement>(null)
  const cpPendingLabel = useRef<string | null>(null)  // 클릭한 각도 라벨을 onChange로 전달

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

  // 포커스 복원용 refs — 삭제 취소 시 트리거 버튼으로 포커스 반환 (WCAG 2.4.3)
  const deletePhotoRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  const deleteVideoRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  const deleteR2VideoRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  const deleteFilmRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map())

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
      // 콤마 구분 → 배열.
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 30)
      const res = await fetch(`/api/actors/${actorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: height || null,
          weight: weight || null,
          skills: skillsArr.length > 0 ? skillsArr : null,
          dialects: dialects.length > 0 ? dialects : null,
          instagram: instagram || null,
          casting_summary: castingSummary.trim() || null,
        }),
        signal: AbortSignal.timeout(10_000),
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
    if (file.size > 20 * 1024 * 1024) { setPptMsg('20MB 이하 파일만 가능합니다.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['pptx', 'pdf'].includes(ext)) { setPptMsg('.pptx 또는 .pdf 파일만 올릴 수 있어요.'); return }
    setPptUploading(true); setPptMsg('')
    try {
      const ct = file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      // 서버 발급 서명 URL 방식 — httpOnly 세션 쿠키를 브라우저가 못 읽어(server.ts) 직접 업로드가
      // RLS에 막히는 문제 우회. 경로는 서버가 intake/{user.id}/ 로 발급 → /api/actors PATCH 검증과 일치.
      const signRes = await fetch('/api/storage/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'actor-docs', ext, contentType: ct, size: file.size }),
        signal: AbortSignal.timeout(15_000),
      })
      if (signRes.status === 401) { window.location.href = '/auth/login'; return }
      const signJson = await signRes.json().catch(() => ({}))
      if (!signRes.ok) throw new Error(signJson.error || '업로드 URL 발급 실패')
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from('actor-docs')
        .uploadToSignedUrl(signJson.path, signJson.token, file, { contentType: ct })
      if (upErr) throw new Error(upErr.message)
      const path = signJson.path as string
      const res = await fetch(`/api/actors/${actorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_doc_path: path }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패')
      setHasPpt(true)
      setPptMsg(`${file.name} 업로드 완료`)
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
        signal: AbortSignal.timeout(10_000),
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
        signal: AbortSignal.timeout(10_000),
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
      const res = await fetch(`/api/actors/${actorId}/videos/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
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
    if (file.size > 30 * 1024 * 1024) {
      setPhotoMsg('사진은 30MB 이하로 올려주세요.')
      return
    }
    setUploading(true)
    setPhotoMsg('')
    try {
      const upFile = await prepareImageForUpload(file)  // HEIC→JPEG 변환 + 4.5MB 초과분 리사이즈(413 회피)
      const fd = new FormData()
      fd.append('file', upFile)
      fd.append('actorId', actorId)
      fd.append('bucket', 'actor-photos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (res.status === 413) throw new Error('사진 용량이 너무 큽니다. 더 작은 사진으로 올려주세요.')
      if (!res.ok) {
        const msg = await res.json().then((j) => j.error).catch(() => null)
        throw new Error(msg || '업로드에 실패했습니다.')
      }
      const { url, id, isProfile } = await res.json()
      // isProfile: 서버가 대표사진 비어있을 때 자동 승격한 결과 (단일 진실 소스)
      setPhotos(prev => [...prev, { id, url, is_profile: !!isProfile }])
      setPhotoMsg(isProfile ? '업로드 완료 — 대표 사진으로 지정되었습니다.' : '업로드 완료.')
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
      const res = await fetch(`/api/actors/${actorId}/photos/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
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
        signal: AbortSignal.timeout(10_000),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '변경 실패')
      setPhotos(prev => prev.map(p => ({ ...p, is_profile: p.id === id })))
    } catch (e) {
      setPhotoMsg((e as Error).message)
    }
  }

  // ── 현재사진(전신 각도) 업로드/삭제 ──────────────────────────────────────────
  function pickCurrentPhoto(label: string) {
    cpPendingLabel.current = label
    cpFileRef.current?.click()
  }

  async function uploadCurrentPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const label = cpPendingLabel.current
    if (!file || !label) return
    if (file.size > 30 * 1024 * 1024) { setCpMsg('사진은 30MB 이하로 올려주세요.'); return }
    setCpUploadingLabel(label)
    setCpMsg('')
    try {
      const upFile = await prepareImageForUpload(file)  // HEIC→JPEG 변환 + 4.5MB 초과분 리사이즈(413 회피)
      const fd = new FormData()
      fd.append('file', upFile)
      fd.append('actorId', actorId)
      fd.append('bucket', 'actor-photos')
      fd.append('photoType', 'current')
      fd.append('label', label)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (res.status === 413) throw new Error('사진 용량이 너무 큽니다. 더 작은 사진으로 올려주세요.')
      if (!res.ok) {
        const msg = await res.json().then((j) => j.error).catch(() => null)
        throw new Error(msg || '업로드에 실패했습니다.')
      }
      const { url, id } = await res.json()
      // 같은 각도(label)에 이미 사진이 있으면 기존 것 삭제 후 교체 — 각도당 1장 유지
      const prevSameLabel = currentPhotos.find((p) => p.label === label)
      setCurrentPhotos((prev) => [...prev.filter((p) => p.label !== label), { id, url, label }])
      if (prevSameLabel) {
        fetch(`/api/actors/${actorId}/photos/${prevSameLabel.id}`, { method: 'DELETE' }).catch(() => {})
      }
      setCpMsg(`${label} 업로드 완료.`)
    } catch (err) {
      setCpMsg((err as Error).message)
    } finally {
      setCpUploadingLabel(null)
      cpPendingLabel.current = null
      if (cpFileRef.current) cpFileRef.current.value = ''
      flashMsg(setCpMsg)
    }
  }

  async function deleteCurrentPhoto(id: string) {
    try {
      const res = await fetch(`/api/actors/${actorId}/photos/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패')
      setCurrentPhotos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setCpMsg((err as Error).message)
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
        signal: AbortSignal.timeout(10_000),
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
      const res = await fetch(`/api/actors/${actorId}/videos/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
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
          id: f.isNew ? undefined : f.id,  // 신규 행은 클라 UUID 제외 → 서버가 INSERT 처리(저장 소실 방지)
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
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({ items }),
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      const data = await res.json()
      if (!res.ok) {
        setFilmMsg(data.error || '저장 중 오류가 발생했습니다.')
      } else {
        // 신규 삽입 행에 DB가 생성한 실제 id 반영 (재저장 시 중복 삽입 방지)
        // bulk 응답 results = [기존행(전송 id) · 거부 · 신규삽입(새 DB id — 전송 순서 보존)]
        const sentExistingIds = new Set(filmography.filter(f => !f.isNew && f.title.trim()).map(f => f.id))
        const newDbIds = (data.results ?? [])
          .filter((r: { id: string; ok: boolean; reason?: string }) => r.ok && !r.reason && !sentExistingIds.has(r.id))
          .map((r: { id: string }) => r.id)
        if (newDbIds.length > 0) {
          const updated = [...filmography]
          let k = 0
          for (let i = 0; i < updated.length; i++) {
            if (updated[i].isNew && updated[i].title.trim() && newDbIds[k]) {
              updated[i] = { ...updated[i], id: newDbIds[k], isNew: false }
              k++
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
        const res = await fetch(`/api/actors/${actorId}/filmography/${f.id}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
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
  const completionItems = useMemo(() => [
    { label: '프로필 사진', done: photos.length > 0 },
    { label: '출연 영상', done: videos.length > 0 || r2Videos.length > 0 },
    { label: '필모그래피', done: filmography.length > 0 },
    { label: '한줄소개', done: castingSummary.trim().length > 0 },
  ], [photos.length, videos.length, r2Videos.length, filmography.length, castingSummary])
  const completionCount = completionItems.filter(i => i.done).length
  const completionPct = Math.round((completionCount / completionItems.length) * 100)

  const isErr = (m: string, okWord: string) => m && !m.includes(okWord)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>

      {/* ── 완성도 (절제된 상단 바) ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--white)' }}>프로필 완성도</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: completionPct === 100 ? '#1D9E75' : 'var(--gray)' }}>{completionPct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: 'var(--bg3)', overflow: 'hidden', marginBottom: 12 }}>
          <div role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100} aria-label="프로필 완성도"
            style={{ height: '100%', width: `${completionPct}%`, borderRadius: 999, background: completionPct === 100 ? '#1D9E75' : 'var(--navy)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {completionItems.map(item => (
            <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 999, fontSize: 13, fontWeight: 500, background: item.done ? 'rgba(29,158,117,0.1)' : 'transparent', border: `1px solid ${item.done ? 'rgba(29,158,117,0.35)' : 'var(--border)'}`, color: item.done ? '#1D9E75' : 'var(--gray)' }}>
              <span aria-hidden="true">{item.done ? '✓' : '○'}</span>{item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 기본 정보 ── */}
      <p style={a.caption}>기본 정보</p>
      <section style={a.card} aria-labelledby="gallery-section-info">
        <h2 id="gallery-section-info" className="sr-only">기본 정보</h2>
        <div style={a.row}>
          <label htmlFor="actor-height" style={a.label}>신장</label>
          <input id="actor-height" type="text" inputMode="numeric" value={height} onChange={e => setHeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} style={a.inlineInput} placeholder="170" autoComplete="off" />
          <span style={a.unit}>cm</span>
        </div>
        <div style={{ ...a.row, ...a.sep }}>
          <label htmlFor="actor-weight" style={a.label}>체중 <span style={a.opt}>선택</span></label>
          <input id="actor-weight" type="text" inputMode="numeric" value={weight} onChange={e => setWeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} style={a.inlineInput} placeholder="60" autoComplete="off" />
          <span style={a.unit}>kg</span>
        </div>
        <div style={{ ...a.row, ...a.sep }}>
          <label htmlFor="actor-instagram" style={a.label}>인스타그램 <span style={a.opt}>선택</span></label>
          <input id="actor-instagram" value={instagram} onChange={e => setInstagram(e.target.value)} style={a.inlineInput} placeholder="@아이디" autoComplete="off" />
        </div>
        <div style={{ padding: '16px', ...a.sep }}>
          <label htmlFor="actor-skills" style={a.blockLabel}>특기</label>
          <p style={a.help}>콤마(,)로 구분해 입력하세요.</p>
          <input id="actor-skills" value={skills} onChange={e => setSkills(e.target.value)} style={a.boxInput} placeholder="수영, 검도, 피아노, 영어" />
        </div>
        <div style={{ padding: '16px', ...a.sep }}>
          <label style={a.blockLabel}>사투리</label>
          <p style={a.help}>네이티브 수준 가능 지역만 선택. 없으면 ‘없음’.</p>
          <div role="group" aria-label="사투리 가능 지역" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[...DIALECT_OPTIONS, DIALECT_NONE].map((d) => {
              const on = dialects.includes(d)
              const isNone = d === DIALECT_NONE
              return (
                <button key={d} type="button" aria-pressed={on}
                  onClick={() => setDialects((prev) => { if (isNone) return prev.includes(DIALECT_NONE) ? [] : [DIALECT_NONE]; const r = prev.filter((x) => x !== DIALECT_NONE); return r.includes(d) ? r.filter((x) => x !== d) : [...r, d] })}
                  style={{ padding: '9px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 500, background: on ? 'var(--navy)' : 'transparent', color: on ? '#fff' : 'var(--gray)', border: `1px solid ${on ? 'var(--navy)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                  {on ? '✓ ' : ''}{isNone ? '없음 (표준어)' : d}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ padding: '16px', ...a.sep }}>
          <label htmlFor="actor-casting-summary" style={a.blockLabel}>한줄소개</label>
          <p style={a.help}>캐스팅 디렉터에게 보이는 자기소개 (50자 내외).</p>
          <textarea id="actor-casting-summary" value={castingSummary} onChange={e => setCastingSummary(e.target.value)} maxLength={120} rows={2}
            placeholder='예: "장르를 넘나드는 탄탄한 기본기의 배우"' aria-describedby="actor-casting-summary-count"
            style={{ ...a.boxInput, resize: 'vertical', minHeight: 64, lineHeight: 1.6 }} />
          <span id="actor-casting-summary-count" aria-live="off" aria-atomic="true" style={{ display: 'block', fontSize: 12, color: 'var(--gray)', textAlign: 'right', marginTop: 4 }}>{castingSummary.length}/120</span>
        </div>
      </section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button type="button" onClick={saveInfo} disabled={infoSaving} aria-busy={infoSaving} style={{ ...a.primary, opacity: infoSaving ? 0.6 : 1 }}>{infoSaving ? '저장 중…' : '저장'}</button>
        <span role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(infoMsg, '저장') ? '#C0392B' : 'var(--navy)' }}>{infoMsg}</span>
      </div>

      {/* ── 프로필 파일 (PPTX) ── */}
      <p style={a.caption}>프로필 파일</p>
      <section style={a.card} aria-labelledby="gallery-section-ppt">
        <h2 id="gallery-section-ppt" className="sr-only">프로필 파일</h2>
        <input ref={pptRef} type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={uploadPpt} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => pptRef.current?.click()} disabled={pptUploading} aria-busy={pptUploading} style={a.rowBtn} aria-label={hasPpt ? '프로필 파일 교체' : '프로필 파일 올리기'}>
          <span style={a.tile} aria-hidden="true"><FileIcon /></span>
          <span style={a.rowBody}>
            <span style={a.label}>{hasPpt ? '프로필 파일 등록됨' : '프로필 파일'} <span style={a.opt}>PPT·PDF</span></span>
            <span style={a.sub}>{pptUploading ? '업로드 중…' : (hasPpt ? '새 파일을 올리면 교체됩니다 · 가로형 권장' : '최대 20MB · 가로형 슬라이드 권장')}</span>
          </span>
          <span style={{ fontSize: 14, color: 'var(--navy)', fontWeight: 500, marginRight: 2 }}>{hasPpt ? '교체' : '올리기'}</span>
          <span style={a.chev}><Chevron /></span>
        </button>
      </section>
      <p role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(pptMsg, '완료') ? '#C0392B' : 'var(--navy)', margin: '0 6px 28px' }}>{pptMsg}</p>

      {/* ── 프로필 사진 ── */}
      <p style={a.caption}>프로필 사진</p>
      <section style={a.cardPad} aria-labelledby="gallery-section-photos">
        <h2 id="gallery-section-photos" className="sr-only">프로필 사진</h2>
        {photos.length > 0 && (
          <div style={a.photoGrid}>
            {photos.map((p, idx) => (
              <div key={p.id} style={a.photoCard}>
                <Image src={p.url} alt={p.is_profile ? '대표 프로필 사진' : `배우 사진 ${idx + 1}`} fill style={{ objectFit: 'cover', objectPosition: 'center 30%' }} sizes="180px" />
                {p.is_profile && <span style={a.profileBadge}>대표</span>}
                <div style={a.photoActions}>
                  {confirmingPhotoId === p.id ? (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button type="button" autoFocus onClick={() => { setConfirmingPhotoId(null); deletePhotoRefs.current.get(p.id)?.focus() }} style={{ ...a.danger, background: '#fff', color: 'var(--white)', border: '1px solid #fff' }}>취소</button>
                      <button type="button" onClick={() => deletePhoto(p.id, p.is_profile)} style={{ ...a.danger, background: '#C0392B', color: '#fff', border: 'none' }}>확인</button>
                    </div>
                  ) : (
                    <>
                      {!p.is_profile && (
                        <button type="button" onClick={() => setProfile(p.id)} aria-label={`사진 ${idx + 1} 대표로 지정`} style={{ ...a.danger, background: 'rgba(255,255,255,0.92)', color: 'var(--navy)', border: 'none', fontWeight: 500 }}>대표 지정</button>
                      )}
                      <button ref={el => { deletePhotoRefs.current.set(p.id, el) }} type="button" onClick={() => deletePhoto(p.id, p.is_profile)} aria-label={p.is_profile ? '대표 프로필 사진 삭제' : `사진 ${idx + 1} 삭제`} style={{ ...a.danger, background: 'rgba(255,255,255,0.92)', border: 'none' }}>삭제</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: photos.length > 0 ? 16 : 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept="image/*,.heic,.heif" onChange={uploadPhoto} style={{ display: 'none' }} aria-hidden="true" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-busy={uploading} style={{ ...a.ghost, opacity: uploading ? 0.6 : 1 }}>{uploading ? '업로드 중…' : '＋ 사진 추가'}</button>
          <span style={{ fontSize: 13, color: 'var(--gray)' }}>JPG·PNG · 세로형 헤드샷 권장 · 큰 사진은 자동으로 줄여 올라가요</span>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(photoMsg, '완료') ? '#C0392B' : 'var(--navy)' }}>{photoMsg}</p>
      </section>
      <div style={{ height: 20 }} />

      {/* ── 현재사진(전신 각도) ── */}
      <p style={a.caption}>현재사진 <span style={a.opt}>선택</span></p>
      <section style={a.cardPad} aria-labelledby="gallery-section-current">
        <h2 id="gallery-section-current" className="sr-only">현재사진</h2>
        <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, margin: '0 0 12px' }}>
          정면 · 좌측 · 우측 · 후면 · 전신 각도의 현재 모습. 체형·전신을 보여줘 캐스팅 판단에 도움이 됩니다.
        </p>
        <input ref={cpFileRef} type="file" accept="image/*,.heic,.heif" onChange={uploadCurrentPhoto} style={{ display: 'none' }} aria-hidden="true" />
        <div style={a.photoGrid}>
          {CURRENT_PHOTO_LABELS.map((label) => {
            const photo = currentPhotos.find((p) => p.label === label)
            const busy = cpUploadingLabel === label
            return (
              <div key={label}>
                {photo ? (
                  <div style={a.photoCard}>
                    <Image src={photo.url} alt={`${label} 현재사진`} fill style={{ objectFit: 'cover', objectPosition: 'center 30%' }} sizes="180px" />
                    <span style={a.profileBadge}>{label}</span>
                    <div style={a.photoActions}>
                      <button type="button" onClick={() => pickCurrentPhoto(label)} disabled={!!cpUploadingLabel} aria-label={`${label} 사진 교체`} style={{ ...a.danger, background: 'rgba(255,255,255,0.92)', color: 'var(--navy)', border: 'none', fontWeight: 500 }}>교체</button>
                      <button type="button" onClick={() => deleteCurrentPhoto(photo.id)} aria-label={`${label} 사진 삭제`} style={{ ...a.danger, background: 'rgba(255,255,255,0.92)', border: 'none' }}>삭제</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => pickCurrentPhoto(label)} disabled={!!cpUploadingLabel} aria-label={`${label} 사진 올리기`}
                    style={{ ...a.photoCard, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', borderStyle: 'dashed', color: 'var(--navy)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600 }}>
                    <span style={{ fontSize: 26, lineHeight: 1 }}>＋</span>
                    {busy ? '업로드 중…' : label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(cpMsg, '완료') ? '#C0392B' : 'var(--navy)' }}>{cpMsg}</p>
      </section>
      <div style={{ height: 20 }} />

      {/* ── 영상 ── */}
      <p style={a.caption}>영상</p>
      <section style={a.cardPad} aria-labelledby="gallery-section-videos">
        <h2 id="gallery-section-videos" className="sr-only">영상</h2>

        {/* 직접 업로드 영상 (R2) */}
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--white)', marginBottom: 12 }}>직접 업로드 영상</p>
        {r2Videos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {r2Videos.map(v => (
              <div key={v.id} style={a.listRow}>
                <p style={{ flex: 1, fontSize: 15, color: 'var(--white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.title || v.r2_key.split('/').pop()}
                  <span style={{ fontSize: 13, color: 'var(--gray)', marginLeft: 6 }}>{v.video_type === 'monologue' ? '독백' : '출연영상'}</span>
                </p>
                {confirmingR2VideoId === v.id ? (
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button type="button" autoFocus onClick={() => { setConfirmingR2VideoId(null); deleteR2VideoRefs.current.get(v.id)?.focus() }} style={a.ghost}>취소</button>
                    <button type="button" onClick={() => deleteR2Video(v.id)} style={{ ...a.danger, background: '#C0392B', color: '#fff', border: 'none' }}>확인</button>
                  </div>
                ) : (
                  <button ref={el => { deleteR2VideoRefs.current.set(v.id, el) }} type="button" onClick={() => deleteR2Video(v.id)} aria-label={`${v.title || '영상'} 삭제`} style={{ ...a.danger, flexShrink: 0 }}>삭제</button>
                )}
              </div>
            ))}
          </div>
        )}
        <input ref={r2VideoRef} type="file" accept="video/*" onChange={uploadR2Video} style={{ display: 'none' }} aria-hidden="true" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => r2VideoRef.current?.click()} disabled={r2Uploading} aria-busy={r2Uploading} style={{ ...a.ghost, opacity: r2Uploading ? 0.6 : 1 }}>{r2Uploading ? r2UploadStatus || '업로드 중…' : '＋ 영상 파일 업로드'}</button>
          <span style={{ fontSize: 13, color: 'var(--gray)' }}>mp4 권장, 최대 300MB</span>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(r2VideoMsg, '완료') ? '#C0392B' : 'var(--navy)' }}>{r2VideoMsg}</p>

        {/* 유튜브 연결 영상 */}
        <div style={{ paddingTop: 18, marginTop: 6, borderTop: '1px solid #ECEAE0' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--white)', marginBottom: 12 }}>유튜브 영상 연결</p>
          {videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {videos.map(v => (
                <div key={v.id} style={a.listRow}>
                  <div style={{ width: 56, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={`https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`} alt={v.title || ''} fill sizes="56px" style={{ objectFit: 'cover' }} />
                  </div>
                  <p style={{ flex: 1, fontSize: 15, color: 'var(--white)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title || v.youtube_id}</p>
                  {confirmingVideoId === v.id ? (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button type="button" autoFocus onClick={() => { setConfirmingVideoId(null); deleteVideoRefs.current.get(v.id)?.focus() }} style={a.ghost}>취소</button>
                      <button type="button" onClick={() => deleteVideo(v.id)} style={{ ...a.danger, background: '#C0392B', color: '#fff', border: 'none' }}>확인</button>
                    </div>
                  ) : (
                    <button ref={el => { deleteVideoRefs.current.set(v.id, el) }} type="button" onClick={() => deleteVideo(v.id)} aria-label={`${v.title || v.youtube_id} 삭제`} style={{ ...a.danger, flexShrink: 0 }}>삭제</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label htmlFor="video-url" style={{ ...a.help, marginBottom: 6, display: 'block' }}>유튜브 URL 또는 ID</label>
              <input id="video-url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={a.boxInput} placeholder="https://youtu.be/..." />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label htmlFor="video-title" style={{ ...a.help, marginBottom: 6, display: 'block' }}>제목 (선택)</label>
              <input id="video-title" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} style={a.boxInput} placeholder="단편영화 주연" />
            </div>
            <button type="button" onClick={addVideo} disabled={videoAdding} aria-busy={videoAdding} style={{ ...a.primary, opacity: videoAdding ? 0.6 : 1 }}>{videoAdding ? '추가 중…' : '추가'}</button>
          </div>
          <p role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(videoMsg, '완료') ? '#C0392B' : 'var(--navy)' }}>{videoMsg}</p>
        </div>
      </section>
      <div style={{ height: 20 }} />

      {/* ── 필모그래피 ── */}
      <p style={a.caption}>필모그래피</p>
      <section style={a.cardPad} aria-labelledby="gallery-section-filmography">
        <h2 id="gallery-section-filmography" className="sr-only">필모그래피</h2>
        {filmography.length > 0 && (
          <div role="region" aria-label="필모그래피 목록" tabIndex={0} style={{ marginBottom: 16, overflowX: 'auto' }}>
            <div style={{ minWidth: 560 }}>
              <div style={{ ...a.filmRow, marginBottom: 4 }}>
                {['구분', '연도', '작품명', '배역', '방송사·제작사', ''].map(h => (
                  <span key={h} style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 500 }}>{h}</span>
                ))}
              </div>
              {filmography.map((f, i) => (
                <div key={f.id || i} style={a.filmRow}>
                  <select aria-label={`필모그래피 ${i + 1}번 구분`} value={f.category} onChange={e => updateFilm(i, 'category', e.target.value)} style={a.smallInput}>
                    <option value="drama">드라마</option>
                    <option value="film">영화</option>
                    <option value="cf">CF</option>
                    <option value="theater">연극</option>
                    <option value="musical">뮤지컬</option>
                    <option value="etc">기타</option>
                  </select>
                  <input aria-label={`필모그래피 ${i + 1}번 연도`} type="number" value={f.year} onChange={e => updateFilm(i, 'year', e.target.value)} style={a.smallInput} min={1990} max={2099} autoComplete="off" />
                  <input aria-label={`필모그래피 ${i + 1}번 작품명`} value={f.title} onChange={e => updateFilm(i, 'title', e.target.value)} style={a.smallInput} placeholder="작품명" />
                  <input aria-label={`필모그래피 ${i + 1}번 배역`} value={f.role} onChange={e => updateFilm(i, 'role', e.target.value)} style={a.smallInput} placeholder="배역" />
                  <input aria-label={`필모그래피 ${i + 1}번 방송사 또는 제작사`} value={f.broadcaster ?? ''} onChange={e => updateFilm(i, 'broadcaster', e.target.value)} style={a.smallInput} placeholder="확실한 것만" />
                  {confirmingFilmIdx === i ? (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button type="button" autoFocus onClick={() => { setConfirmingFilmIdx(null); deleteFilmRefs.current.get(i)?.focus() }} style={a.ghost}>취소</button>
                      <button type="button" onClick={() => deleteFilm(i)} style={{ ...a.danger, background: '#C0392B', color: '#fff', border: 'none' }}>확인</button>
                    </div>
                  ) : (
                    <button ref={el => { deleteFilmRefs.current.set(i, el) }} type="button" onClick={() => deleteFilm(i)} aria-label={`필모그래피 ${i + 1}번 삭제`} style={a.danger}>삭제</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setFilmography(prev => [newFilm(), ...prev])} style={a.ghost}>＋ 항목 추가</button>
          {filmography.length > 0 && (
            <button type="button" onClick={saveAllFilms} disabled={filmSaving} aria-busy={filmSaving} style={{ ...a.primary, opacity: filmSaving ? 0.6 : 1 }}>{filmSaving ? '저장 중…' : '저장'}</button>
          )}
          <span role="status" aria-live="polite" aria-atomic="true" style={{ ...a.msg, color: isErr(filmMsg, '저장') ? '#C0392B' : 'var(--navy)' }}>{filmMsg}</span>
        </div>
      </section>
    </div>
  )
}
