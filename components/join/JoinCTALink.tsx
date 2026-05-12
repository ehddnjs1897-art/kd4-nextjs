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
  channel?: string
  children: React.ReactNode
}

export default function JoinCTALink({
  href,
  location,
  label,
  fireLead,
  kind,
  channel: _channel,
  children,
  onClick,
  ...rest
}: JoinCTALinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 2026-05-12: fireLead → CTAClick으로 강등 (Lead는 실제 폼 제출에서만 발화)
    if (fireLead) analytics.ctaClick(location, label)
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
