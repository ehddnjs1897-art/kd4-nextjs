'use client'

/**
 * 배우 온보딩 업로드 폼
 *  - PPT(≤20MB) → Supabase Storage actor-docs
 *  - 사진 (장당 ≤15MB) → Supabase Storage actor-photos
 *  - 영상(≤300MB) → R2 presigned PUT (브라우저 직접 업로드)
 * 업로드 완료 후 /api/profile/intake 로 경로만 기록.
 *
 * 2026-06 직관 UI 개편 (Apple iOS 설정/Contacts 그룹 리스트 참고):
 *  - 흰 카드 그룹 + 얇은 구분선 + 작은 네이비 아이콘 + 값 오른쪽 정렬 + 작은 ›
 *  - 자료(사진·영상·파일) → 기본 정보 → 특기·소개 순서
 *  ⚠️ 상태·업로드·제출 로직(submit/uploadToBucket/uploadVideo)은 보존, 렌더만 교체
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DIALECT_OPTIONS, DIALECT_NONE } from '@/lib/dialects'
import { prepareImageForUpload } from '@/lib/prepare-image'

const MB = 1024 * 1024

const CURRENT_PHOTO_LABELS = ['정면', '좌측', '우측', '후면', '전신'] as const

// ─── Apple식 라인 아이콘 (네이비 타일 안에 흰 선) ──────────────────────────────
const iconProps = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const PhotoIcon = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="9" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
const VideoIcon = () => <svg {...iconProps}><rect x="2.5" y="5.5" width="13" height="13" rx="2.5" /><path d="M15.5 10l6-3.2v10.4l-6-3.2z" /></svg>
const MicIcon = () => <svg {...iconProps}><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5v3.2" /></svg>
const FileIcon = () => <svg {...iconProps}><path d="M14 2.5H7A2 2 0 005 4.5v15a2 2 0 002 2h10a2 2 0 002-2V7.5z" /><path d="M14 2.5v5h5" /></svg>
const Chevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>

export default function OnboardingForm({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  const router = useRouter()
  const [ppt, setPpt] = useState<File | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [videos, setVideos] = useState<(File | null)[]>([null, null, null])
  const [castingSummary, setCastingSummary] = useState('')
  const [skills, setSkills] = useState('')             // 콤마 구분 (예: "수영, 검도, 피아노")
  const [dialects, setDialects] = useState<string[]>([])   // 사투리 가능 지역 (멀티선택)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [height, setHeight] = useState('')      // 키(cm) — 숫자만
  const [weight, setWeight] = useState('')      // 몸무게(kg) — 숫자만 (선택)
  const [instagram, setInstagram] = useState('')
  const [birthYear, setBirthYear] = useState('')  // 출생연도(4자리) → 나이 자동
  const [skillInput, setSkillInput] = useState('') // 특기 칩 입력 필드 (skills 콤마 문자열은 유지)
  const DRAFT_KEY = `kd4-onboarding-draft-${userId}`  // 자동 임시저장(텍스트 항목만)
  const [draftRestored, setDraftRestored] = useState(false)
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])  // 사진 업로드 전 미리보기

  // 업로드 중 탭 닫기/새로고침 방지
  useEffect(() => {
    if (!loading) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '업로드가 진행 중입니다. 페이지를 떠나면 업로드가 취소됩니다.'
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [loading])
  const [currentPhotos, setCurrentPhotos] = useState<(File | null)[]>([null, null, null, null, null])

  const pptRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<HTMLInputElement>(null)
  const v0Ref = useRef<HTMLInputElement>(null)
  const v1Ref = useRef<HTMLInputElement>(null)
  const v2Ref = useRef<HTMLInputElement>(null)
  const videoRefs = [v0Ref, v1Ref, v2Ref]
  const cp0Ref = useRef<HTMLInputElement>(null)
  const cp1Ref = useRef<HTMLInputElement>(null)
  const cp2Ref = useRef<HTMLInputElement>(null)
  const cp3Ref = useRef<HTMLInputElement>(null)
  const cp4Ref = useRef<HTMLInputElement>(null)
  const currentPhotoRefs = [cp0Ref, cp1Ref, cp2Ref, cp3Ref, cp4Ref]
  const errorRef = useRef<HTMLDivElement>(null)

  // 에러 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  // 자동 임시저장 — 마운트 시 복원 (텍스트 항목만, 파일은 보안상 저장 불가)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (typeof d.height === 'string') setHeight(d.height)
        if (typeof d.weight === 'string') setWeight(d.weight)
        if (typeof d.instagram === 'string') setInstagram(d.instagram)
        if (typeof d.birthYear === 'string') setBirthYear(d.birthYear)
        if (typeof d.skills === 'string') setSkills(d.skills)
        if (typeof d.castingSummary === 'string') setCastingSummary(d.castingSummary)
        if (Array.isArray(d.dialects)) setDialects(d.dialects.filter((x: unknown): x is string => typeof x === 'string'))
      }
    } catch { /* 손상된 draft 무시 */ }
    setDraftRestored(true)
  }, [DRAFT_KEY])
  /* eslint-enable react-hooks/set-state-in-effect */

  // 자동 임시저장 — 텍스트 항목 변경 시 저장 (복원 끝난 뒤에만)
  useEffect(() => {
    if (!draftRestored) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ height, weight, instagram, birthYear, skills, castingSummary, dialects }))
    } catch { /* 용량 초과 등 무시 */ }
  }, [draftRestored, DRAFT_KEY, height, weight, instagram, birthYear, skills, castingSummary, dialects])

  // 사진 미리보기 — 선택한 사진 썸네일(업로드 전 결과 확인). objectURL 누수 방지 revoke
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPhotoPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photos])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function pickPhotos(list: FileList | null) {
    if (!list) return
    setError('')
    try {
      const arr = Array.from(list).slice(0, 6)
      for (const f of arr) {
        if (f.size > 30 * MB) { setError(`사진은 30MB 이하여야 합니다: ${f.name}`); return }
      }
      // 아이폰 HEIC → JPEG 변환 + 대용량 압축 (2026-07-01 대표 지시)
      setWarning('사진을 처리하는 중이에요…')
      const prepared: File[] = []
      for (const f of arr) prepared.push(await prepareImageForUpload(f))
      setWarning('')
      setPhotos(prepared)
    } catch (e) {
      setWarning('')
      setError((e as Error).message || '사진 처리에 실패했습니다.')
    }
  }

  async function pickCurrentPhoto(idx: number, f: File | null) {
    if (f && f.size > 30 * MB) { setError(`현재사진은 30MB 이하여야 합니다.`); return }
    setError('')
    try {
      const prepared = f ? await prepareImageForUpload(f) : null
      setCurrentPhotos(prev => prev.map((p, i) => i === idx ? prepared : p))
    } catch (e) {
      setError((e as Error).message || '사진 처리에 실패했습니다.')
    }
  }

  function pickPpt(f: File | null) {
    if (f && f.size > 20 * MB) { setError('프로필 파일은 20MB 이하여야 합니다.'); return }
    if (f && !f.name.toLowerCase().match(/\.(pptx|pdf)$/)) { setError('.pptx 또는 .pdf 파일만 올릴 수 있어요.'); return }
    setError('')
    setPpt(f)
  }

  function pickVideo(idx: number, f: File | null) {
    if (f && f.size > 300 * MB) { setError('영상은 300MB 이하여야 합니다.'); return }
    setError('')
    setVideos(prev => prev.map((v, i) => i === idx ? f : v))
  }

  async function uploadToBucket(bucket: string, file: File, contentType?: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const ct = contentType || file.type || undefined
    // httpOnly 세션 쿠키는 브라우저 JS가 못 읽으므로(lib/supabase/server.ts) 클라이언트 직접 업로드는
    // anon 취급되어 RLS에 막힌다. → 서버에서 서명된 업로드 URL을 발급받아 업로드(영상 R2 presigned와 동일 방식).
    // 경로는 서버가 세션 user.id 기준 intake/{user.id}/ 로 결정 — intake API 검증과 일치.
    const signRes = await fetch('/api/storage/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket, ext, contentType: ct, size: file.size }),
      signal: AbortSignal.timeout(15_000),
    })
    const signJson = await signRes.json().catch(() => ({}))
    if (!signRes.ok) throw new Error(signJson.error || `${bucket} 업로드 URL 발급 실패`)
    const supabase = createClient()
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signJson.path, signJson.token, file, { contentType: ct })
    if (upErr) throw new Error(`${bucket} 업로드 실패: ${upErr.message}`)
    return signJson.path as string
  }

  async function uploadVideo(file: File): Promise<{ key: string; size: number; filename: string }> {
    const res = await fetch('/api/r2/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type || 'video/mp4', size: file.size }),
      signal: AbortSignal.timeout(10_000),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || '영상 업로드 URL 발급 실패')
    const put = await fetch(j.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'video/mp4' } })
    if (!put.ok) throw new Error('영상 업로드 실패')
    return { key: j.key, size: file.size, filename: file.name }
  }

  async function submit() {
    setError('')
    const videoFiles = videos.filter(Boolean) as File[]
    if (!ppt && photos.length === 0 && videoFiles.length === 0 && !castingSummary.trim() && !skills.trim()) {
      setError('한줄소개 또는 파일을 하나 이상 입력해 주세요.')
      return
    }
    // 프로필 사진은 최소 3장 (대표 지시 2026-06) — 올릴 거면 3장 이상
    if (photos.length > 0 && photos.length < 3) {
      setError('프로필 사진은 최소 3장 올려주세요.')
      photosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setLoading(true)
    // 🔒 2026-06-15: 파일 업로드를 항목별로 격리. 파일 하나(예: PPT)가 실패해도
    //    전체 제출(actor row 생성)을 막지 않고, 성공한 파일 + 텍스트 정보로 등록 진행.
    //    (박이아 케이스: PPT가 버킷 제한으로 실패 → throw → 전체 등록 무산되던 결함 교정)
    const uploadWarnings: string[] = []
    try {
      let docPath: string | undefined
      if (ppt) {
        setStatus('프로필(PPT) 업로드 중...')
        try {
          const ext = ppt.name.split('.').pop()?.toLowerCase()
          const ct = ppt.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
          docPath = await uploadToBucket('actor-docs', ppt, ct)
        } catch { uploadWarnings.push(`프로필 문서(${ppt.name})`) }
      }

      const photoPaths: { path: string }[] = []
      for (let i = 0; i < photos.length; i++) {
        setStatus(`사진 업로드 중... (${i + 1}/${photos.length})`)
        try { photoPaths.push({ path: await uploadToBucket('actor-photos', photos[i]) }) }
        catch { uploadWarnings.push(`사진(${photos[i].name})`) }
      }

      const currentPhotoPaths: { path: string; label: string }[] = []
      const cpFiles = CURRENT_PHOTO_LABELS.map((label, i) => ({ file: currentPhotos[i], label })).filter(x => x.file)
      for (let i = 0; i < cpFiles.length; i++) {
        setStatus(`현재사진 업로드 중... (${i + 1}/${cpFiles.length})`)
        try { currentPhotoPaths.push({ path: await uploadToBucket('actor-photos', cpFiles[i].file!), label: cpFiles[i].label }) }
        catch { uploadWarnings.push(`현재사진(${cpFiles[i].label})`) }
      }

      // 원본 슬롯 인덱스로 video_type 결정 — 3번째 슬롯(slot 2)이 '독백'(monologue).
      // ⚠️ filter(Boolean)된 videoFiles의 인덱스로 판정하면(이전 버그) 슬롯1을 비우고 0·2만
      //    올릴 때 독백이 reel로 잘못 기록됨(나민정 케이스). 원본 videos 배열로 순회한다.
      const videoMetas: { key: string; size: number; filename: string; video_type: string }[] = []
      let vDone = 0
      for (let slot = 0; slot < videos.length; slot++) {
        const file = videos[slot]
        if (!file) continue
        vDone++
        setStatus(`영상 업로드 중... (${vDone}/${videoFiles.length}) 용량이 크면 시간이 걸려요`)
        try {
          const meta = await uploadVideo(file)
          videoMetas.push({ ...meta, video_type: slot === 2 ? 'monologue' : 'reel' })
        } catch { uploadWarnings.push(`영상(${file.name})`) }
      }

      setStatus('등록 마무리 중...')
      // 대표사진 = 맨 앞 프로필 사진(헤드샷). 카카오 OG 썸네일은 /api/og/actor가 따로 합성 (2026-06 대표 지시)
      const ogPhotoPath = photoPaths[0]?.path
      // 콤마 구분 → 배열 + 트림 + 빈값 제거
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 30)

      // 업로드가 전부 실패하고 텍스트 정보도 없으면 — 등록할 내용이 없음
      const hasPayload = !!docPath || photoPaths.length > 0 || currentPhotoPaths.length > 0
        || videoMetas.length > 0 || !!castingSummary.trim() || skillsArr.length > 0
      if (!hasPayload) {
        throw new Error('파일 업로드에 모두 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }

      const res = await fetch('/api/profile/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docPath, photos: photoPaths, currentPhotos: currentPhotoPaths, videos: videoMetas, ogPhotoPath,
          castingSummary: castingSummary.trim() || undefined,
          skills: skillsArr.length > 0 ? skillsArr : undefined,
          dialects: dialects.length > 0 ? dialects : undefined,
          height: height || undefined,
          weight: weight || undefined,
          instagram: instagram.trim() || undefined,
          birthYear: birthYear || undefined,
        }),
        signal: AbortSignal.timeout(15_000),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || '등록에 실패했습니다.')
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }  // 제출 완료 → 임시저장 삭제
      setLoading(false)
      // 일부 파일만 실패 — 등록은 완료, 실패 파일은 마이페이지에서 다시 올리도록 안내
      if (uploadWarnings.length > 0) {
        router.push(`/dashboard?intake=done&partial=${encodeURIComponent(uploadWarnings.length)}`)
      } else {
        router.push('/dashboard?intake=done')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setLoading(false)
      setStatus('')
    }
  }

  // 완성도 — 채운 항목 수 기반
  const completionChecks = [
    !!height, !!castingSummary.trim(), !!skills.trim(), dialects.length > 0,
    !!ppt, photos.length > 0, videos.some(Boolean),
  ]
  const pct = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100)
  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean)

  // 파일 올리기 행 (네이비 아이콘 타일 + 라벨 + 상태값 + ›)
  function fileRow(opts: { icon: React.ReactNode; label: React.ReactNode; sub: string; filled: boolean; onClick: () => void; ariaLabel: string; first?: boolean }) {
    return (
      <button type="button" onClick={opts.onClick} disabled={loading} aria-label={opts.ariaLabel}
        style={{ ...a.rowBtn, ...(opts.first ? {} : a.sep) }}>
        <span style={a.tile} aria-hidden="true">{opts.icon}</span>
        <span style={a.rowBody}>
          <span style={a.label}>{opts.label}</span>
          <span style={a.sub}>{opts.sub}</span>
        </span>
        <span style={{ ...a.valueMuted, marginRight: 2 }}>{opts.filled ? '변경' : ''}</span>
        <span style={a.chev}><Chevron /></span>
      </button>
    )
  }

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* 완성도 — 절제된 상단 바 */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--white)' }}>
            {userName ? `${userName}님, 하나만 올려도 등록돼요` : '하나만 올려도 등록돼요'}
          </span>
          <span style={{ fontSize: 14, color: 'var(--gray)' }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: 'var(--bg3)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--navy)', borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* ━━━ 자료 (사진·영상·파일) ━━━ */}
      <p style={a.caption}>자료</p>
      <div style={a.card}>
        {/* 프로필 사진 */}
        <input ref={photosRef} type="file" accept="image/*,.heic,.heif" multiple disabled={loading} onChange={e => pickPhotos(e.target.files)} style={{ display: 'none' }} aria-hidden="true" />
        {fileRow({
          icon: <PhotoIcon />, label: <>프로필 사진 <span style={a.req}>최소 3장</span></>,
          sub: photos.length > 0 ? `${photos.length}장 선택됨 · 맨 앞이 대표사진` : '세로형 헤드샷 (3~6장)',
          filled: photos.length > 0, onClick: () => photosRef.current?.click(), ariaLabel: '프로필 사진 올리기', first: true,
        })}
        {photos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 14px 16px' }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {photoPreviews[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreviews[i]} alt={`선택한 사진 ${i + 1} 미리보기`}
                    style={{ width: 70, height: 92, objectFit: 'cover', borderRadius: 8, display: 'block', border: i === 0 ? '2px solid var(--navy)' : '1px solid var(--border)' }} />
                )}
                {i === 0 && (
                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: 11, textAlign: 'center', background: 'var(--navy)', color: '#fff', padding: '2px 0', borderRadius: '0 0 7px 7px', fontWeight: 500 }}>대표</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 출연영상 1·2 + 독백 */}
        {[0, 1, 2].map(idx => {
          const v = videos[idx]
          return (
            <span key={idx}>
              <input ref={videoRefs[idx]} type="file" accept="video/*" disabled={loading} onChange={e => pickVideo(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
              {fileRow({
                icon: idx === 2 ? <MicIcon /> : <VideoIcon />,
                label: <>{idx === 2 ? '독백 영상' : `출연영상 ${idx + 1}`} {idx > 0 && <span style={a.opt}>선택</span>}</>,
                sub: v ? `${v.name} (${(v.size / MB).toFixed(0)}MB)` : (idx === 2 ? '혼자 연기하는 독백' : 'mp4 · 최대 300MB'),
                filled: !!v, onClick: () => videoRefs[idx].current?.click(), ariaLabel: `${idx === 2 ? '독백 영상' : `출연영상 ${idx + 1}`} 올리기`,
              })}
            </span>
          )
        })}

        {/* 프로필 파일 */}
        <input ref={pptRef} type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={loading} onChange={e => pickPpt(e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
        {fileRow({
          icon: <FileIcon />, label: <>프로필 파일 <span style={a.opt}>선택</span></>,
          sub: ppt ? `${ppt.name} (${(ppt.size / MB).toFixed(1)}MB)` : 'PPT·PDF · 최대 20MB',
          filled: !!ppt, onClick: () => pptRef.current?.click(), ariaLabel: '프로필 파일 올리기',
        })}
      </div>

      {/* 현재사진(전신 각도) — 가입 때부터 항상 노출 (2026-07-01 대표 지시: 프로필사진 옆에 현재사진란도) */}
      <p style={a.caption}>현재사진 <span style={a.opt}>선택</span></p>
      <div style={{ ...a.card, padding: '14px 16px' }}>
        <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
          정면·좌측·우측·후면·전신 각도의 현재 모습. 체형·전신을 보여줘 캐스팅 판단에 도움이 됩니다. 각 15MB 이하.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CURRENT_PHOTO_LABELS.map((label, idx) => (
            <div key={label}>
              <input ref={currentPhotoRefs[idx]} type="file" accept="image/*,.heic,.heif" disabled={loading} onChange={e => pickCurrentPhoto(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
              <button type="button" onClick={() => currentPhotoRefs[idx].current?.click()} disabled={loading} style={{ ...a.miniBtn, ...(currentPhotos[idx] ? { borderColor: 'var(--navy)', color: 'var(--navy)' } : {}) }}>
                {currentPhotos[idx] ? `✓ ${label}` : `${label} 선택`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━ 기본 정보 ━━━ */}
      <p style={a.caption}>기본 정보</p>
      <div style={a.card}>
        <div style={a.row}>
          <label htmlFor="onb-birth" style={a.label}>생년</label>
          <input id="onb-birth" name="birth_year" type="text" inputMode="numeric" value={birthYear}
            onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            disabled={loading} placeholder="1995" aria-label="출생연도 (4자리)" style={a.inlineInput} autoComplete="off" />
          {birthYear.length === 4 && Number(birthYear) >= 1930 && Number(birthYear) <= 2020 && (
            <span style={{ fontSize: 13, color: 'var(--navy)', marginLeft: 8 }}>만 {new Date().getFullYear() - Number(birthYear)}세</span>
          )}
        </div>
        <div style={{ ...a.row, ...a.sep }}>
          <label htmlFor="onb-height" style={a.label}>키</label>
          <input id="onb-height" name="height" type="text" inputMode="numeric" value={height}
            onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            disabled={loading} placeholder="172" aria-label="키 (센티미터)" style={a.inlineInput} autoComplete="off" />
          <span style={a.unit}>cm</span>
        </div>
        <div style={{ ...a.row, ...a.sep }}>
          <label htmlFor="onb-weight" style={a.label}>몸무게 <span style={a.opt}>선택</span></label>
          <input id="onb-weight" name="weight" type="text" inputMode="numeric" value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            disabled={loading} placeholder="58" aria-label="몸무게 (킬로그램)" style={a.inlineInput} autoComplete="off" />
          <span style={a.unit}>kg</span>
        </div>
        <div style={{ ...a.row, ...a.sep }}>
          <label htmlFor="onb-instagram" style={a.label}>인스타그램 <span style={a.opt}>선택</span></label>
          <input id="onb-instagram" name="instagram" type="text" value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            disabled={loading} placeholder="@아이디" aria-label="인스타그램 주소" style={a.inlineInput} autoComplete="off" />
        </div>
      </div>

      {/* ━━━ 특기 · 사투리 · 소개 ━━━ */}
      <p style={a.caption}>특기 · 소개</p>
      <div style={a.card}>
        {/* 특기 */}
        <div style={{ padding: '16px' }}>
          <label htmlFor="onb-skills-input" style={a.blockLabel}>특기</label>
          <p style={a.help}>입력 후 <strong>Enter</strong>를 누르면 추가돼요 (수영·검도·피아노 등).</p>
          <input id="onb-skills-input" name="skills" type="text" value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                const v = skillInput.trim().replace(/,+$/, '').trim()
                const cur = skills.split(',').map(s => s.trim()).filter(Boolean)
                if (v && !cur.includes(v) && cur.length < 30) setSkills([...cur, v].join(', '))
                setSkillInput('')
              }
            }}
            disabled={loading} placeholder="예: 수영 (입력 후 Enter)" aria-label="특기 입력 (Enter로 추가)" style={a.boxInput} autoComplete="off" />
          {skillList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {skillList.map((sk) => (
                <span key={sk} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 6px 6px 13px', borderRadius: 999, background: 'var(--bg3)', color: 'var(--white)', border: '1px solid var(--border)', fontSize: 14 }}>
                  {sk}
                  <button type="button" disabled={loading} aria-label={`${sk} 삭제`}
                    onClick={() => { const cur = skills.split(',').map(s => s.trim()).filter(Boolean).filter(x => x !== sk); setSkills(cur.join(', ')) }}
                    style={{ background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', padding: '0 2px', fontSize: 15, lineHeight: 1, color: 'inherit', opacity: 0.7 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        {/* 사투리 */}
        <div style={{ padding: '16px', ...a.sep }}>
          <label style={a.blockLabel}>사투리 (가능 지역)</label>
          <p style={a.help}>네이티브 수준으로 가능한 지역을 누르세요. 없으면 ‘없음’.</p>
          <div role="group" aria-label="사투리 가능 지역" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[...DIALECT_OPTIONS, DIALECT_NONE].map((d) => {
              const on = dialects.includes(d)
              const isNone = d === DIALECT_NONE
              return (
                <button key={d} type="button" disabled={loading} aria-pressed={on}
                  onClick={() => setDialects((prev) => { if (isNone) return prev.includes(DIALECT_NONE) ? [] : [DIALECT_NONE]; const r = prev.filter((x) => x !== DIALECT_NONE); return r.includes(d) ? r.filter((x) => x !== d) : [...r, d] })}
                  style={{ padding: '9px 16px', borderRadius: 999, cursor: loading ? 'default' : 'pointer', fontSize: 14, fontWeight: 500, background: on ? 'var(--navy)' : 'transparent', color: on ? '#fff' : 'var(--gray)', border: `1px solid ${on ? 'var(--navy)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                  {on ? '✓ ' : ''}{isNone ? '없음 (표준어)' : d}
                </button>
              )
            })}
          </div>
        </div>
        {/* 한줄소개 */}
        <div style={{ padding: '16px', ...a.sep }}>
          <label htmlFor="casting-summary" style={a.blockLabel}>한줄소개</label>
          <p style={a.help}>캐스팅 디렉터에게 보이는 짧은 소개.</p>
          <textarea id="casting-summary" name="casting_summary" value={castingSummary}
            onChange={(e) => setCastingSummary(e.target.value)} maxLength={120} rows={2} disabled={loading}
            placeholder='예: "장르를 넘나드는 탄탄한 기본기의 배우"' aria-label="캐스팅 한 줄 소개" aria-describedby="onb-casting-count"
            style={{ ...a.boxInput, resize: 'vertical', minHeight: 64, lineHeight: 1.6 }} />
          <p id="onb-casting-count" aria-live="off" aria-atomic="true" style={{ fontSize: 12, color: 'var(--gray)', textAlign: 'right', marginTop: 4 }}>{castingSummary.length}/120</p>
        </div>
      </div>

      {/* 상태/에러/로딩 — 항상 DOM에 존재 (스크린 리더 즉시 알림 WCAG 4.1.3) */}
      <p role="status" aria-live="polite" aria-atomic="true" style={warning ? warnStyle : {}}>{warning}</p>
      <div ref={errorRef} tabIndex={-1} role="alert" aria-atomic="true" style={{ outline: 'none', ...(error ? errStyle : {}) }}>{error}</div>
      {loading && status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--navy-tint-1)', border: '1px solid var(--navy-tint-3)', borderRadius: 12, marginBottom: 16 }}>
          <span style={{ fontSize: '1.1rem' }} aria-hidden="true">⏳</span>
          <p role="status" aria-live="polite" style={{ fontSize: 15, color: 'var(--navy)' }}>{status}</p>
        </div>
      )}

      {/* 제출 */}
      <button type="button" onClick={submit} disabled={loading} aria-busy={loading}
        style={{ ...a.primary, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? '업로드 중...' : '제출하기'}
      </button>
      <button type="button" onClick={() => router.push('/dashboard')} disabled={loading}
        style={{ width: '100%', padding: 14, marginTop: 10, background: 'transparent', color: 'var(--gray)', fontSize: 15, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
        나중에 하기
      </button>
    </div>
  )
}

// ─── Apple식 스타일 ───────────────────────────────────────────────────────────
const a: Record<string, React.CSSProperties> = {
  caption: { fontSize: 13, color: 'var(--gray)', margin: '0 6px 8px', fontWeight: 500 },
  card: { background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 22 },
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
  valueMuted: { fontSize: 14, color: '#B8B4AC' },
  req: { fontSize: 12, fontWeight: 500, color: '#C0392B', marginLeft: 4 },
  opt: { fontSize: 12, fontWeight: 400, color: 'var(--gray)', marginLeft: 4 },
  blockLabel: { display: 'block', fontSize: 16, color: 'var(--white)', fontWeight: 500, marginBottom: 8 },
  help: { fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 },
  boxInput: { display: 'block', width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 14px', color: 'var(--white)', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' },
  moreToggle: { display: 'block', width: '100%', marginBottom: 22, padding: '13px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--gray)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  miniBtn: { display: 'block', width: '100%', padding: '11px 8px', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 14, cursor: 'pointer' },
  primary: { width: '100%', padding: '17px 0', background: 'var(--navy)', color: '#fff', fontWeight: 600, fontSize: 17, borderRadius: 14, border: 'none', fontFamily: 'var(--font-display)' },
}

const errStyle: React.CSSProperties = {
  color: '#C0392B', fontSize: 15, marginBottom: 14, padding: '13px 16px',
  background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 12,
}

const warnStyle: React.CSSProperties = {
  color: '#9A6A00', fontSize: 15, marginBottom: 14, padding: '13px 16px',
  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12,
}
