'use client'

import { useState, useRef, useEffect } from 'react'

interface CastingInquiryProps {
  actorId: string
  actorName: string
  actorAgeGroup?: string | null
  actorGender?: '남' | '여' | null
}

// 접수번호 포맷: KD-YYMMDD-XXXX
function generateReceiptNo(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `KD-${yy}${mm}${dd}-${rand}`
}

export default function CastingInquiry({ actorId, actorName, actorAgeGroup, actorGender }: CastingInquiryProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [receiptNo, setReceiptNo] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 폼 필드
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [production, setProduction] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)

  // 허니팟 (봇 차단 — 사람은 채우지 않는 숨김 필드)
  const honeyRef = useRef<HTMLInputElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerBtnRef = useRef<HTMLButtonElement>(null)
  // done의 최신 값을 ESC 핸들러에서 읽기 위한 ref (stale closure 방지)
  const doneRef = useRef(done)
  useEffect(() => { doneRef.current = done }, [done])

  // 포커스 관리: 열릴 때 닫기 버튼에 포커스, 닫힐 때 트리거로 복원 (WCAG 2.4.3)
  // hasOpenedRef: 초기 마운트 시 else 분기 실행 방지 (페이지 로드 시 포커스 탈취 방지)
  const hasOpenedRef = useRef(false)
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true
      closeBtnRef.current?.focus()
    } else if (hasOpenedRef.current) {
      triggerBtnRef.current?.focus()
    }
  }, [open])

  // ESC 키로 모달 닫기 — handleClose를 직접 호출하되 done은 doneRef로 읽음
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); handleClose() } }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 필드 에러 상태
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = '담당자명을 입력해주세요.'
    if (!production.trim()) errs.production = '작품/회사명을 입력해주세요.'
    if (!role.trim()) errs.role = '찾는 역할을 입력해주세요.'
    if (!phone.trim()) errs.phone = '연락처를 입력해주세요.'
    else if (!/^01[0-9][\-\s]?\d{3,4}[\-\s]?\d{4}$/.test(phone.replace(/\s/g, '')))
      errs.phone = '올바른 연락처 형식을 입력해주세요. (예: 010-1234-5678)'
    if (!consent) errs.consent = '개인정보 수집·이용에 동의해주세요.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || done) return

    // 허니팟 체크 (봇 차단)
    if (honeyRef.current?.value) {
      setDone(true)
      setReceiptNo(generateReceiptNo())
      return
    }

    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setError(null)

    const eventId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `casting_${Date.now()}_${Math.random().toString(36).slice(2)}`

    const motivation = [
      '[캐스팅문의]',
      `배우: ${actorName} (id:${actorId})`,
      actorAgeGroup ? `연령대: ${actorAgeGroup}` : null,
      actorGender ? `성별: ${actorGender}` : null,
      `작품/회사: ${production.trim()}`,
      `역할: ${role.trim()}`,
      message.trim() ? `메시지: ${message.trim()}` : null,
    ].filter(Boolean).join(' / ')

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          record: {
            name: name.trim(),
            phone: phone.trim(),
            inquiry_type: 'casting_inquiry',
            source: `casting:${actorName}`.slice(0, 100),
            motivation,
            status: '대기',
            event_id: eventId,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `서버 오류 (${res.status})`)
      }

      const rno = generateReceiptNo()
      setReceiptNo(rno)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '접수 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    // 성공 후 닫을 때만 상태 초기화 (doneRef로 읽어 stale closure에서도 최신 값 보장)
    if (doneRef.current) {
      setTimeout(() => {
        setDone(false)
        setReceiptNo('')
        setName(''); setPhone(''); setProduction(''); setRole(''); setMessage(''); setConsent(false)
        setFieldErrors({})
        setError(null)
      }, 300)
    }
  }

  return (
    <>
      {/* 캐스팅 문의 트리거 버튼 */}
      <div style={{ marginTop: 24 }}>
        <button
          ref={triggerBtnRef}
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 6,
            fontSize: '0.88rem', fontFamily: 'var(--font-sans)', fontWeight: 700,
            background: 'rgba(200,168,100,0.12)',
            color: 'var(--gold)',
            border: '1px solid rgba(200,168,100,0.4)',
            cursor: 'pointer', letterSpacing: '0.03em',
            transition: 'background 0.15s',
          }}
          aria-haspopup="dialog"
          aria-label={`${actorName} 배우에게 캐스팅 문의 보내기`}
        >
          <span aria-hidden="true">📋</span> 캐스팅 문의
        </button>
        <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: 6 }}>
          KD4가 배우 일정 확인 후 24시간 내 회신드립니다.
        </p>
      </div>

      {/* 모달 오버레이 */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${actorName} 캐스팅 문의`}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 'clamp(20px, 4vw, 32px)',
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* 닫기 버튼 */}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleClose}
              aria-label="문의 창 닫기"
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none',
                color: 'var(--gray)', fontSize: '1.2rem',
                cursor: 'pointer', padding: 6, lineHeight: 1,
              }}
            >✕</button>

            {/* 타이틀 */}
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.62rem', letterSpacing: '0.2em',
              color: 'var(--gold)', marginBottom: 8,
              textTransform: 'uppercase',
            }}>CASTING INQUIRY</p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem', fontWeight: 700,
              color: 'var(--white)', marginBottom: 6,
            }}>{actorName} 배우 캐스팅 문의</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginBottom: 24 }}>
              접수 후 KD4에서 24시간 내 회신드립니다.
            </p>

            {/* 성공 화면 */}
            {done ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>✅</p>
                <p style={{ fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
                  캐스팅 문의가 접수되었습니다
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginBottom: 6 }}>
                  접수번호: <strong style={{ color: 'var(--gold)' }}>{receiptNo}</strong>
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 20 }}>
                  KD4가 배우 일정 확인 후 24시간 내 회신드립니다.
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginBottom: 12 }}>
                  급한 문의는 카카오 채널로
                </p>
                <a
                  href="https://pf.kakao.com/_ximxdqn"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 6,
                    fontSize: '0.82rem', fontWeight: 600,
                    background: 'rgba(254,229,0,0.08)',
                    color: '#fce000', border: '1px solid rgba(254,229,0,0.2)',
                    textDecoration: 'none',
                  }}
                >빠른 상담은 카카오로 →</a>
              </div>
            ) : (
              /* 문의 폼 */
              <form onSubmit={handleSubmit} noValidate>
                {/* 허니팟 (숨김) */}
                <input
                  ref={honeyRef}
                  name="company_url"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                />

                {/* 담당자명 */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="ci-name" style={labelStyle}>
                    담당자명 <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    id="ci-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })) }}
                    placeholder="예: 김프로듀서"
                    maxLength={50}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'ci-name-err' : undefined}
                    style={{ ...inputStyle, borderColor: fieldErrors.name ? 'var(--accent-red)' : undefined }}
                  />
                  {fieldErrors.name && <p id="ci-name-err" style={fieldErrorStyle}>{fieldErrors.name}</p>}
                </div>

                {/* 작품/회사명 */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="ci-production" style={labelStyle}>
                    작품/회사명 <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    id="ci-production"
                    type="text"
                    value={production}
                    onChange={(e) => { setProduction(e.target.value); setFieldErrors((p) => ({ ...p, production: '' })) }}
                    placeholder="예: ○○ 단편영화 / ○○ 엔터테인먼트"
                    maxLength={100}
                    aria-invalid={!!fieldErrors.production}
                    aria-describedby={fieldErrors.production ? 'ci-production-err' : undefined}
                    style={{ ...inputStyle, borderColor: fieldErrors.production ? 'var(--accent-red)' : undefined }}
                  />
                  {fieldErrors.production && <p id="ci-production-err" style={fieldErrorStyle}>{fieldErrors.production}</p>}
                </div>

                {/* 찾는 역할 */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="ci-role" style={labelStyle}>
                    찾는 역할 <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    id="ci-role"
                    type="text"
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setFieldErrors((p) => ({ ...p, role: '' })) }}
                    placeholder="예: 20대 남자 주연 / 형사 역"
                    maxLength={100}
                    aria-invalid={!!fieldErrors.role}
                    aria-describedby={fieldErrors.role ? 'ci-role-err' : undefined}
                    style={{ ...inputStyle, borderColor: fieldErrors.role ? 'var(--accent-red)' : undefined }}
                  />
                  {fieldErrors.role && <p id="ci-role-err" style={fieldErrorStyle}>{fieldErrors.role}</p>}
                </div>

                {/* 연락처 */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="ci-phone" style={labelStyle}>
                    연락처 <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    id="ci-phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: '' })) }}
                    placeholder="예: 010-1234-5678"
                    maxLength={20}
                    aria-invalid={!!fieldErrors.phone}
                    aria-describedby={fieldErrors.phone ? 'ci-phone-err' : undefined}
                    style={{ ...inputStyle, borderColor: fieldErrors.phone ? 'var(--accent-red)' : undefined }}
                  />
                  {fieldErrors.phone && <p id="ci-phone-err" style={fieldErrorStyle}>{fieldErrors.phone}</p>}
                </div>

                {/* 한 줄 메시지 (선택) */}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="ci-message" style={labelStyle}>
                    메시지 <span style={{ color: 'var(--gray)', fontSize: '0.72rem', fontWeight: 400 }}>(선택)</span>
                  </label>
                  <textarea
                    id="ci-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="촬영 시기·조건·추가 요청사항 등 (선택)"
                    maxLength={500}
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 72,
                    }}
                  />
                </div>

                {/* 동의 */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => { setConsent(e.target.checked); setFieldErrors((p) => ({ ...p, consent: '' })) }}
                      aria-invalid={!!fieldErrors.consent}
                      aria-describedby={fieldErrors.consent ? 'ci-consent-err' : undefined}
                      style={{ marginTop: 2, accentColor: 'var(--gold)', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.5 }}>
                      개인정보(이름·연락처)를 KD4 액팅 스튜디오에서 캐스팅 연결 목적으로 수집·이용하는 것에 동의합니다.
                    </span>
                  </label>
                  {fieldErrors.consent && <p id="ci-consent-err" style={fieldErrorStyle}>{fieldErrors.consent}</p>}
                </div>

                {/* 서버 에러 */}
                {error && (
                  <div role="alert" style={{
                    padding: '10px 14px', borderRadius: 6, marginBottom: 14,
                    background: 'rgba(199,62,62,0.08)', border: '1px solid rgba(199,62,62,0.25)',
                    fontSize: '0.82rem', color: 'var(--accent-red)',
                  }}>
                    {error}{' '}
                    <a href="https://pf.kakao.com/_ximxdqn" target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
                      카카오로 문의하기 →
                    </a>
                  </div>
                )}

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 0',
                    borderRadius: 6, border: 'none',
                    background: loading ? 'rgba(200,168,100,0.3)' : 'rgba(200,168,100,0.15)',
                    color: 'var(--gold)',
                    fontSize: '0.9rem', fontFamily: 'var(--font-sans)', fontWeight: 700,
                    letterSpacing: '0.04em',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    outline: '1px solid rgba(200,168,100,0.4)',
                    transition: 'background 0.15s',
                  }}
                  aria-busy={loading}
                >
                  {loading ? '접수 중...' : '캐스팅 문의 보내기'}
                </button>

                {/* 카카오 보조 동선 */}
                <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.78rem', color: 'var(--gray)' }}>
                  급한 문의는{' '}
                  <a
                    href="https://pf.kakao.com/_ximxdqn"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}
                  >카카오 채널로 →</a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.75)',
  marginBottom: 6,
  letterSpacing: '0.02em',
  fontFamily: 'var(--font-sans)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--white)',
  fontSize: '0.88rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
}

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--accent-red)',
  marginTop: 4,
}
