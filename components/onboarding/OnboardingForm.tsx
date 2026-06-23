'use client'

/**
 * 배우 온보딩 업로드 폼
 *  - PPT(≤10MB) → Supabase Storage actor-docs
 *  - 사진 (장당 ≤15MB) → Supabase Storage actor-photos
 *  - 영상(≤300MB) → R2 presigned PUT (브라우저 직접 업로드)
 * 업로드 완료 후 /api/profile/intake 로 경로만 기록.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DIALECT_OPTIONS } from '@/lib/dialects'

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
  const [skills, setSkills] = useState('')             // 콤마 구분 (예: "수영, 검도, 피아노")
  const [advancedSkills, setAdvancedSkills] = useState('') // 콤마 구분 — skills의 부분집합 (⭐ 표시)
  const [dialects, setDialects] = useState<string[]>([])   // 사투리 가능 지역 (멀티선택)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [height, setHeight] = useState('')      // 키(cm) — 숫자만
  const [weight, setWeight] = useState('')      // 몸무게(kg) — 숫자만 (선택)
  const [instagram, setInstagram] = useState('')
  const [step, setStep] = useState(0)  // REPLAY 참고 — 3단계 STEP (0:기본 1:사진·문서 2:영상)
  const STEP_LABELS = ['기본 정보', '사진·문서', '영상'] as const
  const DRAFT_KEY = `kd4-onboarding-draft-${userId}`  // REPLAY 참고 — 자동 임시저장(텍스트 항목만)
  const [draftRestored, setDraftRestored] = useState(false)

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
        if (typeof d.skills === 'string') setSkills(d.skills)
        if (typeof d.advancedSkills === 'string') setAdvancedSkills(d.advancedSkills)
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ height, weight, instagram, skills, advancedSkills, castingSummary, dialects }))
    } catch { /* 용량 초과 등 무시 */ }
  }, [draftRestored, DRAFT_KEY, height, weight, instagram, skills, advancedSkills, castingSummary, dialects])

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
    const arr = Array.from(list).slice(0, 4)
    for (const f of arr) {
      if (f.size > 15 * MB) { setError(`사진은 15MB 이하여야 합니다: ${f.name}`); return }
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
    if (f && f.size > 15 * MB) { setError(`현재사진은 15MB 이하여야 합니다.`); return }
    setError('')
    setCurrentPhotos(prev => prev.map((p, i) => i === idx ? f : p))
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

      const videoMetas: { key: string; size: number; filename: string; video_type: string }[] = []
      for (let i = 0; i < videoFiles.length; i++) {
        setStatus(`영상 업로드 중... (${i + 1}/${videoFiles.length}) 용량이 크면 시간이 걸려요`)
        try {
          const meta = await uploadVideo(videoFiles[i])
          videoMetas.push({ ...meta, video_type: i === 2 ? 'monologue' : 'reel' })
        } catch { uploadWarnings.push(`영상(${videoFiles[i].name})`) }
      }

      setStatus('등록 마무리 중...')
      // OG(카카오 썸네일)용 가로사진 — 전부 성공했을 때만 landscapeIdx 매핑 신뢰(일부 실패 시 인덱스 어긋남 → 첫 사진 폴백)
      const ogPhotoPath = (landscapeIdx >= 0 && photoPaths.length === photos.length && photoPaths[landscapeIdx])
        ? photoPaths[landscapeIdx].path
        : photoPaths[0]?.path
      // 콤마 구분 → 배열 + 트림 + 빈값 제거
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 30)
      const advArr = advancedSkills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 30)

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
          advancedSkills: advArr.length > 0 ? advArr : undefined,
          dialects: dialects.length > 0 ? dialects : undefined,
          height: height || undefined,
          weight: weight || undefined,
          instagram: instagram.trim() || undefined,
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

  // 완성도 — 채운 항목 수 기반 (REPLAY 진행률 참고)
  const completionChecks = [
    !!height, !!castingSummary.trim(), !!skills.trim(), dialects.length > 0,
    !!ppt, photos.length > 0, videos.some(Boolean),
  ]
  const pct = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100)

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680 }}>

      {/* 준비 안내 — 부담 낮추기 + 필수 최소 안내 */}
      <div style={{ marginBottom: 24, padding: '16px 18px', background: 'rgba(196,165,90,0.08)', border: '1px solid rgba(196,165,90,0.25)', borderRadius: 10 }}>
        <p style={{ fontSize: '0.86rem', color: 'var(--white)', lineHeight: 1.7, fontWeight: 700, marginBottom: 6 }}>
          📋 한 번에 다 채우지 않으셔도 돼요.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--gold)' }}>사진·영상·프로필 문서 중 하나만</strong> 올려도 등록됩니다. 나머지는 제출 후 <strong>마이페이지</strong>에서 천천히 채우셔도 돼요. 정보가 많을수록 캐스팅 노출에 유리합니다.
        </p>
      </div>

      {/* STEP 인디케이터 + 완성도 (REPLAY 참고) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 6, borderRadius: 999, background: i <= step ? 'var(--gold)' : 'var(--border)', transition: 'background 0.2s' }} />
              <span style={{ display: 'block', marginTop: 6, fontSize: '0.72rem', fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--white)' : 'var(--gray)' }}>
                {i + 1}. {label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--gray)' }}>
          <span>{draftRestored ? '✓ 자동 임시저장 중' : ''}</span>
          <span>완성도 {pct}%</span>
        </div>
      </div>

      {step === 0 && (<>
      {/* 기본 정보 — 키·몸무게·인스타 (캐스팅 검색·필터 핵심) */}
      <section style={sec} aria-labelledby="onb-basic">
        <h2 id="onb-basic" style={secTitle}>기본 정보<span style={optTag}>선택</span></h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          캐스팅 디렉터가 키·체형으로 배우를 찾을 때 쓰여요. 아는 만큼만 적어주세요.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label htmlFor="onb-height" style={fieldLabel}>키 (cm)</label>
            <input
              id="onb-height" name="height" type="text" inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              disabled={loading} placeholder="예: 172" aria-label="키 (센티미터)" style={inp} autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="onb-weight" style={fieldLabel}>몸무게 (kg)<span style={{ fontWeight: 400, color: 'var(--gray)', marginLeft: 6 }}>· 선택</span></label>
            <input
              id="onb-weight" name="weight" type="text" inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              disabled={loading} placeholder="예: 58" aria-label="몸무게 (킬로그램)" style={inp} autoComplete="off"
            />
          </div>
        </div>
        <label htmlFor="onb-instagram" style={fieldLabel}>인스타그램<span style={{ fontWeight: 400, color: 'var(--gray)', marginLeft: 6 }}>· 선택</span></label>
        <input
          id="onb-instagram" name="instagram" type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          disabled={loading} placeholder="@아이디 또는 instagram.com/아이디" aria-label="인스타그램 주소" style={inp} autoComplete="off"
        />
      </section>

      {/* 특기 + 고급 숙련도 */}
      <section style={sec} aria-labelledby="onb-skills">
        <h2 id="onb-skills" style={secTitle}>특기</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
          캐스팅에 도움 되는 기술·스킬을 콤마로 구분해 입력하세요. (수영, 검도, 피아노, 사투리, 영어 등)
        </p>
        <input
          id="onb-skills-input"
          name="skills"
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          disabled={loading}
          placeholder="수영, 검도, 피아노, 영어, 사투리(경상도)"
          aria-label="특기"
          style={inp}
          autoComplete="off"
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginTop: 18, marginBottom: 8 }}>
          <span aria-hidden="true">⭐</span> <strong style={{ color: 'var(--navy)' }}>고급 숙련도</strong> — 전문가급/네이티브 수준만. 위에 입력한 특기 중 콤마로 구분해 다시 적어주세요.
        </p>
        <input
          id="onb-advanced-skills-input"
          name="advanced_skills"
          type="text"
          value={advancedSkills}
          onChange={(e) => setAdvancedSkills(e.target.value)}
          disabled={loading}
          placeholder="검도, 영어"
          aria-label="고급 숙련도 (전문가급 스킬만)"
          style={inp}
          autoComplete="off"
        />
      </section>

      {/* 사투리 (가능 지역) */}
      <section style={sec} aria-labelledby="onb-dialects">
        <h2 id="onb-dialects" style={secTitle}>사투리 (가능 지역)</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
          네이티브 수준으로 구사 가능한 사투리 지역을 선택하세요. (해당 없으면 비워두세요)
        </p>
        <div role="group" aria-label="사투리 가능 지역" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DIALECT_OPTIONS.map((d) => {
            const on = dialects.includes(d)
            return (
              <button
                key={d}
                type="button"
                disabled={loading}
                aria-pressed={on}
                onClick={() => setDialects((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])}
                style={{
                  padding: '8px 16px', borderRadius: 999, cursor: loading ? 'default' : 'pointer',
                  fontSize: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
                  background: on ? 'var(--navy)' : 'transparent',
                  color: on ? '#fff' : 'var(--gray)',
                  border: `1px solid ${on ? 'var(--navy)' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}
              >
                {on ? '✓ ' : ''}{d}
              </button>
            )
          })}
        </div>
      </section>

      {/* 한줄소개 */}
      <section style={sec} aria-labelledby="onb-casting-summary">
        <h2 id="onb-casting-summary" style={secTitle}>한줄소개</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
          캐스팅 디렉터에게 보이는 짧은 자기소개입니다.
          <em style={{ color: 'var(--gray)', marginLeft: 6 }}>"장르를 넘나드는 탄탄한 기본기의 배우"</em>
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
          aria-describedby="onb-casting-count"
          style={{ ...inp, resize: 'vertical', minHeight: 64, lineHeight: 1.6 }}
        />
        <p id="onb-casting-count" aria-live="off" aria-atomic="true" style={{ fontSize: '0.72rem', color: 'var(--gray)', textAlign: 'right', marginTop: 4 }}>{castingSummary.length}/120</p>
      </section>
      </>)}

      {step === 1 && (<>
      {/* PPTX */}
      <section style={sec} aria-labelledby="onb-pptx">
        <h2 id="onb-pptx" style={secTitle}>프로필 문서</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          <strong>.pptx 또는 .pdf</strong> 형식, 최대 20MB.
          PPTX는 가로형 슬라이드로 올려주세요 (세로형은 사진이 잘릴 수 있어요).
        </p>
        <input ref={pptRef} type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={loading} onChange={e => pickPpt(e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => pptRef.current?.click()} disabled={loading} style={fileBtn}>
          {ppt ? <><span aria-hidden="true">📄</span>{` ${ppt.name} (${(ppt.size / MB).toFixed(1)}MB) — 변경`}</> : <><span aria-hidden="true">📄</span>{' 파일 선택'}</>}
        </button>
        {ppt && <p style={picked}><span aria-hidden="true">✓</span> {ppt.name} 선택됨</p>}
      </section>

      {/* 사진 */}
      <section style={sec} aria-labelledby="onb-photos">
        <h2 id="onb-photos" style={secTitle}>프로필 사진</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          <strong>세로형 헤드샷 3~4장</strong>이 가장 보기 좋아요 (장당 15MB 이하).
          여기에 <strong>가로 사진 1장</strong>을 함께 올리면 카카오톡으로 공유할 때 썸네일로 쓰입니다.
        </p>
        <input ref={photosRef} type="file" accept="image/*" multiple disabled={loading} onChange={e => pickPhotos(e.target.files)} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => photosRef.current?.click()} disabled={loading} style={fileBtn}>
          {photos.length > 0 ? <><span aria-hidden="true">🖼</span>{` ${photos.length}장 선택됨 — 변경`}</> : <><span aria-hidden="true">🖼</span>{' 사진 선택'}</>}
        </button>
        {photos.length > 0 && (
          <p style={picked}><span aria-hidden="true">✓</span> {photos.map(p => p.name).join(', ')}</p>
        )}

        {/* 현재사진 */}
        <div style={{ marginTop: 20, padding: '16px 18px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>
            현재사진 <span style={{ fontSize: '0.74rem', fontWeight: 400, color: 'var(--gray)' }}>(선택)</span>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
            앞·좌·우·뒤 각도의 현재 모습 사진. <strong>체형·전신</strong>을 보여줘 캐스팅 판단에 도움이 됩니다. 각 15MB 이하.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CURRENT_PHOTO_LABELS.map((label, idx) => (
              <div key={label}>
                <input ref={currentPhotoRefs[idx]} type="file" accept="image/*" disabled={loading} onChange={e => pickCurrentPhoto(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
                <button type="button" onClick={() => currentPhotoRefs[idx].current?.click()} disabled={loading} style={{ ...fileBtn, fontSize: '0.78rem', padding: '8px 14px' }}>
                  {currentPhotos[idx] ? <><span aria-hidden="true">✓ </span>{label}</> : `${label} 선택`}
                </button>
                {currentPhotos[idx] && (
                  <p style={{ ...picked, marginTop: 4 }}>{currentPhotos[idx]!.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      </>)}

      {step === 2 && (<>
      {/* 영상 */}
      <section style={sec} aria-labelledby="onb-videos">
        <h2 id="onb-videos" style={secTitle}>출연영상</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 14 }}>
          mp4 권장, 최대 300MB. 출연영상 2개 + <strong>독백 영상</strong> 1개(혼자 연기하는 독백 — 감정·발성을 보여주는 용도)까지 올릴 수 있어요. 용량이 크면 업로드에 시간이 걸릴 수 있습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(idx => (
            <div key={idx}>
              <input ref={videoRefs[idx]} type="file" accept="video/*" disabled={loading} onChange={e => pickVideo(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
              <button type="button" onClick={() => videoRefs[idx].current?.click()} disabled={loading} style={{ ...fileBtn, width: '100%', justifyContent: 'flex-start' }}>
                {videos[idx]
                  ? <><span aria-hidden="true">🎬</span>{` ${idx === 2 ? '전략적 독백' : `출연영상 ${idx + 1}`}: ${videos[idx]!.name} (${(videos[idx]!.size / MB).toFixed(0)}MB) — 변경`}</>
                  : <><span aria-hidden="true">🎬</span>{` ${idx === 2 ? '전략적 독백 (선택)' : `출연영상 ${idx + 1}${idx > 0 ? ' (선택)' : ''}`} 선택`}</>}
              </button>
            </div>
          ))}
        </div>
      </section>
      </>)}

      {/* 항상 DOM에 존재 — 스크린 리더 즉시 알림 보장 (WCAG 4.1.3) */}
      <p role="status" aria-live="polite" aria-atomic="true" style={warning ? warnStyle : {}}>{warning}</p>
      <div
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        aria-atomic="true"
        style={{ outline: 'none', ...(error ? errStyle : {}) }}
      >{error}</div>
      {loading && status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(196,165,90,0.08)', border: '1px solid rgba(196,165,90,0.2)', borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '1rem' }} aria-hidden="true">⏳</span>
          <p role="status" aria-live="polite" style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>{status}</p>
        </div>
      )}

      {/* STEP 네비게이션 (REPLAY 참고) — 이전/다음, 마지막 단계만 제출 */}
      <div style={{ display: 'flex', gap: 10 }}>
        {step > 0 && (
          <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={loading} style={navSecondary}>
            ← 이전
          </button>
        )}
        {step < 2 ? (
          <button type="button" onClick={() => setStep(s => Math.min(2, s + 1))} disabled={loading} style={navPrimary}>
            다음 →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={loading} aria-busy={loading}
            style={{ ...navPrimary, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? '업로드 중...' : '제출하기'}
          </button>
        )}
      </div>

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

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--white)',
  marginBottom: 6,
}

const optTag: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 400,
  color: 'var(--gray)',
  letterSpacing: 0,
  marginLeft: 8,
  verticalAlign: 'middle',
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

const navPrimary: React.CSSProperties = {
  flex: 1, padding: '14px 0', background: 'var(--navy)', color: '#fff',
  fontWeight: 700, fontSize: '0.95rem', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
}

const navSecondary: React.CSSProperties = {
  flex: 1, padding: '14px 0', background: 'transparent', color: 'var(--white)',
  fontWeight: 600, fontSize: '0.92rem', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
  fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
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
