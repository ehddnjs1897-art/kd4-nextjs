'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  src: string
  alt: string
  unoptimized?: boolean
  priority?: boolean
}

/** src 없거나 로드 실패 시 크림 배경 + 이름 첫 글자 이니셜 fallback
 * QW4 (R293): 다크 잔재 placeholder-actor.svg → 크림 배경(var(--bg3)) + 이니셜 */
function InitialFallback({ name }: { name: string }) {
  const initial = name ? name[0] : '?'
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg3, #f0efe8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2rem, 8cqi, 4rem)',
          fontWeight: 700,
          color: 'var(--navy, #15488a)',
          opacity: 0.22,
          userSelect: 'none',
        }}
      >
        {initial}
      </span>
    </div>
  )
}

export default function ActorCardImage({ src, alt, unoptimized, priority }: Props) {
  const [hasError, setHasError] = useState(!src)

  if (hasError) {
    return <InitialFallback name={alt} />
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width:640px) 100vw, 50vw"
      style={{ objectFit: 'cover', objectPosition: 'center top' }}
      unoptimized={unoptimized}
      priority={priority}
      onError={() => setHasError(true)}
    />
  )
}
