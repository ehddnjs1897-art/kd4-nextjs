'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { MessageCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { analytics } from '@/lib/analytics'
import { SOURCE_VALUES, MEISNER_OPTIONS } from '@/lib/form-options'

/** UTM 파라미터 추적 (2026-05-14) — 광고 채널별 ROI 분석용
 * 광고 URL에 ?utm_source=meta&utm_campaign=lead_5월 등을 붙이면
 * 신청 폼에서 자동 캡처해 Supabase에 저장. 어느 광고가 진짜 신청 만들었는지 추적.
 */
interface UTMData {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referrer: string | null
}

/** UTM 영속 키 — 사이트 탐색 중에도 광고 진입 UTM 유지 (2026-05-19 버그 수정)
 * 문제: 사용자가 /join?utm=… 진입 후 /classes 등 둘러보고 돌아오면
 * URL에서 UTM 증발 → 폼 제출 시 전부 NULL 기록되던 버그.
 * 해결: 첫 진입 시 sessionStorage에 저장, 이후 URL에 없으면 복원해서 사용.
 */
const UTM_STORAGE_KEY = 'kd4_utm'

function readUTMFromURL(): UTMData {
  const empty: UTMData = { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null, referrer: null }
  if (typeof window === 'undefined' || typeof document === 'undefined') return empty

  const params = new URLSearchParams(window.location.search)
  const fromURL: UTMData = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    referrer: document.referrer || null,
  }

  // URL에 UTM이 하나라도 있으면 = 광고 첫 진입 → sessionStorage 저장 후 사용
  const hasURLUTM = Boolean(
    fromURL.utm_source || fromURL.utm_medium || fromURL.utm_campaign || fromURL.utm_content || fromURL.utm_term
  )
  try {
    if (hasURLUTM) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromURL))
      return fromURL
    }
    // URL에 UTM 없음 = 사이트 둘러보다 돌아온 경우 → 저장된 첫 진입 UTM 복원
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UTMData>
      return { ...empty, ...parsed }
    }
  } catch {
    // 시크릿 모드 등 sessionStorage 접근 불가 — URL 값 그대로 사용
  }
  return fromURL
}

const SOURCE_OPTIONS = [
  { value: '', label: 'KD4를 어떻게 알게 되셨나요?' },
  ...SOURCE_VALUES.map((v) => ({ value: v, label: v })),
]

const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.nameKo !== '베이직 클래스')

