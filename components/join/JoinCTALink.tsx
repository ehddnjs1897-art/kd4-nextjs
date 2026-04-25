'use client'

import { pixel } from '@/lib/meta-pixel'

interface JoinCTALinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  location: string
  label: string
  fireLead?: boolean
  kind?: 'external'
  channel?: string
  children: React.ReactNode
}

export default function JoinCTALink({
  href,
  location: _location,
  label: _label,
  fireLead,
  kind,
  channel: _channel,
  children,
  onClick,
  ...rest
}: JoinCTALinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (fireLead) pixel.lead()
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
