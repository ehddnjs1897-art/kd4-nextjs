'use client'

import { analytics } from '@/lib/analytics'

interface JoinCTALinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  location: string
  label: string
  /** @deprecated 2026-05-12: 버튼 클릭이 Meta Lead 이벤트로 잘못 잡혀 광고 학습 오염
   * → CTA 클릭은 CTAClick(커스텀 이벤트)으로만 추적. Lead는 폼 제출 시점에만 발화. */
  fireLead?: boolean
  kind?: 'external'
  /** 외부 CTA 채널 식별자 — lite-lead 누수 추적용 (2026-05-23)
   *  허용값: 'kakao' | 'form' | 'instagram' | 'blog' */
  channel?: string
  children: React.ReactNode
}

/** UTM 영속 키 — JoinForm 과 동일. sessionStorage 에 광고 첫 진입 UTM 보존. */
const UTM_STORAGE_KEY = 'kd4_utm'

function readStoredUTM(): Record<string, string | null> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored) as Record<string, string | null>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** 외부 CTA 클릭 시 consultations 에 lite_lead 기록 (2026-05-23)
 *  navigator.sendBeacon 으로 페이지 이동 중에도 안전하게 발사.
 *  실패해도 사용자 경험 영향 없음 (silent). */
function fireLiteLead(channel: string) {
  if (typeof window === 'undefined') return
  try {
    const utm = readStoredUTM()
    const payload = JSON.stringify({
      channel,
      utm,
      referrer: document.referrer || null,
    })

    // sendBeacon 우선 (페이지 unload 중에도 발사 보장)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      const ok = navigator.sendBeacon('/api/lite-lead', blob)
      if (ok) return
    }

    // sendBeacon 실패 시 fetch keepalive 폴백
    fetch('/api/lite-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // 추적 실패해도 사용자 경험 영향 없도록 silent
    })
  } catch {
    // 어떤 예외든 사용자 페이지 이동을 막지 않음
  }
}

export default function JoinCTALink({
  href,
  location,
  label,
  fireLead,
  kind,
  channel,
  children,
  onClick,
  ...rest
}: JoinCTALinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 2026-05-12: fireLead → CTAClick으로 강등 (Lead는 실제 폼 제출에서만 발화)
    if (fireLead) analytics.ctaClick(location, label)

    // 2026-05-23: 외부 채널 CTA 는 추가로 lite_lead 기록 (누수 회수)
    //   조건: kind='external' (새 탭으로 외부 이동) + fireLead (의도된 CTA)
    //   channel 미지정 시 location 을 fallback 으로 사용해 분석 정밀도 유지
    if (kind === 'external' && fireLead) {
      const resolved = channel || location
      // 허용 채널만 전송 — 서버에서도 한번 더 검증
      const knownChannels = new Set(['kakao', 'form', 'instagram', 'blog'])
      if (knownChannels.has(resolved)) {
        fireLiteLead(resolved)
      }
    }

    onClick?.(e)
  }

  const external = kind === 'external'

  return (
    <a
      href={href}
      onClick={handleClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}
