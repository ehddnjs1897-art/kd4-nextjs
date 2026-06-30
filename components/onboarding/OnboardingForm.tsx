'use client'

/**
 * 배우 온보딩 업로드 폼
 *  - PPT(≤20MB) → Supabase Storage actor-docs
 *  - 사진 (장당 ≤15MB) → Supabase Storage actor-photos
 *  - 영상(≤300MB) → R2 presigned PUT (브라우저 직접 업로드)
 * 업로드 완료 후 /api/profile/intake 로 경로만 기록.
 *
 * 2026-06 시니어 친화 전면개편 (REPLAY repl.co.kr 참고):
 *  - 단계 위저드(다음/이전) 제거 → 한 페이지 행 리스트(스크롤 한 번)
 *  - 자료(사진·영상·파일)를 맨 위로 — 제일 쉽고 중요한 것 먼저
 *  - 큰 아이콘 + 큰 글자 + 큰 행 버튼(누르는 영역 넓게)
 *  ⚠️ 상태·업로드·제출 로직(submit/uploadToBucket/uploadVideo)은 보존, 렌더만 교체
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DIALECT_OPTIONS, DIALECT_NONE } from '@/lib/dialects'

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
  const [birthYear, setBirthYear] = useState('')  // 출생연도(4자리) → 나이 자동
  const [skillInput, setSkillInput] = useState('') // 특기 칩 입력 필드 (skills 콤마 문자열은 유지)
  const DRAFT_KEY = `kd4-onboarding-draft-${userId}`  // 자동 임시저장(텍스트 항목만)
  const [draftRestored, setDraftRestored] = useState(false)
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])  // 사진 업로드 전 미리보기
  const [showCurrentPhotos, setShowCurrentPhotos] = useState(false) // 현재사진(전신 각도) 펼치기 — 기본 접어둠

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
        if (typeof d.birthYear === 'string') setBirthYear(d.birthYear)
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ height, weight, instagram, birthYear, skills, advancedSkills, castingSummary, dialects }))
    } catch { /* 용량 초과 등 무시 */ }
  }, [draftRestored, DRAFT_KEY, height, weight, instagram, birthYear, skills, advancedSkills, castingSummary, dialects])

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
    const arr = Array.from(list).slice(0, 6)
    for (const f of arr) {
      if (f.size > 15 * MB) { setError(`사진은 15MB 이하여야 합니다: ${f.name}`); return }
    }
    setError('')
    setWarning('')
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

  // 완성도 — 채운 항목 수 기반 (REPLAY 진행률 참고)
  const completionChecks = [
    !!height, !!castingSummary.trim(), !!skills.trim(), dialects.length > 0,
    !!ppt, photos.length > 0, videos.some(Boolean),
  ]
  const pct = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100)
  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean)
  const advList = advancedSkills.split(',').map(s => s.trim()).filter(Boolean)

  // ─── 렌더 ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>

      {/* 안내 — 부담 낮추기 (제일 쉬운 것 하나만 해도 OK) */}
      <div style={{ marginBottom: 20, padding: '18px 20px', background: 'rgba(196,165,90,0.08)', border: '1px solid rgba(196,165,90,0.25)', borderRadius: 12 }}>
        <p style={{ fontSize: '1rem', color: 'var(--white)', lineHeight: 1.7, fontWeight: 700, marginBottom: 8 }}>
          {userName ? `${userName}님, ` : ''}한 번에 다 안 채우셔도 돼요 👍
        </p>
        <p style={{ fontSize: '0.92rem', color: 'var(--gray)', lineHeight: 1.75 }}>
          <strong style={{ color: 'var(--gold)' }}>사진·영상·프로필 파일 중 하나만</strong> 올려도 등록됩니다.
          나머지는 나중에 <strong style={{ color: 'var(--white)' }}>마이페이지</strong>에서 천천히 채우셔도 돼요.
        </p>
      </div>

      {/* 완성도 바 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--white)' }}>내 프로필 완성도</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--gold)' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)', borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
        {draftRestored && (
          <p style={{ fontSize: '0.74rem', color: 'var(--gray)', marginTop: 6 }}>✓ 작성 내용은 자동으로 임시저장돼요</p>
        )}
      </div>

      {/* ━━━ ① 자료 올리기 (사진·영상·파일) — 제일 먼저, 제일 중요 ━━━ */}
      <section style={sec} aria-labelledby="onb-files">
        <div style={stepHead}>
          <span style={stepNum}>1</span>
          <div>
            <h2 id="onb-files" style={stepTitle}>사진 · 영상 · 파일 올리기</h2>
            <p style={stepSub}>제일 쉬운 것부터 — 하나만 올려도 등록돼요</p>
          </div>
        </div>

        {/* 프로필 사진 (행 버튼) */}
        <input ref={photosRef} type="file" accept="image/*" multiple disabled={loading} onChange={e => pickPhotos(e.target.files)} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => photosRef.current?.click()} disabled={loading} style={rowBtn(photos.length > 0)} aria-label="프로필 사진 올리기">
          <span style={rowIcon} aria-hidden="true">🖼</span>
          <span style={rowBody}>
            <span style={rowLabel}>프로필 사진 <span style={reqTag}>최소 3장</span></span>
            <span style={rowSub}>{photos.length > 0 ? `${photos.length}장 선택됨` : '세로형 헤드샷 · 맨 앞이 대표사진'}</span>
          </span>
          <span style={rowAction(photos.length > 0)}>{photos.length > 0 ? '변경' : '올리기 ›'}</span>
        </button>
        {photos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 2px 0' }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                {photoPreviews[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreviews[i]}
                    alt={`선택한 사진 ${i + 1} 미리보기`}
                    style={{ width: 76, height: 100, objectFit: 'cover', borderRadius: 8, display: 'block', border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--border)' }}
                  />
                )}
                {i === 0 && (
                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: '0.62rem', textAlign: 'center', background: 'var(--gold)', color: '#fff', padding: '2px 0', borderRadius: '0 0 7px 7px', fontWeight: 700 }}>대표</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 출연영상 (행 버튼 3개) */}
        <div style={rowGroupGap}>
          {[0, 1, 2].map(idx => (
            <span key={idx}>
              <input ref={videoRefs[idx]} type="file" accept="video/*" disabled={loading} onChange={e => pickVideo(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
              <button type="button" onClick={() => videoRefs[idx].current?.click()} disabled={loading} style={rowBtn(!!videos[idx])} aria-label={`${idx === 2 ? '독백 영상' : `출연영상 ${idx + 1}`} 올리기`}>
                <span style={rowIcon} aria-hidden="true">{idx === 2 ? '🎙' : '🎬'}</span>
                <span style={rowBody}>
                  <span style={rowLabel}>{idx === 2 ? '독백 영상' : `출연영상 ${idx + 1}`} {idx > 0 && <span style={optInline}>선택</span>}</span>
                  <span style={rowSub}>
                    {videos[idx]
                      ? `${videos[idx]!.name} (${(videos[idx]!.size / MB).toFixed(0)}MB)`
                      : idx === 2 ? '혼자 연기하는 독백 (감정·발성)' : 'mp4 권장 · 최대 300MB'}
                  </span>
                </span>
                <span style={rowAction(!!videos[idx])}>{videos[idx] ? '변경' : '올리기 ›'}</span>
              </button>
            </span>
          ))}
        </div>

        {/* 프로필 파일 (PPT/PDF) */}
        <input ref={pptRef} type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={loading} onChange={e => pickPpt(e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
        <button type="button" onClick={() => pptRef.current?.click()} disabled={loading} style={{ ...rowBtn(!!ppt), marginTop: 10 }} aria-label="프로필 파일 올리기">
          <span style={rowIcon} aria-hidden="true">📄</span>
          <span style={rowBody}>
            <span style={rowLabel}>프로필 파일 <span style={optInline}>선택</span></span>
            <span style={rowSub}>{ppt ? `${ppt.name} (${(ppt.size / MB).toFixed(1)}MB)` : 'PPT·PDF · 최대 20MB (가로형 권장)'}</span>
          </span>
          <span style={rowAction(!!ppt)}>{ppt ? '변경' : '올리기 ›'}</span>
        </button>

        {/* 현재사진 (전신 각도) — 접어둠 */}
        <button type="button" onClick={() => setShowCurrentPhotos(v => !v)} disabled={loading} style={moreToggle}>
          {showCurrentPhotos ? '▾ 현재사진(전신 각도) 닫기' : '＋ 현재사진(전신 각도) 추가하기 · 선택'}
        </button>
        {showCurrentPhotos && (
          <div style={{ marginTop: 10, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
              앞·좌·우·뒤 각도의 현재 모습. <strong style={{ color: 'var(--white)' }}>체형·전신</strong>을 보여줘 캐스팅 판단에 도움이 됩니다. 각 15MB 이하.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CURRENT_PHOTO_LABELS.map((label, idx) => (
                <div key={label}>
                  <input ref={currentPhotoRefs[idx]} type="file" accept="image/*" disabled={loading} onChange={e => pickCurrentPhoto(idx, e.target.files?.[0] ?? null)} style={{ display: 'none' }} aria-hidden="true" />
                  <button type="button" onClick={() => currentPhotoRefs[idx].current?.click()} disabled={loading} style={{ ...miniBtn, ...(currentPhotos[idx] ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}) }}>
                    {currentPhotos[idx] ? `✓ ${label}` : `${label} 선택`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ━━━ ② 기본 정보 (생년·키·체형) ━━━ */}
      <section style={sec} aria-labelledby="onb-basic">
        <div style={stepHead}>
          <span style={stepNum}>2</span>
          <div>
            <h2 id="onb-basic" style={stepTitle}>기본 정보</h2>
            <p style={stepSub}>캐스팅이 나이·키·체형으로 배우를 찾을 때 쓰여요</p>
          </div>
        </div>

        <div style={fieldRow}>
          <label htmlFor="onb-birth" style={bigLabel}>출생연도</label>
          <input
            id="onb-birth" name="birth_year" type="text" inputMode="numeric"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            disabled={loading} placeholder="예: 1995" aria-label="출생연도 (4자리)" style={inpBig} autoComplete="off"
          />
          {birthYear.length === 4 && Number(birthYear) >= 1930 && Number(birthYear) <= 2020 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--gold)', marginTop: 6 }}>만 {new Date().getFullYear() - Number(birthYear)}세 — 나이는 자동 계산돼요</p>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...fieldRow }}>
          <div>
            <label htmlFor="onb-height" style={bigLabel}>키 (cm)</label>
            <input
              id="onb-height" name="height" type="text" inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              disabled={loading} placeholder="예: 172" aria-label="키 (센티미터)" style={inpBig} autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="onb-weight" style={bigLabel}>몸무게 (kg) <span style={optInline}>선택</span></label>
            <input
              id="onb-weight" name="weight" type="text" inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              disabled={loading} placeholder="예: 58" aria-label="몸무게 (킬로그램)" style={inpBig} autoComplete="off"
            />
          </div>
        </div>
        <div>
          <label htmlFor="onb-instagram" style={bigLabel}>인스타그램 <span style={optInline}>선택</span></label>
          <input
            id="onb-instagram" name="instagram" type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            disabled={loading} placeholder="@아이디 또는 instagram.com/아이디" aria-label="인스타그램 주소" style={inpBig} autoComplete="off"
          />
        </div>
      </section>

      {/* ━━━ ③ 특기 · 사투리 · 소개 ━━━ */}
      <section style={sec} aria-labelledby="onb-extra">
        <div style={stepHead}>
          <span style={stepNum}>3</span>
          <div>
            <h2 id="onb-extra" style={stepTitle}>특기 · 사투리 · 소개</h2>
            <p style={stepSub}>아는 만큼만 적어주세요 — 전부 선택이에요</p>
          </div>
        </div>

        {/* 특기 (칩) */}
        <div style={fieldRow}>
          <label htmlFor="onb-skills-input" style={bigLabel}>특기</label>
          <p style={helpText}>기술을 적고 <strong>Enter</strong>를 누르면 칸이 생겨요 (수영·검도·피아노 등). 전문가급은 <span aria-hidden="true">⭐</span>를 눌러 강조.</p>
          <input
            id="onb-skills-input"
            name="skills"
            type="text"
            value={skillInput}
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
            disabled={loading}
            placeholder="예: 수영 (입력 후 Enter)"
            aria-label="특기 입력 (Enter로 추가)"
            style={inpBig}
            autoComplete="off"
          />
          {skillList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {skillList.map((sk) => {
                const isAdv = advList.includes(sk)
                return (
                  <span key={sk} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 10px 7px 14px', borderRadius: 999,
                    background: isAdv ? 'var(--navy)' : 'var(--bg3)',
                    color: isAdv ? '#fff' : 'var(--white)',
                    border: `1px solid ${isAdv ? 'var(--navy)' : 'var(--border)'}`,
                    fontSize: '0.9rem', fontFamily: 'var(--font-sans)',
                  }}>
                    <button
                      type="button" disabled={loading} aria-pressed={isAdv}
                      aria-label={`${sk} 고급 숙련도 ${isAdv ? '해제' : '표시'}`}
                      onClick={() => {
                        const adv = advancedSkills.split(',').map(s => s.trim()).filter(Boolean)
                        setAdvancedSkills((isAdv ? adv.filter(x => x !== sk) : [...adv, sk]).join(', '))
                      }}
                      style={{ background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1, color: 'inherit' }}
                    >{isAdv ? '⭐' : '☆'}</button>
                    {sk}
                    <button
                      type="button" disabled={loading} aria-label={`${sk} 삭제`}
                      onClick={() => {
                        const cur = skills.split(',').map(s => s.trim()).filter(Boolean).filter(x => x !== sk)
                        const adv = advancedSkills.split(',').map(s => s.trim()).filter(Boolean).filter(x => x !== sk)
                        setSkills(cur.join(', '))
                        setAdvancedSkills(adv.join(', '))
                      }}
                      style={{ background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', padding: '0 2px', fontSize: '1rem', lineHeight: 1, color: 'inherit', opacity: 0.7 }}
                    >×</button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* 사투리 */}
        <div style={fieldRow}>
          <label style={bigLabel}>사투리 (가능 지역)</label>
          <p style={helpText}>네이티브 수준으로 가능한 지역을 누르세요. 없으면 <strong style={{ color: 'var(--white)' }}>없음</strong>.</p>
          <div role="group" aria-label="사투리 가능 지역" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[...DIALECT_OPTIONS, DIALECT_NONE].map((d) => {
              const on = dialects.includes(d)
              const isNone = d === DIALECT_NONE
              return (
                <button
                  key={d}
                  type="button"
                  disabled={loading}
                  aria-pressed={on}
                  onClick={() => setDialects((prev) => {
                    if (isNone) return prev.includes(DIALECT_NONE) ? [] : [DIALECT_NONE]
                    const r = prev.filter((x) => x !== DIALECT_NONE)
                    return r.includes(d) ? r.filter((x) => x !== d) : [...r, d]
                  })}
                  style={{
                    padding: '10px 18px', borderRadius: 999, cursor: loading ? 'default' : 'pointer',
                    fontSize: '0.92rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
                    background: on ? 'var(--navy)' : 'transparent',
                    color: on ? '#fff' : 'var(--gray)',
                    border: `1px solid ${on ? 'var(--navy)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {on ? '✓ ' : ''}{isNone ? '없음 (표준어)' : d}
                </button>
              )
            })}
          </div>
        </div>

        {/* 한줄소개 */}
        <div>
          <label htmlFor="casting-summary" style={bigLabel}>한줄소개</label>
          <p style={helpText}>캐스팅 디렉터에게 보이는 짧은 소개. <em style={{ color: 'var(--gray)' }}>&quot;장르를 넘나드는 탄탄한 기본기의 배우&quot;</em></p>
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
            style={{ ...inpBig, resize: 'vertical', minHeight: 68, lineHeight: 1.6 }}
          />
          <p id="onb-casting-count" aria-live="off" aria-atomic="true" style={{ fontSize: '0.74rem', color: 'var(--gray)', textAlign: 'right', marginTop: 4 }}>{castingSummary.length}/120</p>
        </div>
      </section>

      {/* 상태/에러/로딩 — 항상 DOM에 존재 (스크린 리더 즉시 알림 WCAG 4.1.3) */}
      <p role="status" aria-live="polite" aria-atomic="true" style={warning ? warnStyle : {}}>{warning}</p>
      <div
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        aria-atomic="true"
        style={{ outline: 'none', ...(error ? errStyle : {}) }}
      >{error}</div>
      {loading && status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'rgba(196,165,90,0.08)', border: '1px solid rgba(196,165,90,0.2)', borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '1.1rem' }} aria-hidden="true">⏳</span>
          <p role="status" aria-live="polite" style={{ fontSize: '0.92rem', color: 'var(--gold)' }}>{status}</p>
        </div>
      )}

      {/* 제출 — 큰 버튼 하나 */}
      <button type="button" onClick={submit} disabled={loading} aria-busy={loading}
        style={{ ...submitBtn, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? '업로드 중...' : '제출하기'}
      </button>

      <button type="button" onClick={() => router.push('/dashboard')} disabled={loading} style={{
        width: '100%', padding: 14, marginTop: 10, background: 'transparent',
        color: 'var(--gray)', fontSize: '0.92rem', borderRadius: 8, border: 'none', cursor: 'pointer',
      }}>
        나중에 하기
      </button>
    </div>
  )
}

// ─── 스타일 ───────────────────────────────────────────────────────────────────
const sec: React.CSSProperties = {
  marginBottom: 18,
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '22px 20px',
}

// 섹션 헤더 — 번호 동그라미 + 큰 제목 (시니어 친화)
const stepHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
}
const stepNum: React.CSSProperties = {
  flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
  background: 'var(--gold)', color: '#1a1a1a', fontWeight: 800,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.95rem', fontFamily: 'var(--font-display)',
}
const stepTitle: React.CSSProperties = {
  fontSize: '1.18rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1.2, margin: 0,
}
const stepSub: React.CSSProperties = {
  fontSize: '0.84rem', color: 'var(--gray)', marginTop: 3, lineHeight: 1.4,
}

// 큰 행 버튼 (파일 올리기) — 채워지면 골드 테두리
const rowBtn = (filled: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
  padding: '15px 16px', borderRadius: 12,
  background: filled ? 'rgba(196,165,90,0.07)' : 'var(--bg3)',
  border: `1.5px ${filled ? 'solid var(--gold)' : 'dashed var(--border)'}`,
  cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
})
const rowGroupGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }
const rowIcon: React.CSSProperties = { flexShrink: 0, fontSize: '1.5rem', lineHeight: 1, width: 30, textAlign: 'center' }
const rowBody: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }
const rowLabel: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }
const rowSub: React.CSSProperties = { fontSize: '0.8rem', color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const rowAction = (filled: boolean): React.CSSProperties => ({
  flexShrink: 0, fontSize: '0.9rem', fontWeight: 700,
  color: 'var(--gold)', whiteSpace: 'nowrap',
})

const reqTag: React.CSSProperties = { fontSize: '0.74rem', fontWeight: 700, color: '#e2554a', marginLeft: 4 }
const optInline: React.CSSProperties = { fontSize: '0.74rem', fontWeight: 400, color: 'var(--gray)', marginLeft: 4 }

// 더보기 토글 (현재사진 펼치기)
const moreToggle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 12, padding: '11px 0',
  background: 'transparent', border: '1px solid var(--border)', borderRadius: 10,
  color: 'var(--gray)', fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
}
const miniBtn: React.CSSProperties = {
  display: 'block', width: '100%', padding: '10px 8px',
  background: 'var(--bg2)', border: '1px dashed var(--border)', borderRadius: 8,
  color: 'var(--white)', fontSize: '0.84rem', cursor: 'pointer',
}

// 텍스트 입력 (시니어 — 크게)
const fieldRow: React.CSSProperties = { marginBottom: 18 }
const bigLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)', marginBottom: 8,
}
const helpText: React.CSSProperties = {
  fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 10,
}
const inpBig: React.CSSProperties = {
  display: 'block', width: '100%',
  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10,
  padding: '14px 14px', color: 'var(--white)', fontSize: '1rem',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const submitBtn: React.CSSProperties = {
  width: '100%', padding: '18px 0', background: 'var(--navy)', color: '#fff',
  fontWeight: 700, fontSize: '1.1rem', borderRadius: 12, border: 'none',
  fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
}

const errStyle: React.CSSProperties = {
  color: '#b91c1c',
  fontSize: '0.9rem',
  marginBottom: 14,
  padding: '12px 16px',
  background: 'rgba(185,28,28,0.08)',
  border: '1px solid rgba(185,28,28,0.2)',
  borderRadius: 8,
}

const warnStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: '0.9rem',
  marginBottom: 14,
  padding: '12px 16px',
  background: 'rgba(251,191,36,0.08)',
  border: '1px solid rgba(251,191,36,0.2)',
  borderRadius: 8,
}
