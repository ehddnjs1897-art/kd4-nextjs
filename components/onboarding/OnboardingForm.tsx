'use client'

/**
 * 배우 온보딩 업로드 폼 (가입 직후)
 *  - PPT(≤10MB) → Supabase Storage actor-docs (비공개)
 *  - 사진 3장(가로세로 혼합, 장당 ≤5MB) → Supabase Storage actor-photos (공개)
 *  - 영상(≤300MB) → R2 presigned PUT (브라우저 직접 업로드)
 * 업로드는 모두 브라우저가 직접 수행 → 마지막에 /api/profile/intake 로 경로만 기록.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MB = 1024 * 1024

export default function OnboardingForm({
  userName,
}: {
  userId: string
  userName: string
}) {
  const router = useRouter()
  const [ppt, setPpt] = useState<File | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [landscapeIdx, setLandscapeIdx] = useState<number>(-1) // 가로사진 index
  const [videos, setVideos] = useState<(File | null)[]>([null, null])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  // 이미지 파일의 가로/세로 비율 체크
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
      if (f.size > 5 * MB) {
        setError(`사진은 장당 5MB 이하여야 합니다: ${f.name}`)
        return
      }
    }
    // 가로사진 최소 1장 체크
    const checks = await Promise.all(arr.map(checkLandscape))
    const idx = checks.findIndex(Boolean)
    if (arr.length > 0 && idx === -1) {
      setError('사진 중 최소 1장은 가로(16:9, 4:3 등) 형식으로 올려주세요. 카카오톡 공유 썸네일로 사용됩니다.')
      return
    }
    setLandscapeIdx(idx)
    setError('')
    setPhotos(arr)
  }

  function pickPpt(f: File | null) {
    if (f && f.size > 10 * MB) {
      setError('프로필 파일은 .pptx 형식, 10MB 이하여야 합니다.')
      return
    }
    setError('')
    setPpt(f)
  }

  function pickVideo(idx: number, f: File | null) {
    if (f && f.size > 300 * MB) {
      setError('영상은 300MB 이하여야 합니다.')
      return
    }
    setError('')
    setVideos(prev => prev.map((v, i) => i === idx ? f : v))
  }

  async function uploadToBucket(bucket: string, file: File, contentType?: string): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
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
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'video/mp4',
        size: file.size,
      }),
    })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || '영상 업로드 URL 발급 실패')
    const put = await fetch(j.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'video/mp4' },
    })
    if (!put.ok) throw new Error('영상 업로드에 실패했습니다. (네트워크 또는 CORS 설정 확인)')
    return { key: j.key, size: file.size, filename: file.name }
  }

  async function submit() {
    setError('')
    const videoFiles = videos.filter(Boolean) as File[]
    if (!ppt && photos.length === 0 && videoFiles.length === 0) {
      setError('하나 이상 첨부해 주세요.')
      return
    }
    setLoading(true)
    try {
      let docPath: string | undefined
      if (ppt) {
        setStatus('프로필(PPT) 업로드 중...')
        const ext = ppt.name.split('.').pop()?.toLowerCase()
        const ct =
          ppt.type ||
          (ext === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
        docPath = await uploadToBucket('actor-docs', ppt, ct)
      }

      const photoPaths: { path: string }[] = []
      for (let i = 0; i < photos.length; i++) {
        setStatus(`사진 업로드 중... (${i + 1}/${photos.length})`)
        const p = await uploadToBucket('actor-photos', photos[i])
        photoPaths.push({ path: p })
      }

      const videoMetas: { key: string; size: number; filename: string }[] = []
      for (let i = 0; i < videoFiles.length; i++) {
        setStatus(`영상 업로드 중... (${i + 1}/${videoFiles.length}) 용량이 크면 시간이 걸려요`)
        videoMetas.push(await uploadVideo(videoFiles[i]))
      }

      setStatus('등록 마무리 중...')
      const ogPhotoPath = landscapeIdx >= 0 && photoPaths[landscapeIdx]
        ? photoPaths[landscapeIdx].path
        : undefined
      const res = await fetch('/api/profile/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docPath, photos: photoPaths, videos: videoMetas, ogPhotoPath }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || '등록에 실패했습니다.')

      router.push('/dashboard?intake=done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <p style={s.eyebrow}>PROFILE SETUP</p>
        <h1 style={s.title}>프로필 등록</h1>
        <p style={s.sub}>
          {userName ? `${userName}님, ` : ''}프로필 자료를 올려 주세요. 검토 후 배우 DB에 공개됩니다.
        </p>
      </div>

      {/* PPT */}
      <div style={s.field}>
        <label style={s.label}>프로필 PPTX <span style={s.hint}>(.pptx 형식만 가능, 10MB 이하)</span></label>
        <p style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 4 }}>
          파일 형식은 <strong>.pptx</strong>만 받습니다. PDF가 있으신 경우 PowerPoint에서 파일 → 저장 → .pptx로 변환 후 올려주세요.
        </p>
        <input
          type="file"
          accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          disabled={loading}
          onChange={(e) => pickPpt(e.target.files?.[0] ?? null)}
          style={s.input}
        />
        {ppt && <p style={s.picked}>✓ {ppt.name} ({(ppt.size / MB).toFixed(1)}MB)</p>}
      </div>

      {/* 사진 */}
      <div style={s.field}>
        <label style={s.label}>프로필 사진 <span style={s.hint}>(최대 3장, 가로세로 무관, 장당 5MB 이하)</span></label>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={loading}
          onChange={(e) => pickPhotos(e.target.files)}
          style={s.input}
        />
        {photos.length > 0 && (
          <p style={s.picked}>✓ {photos.length}장 선택됨: {photos.map((p) => p.name).join(', ')}</p>
        )}
      </div>

      {/* 영상 1, 2 */}
      {[0, 1].map((idx) => (
        <div key={idx} style={s.field}>
          <label style={s.label}>
            출연 영상 {idx + 1}{idx === 0 ? '' : ' (선택)'}
            <span style={s.hint}> (300MB 이하, mp4 권장)</span>
          </label>
          <input
            type="file"
            accept="video/*"
            disabled={loading}
            onChange={(e) => pickVideo(idx, e.target.files?.[0] ?? null)}
            style={s.input}
          />
          {videos[idx] && (
            <p style={s.picked}>✓ {videos[idx]!.name} ({(videos[idx]!.size / MB).toFixed(0)}MB)</p>
          )}
        </div>
      ))}

      {error && <p style={s.error}>{error}</p>}
      {loading && status && <p style={s.status}>⏳ {status}</p>}

      <button type="button" onClick={submit} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}>
        {loading ? '업로드 중...' : '프로필 제출하기'}
      </button>

      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        disabled={loading}
        style={s.skip}
      >
        나중에 하기
      </button>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 520, margin: '0 auto', padding: 'clamp(48px,9vw,80px) 24px', color: 'var(--white)' },
  head: { marginBottom: 32 },
  eyebrow: {
    fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.3em',
    color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12,
  },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 10 },
  sub: { fontSize: '0.9rem', color: 'var(--gray)', lineHeight: 1.7 },
  field: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  label: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)' },
  hint: { fontSize: '0.75rem', fontWeight: 400, color: 'var(--gray)' },
  input: {
    background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '10px 12px', color: 'var(--white)', fontSize: '0.85rem', fontFamily: 'inherit',
  },
  picked: { fontSize: '0.78rem', color: 'var(--gold)' },
  error: { color: 'var(--accent-red, #f87171)', fontSize: '0.85rem', marginBottom: 14 },
  status: { color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 14 },
  btn: {
    width: '100%', padding: 15, background: 'var(--gold)', color: '#fff', fontWeight: 800,
    fontSize: '1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
    letterSpacing: '0.04em',
  },
  skip: {
    width: '100%', padding: 12, marginTop: 10, background: 'transparent', color: 'var(--gray)',
    fontSize: '0.85rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
}
