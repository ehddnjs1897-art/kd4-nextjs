/**
 * /join 「바로 상담」 창의 브라우저 쪽 도우미 (2026-11-18)
 *
 * ⚠️ 꼬리표(UTM)·연락처 규칙은 components/contact/JoinForm.tsx 와 같아야 한다 —
 *    한쪽을 고치면 다른 쪽도 같이 고칠 것. (기존 폼은 클래스 전용 페이지에서 계속 쓰므로 건드리지 않고 규칙만 맞춘다)
 */
import { normalizeUtmSource } from '@/lib/utm'
import type { InstantKey } from '@/lib/join-instant'

/* ── 상담창 열기 — 타일·버튼 어디서든 같은 신호로 연다 ── */
export const CONSULT_OPEN_EVENT = 'kd4:consult-open'

export interface ConsultOpenDetail {
  key: InstantKey
  /** 어디서 눌렀는지 — 전환 측정용 (top / bottom / reel_section …) */
  location: string
}

declare global {
  interface Window {
    /** 상담창이 아직 준비되기 전에 눌린 요청 — 준비되는 즉시 연다 */
    __kd4PendingConsult?: ConsultOpenDetail
  }
}

export function openConsult(key: InstantKey, location: string) {
  if (typeof window === 'undefined') return
  const detail: ConsultOpenDetail = { key, location }
  window.__kd4PendingConsult = detail
  window.dispatchEvent(new CustomEvent<ConsultOpenDetail>(CONSULT_OPEN_EVENT, { detail }))
}

/* ── 광고 꼬리표 (JoinForm 과 같은 저장 키·같은 모양) ── */
export interface UTMData {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referrer: string | null
  landing: string | null
}

const UTM_STORAGE_KEY = 'kd4_utm'

export const EMPTY_UTM: UTMData = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  referrer: null,
  landing: null,
}

export function readUTM(): UTMData {
  if (typeof window === 'undefined' || typeof document === 'undefined') return EMPTY_UTM
  const params = new URLSearchParams(window.location.search)
  const fromURL: UTMData = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    referrer: document.referrer || null,
    landing: (window.location.pathname + window.location.search).slice(0, 300),
  }
  const hasURLUTM = Boolean(
    fromURL.utm_source || fromURL.utm_medium || fromURL.utm_campaign || fromURL.utm_content || fromURL.utm_term,
  )
  try {
    if (hasURLUTM) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromURL))
      return fromURL
    }
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UTMData>
      return { ...EMPTY_UTM, ...parsed }
    }
  } catch {
    // 시크릿 모드 등 sessionStorage 접근 불가 — URL 값 그대로
  }
  return fromURL
}

/** 꼬리표로 유입 경로를 이미 아는 경우의 값 (lib/form-options.ts SOURCE_VALUES 중 하나). 모르면 빈 문자열 */
export function sourceFromUTM(utm: UTMData): string {
  const s = normalizeUtmSource(utm.utm_source)
  if (s === 'naver' || s === 'google') return '네이버·구글 검색'
  if (s === 'instagram' || s === 'facebook') return '인스타그램'
  return ''
}

/** 접수 성공 뒤 전환 이벤트에 붙는 출처 라벨 — 기존 폼과 같은 규칙 */
export function leadSourceLabel(utm: UTMData): string {
  const src = normalizeUtmSource(utm.utm_source)
  return !src ? 'join_form_direct' : src === 'instagram' ? 'join_form_instagram_ad' : `join_form_${src}`
}

/* ── 입력 검사 ── */
export function validateName(v: string): string {
  return v.trim() ? '' : '이름을 입력해 주세요.'
}

export function validatePhone(v: string): string {
  if (!v.trim()) return '연락처를 입력해 주세요.'
  return /^01[0-9][-\s]?\d{3,4}[-\s]?\d{4}$/.test(v.replace(/\s/g, ''))
    ? ''
    : '올바른 연락처를 입력해 주세요. (예: 010-1234-5678)'
}

/** 연락처 자동 하이픈 — 010-1234-5678 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`
}

/** 화면에 보여주는 접수번호 (KD-연월일-4자리) — 기존 폼과 같은 모양 */
export function makeTicketNo(now = new Date()): string {
  const ymd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `KD-${ymd}-${Math.floor(Math.random() * 9000 + 1000)}`
}

/** Meta 중복제거용 이벤트 ID — 픽셀 Lead 와 서버 CAPI Lead 에 같은 값을 보내 1건으로 묶는다 (기존 폼과 같은 방식) */
export function makeEventId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`
}
