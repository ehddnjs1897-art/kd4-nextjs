'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Check, ChevronLeft, MessageCircle, X } from 'lucide-react'
import { analytics } from '@/lib/analytics'
import type { InstantClass, InstantKey } from '@/lib/join-instant'
import {
  CONSULT_OPEN_EVENT,
  EMPTY_UTM,
  formatPhone,
  leadSourceLabel,
  makeEventId,
  makeTicketNo,
  readUTM,
  sourceFromUTM,
  validateName,
  validatePhone,
  type ConsultOpenDetail,
  type UTMData,
} from '@/lib/consult-instant'
import JoinCTALink from './JoinCTALink'
import s from './ConsultSheet.module.css'

/* 영상은 상세소개를 열었을 때만 불러온다 */
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

/**
 * /join 「바로 상담」 창 (2026-11-18 대표 브리프)
 *
 * 클래스 타일을 누르면 이 창이 열린다 — 휴대폰은 아래에서 올라오는 패널, PC는 가운데 팝업.
 * 위에서부터: 선택한 클래스명 → 수강료·기간 → 상세소개 보기 → 이름·연락처·동의 한 화면 폼.
 * 상세소개를 보고 돌아와도 고른 클래스와 적던 내용은 그대로 남는다.
 *
 * - 접수 내용·전환 이벤트는 기존 상담 폼(components/contact/JoinForm.tsx)과 같은 모양으로 보낸다.
 * - 클래스 클릭은 「신청 완료」가 아니다 — 전환(Lead)은 서버가 접수를 받았다고 답한 뒤에만 보낸다.
 * - 휴대폰 «뒤로» 버튼: 상세소개 → 상담 → 닫힘 순서로 한 단계씩 돌아간다 (페이지를 떠나지 않음).
 */

type View = 'consult' | 'detail' | 'done'
type FieldErrors = { name?: string; phone?: string; consent?: string }

/** 브라우저 기록에 남기는 표시 — 뒤로 가기로 창을 한 단계씩 닫기 위한 것 */
const HISTORY_KEY = 'kd4Sheet'

function sheetMark(): string | undefined {
  const st: unknown = window.history.state
  if (st && typeof st === 'object' && HISTORY_KEY in st) {
    const v = (st as Record<string, unknown>)[HISTORY_KEY]
    return typeof v === 'string' ? v : undefined
  }
  return undefined
}

function lockPageScroll() {
  const root = document.documentElement
  const gap = window.innerWidth - root.clientWidth
  root.style.overflow = 'hidden'
  if (gap > 0) root.style.paddingRight = `${gap}px`
}

function unlockPageScroll() {
  const root = document.documentElement
  root.style.overflow = ''
  root.style.paddingRight = ''
}

