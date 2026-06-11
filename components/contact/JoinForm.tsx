'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { MessageCircle, CheckCircle, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { analytics } from '@/lib/analytics'
import { SOURCE_VALUES, MEISNER_OPTIONS } from '@/lib/form-options'
import styles from './JoinForm.module.css'

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
 * 첫 진입 시 sessionStorage에 저장, 이후 URL에 없으면 복원해서 사용.
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

  const hasURLUTM = Boolean(
    fromURL.utm_source || fromURL.utm_medium || fromURL.utm_campaign || fromURL.utm_content || fromURL.utm_term
  )
  try {
    if (hasURLUTM) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromURL))
      return fromURL
    }
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

/* ── 클래스 선택지 — lib/classes.ts 단일 소스 (명칭 임의 변경 금지) ──
 * 카드형 3종: 신규 신청 가능(isNewMemberOpen) 메인 클래스
 * 칩형: 나머지 클래스 + 기타/상담 후 결정 — 기존 select 선택지와 동일 값 유지 (DB 분석 연속성) */
const FEATURED_CLASS_NAMES = ['베이직 클래스', '마이즈너 테크닉 정규 클래스', '출연영상 클래스']
const FEATURED_CLASSES = FEATURED_CLASS_NAMES
  .map((name) => CLASSES.find((c) => c.nameKo === name))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))

const MORE_CLASS_NAMES = ['오디션 테크닉 클래스', '움직임 클래스', '개인 레슨']
const ETC_OPTION = '기타 / 상담 후 결정'
const MORE_OPTIONS = [...MORE_CLASS_NAMES, ETC_OPTION]

/* 클래스별 카드 태그 — 취미/정규 구분 */
function classTag(cls: (typeof CLASSES)[number]): string {
  if (cls.isHobby) return '취미 · 입문'
  if (cls.nameKo === '출연영상 클래스') return '정규 · 포트폴리오'
  return '정규 클래스'
}

const STEPS = ['클래스 선택', '신청 정보', '확인'] as const

/* ── 실시간 유효성 검사 ── */
function validateName(v: string): string {
  return v.trim() ? '' : '이름을 입력해 주세요.'
}
function validatePhone(v: string): string {
  if (!v.trim()) return '연락처를 입력해 주세요.'
  return /^01[0-9][-\s]?\d{3,4}[-\s]?\d{4}$/.test(v.replace(/\s/g, ''))
    ? ''
    : '올바른 연락처를 입력해 주세요. (예: 010-1234-5678)'
}
function validateEmail(v: string): string {
  if (!v.trim()) return '이메일을 입력해 주세요.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : '올바른 이메일 형식이 아니에요.'
}

