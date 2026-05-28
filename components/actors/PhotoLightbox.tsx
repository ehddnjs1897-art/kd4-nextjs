'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Photo {
  url: string
  alt?: string
}

interface Props {
  photos: Photo[]
  /** 활성 사진 인덱스. null이면 닫힘. */
  activeIndex: number | null
  /** 이미지 우클릭/드래그 방지 (보호 모드) */
  imageProtected?: boolean
  onClose: () => void
  /** 인덱스 변경 시 호출 (←/→ 키 또는 썸네일 클릭) */
  onChange: (next: number) => void
}

/**
 * 사진 라이트박스 — 클릭 시 확대, 키보드 ←/→/ESC, 백드롭 클릭 닫기.
 * 접근성: role=dialog + aria-modal + ESC + focus trap.
 * KD4 디자인: 베이지 배경 톤 유지 (#15488A 네이비 강조).
 */
export default function PhotoLightbox({
  photos,
  activeIndex,
  imageProtected = false,
  onClose,
  onChange,
}: Props) {
  const open = activeIndex !== null
  const [imgLoaded, setImgLoaded] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // 키보드 핸들러
  useEffect(() => {
    if (!open) return
    setImgLoaded(false)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && activeIndex! > 0) {
        e.preventDefault()
        onChange(activeIndex! - 1)
      } else if (e.key === 'ArrowRight' && activeIndex! < photos.length - 1) {
        e.preventDefault()
        onChange(activeIndex! + 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, activeIndex, photos.length, onClose, onChange])

  // 열렸을 때 닫기 버튼에 포커스 + body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => { document.body.style.overflow = prevOverflow }
  }, [open])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  if (!open) return null
  const current = photos[activeIndex!]
  if (!current) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt ?? `사진 ${activeIndex! + 1} / ${photos.length}`}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(20px, 4vw, 56px)',
      }}
    >
      {/* 닫기 버튼 */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="라이트박스 닫기"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          fontSize: '1.4rem',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span aria-hidden="true">×</span>
      </button>

      {/* 이전 버튼 */}
      {activeIndex! > 0 && (
        <button
          type="button"
          onClick={() => onChange(activeIndex! - 1)}
          aria-label="이전 사진"
          style={{
            position: 'absolute',
            left: 'clamp(10px, 2vw, 24px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            fontSize: '1.5rem',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <span aria-hidden="true">‹</span>
        </button>
      )}

      {/* 다음 버튼 */}
      {activeIndex! < photos.length - 1 && (
        <button
          type="button"
          onClick={() => onChange(activeIndex! + 1)}
          aria-label="다음 사진"
          style={{
            position: 'absolute',
            right: 'clamp(10px, 2vw, 24px)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            fontSize: '1.5rem',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <span aria-hidden="true">›</span>
        </button>
      )}

      {/* 이미지 컨테이너 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          height: '100%',
          maxHeight: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onContextMenu={imageProtected ? (e) => e.preventDefault() : undefined}
        onDragStart={(e) => e.preventDefault()}
      >
        {!imgLoaded && (
          <div aria-hidden="true" style={{
            position: 'absolute',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
          }}>
            불러오는 중…
          </div>
        )}
        {imageProtected ? (
          <div
            role="img"
            aria-label={current.alt ?? `사진 ${activeIndex! + 1}`}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url("${current.url}")`,
              backgroundPosition: 'center',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={current.url}
            alt={current.alt ?? `사진 ${activeIndex! + 1}`}
            onLoad={() => setImgLoaded(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.2s',
              borderRadius: 4,
            }}
          />
        )}
      </div>

      {/* 인덱스 표시 */}
      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.85rem',
          background: 'rgba(0,0,0,0.4)',
          padding: '6px 14px',
          borderRadius: 20,
          letterSpacing: '0.05em',
          fontFamily: 'var(--font-display)',
        }}
      >
        {activeIndex! + 1} / {photos.length}
      </div>
    </div>
  )
}
