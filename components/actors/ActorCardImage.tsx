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
  // 사진 비율 따라 크롭 위치 자동 조정 (2026-06-30 대표 지시 — 얼굴 가운데 정렬):
  //  · 세로(헤드샷): 'center 30%' — 얼굴 T존이 가운데 오도록 상단 살짝 위
  //  · 가로(이력서 합성이미지): 'left center' — 왼쪽 헤드샷 위주로
  const [objectPosition, setObjectPosition] = useState('center 30%')

  if (hasError) {
    return <InitialFallback name={alt} />
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width:640px) 100vw, (max-width:1232px) calc(50vw - 22px), 578px"
      style={{ objectFit: 'cover', objectPosition }}
      unoptimized={unoptimized}
      priority={priority}
      onError={() => setHasError(true)}
      onLoad={(e) => {
        const img = e.currentTarget
        if (img.naturalWidth && img.naturalHeight) {
          setObjectPosition(img.naturalWidth > img.naturalHeight * 1.05 ? 'left center' : 'center 30%')
        }
      }}
    />
  )
}