export default function JoinForm() {
  const uid = useId()
  const consentId = `join-consent-${uid}`
  const errorId = `join-form-error-${uid}`
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [className, setClassName] = useState('')
  const [meisnerExp, setMeisnerExp] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [invalidFields, setInvalidFields] = useState(new Set<string>())
  const [ticketNo, setTicketNo] = useState('')
  const [focused, setFocused] = useState<string | null>(null)
  const [formStarted, setFormStarted] = useState(false)
  const successRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  // 성공 화면 전환 시 포커스 이동 (WCAG 2.4.3 Focus Order)
  useEffect(() => {
    if (done) successRef.current?.focus()
  }, [done])

  // 유효성 오류 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  /** UTM 파라미터 — 마운트 시 1회 캡처해 ref 에 보관 (재렌더 영향 X) */
  const utmRef = useRef<UTMData>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    referrer: null,
  })
  useEffect(() => {
    utmRef.current = readUTMFromURL()
  }, [])

  /** 첫 필드 포커스 시 form_start 이벤트 1회 발화 */
  function handleFieldFocus(field: string) {
    setFocused(field)
    if (!formStarted) {
      analytics.formStart('join_form')
      setFormStarted(true)
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: '#ffffff',
    border: `1px solid ${focused === field ? 'var(--navy)' : 'var(--border)'}`,
    borderRadius: '12px',
    padding: '14px 18px',
    color: '#111111',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    appearance: 'none',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return  // 더블 클릭 방지
    // 2026-05-20: 전 항목 필수로 — 대표 지시
    // per-field 유효성: aria-invalid가 실제 오류 필드에만 표시되도록 추적
    const emptyFields = new Set<string>()
    if (!name) emptyFields.add('name')
    if (!phone) emptyFields.add('phone')
    if (!email) emptyFields.add('email')
    if (!className) emptyFields.add('className')
    if (!meisnerExp) emptyFields.add('meisnerExp')
    if (!source) emptyFields.add('source')
    if (emptyFields.size > 0) {
      setInvalidFields(emptyFields)
      setError('모든 항목을 입력해 주세요.')
      return
    }
    if (!consent) {
      setInvalidFields(new Set(['consent']))
      setError('개인정보 수집·이용에 동의해 주세요.')
      return
    }
    // 전화번호 형식 검증 (010-xxxx-xxxx 또는 숫자만)
    if (!/^01[0-9][-\s]?\d{3,4}[-\s]?\d{4}$/.test(phone.replace(/\s/g, ''))) {
      setInvalidFields(new Set(['phone']))
      setError('올바른 연락처를 입력해 주세요. (예: 010-1234-5678)')
      return
    }
    setLoading(true)
    setError('')
    setInvalidFields(new Set())

    const motivationParts = [
      source ? `유입경로: ${source}` : '유입경로: /join 랜딩',
      className && `희망클래스: ${className}`,
      meisnerExp && `마이즈너경험: ${meisnerExp}`,
    ].filter(Boolean)
    const motivation = motivationParts.join(' / ')

    // Meta 중복제거용 이벤트 ID — 픽셀 Lead 와 서버 CAPI Lead 에 동일 값 전달 → Meta 가 1건으로 dedup
    const eventId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`

    analytics.lead({
      source: 'join_form_instagram_ad',
      className: className || undefined,
      eventId,
    })

    let notifyOk = false
    try {
      const notifyRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: {
            name,
            phone,
            email: email || null,
            class_name: className || null,
            source: source || '/join 랜딩',
            motivation,
            status: '대기',
            created_at: new Date().toISOString(),
            // 2026-05-14: 광고 채널 추적용 UTM 파라미터
            ...utmRef.current,
            // 2026-05-22: Meta CAPI 중복제거용 — 위 픽셀 Lead 와 동일 eventId
            event_id: eventId,
          },
        }),
        signal: AbortSignal.timeout(15_000),
      })
      notifyOk = notifyRes.ok
    } catch {
      notifyOk = false
    }

    if (!notifyOk) {
      setError('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    /* 간단한 접수번호 생성 (UX용) — KD 연-월-일-4자리 */
    const now = new Date()
    const ymd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const rand = Math.floor(Math.random() * 9000 + 1000)
    setTicketNo(`KD-${ymd}-${rand}`)

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        style={{
          background: 'var(--navy-tint-1)',
          border: '1px solid var(--navy-tint-3)',
          borderRadius: '16px',
          padding: '40px 28px',
          textAlign: 'center',
          outline: 'none',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--navy-tint-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
        >
          <CheckCircle aria-hidden={true} size={28} color="var(--navy)" strokeWidth={1.8} />
        </div>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: '6px',
            color: '#111111',
          }}
        >
          배우지망생 → <span style={{ color: 'var(--navy)' }}>진짜 배우</span>
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--gray)',
            marginBottom: '10px',
            lineHeight: 1.6,
          }}
        >
          첫 걸음 접수 완료
        </p>

        {/* 접수번호 */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.78rem',
            color: 'var(--gray)',
            letterSpacing: '0.1em',
            marginBottom: '20px',
          }}
        >
          접수번호 <strong style={{ color: 'var(--navy)' }}>{ticketNo}</strong>
        </p>

        {/* 다음 안내 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '20px',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '0.88rem', color: '#111', lineHeight: 1.75, marginBottom: '10px' }}>
            문자를 남겨주시면 <strong>24시간 이내</strong> 연락드립니다.{' '}
            <span style={{ color: 'var(--gray)', fontSize: '0.82rem' }}>(SMS 확인)</span>
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.7 }}>
            30분 상담 예약 일정을 잡은 뒤 상담을 진행합니다.
          </p>
        </div>

        {/* 리드마그넷 — 가이드 PDF */}
        <a
          href="https://pf.kakao.com/_ximxdqn"
          target="_blank" rel="noopener noreferrer"
          aria-label="카카오 상담받기 (새 탭에서 열림)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--navy)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: '10px',
          }}
        >
          <MessageCircle aria-hidden={true} size={15} strokeWidth={2} />
          카카오 상담받기
        </a>

        <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: '14px', lineHeight: 1.7 }}>
          급하시면{' '}
          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank" rel="noopener noreferrer"
            aria-label="카카오 채널 (새 탭에서 열림)"
            style={{
              color: 'var(--navy)',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <MessageCircle aria-hidden={true} size={12} strokeWidth={2.2} />
            카카오 채널
          </a>
          로 먼저 문의하셔도 됩니다.
        </p>

        {/* ── 상담 전 KD4 더 알아보기 — 4개 카드 ── */}
        <div style={{ marginTop: '40px', textAlign: 'left' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              color: 'var(--gray)',
              textTransform: 'uppercase',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            상담 전 더 알아보기
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {/* 카드 1: 권동원 대표 */}
            <a
              href="/#director"
              aria-label="권동원 대표 소개 자세히 보기"
              style={{
                display: 'block',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: '#111111',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                <Image
                  src="/director.jpg"
                  alt="권동원 대표"
                  fill
                  sizes="(max-width: 768px) 100vw, 220px"
                  style={{ objectFit: 'cover', objectPosition: 'center top' }}
                />
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  {DIRECTOR.name} 대표
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.5, marginBottom: '8px' }}>
                  <span lang="en">Disney+</span> 무빙2 · <span lang="en">Netflix</span> 중증외상센터 · 마이즈너 워크샵 수료
                </p>
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--navy)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  자세히 보기 <ArrowRight aria-hidden={true} size={11} strokeWidth={2.2} />
                </p>
              </div>
            </a>

            {/* 카드 2: 캐스팅 결과 */}
            <a
              href="/#casting"
              aria-label="KD4 캐스팅 결과 자세히 보기"
              style={{
                display: 'block',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: '#111111',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  background: 'var(--bg2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                }}
                aria-hidden="true"
              >
                🎬
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  KD4 캐스팅 결과
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.5, marginBottom: '8px' }}>
                  KD4 멤버들의 실제 캐스팅 작품 모아보기
                </p>
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--navy)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  자세히 보기 <ArrowRight aria-hidden={true} size={11} strokeWidth={2.2} />
                </p>
              </div>
            </a>

            {/* 카드 3: 마이즈너 테크닉 */}
            <a
              href="/about#meisner"
              aria-label="마이즈너 테크닉 자세히 보기"
              style={{
                display: 'block',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: '#111111',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  background: 'var(--bg2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                }}
                aria-hidden="true"
              >
                🎭
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  마이즈너 테크닉
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.5, marginBottom: '8px' }}>
                  KD4 훈련의 핵심 — 연기하지 않는 연기
                </p>
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--navy)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  자세히 보기 <ArrowRight aria-hidden={true} size={11} strokeWidth={2.2} />
                </p>
              </div>
            </a>

            {/* 카드 4: 멤버 이야기 */}
            <a
              href="/about#reviews"
              aria-label="KD4 멤버 이야기 자세히 보기"
              style={{
                display: 'block',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: '#111111',
                transition: 'border-color 0.2s, transform 0.15s',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  background: 'var(--bg2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                }}
                aria-hidden="true"
              >
                💬
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  멤버 이야기
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.5, marginBottom: '8px' }}>
                  KD4 멤버가 직접 남긴 후기
                </p>
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--navy)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  자세히 보기 <ArrowRight aria-hidden={true} size={11} strokeWidth={2.2} />
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="수강신청" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 이름 */}
      <input
        aria-label="이름"
        aria-invalid={invalidFields.has('name')}
        aria-describedby={invalidFields.has('name') ? errorId : undefined}
        type="text"
        placeholder="이름 *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={() => handleFieldFocus('name')}
        onBlur={() => setFocused(null)}
        autoComplete="name"
        maxLength={50}
        spellCheck={false}
        style={inputStyle('name')}
        required
        aria-required="true"
      />

      {/* 연락처 */}
      <input
        aria-label="연락처"
        aria-invalid={invalidFields.has('phone')}
        aria-describedby={invalidFields.has('phone') ? errorId : undefined}
        type="tel"
        inputMode="numeric"
        placeholder="연락처 * 010-0000-0000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onFocus={() => handleFieldFocus('phone')}
        onBlur={() => setFocused(null)}
        autoComplete="tel"
        maxLength={20}
        style={inputStyle('phone')}
        required
        aria-required="true"
      />

      {/* 이메일 — 필수 (2026-05-20: 대표 지시로 필수 복귀) */}
      <input
        aria-label="이메일"
        aria-invalid={invalidFields.has('email')}
        aria-describedby={invalidFields.has('email') ? errorId : undefined}
        type="email"
        placeholder="이메일 *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={() => handleFieldFocus('email')}
        onBlur={() => setFocused(null)}
        autoComplete="email"
        maxLength={254}
        style={inputStyle('email')}
        required
        aria-required="true"
      />

      {/* 희망 클래스 (필수) */}
      {OPEN_CLASSES.length === 0 ? (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(196,165,90,0.06)',
          border: '1px solid rgba(196,165,90,0.25)',
          borderRadius: 'var(--radius)',
          fontSize: '0.85rem',
          color: 'var(--secondary)',
          lineHeight: 1.6,
        }}>
          현재 신청 가능한 클래스가 없습니다.{' '}
          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--gold)', textDecoration: 'underline' }}
          >
            카카오 채널
          </a>
          로 문의해 주세요.
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <label htmlFor={`join-class-${uid}`} className="sr-only">희망 클래스</label>
          <select
            id={`join-class-${uid}`}
            aria-label="희망 클래스"
            aria-invalid={invalidFields.has('className')}
            aria-describedby={invalidFields.has('className') ? errorId : undefined}
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            onFocus={() => handleFieldFocus('class')}
            onBlur={() => setFocused(null)}
            style={{ ...inputStyle('class'), cursor: 'pointer' }}
            required
          >
            <option value="" disabled hidden>희망 클래스</option>
            {OPEN_CLASSES.map((c) => (
              <option key={c.nameKo} value={c.nameKo}>
                {c.nameKo}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--gray)',
              fontSize: '0.8rem',
            }}
          >
            ▼
          </span>
        </div>
      )}

      {/* 마이즈너 경험 (필수) */}
      <div style={{ position: 'relative' }}>
        <label htmlFor={`join-meisner-${uid}`} className="sr-only">마이즈너 경험</label>
        <select
          id={`join-meisner-${uid}`}
          aria-label="마이즈너 경험"
          aria-invalid={invalidFields.has('meisnerExp')}
          aria-describedby={invalidFields.has('meisnerExp') ? errorId : undefined}
          value={meisnerExp}
          onChange={(e) => setMeisnerExp(e.target.value)}
          onFocus={() => handleFieldFocus('meisner')}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle('meisner'), cursor: 'pointer' }}
          required
        >
          {MEISNER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} disabled={o.value === ''} hidden={o.value === ''}>
              {o.label === '마이즈너 경험 선택' ? '마이즈너 경험' : o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--gray)',
            fontSize: '0.8rem',
          }}
        >
          ▼
        </span>
      </div>

      {/* 유입 경로 (필수) */}
      <div style={{ position: 'relative' }}>
        <label htmlFor={`join-source-${uid}`} className="sr-only">KD4를 어떻게 알게 되셨나요</label>
        <select
          id={`join-source-${uid}`}
          aria-label="KD4를 어떻게 알게 되셨나요"
          aria-invalid={invalidFields.has('source')}
          aria-describedby={invalidFields.has('source') ? errorId : undefined}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onFocus={() => handleFieldFocus('source')}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle('source'), cursor: 'pointer' }}
          required
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} disabled={o.value === ''} hidden={o.value === ''}>
              {o.value === '' ? 'KD4를 어떻게 알게 되셨나요?' : o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--gray)',
            fontSize: '0.8rem',
          }}
        >
          ▼
        </span>
      </div>

      {/* 개인정보 수집·이용 동의 (필수) */}
      <label
        htmlFor={consentId}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px',
          background: consent ? 'rgba(21,72,138,0.04)' : '#ffffff',
          border: `1px solid ${consent ? 'var(--navy)' : 'var(--border)'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          aria-invalid={invalidFields.has('consent')}
          aria-describedby={invalidFields.has('consent') ? errorId : undefined}
          style={{
            width: '24px',
            height: '24px',
            marginTop: '2px',
            accentColor: 'var(--navy)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '0.85rem',
            color: '#111111',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--navy)' }}>[필수]</strong> 개인정보 수집·이용에 동의합니다.
          <br />
          <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>
            상담 연락 목적으로만 사용됩니다 · 언제든 삭제 요청 가능
          </span>
        </span>
      </label>

      {/* 에러 — 항상 DOM에 존재 (aria-describedby 참조 깨짐 방지), 비어있을 때는 sr-only로 시각 은닉 */}
      <p
        ref={errorRef}
        tabIndex={-1}
        id={errorId}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={error ? undefined : 'sr-only'}
        style={{ color: '#b91c1c', fontSize: '0.85rem', margin: 0, outline: 'none' }}
      >
        {error || ''}
      </p>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        style={{
          width: '100%',
          padding: '16px',
          background: loading ? 'rgba(21,72,138,0.5)' : 'var(--navy)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.05rem',
          letterSpacing: '0.04em',
          borderRadius: '12px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, transform 0.15s',
          marginTop: '4px',
          fontFamily: 'inherit',
        }}
      >
        {loading ? '신청 중...' : '무료 상담 신청 →'}
      </button>
    </form>
  )
}
