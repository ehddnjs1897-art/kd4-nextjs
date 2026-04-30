'use client'

import Image from 'next/image'

/**
 * 모바일 전용 Hero 정적 fallback.
 * Three.js HeroScene 대신 실제 폰에서 캡쳐한 첫 프레임 이미지를 보여줌.
 * 모바일 PageSpeed 최적화 (3D 자산 ~10MB 다운로드 회피).
 */
export default function HeroMobileFallback() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        background: '#E8E4D8',
      }}
    >
      <Image
        src="/images/hero-mobile.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    </div>
  )
}
