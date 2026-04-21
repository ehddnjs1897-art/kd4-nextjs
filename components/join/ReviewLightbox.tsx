'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, Quote } from 'lucide-react'

export interface ReviewItem {
  id: string
  image: string
  author: string
  cohort: string
  summary: string
  fullQuote: string
}

export default function ReviewLightbox({
  review,
  onClose,
}: {
  review: ReviewItem | null
  onClose: () => void
}) {
  // ESC 로 닫기 + 스크롤 락
  useEffect(() => {
    if (!review) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [review, onClose])

  if (!review) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${review.author} 후기 원문`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15,20,35,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 40px)',
        animation: 'fadeIn 0.2s ease-out',
        backdropFilter: 'blur(6px)',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        style={{
          position: 'fixed',
          top: 'clamp(16px, 3vw, 28px)',
          right: 'clamp(16px, 3vw, 28px)',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#ffffff',
          zIndex: 2,
        }}
      >
        <X size={22} strokeWidth={1.8} />
      </button>

      {/* 콘텐츠 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '20px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.28s ease-out',
        }}
      >
        {/* 원본 카톡 이미지 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 4',
            maxHeight: '60vh',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0f1423',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <Image
            src={review.image}
            alt={`${review.author} 후기 — ${review.summary}`}
            fill
            sizes="(max-width: 768px) 90vw, 640px"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* 인용 텍스트 블록 */}
        <figure
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: 'clamp(20px, 4vw, 28px)',
            margin: 0,
          }}
        >
          <Quote
            size={22}
            color="var(--navy)"
            strokeWidth={1.3}
            style={{ opacity: 0.3, marginBottom: '10px' }}
          />
          <blockquote
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(0.98rem, 2.4vw, 1.08rem)',
              lineHeight: 1.85,
              color: '#111111',
              margin: 0,
              marginBottom: '18px',
            }}
          >
            {review.fullQuote}
          </blockquote>
          <figcaption
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ fontWeight: 700, color: '#111111' }}>— {review.author}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
