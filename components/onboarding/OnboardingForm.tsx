'use client'

/**
 * 배우 온보딩 업로드 폼
 *  - PPT(≤10MB) → Supabase Storage actor-docs
 *  - 사진 (장당 ≤5MB) → Supabase Storage actor-photos
 *  - 영상(≤300MB) → R2 presigned PUT (브라우저 직접 업로드)
 * 업로드 완료 후 /api/profile/intake 로 경로만 기록.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MB = 1024 * 1024

const CURRENT_PHOTO_LABELS = ['앞면', '좌측면', '우측면', '뒷면'] as const

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
  const [landscapeIdx, setLandscapeIdx] = useState<number>(-1)
  const [videos, setVideos] = useState<(File | null)[]>([null, null, null])
  const [castingSummary, setCastingSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

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
  const [currentPhotos, setCurrentPhotos] = useState<(File | null)[]>([null, null, null, null])

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
  const currentPhotoRefs = [cp0Ref, cp1Ref, cp2Ref, cp3Ref]

  function checkLandscape(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalWidth > img.naturalHeight) }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false) }
      img.src = url
    })
  }

  async function pickPhotos(list: FileList | null) {
    if (!list) return
    const arr = Array.from(list).slice(0, 3)
    for (const f of arr) {
      if (f.size > 5 * MB) { setError(`사진은 5MB 이하여야 합니다: ${f.name}`); return }
    }
    const checks = await Promise.all(arr.map(checkLandscape))
    const idx = checks.findIndex(Boolean)
    // 가로 사진 없어도 업로드 허용 (경고만, 차단 안 함) — 핸드폰 세로사진 배려
    if (arr.length > 0 && idx === -1) {
      setWarning('가로(16:9) 사진이 없어 첫 번째 사진이 썸네일로 사용됩니다. 가로 사진을 포함하면 더 좋아요!')
    } else {
      setWarning('')
    }
    setError('')
    setLandscapeIdx(idx >= 0 ? idx : 0)
    setPhotos(arr)
  }

  function pickCurrentPhoto(idx: number, f: File | null) {
    if (f && f.size > 5 * MB) { setError(`현재사진은 5MB 이하여야 합니다.`); return }
    setError('')
    setCurrentPhotos(prev => prev.map((p, i) => i === idx ? f : p))
  }

  function pickPpt(f: File | null) {
    if (f && f.size > 10 * MB) { setError('프로필 파일은 10MB 이하여야 합니다.'); return }
    setError('')
    setPpt(f)
  }

  function pickVideo(idx: number, f: File | null) {
    if (f && f.size > 300 * MB) { setError('영상은 300MB 이하여야 합니다.'); return }
    setError('')
    setVideos(prev => prev.map((v, i) => i === idx ? f : v))
  }

  async function uploadToBucket(bucket: string, file: File, contentType?: string): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    // intake API は intake/${userId}/... 패턴만 허용 — 네임스페이스 일치 필수
    const path = `intake/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: contentType || file.type || undefined,
      upsert: false,
    })
    if (upErr) throw new Error(`${bucket} 업로드 실패: ${upErr.message}`)
    return path
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
    if (!ppt && photos.length === 0 && videoFiles.length === 0 && !castingSummary.trim()) {
      setError('한줄소개 또는 파일을 하나 이상 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      let docPath: string | undefined
      if (ppt) {
        setStatus('프로필(PPT) 업로드 중...')
        const ext = ppt.name.split('.').pop()?.toLowerCase()
        const ct = ppt.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
        docPath = await uploadToBucket('actor-docs', ppt, ct)
      }

      const photoPaths: { path: string }[] = []
      for (let i = 0; i < photos.length; i++) {
        setStatus(`사진 업로드 중... (${i + 1}/${photos.length})`)
        photoPaths.push({ path: await uploadToBucket('actor-photos', photos[i]) })
      }

      const currentPhotoPaths: { path: string; label: string }[] = []
      const cpFiles = CURRENT_PHOTO_LABELS.map((label, i) => ({ file: currentPhotos[i], label })).filter(x => x.file)
      for (let i = 0; i < cpFiles.length; i++) {
        setStatus(`현재사진 업로드 중... (${i + 1}/${cpFiles.length})`)
        currentPhotoPaths.push({ path: await uploadToBucket('actor-photos', cpFiles[i].file!), label: cpFiles[i].label })
      }

      const videoMetas: { key: string; size: number; filename: string; video_type: string }[] = []
      for (let i = 0; i < videoFiles.length; i++) {
        setStatus(`영상 업로드 중... (${i + 1}/${videoFiles.length}) 용량이 크면 시간이 걸려요`)
        const meta = await uploadVideo(videoFiles[i])
        videoMetas.push({ ...meta, video_type: i === 2 ? 'monologue' : 'reel' })
      }

      setStatus('등록 마무리 중...')
      const ogPhotoPath = landscapeIdx >= 0 && photoPaths[landscapeIdx] ? photoPaths[landscapeIdx].path : undefined
      const res = await fetch('/api/profile/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docPath, photos: photoPaths, currentPhotos: currentPhotoPaths, videos: videoMetas, ogPhotoPath, castingSummary: castingSummary.trim() || undefined }),
        signal: AbortSignal.timeout(15_000),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || '등록에 실패했습니다.')
      setLoading(false)
      router.push('/dashboard?intake=done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setLoading(false)
      setStatus('')
    }
  }

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680 }}>

      {/* 한줄소개 */}
      <section style={sec} aria-labelledby="onb-casting-summary">
        <h3 id="onb-casting-summary" style={secTitle}>한줄소개</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
          캐스팅 디렉터에게 보이는 짧은 자기소개입니다.
          <em style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>"장르를 넘나드는 탄탄한 기본기의 배우"</em>
        </p>
        <textarea
          id="casting-summary"
          name="casting_summary"
          value={castingSummary}
          onChange={(e) => setCastingSummary(e.target.value)}
          maxLength={120}
          rows={2}
          disabled={loading}
          placeholder="한 줄로 나를 소개해주세요."
          aria-label="캐스팅 한 줄 소개"
          style={{ ...inp, resize: 'vertical', minHeight: 64, lineHeight: 1.6 }}
        />
        <p style={{ fontSize: '0.72rem', color: 'var(--gray)', textAlign: 'right', marginTop: 4 }}>{castingSummary.length}/120</p>
      </section>

      {/* PPTX */}
      <section style={sec} aria-labelledby="onb-pptx">
        <h3 id="onb-pptx" style={secTitle}>프로필 PPTX</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          <strong>.pptx 형식</strong>만 가능, 10MB 이하. PDF는 PowerPoint에서 .pptx로 변환 후 올려주세요.
        </p>
        <input ref={pptRef} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={loading} onChange={e => pickPpt(e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => pptRef.current?.click()} disabled={loading} style={fileBtn}>
          {ppt ? `📄 ${ppt.name} (${(ppt.size / MB).toFixed(1)}MB) — 변경` : '📄 파일 선택'}
        </button>
        {ppt && <p style={picked}>✓ {ppt.name} 선택됨</p>}
      </section>

      {/* 사진 */}
      <section style={sec} aria-labelledby="onb-photos">
        <h3 id="onb-photos" style={secTitle}>프로필 사진</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          최대 3장, 가로·세로 무관, 장당 5MB 이하.
          카카오톡 공유용 <strong>가로(16:9·4:3)</strong> 사진을 1장 이상 포함해 주세요.
        </p>
        <input ref={photosRef} type="file" accept="image/*" multiple disabled={loading} onChange={e => pickPhotos(e.target.files)} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => photosRef.current?.click()} disabled={loading} style={fileBtn}>
          {photos.length > 0 ? `🖼 ${photos.length}장 선택됨 — 변경` : '🖼 사진 선택'}
        </button>
        {photos.length > 0 && (
          <p style={picked}>✓ {photos.map(p => p.name).join(', ')}</p>
        )}

        {/* 현재사진 */}
        <div style={{ marginTop: 20, padding: '16px 18px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>
            현재사진 <span style={{ fontSize: '0.74rem', fontWeight: 400, color: 'var(--gray)' }}>(선택)</span>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
            앞·좌·우·뒤 각도로 촬영한 현재 모습 사진. 각 5MB 이하.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CURRENT_PHOTO_LABELS.map((label, idx) => (
              <div key={label}>
                <input ref={currentPhotoRefs[idx]} type="file" accept="image/*" disabled={loading} onChange={e => pickCurrentPhoto(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
                <button type="button" onClick={() => currentPhotoRefs[idx].current?.click()} disabled={loading} style={{ ...fileBtn, fontSize: '0.78rem', padding: '8px 14px' }}>
                  {currentPhotos[idx] ? `✓ ${label}` : `${label} 선택`}
                </button>
                {currentPhotos[idx] && (
                  <p style={{ ...picked, marginTop: 4 }}>{currentPhotos[idx]!.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 영상 */}
      <section style={sec} aria-labelledby="onb-videos">
        <h3 id="onb-videos" style={secTitle}>출연영상</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          mp4 권장, 최대 300MB. 용량이 크면 업로드에 시간이 걸릴 수 있습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(idx => (
            <div key={idx}>
              <input ref={videoRefs[idx]} type="file" accept="video/*" disabled={loading} onChange={e => pickVideo(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
              <button type="button" onClick={() => videoRefs[idx].current?.click()} disabled={loading} style={{ ...fileBtn, width: '100%', justifyContent: 'flex-start' }}>
                {videos[idx]
                  ? `🎬 ${idx === 2 ? '전략적 독백' : `출연영상 ${idx + 1}`}: ${videos[idx]!.name} (${(videos[idx]!.size / MB).toFixed(0)}MB) — 변경`
                  : `🎬 ${idx === 2 ? '전략적 독백 (선택)' : `출연영상 ${idx + 1}${idx > 0 ? ' (선택)' : ''}`} 선택`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 항상 DOM에 존재 — 스크린 리더 즉시 알림 보장 (WCAG 4.1.3) */}
      <p role="status" aria-live="polite" aria-atomic="true" style={warning ? warnStyle : {}}>{warning}</p>
      <p role="alert" aria-live="assertive" aria-atomic="true" style={error ? errStyle : {}}>{error}</p>
      {loading && status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(196,165,90,0.08)', border: '1px solid rgba(196,165,90,0.2)', borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '1rem' }}>⏳</span>
          <p role="status" aria-live="polite" style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>{status}</p>
        </div>
      )}

      <button type="button" onClick={submit} disabled={loading} aria-busy={loading} style={{
        width: '100%', padding: '14px 0', background: 'var(--navy)', color: '#fff',
        fontWeight: 700, fontSize: '0.95rem', borderRadius: 8, border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
        opacity: loading ? 0.6 : 1,
      }}>
        {loading ? '업로드 중...' : '제출하기'}
      </button>

      <button type="button" onClick={() => router.push('/dashboard')} disabled={loading} style={{
        width: '100%', padding: 12, marginTop: 10, background: 'transparent',
        color: 'var(--gray)', fontSize: '0.84rem', borderRadius: 8, border: 'none', cursor: 'pointer',
      }}>
        나중에 하기
      </button>
    </div>
  )
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const sec: React.CSSProperties = {
  marginBottom: 24,
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '24px 22px',
}

const secTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.7rem',
  fontWeight: 400,
  letterSpacing: '0.25em',
  color: 'var(--gold)',
  textTransform: 'uppercase',
  marginBottom: 12,
}

const inp: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'var(--white)',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const fileBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  background: 'var(--bg3)',
  border: '1px dashed var(--border)',
  borderRadius: 8,
  color: 'var(--white)',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
}

const picked: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--gold)',
  marginTop: 6,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const errStyle: React.CSSProperties = {
  color: '#b91c1c',
  fontSize: '0.85rem',
  marginBottom: 14,
  padding: '10px 14px',
  background: 'rgba(185,28,28,0.08)',
  border: '1px solid rgba(185,28,28,0.2)',
  borderRadius: 8,
}

const warnStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: '0.85rem',
  marginBottom: 14,
  padding: '10px 14px',
  background: 'rgba(251,191,36,0.08)',
  border: '1px solid rgba(251,191,36,0.2)',
  borderRadius: 8,
}