/** 연락처 자동 하이픈 — 010-1234-5678 형태로 정리 (모바일 숫자 키보드 대응) */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`
}

export default function JoinForm() {
  const uid = useId()
  const consentId = `join-consent-${uid}`
  const errorId = `join-form-error-${uid}`

  /* 멀티스텝: 0 클래스 선택 → 1 신청 정보 → 2 확인 */
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [meisnerExp, setMeisnerExp] = useState('')
  const [consent, setConsent] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ticketNo, setTicketNo] = useState('')
  const [formStarted, setFormStarted] = useState(false)
  // 허니팟 — 봇이 채우면 조용히 성공 처리 (DB 저장 안 함, 광고 전환 오염 방지)
  const [honeypot, setHoneypot] = useState('')
  const successRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const stepTitleRef = useRef<HTMLHeadingElement>(null)
  const mountedRef = useRef(false)

  // 성공 화면 전환 시 포커스 이동 (WCAG 2.4.3 Focus Order)
  useEffect(() => {
    if (done) successRef.current?.focus()
  }, [done])

  // 서버 오류 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  // 스텝 전환 시 스텝 제목으로 포커스 이동 (첫 마운트 제외)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    stepTitleRef.current?.focus({ preventScroll: false })
  }, [step])

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

  /** 첫 상호작용(클래스 선택·필드 포커스) 시 form_start 이벤트 1회 발화 */
  function fireFormStart() {
    if (!formStarted) {
      analytics.formStart('join_form')
      setFormStarted(true)
    }
  }

  function selectClass(nameKo: string) {
    fireFormStart()
    setSelectedClass(nameKo)
    setFieldErrors((prev) => ({ ...prev, className: '' }))
  }

  /** 실시간 검증 — blur 시 검증, 오류 상태에서 입력 중 즉시 해제 */
  function setFieldError(field: string, message: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: message }))
  }
  function liveValidate(field: 'name' | 'phone' | 'email', value: string) {
    if (!fieldErrors[field]) return // 오류 없으면 입력 중 검증 안 함 (타이핑 방해 X)
    const validator = field === 'name' ? validateName : field === 'phone' ? validatePhone : validateEmail
    setFieldError(field, validator(value))
  }

  function goNextFromClass() {
    if (!selectedClass) {
      setFieldError('className', '클래스를 선택해 주세요. 아직 못 정하셨으면 "기타 / 상담 후 결정"도 괜찮아요.')
      return
    }
    analytics.custom('form_step', { step: 2, step_name: 'info' })
    setStep(1)
  }

  function goNextFromInfo() {
    const errors: Record<string, string> = {
      name: validateName(name),
      phone: validatePhone(phone),
      email: validateEmail(email),
      meisnerExp: meisnerExp ? '' : '경험 여부를 선택해 주세요.',
      source: source ? '' : '유입 경로를 선택해 주세요.',
      consent: consent ? '' : '개인정보 수집·이용에 동의해 주세요.',
    }
    setFieldErrors(errors)
    const firstInvalid = Object.keys(errors).find((k) => errors[k])
    if (firstInvalid) {
      const idMap: Record<string, string> = {
        name: `join-name-${uid}`,
        phone: `join-phone-${uid}`,
        email: `join-email-${uid}`,
        meisnerExp: `join-meisner-${uid}-0`,
        source: `join-source-${uid}`,
        consent: consentId,
      }
      document.getElementById(idMap[firstInvalid])?.focus()
      return
    }
    analytics.custom('form_step', { step: 3, step_name: 'confirm' })
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return  // 더블 클릭 방지
    if (step !== 2) return // 마지막 단계에서만 제출 (모바일 엔터키 오발사 방지)
    // 허니팟 체크 — 봇 제출 조용히 막기
    if (honeypot) { setDone(true); return }

    setLoading(true)
    setError('')

    const motivationParts = [
      source ? `유입경로: ${source}` : '유입경로: /join 랜딩',
      selectedClass && `희망클래스: ${selectedClass}`,
      meisnerExp && `마이즈너경험: ${meisnerExp}`,
    ].filter(Boolean)
    const motivation = motivationParts.join(' / ')

    // Meta 중복제거용 이벤트 ID — 픽셀 Lead 와 서버 CAPI Lead 에 동일 값 전달 → Meta 가 1건으로 dedup
    const eventId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // Lead 이벤트는 서버 저장 성공 확인 후에만 발화 (실패·봇 제출 오염 방지)
    let notifyOk = false
    let dbSaved = false
    try {
      const notifyRes = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: {
            name,
            phone,
            email: email || null,
            class_name: selectedClass || null,
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
      if (notifyRes.ok) {
        const json = await notifyRes.json().catch(() => ({}))
        dbSaved = json?.dbSaved === true
        if (!dbSaved) console.warn('[JoinForm] DB 저장 실패 — SMS/webhook 성공')
      }
    } catch {
      notifyOk = false
    }

    if (!notifyOk) {
      setError('접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    // 저장 성공 확인 후 Lead 발화 (2026-06-09 fix: 성공 후 이동)
    analytics.lead({
      source: 'join_form_instagram_ad',
      className: selectedClass || undefined,
      eventId,
    })

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
          배우지망생 <span aria-hidden="true">→</span> <span style={{ color: 'var(--navy)' }}>진짜 배우</span>
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

        {/* 신청 내용 요약 — 신뢰감 (내가 뭘 신청했는지 즉시 확인) */}
        {selectedClass && (
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--gray-light)',
              marginBottom: '20px',
            }}
          >
            신청 클래스 — <strong style={{ color: 'var(--navy)' }}>{selectedClass}</strong>
          </p>
        )}

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
            <Link
              href="/#director"
              aria-label="권동원 대표 소개 자세히 보기"
              className="kd4-card-hover"
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
            </Link>

            {/* 카드 2: 캐스팅 결과 */}
            <Link
              href="/#casting"
              aria-label="KD4 캐스팅 결과 자세히 보기"
              className="kd4-card-hover"
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
            </Link>

            {/* 카드 3: 마이즈너 테크닉 */}
            <a
              href="/about#meisner"
              aria-label="마이즈너 테크닉 자세히 보기"
              className="kd4-card-hover"
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
              className="kd4-card-hover"
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

  const meisnerChoices = MEISNER_OPTIONS.filter((o) => o.value !== '')

  return (
    <form onSubmit={handleSubmit} aria-label="무료 상담 신청" noValidate>
      {/* 허니팟 — 봇 방지: 화면 밖, 스크린리더 숨김, 탭 불가 */}
      <input
        type="text"
        name="company"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0 }}
      />

      {/* ── 진행 표시 ── */}
      <ol className={styles.progress} aria-label={`신청 진행 단계 — ${step + 1}/3 ${STEPS[step]}`}>
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`${styles.progressStep} ${i === step ? styles.current : ''} ${i < step ? styles.done : ''}`}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className={styles.progressDot} aria-hidden="true">
              {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className={styles.progressLabel}>{label}</span>
          </li>
        ))}
      </ol>

      {/* ━━━ STEP 1 — 클래스 선택 ━━━ */}
      {step === 0 && (
        <div className={styles.stepPane} role="group" aria-label="1단계 — 클래스 선택">
          <h3 ref={stepTitleRef} tabIndex={-1} className={styles.stepTitle}>
            어떤 클래스로 시작할까요?
          </h3>
          <p className={styles.stepHint}>
            카드를 누르면 커리큘럼·가격·일정이 펼쳐져요. 연기 경험 없어도 OK.
          </p>

          {FEATURED_CLASSES.map((cls) => {
            const selected = selectedClass === cls.nameKo
            return (
              <button
                key={cls.nameKo}
                type="button"
                className={`${styles.classCard} ${selected ? styles.classCardSelected : ''}`}
                onClick={() => selectClass(cls.nameKo)}
                aria-pressed={selected}
              >
                <span className={styles.checkBadge} aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span className={styles.cardTag}>
                  {classTag(cls)}
                  {cls.hot && <span className={styles.cardHot}>🔥 HOT</span>}
                </span>
                <span className={styles.cardName}>{cls.nameKo}</span>
                <span className={styles.cardQuote}>{cls.quote}</span>

                {/* 선택 시 상세 expand — 커리큘럼 요약 + 가격 + 일정 */}
                <span className={`${styles.detail} ${selected ? styles.detailOpen : ''}`} aria-hidden={!selected}>
                  <span className={styles.detailInner}>
                    <span className={styles.detailBox} style={{ display: 'block' }}>
                      {cls.bullets.slice(0, 3).map((b) => (
                        <span key={b} className={styles.detailBullet} style={{ display: 'block' }}>{b}</span>
                      ))}
                      <span className={styles.detailPrice} style={{ display: 'block' }}>
                        월 {cls.price}원
                        {cls.course && <span>{cls.course}</span>}
                      </span>
                      <span className={styles.detailMeta} style={{ display: 'block' }}>
                        {cls.schedule} · {cls.duration} · 정원 {cls.capacity}
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            )
          })}

          {/* 다른 클래스 / 미정 */}
          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            다른 클래스를 찾으세요? {moreOpen ? '접기 ▲' : '펼치기 ▼'}
          </button>
          {(moreOpen || MORE_OPTIONS.includes(selectedClass)) && (
            <div className={styles.chipRow} role="group" aria-label="다른 클래스 선택">
              {MORE_OPTIONS.map((nameKo) => (
                <button
                  key={nameKo}
                  type="button"
                  className={`${styles.chip} ${selectedClass === nameKo ? styles.chipSelected : ''}`}
                  onClick={() => selectClass(nameKo)}
                  aria-pressed={selectedClass === nameKo}
                >
                  {nameKo}
                </button>
              ))}
            </div>
          )}

          {fieldErrors.className && (
            <p className={styles.fieldError} role="alert">{fieldErrors.className}</p>
          )}

          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={goNextFromClass}
              disabled={!selectedClass}
            >
              다음 — 신청 정보 입력
              <ArrowRight aria-hidden={true} size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      {/* ━━━ STEP 2 — 신청 정보 ━━━ */}
      {step === 1 && (
        <div className={styles.stepPane} role="group" aria-label="2단계 — 신청 정보 입력">
          <h3 ref={stepTitleRef} tabIndex={-1} className={styles.stepTitle}>
            연락받을 정보를 알려주세요
          </h3>
          <p className={styles.stepHint}>
            선택한 클래스 — <strong style={{ color: 'var(--navy)' }}>{selectedClass}</strong>
          </p>

          {/* 이름 */}
          <div className={styles.field}>
            <label htmlFor={`join-name-${uid}`} className={styles.fieldLabel}>이름</label>
            <input
              id={`join-name-${uid}`}
              className={`${styles.input} ${fieldErrors.name ? styles.inputInvalid : name.trim() ? styles.inputValid : ''}`}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? `join-name-err-${uid}` : undefined}
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => { setName(e.target.value); liveValidate('name', e.target.value) }}
              onFocus={fireFormStart}
              onBlur={() => setFieldError('name', validateName(name))}
              autoComplete="name"
              enterKeyHint="next"
              maxLength={50}
              spellCheck={false}
              required
              aria-required="true"
            />
            {fieldErrors.name && <p id={`join-name-err-${uid}`} className={styles.fieldError}>{fieldErrors.name}</p>}
          </div>

          {/* 연락처 — 자동 하이픈 + 숫자 키보드 */}
          <div className={styles.field}>
            <label htmlFor={`join-phone-${uid}`} className={styles.fieldLabel}>연락처</label>
            <input
              id={`join-phone-${uid}`}
              className={`${styles.input} ${fieldErrors.phone ? styles.inputInvalid : phone && !validatePhone(phone) ? styles.inputValid : ''}`}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? `join-phone-err-${uid}` : undefined}
              type="tel"
              inputMode="numeric"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => { const v = formatPhone(e.target.value); setPhone(v); liveValidate('phone', v) }}
              onFocus={fireFormStart}
              onBlur={() => setFieldError('phone', validatePhone(phone))}
              autoComplete="tel"
              enterKeyHint="next"
              maxLength={13}
              required
              aria-required="true"
            />
            {fieldErrors.phone && <p id={`join-phone-err-${uid}`} className={styles.fieldError}>{fieldErrors.phone}</p>}
          </div>

          {/* 이메일 — 필수 (2026-05-20: 대표 지시로 필수 복귀) */}
          <div className={styles.field}>
            <label htmlFor={`join-email-${uid}`} className={styles.fieldLabel}>이메일</label>
            <input
              id={`join-email-${uid}`}
              className={`${styles.input} ${fieldErrors.email ? styles.inputInvalid : email && !validateEmail(email) ? styles.inputValid : ''}`}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? `join-email-err-${uid}` : undefined}
              type="email"
              inputMode="email"
              placeholder="actor@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); liveValidate('email', e.target.value) }}
              onFocus={fireFormStart}
              onBlur={() => setFieldError('email', validateEmail(email))}
              autoComplete="email"
              enterKeyHint="done"
              autoCapitalize="none"
              maxLength={254}
              spellCheck={false}
              required
              aria-required="true"
            />
            {fieldErrors.email && <p id={`join-email-err-${uid}`} className={styles.fieldError}>{fieldErrors.email}</p>}
          </div>

          {/* 마이즈너 경험 — 세그먼트 라디오 (select 대비 탭 1번 절약) */}
          <div className={styles.field}>
            <span className={styles.fieldLabel} id={`join-meisner-label-${uid}`}>마이즈너 테크닉 경험</span>
            <div className={styles.segGroup} role="radiogroup" aria-labelledby={`join-meisner-label-${uid}`} aria-required="true">
              {meisnerChoices.map((o, i) => (
                <label
                  key={o.value}
                  className={`${styles.segOption} ${meisnerExp === o.value ? styles.segSelected : ''}`}
                >
                  <input
                    id={`join-meisner-${uid}-${i}`}
                    type="radio"
                    name={`join-meisner-${uid}`}
                    className="sr-only"
                    value={o.value}
                    checked={meisnerExp === o.value}
                    onChange={() => { setMeisnerExp(o.value); setFieldError('meisnerExp', '') }}
                    onFocus={fireFormStart}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {fieldErrors.meisnerExp && <p className={styles.fieldError}>{fieldErrors.meisnerExp}</p>}
          </div>

          {/* 유입 경로 */}
          <div className={styles.field}>
            <label htmlFor={`join-source-${uid}`} className={styles.fieldLabel}>KD4를 어떻게 알게 되셨나요?</label>
            <div className={styles.selectWrap}>
              <select
                id={`join-source-${uid}`}
                className={`${styles.input} ${fieldErrors.source ? styles.inputInvalid : ''}`}
                aria-invalid={Boolean(fieldErrors.source)}
                value={source}
                onChange={(e) => { setSource(e.target.value); setFieldError('source', '') }}
                onFocus={fireFormStart}
                style={{ cursor: 'pointer' }}
                required
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ''} hidden={o.value === ''}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className={styles.selectArrow}>▼</span>
            </div>
            {fieldErrors.source && <p className={styles.fieldError}>{fieldErrors.source}</p>}
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
              border: `1px solid ${fieldErrors.consent ? '#b91c1c' : consent ? 'var(--navy)' : 'var(--border)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setFieldError('consent', '') }}
              required
              aria-invalid={Boolean(fieldErrors.consent)}
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
          {fieldErrors.consent && <p className={styles.fieldError} role="alert">{fieldErrors.consent}</p>}

          <div className={styles.navRow}>
            <button type="button" className={styles.btnGhost} onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden={true} size={15} strokeWidth={2.2} />
              이전
            </button>
            <button type="button" className={styles.btnPrimary} onClick={goNextFromInfo}>
              다음 — 신청 내용 확인
              <ArrowRight aria-hidden={true} size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      {/* ━━━ STEP 3 — 확인 + 제출 ━━━ */}
      {step === 2 && (
        <div className={styles.stepPane} role="group" aria-label="3단계 — 신청 내용 확인">
          <h3 ref={stepTitleRef} tabIndex={-1} className={styles.stepTitle}>
            이 내용으로 신청할게요
          </h3>
          <p className={styles.stepHint}>제출 전 마지막으로 확인해 주세요.</p>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>희망 클래스</span>
              <span className={styles.summaryVal}>{selectedClass}</span>
              <button type="button" className={styles.summaryEdit} onClick={() => setStep(0)} aria-label="희망 클래스 수정">수정</button>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>이름</span>
              <span className={styles.summaryVal}>{name}</span>
              <button type="button" className={styles.summaryEdit} onClick={() => setStep(1)} aria-label="이름 수정">수정</button>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>연락처</span>
              <span className={styles.summaryVal}>{phone}</span>
              <button type="button" className={styles.summaryEdit} onClick={() => setStep(1)} aria-label="연락처 수정">수정</button>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>이메일</span>
              <span className={styles.summaryVal}>{email}</span>
              <button type="button" className={styles.summaryEdit} onClick={() => setStep(1)} aria-label="이메일 수정">수정</button>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>마이즈너 경험</span>
              <span className={styles.summaryVal}>{meisnerExp}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>알게 된 경로</span>
              <span className={styles.summaryVal}>{source}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6, margin: '2px 2px 0', wordBreak: 'keep-all' }}>
            제출하시면 <strong style={{ color: 'var(--navy)' }}>24시간 이내 SMS</strong>로 연락드려요.
            상담은 무료이고, 상담 후 바로 가셔도 괜찮아요.
          </p>

          {/* 서버 오류 — 항상 DOM에 존재 (aria 참조 깨짐 방지), 비어있을 때 sr-only */}
          <p
            ref={errorRef}
            tabIndex={-1}
            id={errorId}
            role="alert"
            aria-atomic="true"
            className={error ? styles.fieldError : 'sr-only'}
            style={{ outline: 'none' }}
          >
            {error || ''}
          </p>

          <div className={styles.navRow}>
            <button type="button" className={styles.btnGhost} onClick={() => setStep(1)} disabled={loading}>
              <ArrowLeft aria-hidden={true} size={15} strokeWidth={2.2} />
              이전
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
              aria-busy={loading}
              aria-describedby={errorId}
            >
              {loading ? '신청 중...' : <>무료 상담 신청 완료 <ArrowRight aria-hidden={true} size={16} strokeWidth={2.2} /></>}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