export default function ConsultSheet({ classes }: { classes: InstantClass[] }) {
  const uid = useId()
  const titleId = `consult-title-${uid}`
  const nameId = `consult-name-${uid}`
  const phoneId = `consult-phone-${uid}`
  const consentId = `consult-consent-${uid}`
  const errorId = `consult-error-${uid}`

  const dialogRef = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  const [activeKey, setActiveKey] = useState<InstantKey | null>(null)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('consult')

  /* 적던 내용 — 창을 닫거나 상세소개를 다녀와도 지우지 않는다 */
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticketNo, setTicketNo] = useState('')
  const [doneClass, setDoneClass] = useState('')

  /* 이벤트 처리기에서 «지금 값»을 읽기 위한 사본 */
  const openRef = useRef(false)
  const viewRef = useRef<View>('consult')
  const keyRef = useRef<InstantKey | null>(null)
  const depthRef = useRef(0) // 이 창이 브라우저 기록에 쌓은 칸 수 (0 닫힘 · 1 상담 · 2 상세소개)
  const closingRef = useRef(false) // 우리가 창을 닫으면서 기록을 되감는 중
  const returnViaRef = useRef('')
  const scrollToFormRef = useRef(false)
  const downOnBackdropRef = useRef(false)
  const startedRef = useRef(false)
  const utmRef = useRef<UTMData>(EMPTY_UTM)

  const cls = classes.find((c) => c.key === activeKey) ?? null
  const picks = classes.filter((c) => c.key !== 'recommend')

  const trackParams = useCallback(
    (key: InstantKey | null) => {
      const c = classes.find((x) => x.key === key)
      return { class_key: key ?? '', class_name: c?.className ?? '' }
    },
    [classes],
  )

  /* ── 열기 ── */
  const present = useCallback(
    (key: InstantKey, target: 'consult' | 'detail', pushHistory: boolean) => {
      const dlg = dialogRef.current
      if (!dlg) return
      keyRef.current = key
      setActiveKey(key)
      viewRef.current = target
      setView(target)
      setError('')
      if (openRef.current) return

      openRef.current = true
      setOpen(true)
      if (pushHistory) {
        window.history.pushState({ [HISTORY_KEY]: 'consult' }, '')
        depthRef.current = 1
      }
      try {
        if (!dlg.open) dlg.showModal()
      } catch {
        dlg.setAttribute('open', '') // 아주 오래된 브라우저 — 팝업 대신 그냥 펼친다
      }
      lockPageScroll()
      analytics.custom('consult_sheet_view', trackParams(key))
    },
    [trackParams],
  )

  const handleOpenRequest = useCallback(
    (detail: ConsultOpenDetail) => {
      window.__kd4PendingConsult = undefined
      if (!classes.some((c) => c.key === detail.key)) return
      if (closingRef.current) {
        // 닫히는 중에 다시 눌림 — 기록 되감기가 끝난 뒤에 연다
        window.__kd4PendingConsult = detail
        return
      }
      analytics.custom('class_select', { ...trackParams(detail.key), location: detail.location })
      present(detail.key, 'consult', true)
    },
    [classes, present, trackParams],
  )

  /* ── 닫기 ── */
  const closeNow = useCallback(
    (reason: string) => {
      if (!openRef.current) return
      openRef.current = false
      setOpen(false)
      const dlg = dialogRef.current
      if (dlg?.open) dlg.close()
      else dlg?.removeAttribute('open')
      unlockPageScroll()
      analytics.custom('consult_sheet_close', {
        ...trackParams(keyRef.current),
        view: viewRef.current,
        reason,
        input_started: startedRef.current,
      })
      if (viewRef.current === 'done') {
        // 접수를 마친 뒤 다시 열면 새 상담으로
        viewRef.current = 'consult'
        setView('consult')
      }
    },
    [trackParams],
  )

  const requestClose = useCallback(
    (reason: string) => {
      const depth = depthRef.current
      closeNow(reason)
      if (depth > 0) {
        depthRef.current = 0
        closingRef.current = true
        window.history.go(-depth)
      }
    },
    [closeNow],
  )

  /* ── 브라우저 «뒤로/앞으로» ── */
  const handlePopState = useCallback(() => {
    const wasClosing = closingRef.current
    closingRef.current = false
    const mark = sheetMark()

    if (!mark) {
      depthRef.current = 0
      closeNow('back')
      const pending = window.__kd4PendingConsult
      if (pending) handleOpenRequest(pending)
      return
    }

    const target = mark === 'detail' ? 'detail' : 'consult'
    if (!openRef.current) {
      // 닫은 뒤 «앞으로»를 누른 경우 — 보던 클래스가 있으면 다시 연다 (우리가 닫는 중이었다면 열지 않음)
      if (wasClosing || !keyRef.current) return
      depthRef.current = target === 'detail' ? 2 : 1
      present(keyRef.current, target, false)
      return
    }

    depthRef.current = target === 'detail' ? 2 : 1
    if (viewRef.current === 'done') return
    if (viewRef.current === 'detail' && target === 'consult') {
      analytics.custom('detail_return', {
        ...trackParams(keyRef.current),
        via: returnViaRef.current || 'browser_back',
      })
    }
    returnViaRef.current = ''
    viewRef.current = target
    setView(target)
  }, [closeNow, handleOpenRequest, present, trackParams])

  useEffect(() => {
    utmRef.current = readUTM()
    // 새로고침 뒤 남은 표시 지우기 — 창은 닫혀 있는데 기록에만 «열림»이 남는 일 방지
    if (sheetMark()) window.history.replaceState({}, '')

    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ConsultOpenDetail>).detail
      if (detail) handleOpenRequest(detail)
    }
    window.addEventListener(CONSULT_OPEN_EVENT, onOpen)
    window.addEventListener('popstate', handlePopState)

    // 이 창이 준비되기 전에 눌린 타일 — 같은 신호를 한 번 더 보내 지금 연다
    const pending = window.__kd4PendingConsult
    if (pending) window.dispatchEvent(new CustomEvent<ConsultOpenDetail>(CONSULT_OPEN_EVENT, { detail: pending }))

    return () => {
      window.removeEventListener(CONSULT_OPEN_EVENT, onOpen)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handleOpenRequest, handlePopState])

  /* 페이지를 떠날 때 스크롤 잠금이 남지 않게 */
  useEffect(() => unlockPageScroll, [])

  /* 화면이 바뀔 때: 맨 위로(또는 폼 위치로) + 제목에 초점 (키보드가 갑자기 올라오지 않게 입력칸엔 초점을 주지 않는다) */
  useEffect(() => {
    if (!open) return
    const body = bodyRef.current
    if (body) {
      const toForm = scrollToFormRef.current && view === 'consult' && formRef.current
      body.scrollTop = toForm ? Math.max(0, formRef.current!.offsetTop - 14) : 0
    }
    scrollToFormRef.current = false
    headingRef.current?.focus({ preventScroll: true })
  }, [open, view, activeKey])

  /* ── 상세소개 ── */
  function openDetail() {
    if (viewRef.current !== 'consult') return
    window.history.pushState({ [HISTORY_KEY]: 'detail' }, '')
    depthRef.current = 2
    viewRef.current = 'detail'
    setView('detail')
    analytics.custom('detail_view', trackParams(keyRef.current))
  }

  function backToConsult(via: 'cta' | 'back_button' | 'switch_class') {
    if (viewRef.current !== 'detail') return
    scrollToFormRef.current = via !== 'back_button'
    if (depthRef.current >= 2) {
      returnViaRef.current = via
      window.history.back() // 화면 전환은 handlePopState 가 한다
      return
    }
    analytics.custom('detail_return', { ...trackParams(keyRef.current), via })
    viewRef.current = 'consult'
    setView('consult')
  }

  /** 「추천받기」 상세소개에서 반을 정한 경우 — 적던 내용은 그대로 두고 클래스만 바꾼다 */
  function switchClass(key: InstantKey) {
    keyRef.current = key
    setActiveKey(key)
    analytics.custom('class_select', { ...trackParams(key), location: 'recommend_detail' })
    backToConsult('switch_class')
  }

  /* ── 폼 ── */
  function fireFormStart() {
    if (startedRef.current) return
    startedRef.current = true
    analytics.formStart('join_form') // 기존 폼과 같은 이름 — 변경 전후 비교가 끊기지 않게
    analytics.custom('consult_input_start', trackParams(keyRef.current))
  }

  function setFieldError(field: keyof FieldErrors, msg: string) {
    setFieldErrors((prev) => (prev[field] === msg || (!prev[field] && !msg) ? prev : { ...prev, [field]: msg }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !cls) return

    const doneLabel = cls.key === 'recommend' ? '상담에서 함께 결정' : cls.className

    // 허니팟 — 봇 제출은 조용히 「완료」만 보여주고 아무것도 보내지 않는다
    if (honeypot) {
      setDoneClass(doneLabel)
      setTicketNo(makeTicketNo())
      viewRef.current = 'done'
      setView('done')
      return
    }

    const errs: FieldErrors = {
      name: validateName(name),
      phone: validatePhone(phone),
      consent: consent ? '' : '개인정보 수집·이용에 동의해 주세요.',
    }
    setFieldErrors(errs)
    const firstBad = errs.name ? nameId : errs.phone ? phoneId : errs.consent ? consentId : ''
    if (firstBad) {
      document.getElementById(firstBad)?.focus()
      return
    }

    setLoading(true)
    setError('')

    const utm = utmRef.current
    const source = sourceFromUTM(utm) || '/join 랜딩'
    const motivation = [`유입경로: ${source}`, `희망클래스: ${cls.className}`, '폼: 바로상담'].join(' / ')

    // Meta 중복제거용 — 픽셀 Lead 와 서버 CAPI Lead 에 같은 값
    const eventId = makeEventId()

    let notifyOk = false
    let apiErrorMsg = ''
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record: {
            name,
            phone,
            email: null,
            class_name: cls.className,
            source,
            motivation,
            status: '대기',
            created_at: new Date().toISOString(),
            ...utm,
            event_id: eventId,
          },
        }),
        signal: AbortSignal.timeout(15_000),
      })
      notifyOk = res.ok
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        if (json?.dbSaved !== true) console.warn('[ConsultSheet] DB 저장 실패 — SMS/webhook 성공')
      } else {
        apiErrorMsg = typeof json?.error === 'string' ? json.error : ''
      }
    } catch {
      notifyOk = false
    }

    if (!notifyOk) {
      setError(apiErrorMsg || '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }

    // 서버가 접수를 받았다고 답한 뒤에만 전환 이벤트를 보낸다
    analytics.lead({ source: leadSourceLabel(utm), className: cls.className, eventId })

    setDoneClass(doneLabel)
    setTicketNo(makeTicketNo())
    setLoading(false)
    setConsent(false) // 접수 뒤 다른 클래스를 열어도 실수로 한 번 더 접수되지 않게 — 동의는 다시 받는다
    viewRef.current = 'done'
    setView('done')
  }

  const sheetTitle = !cls ? '' : cls.key === 'recommend' ? '클래스 추천 상담' : `${cls.label} 상담`

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault() // Esc — 닫기는 우리가 (기록 되감기까지 같이)
        requestClose('esc')
      }}
      onClose={() => {
        if (openRef.current) requestClose('native')
      }}
      onPointerDown={(e) => {
        downOnBackdropRef.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        // 바깥 어두운 부분을 눌렀을 때만 (창 안에서 글자를 끌다가 밖에서 뗀 경우는 제외)
        if (e.target === e.currentTarget && downOnBackdropRef.current) requestClose('backdrop')
      }}
    >
      {cls && (
        <>
          <div className={s.head}>
            <span className={s.grab} aria-hidden="true" />
            {view === 'detail' ? (
              <button type="button" className={s.headBack} onClick={() => backToConsult('back_button')}>
                <ChevronLeft aria-hidden={true} size={17} strokeWidth={2.2} />
                상담으로 돌아가기
              </button>
            ) : view === 'consult' ? (
              <button type="button" className={s.headBack} onClick={() => requestClose('repick')}>
                <ChevronLeft aria-hidden={true} size={17} strokeWidth={2.2} />
                클래스 다시 고르기
              </button>
            ) : (
              <span />
            )}
            <button type="button" className={s.close} aria-label="닫기" onClick={() => requestClose('x')}>
              <X aria-hidden={true} size={20} strokeWidth={2} />
            </button>
          </div>

          <div className={s.body} ref={bodyRef}>
            {/* ───────── 상담 화면 ───────── */}
            {view === 'consult' && (
              <>
                <p className={s.eyebrow}>무료 상담</p>
                <h2 id={titleId} ref={headingRef} tabIndex={-1} className={s.title}>
                  {sheetTitle}
                </h2>
                {cls.key === 'recommend' ? (
                  <p className={s.quote}>
                    아직 못 정하셨어도 괜찮아요. 상담에서 이야기를 듣고 맞는 반을 함께 정합니다.
                  </p>
                ) : (
                  cls.quote && <p className={s.quote}>{cls.quote}</p>
                )}

                {/* 수강료·기간 — 연락처를 적기 전에 먼저 보여준다 */}
                <div className={s.summary}>
                  {cls.key === 'recommend' ? (
                    <ul className={s.compare}>
                      {picks.map((p) => (
                        <li key={p.key}>
                          <span>{p.label}</span>
                          <span className={s.compareVal}>월 {p.price}원</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <p className={s.price}>
                        <span className={s.priceUnit}>월</span>
                        <strong className={s.priceNum}>{cls.price}</strong>
                        <span className={s.priceUnit}>원</span>
                        {cls.course && <span className={s.course}>{cls.course}</span>}
                      </p>
                      {cls.facts && <p className={s.facts}>{cls.facts.join(' · ')}</p>}
                      {cls.note && <p className={s.classNote}>{cls.note}</p>}
                      {cls.priceNote && <p className={s.priceNote}>{cls.priceNote}</p>}
                    </>
                  )}
                  <button type="button" className={s.detailBtn} onClick={openDetail}>
                    {cls.key === 'recommend' ? '클래스별 차이 보기' : `${cls.label} 상세소개 보기`}
                  </button>
                </div>

                <form ref={formRef} className={s.form} onSubmit={handleSubmit} aria-label={`${sheetTitle} 신청`} noValidate>
                  {/* 허니팟 — 봇 방지: 화면 밖, 스크린리더 숨김, 탭 불가 */}
                  <input
                    type="text"
                    name="company"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    aria-hidden="true"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0 }}
                  />

                  <p className={s.formHead}>이름과 연락처만 남겨 주세요</p>

                  <div className={s.field}>
                    <label htmlFor={nameId} className={s.fieldLabel}>이름</label>
                    <input
                      id={nameId}
                      className={`${s.input} ${fieldErrors.name ? s.inputInvalid : name.trim() ? s.inputValid : ''}`}
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? `${nameId}-err` : undefined}
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (fieldErrors.name) setFieldError('name', validateName(e.target.value))
                      }}
                      onFocus={fireFormStart}
                      onBlur={() => setFieldError('name', validateName(name))}
                      autoComplete="name"
                      enterKeyHint="next"
                      maxLength={50}
                      spellCheck={false}
                      required
                      aria-required="true"
                    />
                    {fieldErrors.name && <p id={`${nameId}-err`} className={s.fieldError}>{fieldErrors.name}</p>}
                  </div>

                  <div className={s.field}>
                    <label htmlFor={phoneId} className={s.fieldLabel}>연락처</label>
                    <input
                      id={phoneId}
                      className={`${s.input} ${fieldErrors.phone ? s.inputInvalid : phone && !validatePhone(phone) ? s.inputValid : ''}`}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? `${phoneId}-err` : undefined}
                      type="tel"
                      inputMode="numeric"
                      placeholder="010-0000-0000"
                      value={phone}
                      onChange={(e) => {
                        const v = formatPhone(e.target.value)
                        setPhone(v)
                        if (fieldErrors.phone) setFieldError('phone', validatePhone(v))
                      }}
                      onFocus={fireFormStart}
                      onBlur={() => setFieldError('phone', validatePhone(phone))}
                      autoComplete="tel"
                      enterKeyHint="done"
                      maxLength={13}
                      required
                      aria-required="true"
                    />
                    {fieldErrors.phone && <p id={`${phoneId}-err`} className={s.fieldError}>{fieldErrors.phone}</p>}
                  </div>

                  <label
                    htmlFor={consentId}
                    className={`${s.consent} ${consent ? s.consentOn : ''} ${fieldErrors.consent ? s.consentInvalid : ''}`}
                  >
                    <input
                      id={consentId}
                      type="checkbox"
                      className={s.consentBox}
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked)
                        if (e.target.checked) setFieldError('consent', '')
                      }}
                      required
                      aria-invalid={Boolean(fieldErrors.consent)}
                    />
                    <span className={s.consentText}>
                      <strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.
                      <br />
                      <span className={s.consentSub}>
                        상담 연락 목적으로만 사용됩니다 · 언제든 삭제 요청 가능 ·{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer">
                          처리방침
                        </a>
                      </span>
                    </span>
                  </label>
                  {fieldErrors.consent && <p className={s.fieldError} role="alert">{fieldErrors.consent}</p>}

                  {/* 서버 오류 — 항상 DOM에 둔다 (스크린리더 알림) */}
                  <p
                    ref={errorRef}
                    tabIndex={-1}
                    id={errorId}
                    role="alert"
                    aria-atomic="true"
                    className={error ? s.fieldError : 'sr-only'}
                    style={{ outline: 'none' }}
                  >
                    {error || ''}
                  </p>

                  <button type="submit" className={s.btnPrimary} disabled={loading} aria-busy={loading}>
                    {loading ? '접수 중…' : '무료 상담 신청'}
                  </button>

                  <p className={s.reassure}>
                    제출하시면 <strong>바로 안내 문자</strong>를 보내고, 1~2일 안에 대표가 직접 전화드려요. 상담은
                    무료이고, 상담 후 바로 가셔도 괜찮아요.
                  </p>
                  <p className={s.kakaoAlt}>
                    통화가 부담되면{' '}
                    <JoinCTALink
                      href="https://pf.kakao.com/_ximxdqn"
                      kind="external"
                      channel="kakao"
                      location="form_alt"
                      label="카카오로 먼저 물어보기"
                      fireLead
                      aria-label="카카오로 먼저 물어보기 (새 탭에서 열림)"
                      className={s.kakaoAltLink}
                    >
                      <MessageCircle aria-hidden={true} size={13} strokeWidth={2.2} />
                      카카오로 먼저 물어보셔도 돼요
                    </JoinCTALink>
                  </p>
                </form>
              </>
            )}

            {/* ───────── 상세소개 ───────── */}
            {view === 'detail' && cls.key !== 'recommend' && (
              <>
                <p className={s.eyebrow}>상세소개</p>
                <h2 id={titleId} ref={headingRef} tabIndex={-1} className={s.title}>
                  {cls.nameKo ?? cls.label}
                </h2>
                {cls.quote && <p className={s.quote}>{cls.quote}</p>}

                {cls.bullets && cls.bullets.length > 0 && (
                  <section className={s.sec}>
                    <h3 className={s.secTitle}>수업 내용</h3>
                    <ul className={s.bullets}>
                      {cls.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    {cls.note && <p className={s.small}>{cls.note}</p>}
                  </section>
                )}

                {cls.videos && cls.videos.length > 0 && (
                  <section className={s.sec}>
                    <h3 className={s.secTitle}>멤버 출연영상</h3>
                    <div className={s.videos}>
                      {cls.videos.map((v) => (
                        <figure key={v.id} className={s.video}>
                          <YouTubeFacade videoId={v.id} title={v.title} containerStyle={{ borderRadius: '10px' }} />
                          <figcaption>{v.title}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                )}

                {cls.includes && cls.includes.length > 0 && (
                  <section className={s.sec}>
                    <h3 className={s.secTitle}>수강료에 포함</h3>
                    <ul className={s.bullets}>
                      {cls.includes.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className={s.sec}>
                  <h3 className={s.secTitle}>비용과 과정</h3>
                  <dl className={s.rows}>
                    <div className={s.row}>
                      <dt>월 수강료</dt>
                      <dd>월 {cls.price}원</dd>
                    </div>
                    {cls.course && (
                      <div className={s.row}>
                        <dt>과정</dt>
                        <dd>{cls.course}</dd>
                      </div>
                    )}
                    {cls.facts && (
                      <div className={s.row}>
                        <dt>수업</dt>
                        <dd>{cls.facts.join(' · ')}</dd>
                      </div>
                    )}
                    {cls.instructor && (
                      <div className={s.row}>
                        <dt>진행</dt>
                        <dd>{cls.instructor}</dd>
                      </div>
                    )}
                  </dl>
                  {cls.priceNote && <p className={s.priceNote}>{cls.priceNote}</p>}
                  <p className={s.small}>개강 일정과 수업 요일은 상담에서 안내해 드려요.</p>
                </section>

                <a href={cls.href} target="_blank" rel="noopener noreferrer" className={s.pageLink}>
                  {cls.label} 소개 페이지 전체 보기 (새 탭)
                </a>
              </>
            )}

            {/* ───────── 추천받기: 클래스별 차이 ───────── */}
            {view === 'detail' && cls.key === 'recommend' && (
              <>
                <p className={s.eyebrow}>한눈에 보기</p>
                <h2 id={titleId} ref={headingRef} tabIndex={-1} className={s.title}>
                  클래스별 차이
                </h2>
                <p className={s.quote}>마음이 가는 반이 있으면 그 반으로 바로 상담을 신청할 수 있어요.</p>
                <ul className={s.pickList}>
                  {picks.map((p) => (
                    <li key={p.key} className={s.pick}>
                      <p className={s.pickName}>{p.nameKo ?? p.label}</p>
                      {p.quote && <p className={s.pickQuote}>{p.quote}</p>}
                      <p className={s.pickMeta}>
                        <strong>월 {p.price}원</strong>
                        {p.course ? ` · ${p.course}` : ''}
                        {p.facts ? ` · ${p.facts.join(' · ')}` : ''}
                      </p>
                      <button type="button" className={s.pickBtn} onClick={() => switchClass(p.key)}>
                        {p.label} 상담으로 바꾸기
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* ───────── 접수 완료 ───────── */}
            {view === 'done' && (
              <div className={s.done} role="status" aria-live="polite">
                <span className={s.doneIcon} aria-hidden="true">
                  <Check size={26} strokeWidth={2.4} />
                </span>
                <h2 id={titleId} ref={headingRef} tabIndex={-1} className={s.doneTitle}>
                  배우지망생 <span aria-hidden="true">→</span> <span className={s.navy}>진짜 배우</span>
                </h2>
                <p className={s.doneLead}>첫 걸음 접수 완료</p>
                <p className={s.ticket}>
                  접수번호 <strong>{ticketNo}</strong>
                </p>
                {doneClass && (
                  <p className={s.doneClass}>
                    신청 클래스 — <strong>{doneClass}</strong>
                  </p>
                )}
                <div className={s.doneBox}>
                  <p>
                    방금 <strong>안내 문자</strong>를 보내드렸어요. 1~2일 안에 대표가 직접 전화드립니다.
                  </p>
                  <p className={s.doneBoxSub}>30분 상담 예약 일정을 잡은 뒤 상담을 진행합니다.</p>
                </div>
                <a
                  href="https://pf.kakao.com/_ximxdqn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="카카오 상담받기 (새 탭에서 열림)"
                  className={s.doneKakao}
                >
                  <MessageCircle aria-hidden={true} size={15} strokeWidth={2} />
                  카카오로 먼저 물어보기
                </a>
                <button type="button" className={s.doneClose} onClick={() => requestClose('done')}>
                  닫기
                </button>
              </div>
            )}
          </div>

          {view === 'detail' && (
            <div className={s.foot}>
              <button type="button" className={s.btnPrimary} onClick={() => backToConsult('cta')}>
                {cls.key === 'recommend' ? '추천 상담 이어서 신청하기' : '이어서 상담 신청하기'}
              </button>
            </div>
          )}
        </>
      )}
    </dialog>
  )
}
