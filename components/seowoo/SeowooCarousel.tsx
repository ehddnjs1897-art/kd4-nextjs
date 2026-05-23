'use client'

import Image from 'next/image'
import { useRef, useState, useCallback } from 'react'

const SLIDES = [
  { src: '/partners/seowoo-guide/01.webp', alt: '첫 프로필, 어떻게 찍어야 할까? — 프로필준비 A to Z' },
  { src: '/partners/seowoo-guide/02.webp', alt: '프로필사진 — 내 이미지를 보여주는 첫인상' },
  { src: '/partners/seowoo-guide/03.webp', alt: 'step.1 먼저 생각해보기' },
  { src: '/partners/seowoo-guide/04.webp', alt: 'step.2 의상 준비' },
  { src: '/partners/seowoo-guide/05.webp', alt: 'step.3 표정&포즈' },
  { src: '/partners/seowoo-guide/06.webp', alt: 'step.4 헤어&메이크업' },
  { src: '/partners/seowoo-guide/07.webp', alt: 'step.5 촬영 전 사전미팅' },
  { src: '/partners/seowoo-guide/08.webp', alt: 'step.6 촬영중엔 걱정마세요' },
  { src: '/partners/seowoo-guide/09.webp', alt: 'step.7 촬영 전날·당일날' },
  { src: '/partners/seowoo-guide/10.webp', alt: '누구나 처음은 있어요 — epilogue' },
]

export default function SeowooCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const item = track.children[index] as HTMLElement
    if (!item) return
    track.scrollTo({ left: item.offsetLeft, behavior: 'smooth' })
    setActive(index)
  }, [])

  const prev = () => scrollTo(Math.max(0, active - 1))
  const next = () => scrollTo(Math.min(SLIDES.length - 1, active + 1))

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const item = track.children[active] as HTMLElement
    const itemW = item?.offsetWidth ?? 1
    const idx = Math.round(track.scrollLeft / itemW)
    setActive(Math.max(0, Math.min(SLIDES.length - 1, idx)))
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* track */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="seowoo-carousel-track"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          gap: 12,
          borderRadius: 12,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              position: 'relative',
              aspectRatio: '4 / 5',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#f7f7f5',
              border: '1px solid var(--border)',
            }}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              style={{ objectFit: 'cover' }}
              loading={i === 0 ? 'eager' : 'lazy'}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* desktop arrows */}
      {active > 0 && (
        <button
          type="button"
          onClick={prev}
          aria-label="이전"
          style={{
            position: 'absolute',
            top: '50%',
            left: -20,
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            color: 'var(--white)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          ‹
        </button>
      )}
      {active < SLIDES.length - 1 && (
        <button
          type="button"
          onClick={next}
          aria-label="다음"
          style={{
            position: 'absolute',
            top: '50%',
            right: -20,
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            color: 'var(--white)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          ›
        </button>
      )}

      {/* dot indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`${i + 1}번 슬라이드`}
            aria-current={i === active ? 'true' : undefined}
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === active ? 'var(--gold)' : 'var(--border)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>

      {/* counter */}
      <p
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-display), Oswald, sans-serif',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          color: 'var(--secondary)',
          marginTop: 10,
        }}
      >
        {active + 1} / {SLIDES.length}
      </p>
    </div>
  )
}
