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
  // 사진 비율 따라 크롭 자동 조정 (2026-07-01 대표 지시 — 얼굴 위주, 이력서 테두리 안 보이게):
  //  · 세로(헤드샷): 'center 30%' — 얼굴 T존 가운데, 확대 없음
  //  · 가로(이력서 합성이미지): 왼쪽 상단 얼굴로 확대(scale) — 오른쪽 이력서·테두리 잘라냄
  const PORTRAIT: React.CSSProperties = { objectFit: 'cover', objectPosition: 'center 30%' }
  const [imgStyle, setImgStyle] = useState<React.CSSProperties>(PORTRAIT)

  if (hasError) {
    return <InitialFallback name={alt} />
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width:640px) 100vw, (max-width:1232px) calc(50vw - 22px), 578px"
      style={imgStyle}
      unoptimized={unoptimized}
      priority={priority}
      onError={() => setHasError(true)}
      onLoad={(e) => {
        const img = e.currentTarget
        if (!img.naturalWidth || !img.naturalHeight) return
        const w = img.naturalWidth
        const h = img.naturalHeight
        if (!(w > h * 1.05)) { setImgStyle(PORTRAIT); return }
        // 가로 합성(헤드샷+이력서): 고정 배율(1.6) 크롭이 사진마다 얼굴을 빗나가던 것 →
        // 비율 기반 동적 계산 (2026-07-06 대표 지시: 얼굴 T존 센터, 텍스트형도 위치 일관).
        // 카드(3:4)가 cover로 보여주는 폭 = 0.75h. 헤드샷은 통상 왼쪽 ~45% 영역이므로
        // 보이는 창을 '왼쪽 45%'로 맞추는 배율을 각 사진 비율에서 계산. 세로는 상단 1/4(T존) 앵커.
        const visibleFrac = (0.75 * h) / w
        const scale = Math.min(2.2, Math.max(1, visibleFrac / 0.45))
        setImgStyle({
          objectFit: 'cover',
          objectPosition: 'left 25%',
          transform: `scale(${scale})`,
          transformOrigin: 'left 25%',
        })
      }}
    />
  )
}
