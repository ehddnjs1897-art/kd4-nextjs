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

// 2026-07-01 도입된 '왼쪽 25%로 확대' 처리는 옛 이력서 합성사진(헤드샷+텍스트, 얼굴이
// 왼쪽에 있다고 가정) 전용이었음. 그 사진들은 2026-07-06 얼굴크롭 배치로 전부 서버에서
// 세로(portrait, /cards/{id}.jpg)로 재변환 완료 — 더 이상 이 분기에 걸리지 않음.
// 반면 신규로 실제 가로 촬영 사진(얼굴이 중앙에 있는 정상 사진)을 대표사진으로 쓰는
// 배우가 생기면서, 왼쪽-앵커 가정이 뒷모습·배경만 보여주는 오탐을 일으킴(배승헌 제보,
// 2026-07-08). 배율 확대 없이 상단부 중앙 크롭 하나로 통일 — 세로/가로 모두 이 규칙이면
// 중앙 구도로 찍힌 일반적인 사진에서 안전하게 작동.
const CENTER_CROP: React.CSSProperties = { objectFit: 'cover', objectPosition: 'center 30%' }

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
      sizes="(max-width:640px) 100vw, (max-width:1232px) calc(50vw - 22px), 578px"
      style={CENTER_CROP}
      unoptimized={unoptimized}
      priority={priority}
      onError={() => setHasError(true)}
    />
  )
}
