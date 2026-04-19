'use client'

import { analytics } from '@/lib/analytics'
import type { CSSProperties, ReactNode } from 'react'

/**
 * /join 페이지 CTA 링크 래퍼 — 클릭 시 analytics.ctaClick 발화
 *
 * 서버 컴포넌트(/join/page.tsx)에서 `<a>` 대신 사용합니다.
 * 앵커 링크(#form) 또는 외부 링크(카카오) 둘 다 지원.
 */
export default function JoinCTALink({
  href,
  location,
  label,
  kind = 'anchor',
  channel,
  className,
  style,
  children,
}: {
  href: string
  /** 어디에 있는 CTA 인지 — hero / inline_proof / offer_bottom / footer 등 */
  location: string
  /** GA4 리포트용 라벨 (버튼 텍스트) */
  label?: string
  /** anchor: 내부 스크롤 / external: 새 탭 (카카오 등) */
  kind?: 'anchor' | 'external'
  /** external 일 때 channel 구분 — kakao / phone */
  channel?: 'kakao' | 'phone'
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const handleClick = () => {
    analytics.ctaClick(location, label)
    if (kind === 'external' && channel) {
      analytics.contact(channel)
    }
  }

  const externalProps =
    kind === 'external'
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {}

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={handleClick}
      {...externalProps}
    >
      {children}
    </a>
  )
}
