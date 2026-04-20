'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Quote, Maximize2 } from 'lucide-react'
import ReviewLightbox, { type ReviewItem } from './ReviewLightbox'
import { analytics } from '@/lib/analytics'

/**
 * 카톡 후기 그리드 — 하이브리드 B안
 * - 데스크톱 3열 × 2행 = 6장
 * - 태블릿 2열
 * - 모바일 1열 (완독률 우선)
 * - 카드 클릭 시 ReviewLightbox 로 원본 이미지 + 전체 인용 확대
 */
export default function ReviewGrid({ reviews }: { reviews: ReviewItem[] }) {
  const [open, setOpen] = useState<ReviewItem | null>(null)

  function handleOpen(r: ReviewItem) {
    setOpen(r)
    analytics.custom('ReviewOpen', { review_id: r.id, author: r.author })
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        {reviews.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => handleOpen(r)}
            className="review-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'left',
              padding: '22px 20px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'inherit',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(21,72,138,0.12)'
              e.currentTarget.style.borderColor = 'var(--navy)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            aria-label={`${r.author} 후기 — ${r.summary} · 탭해서 원본 보기`}
          >
            {/* 별점 */}
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  color="#F59E0B"
                  fill="#F59E0B"
                  strokeWidth={1.3}
                />
              ))}
            </div>

            {/* 카톡 썸네일 */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4 / 3',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
              }}
            >
              <Image
                src={r.image}
                alt={`${r.author} 카카오톡 후기`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1080px) 50vw, 340px"
                style={{ objectFit: 'cover', objectPosition: 'top' }}
              />
              {/* 확대 아이콘 힌트 */}
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(21,72,138,0.9)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Maximize2 size={13} strokeWidth={2} />
              </span>
            </div>

            {/* 인용 요약 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Quote
                size={16}
                color="var(--navy)"
                strokeWidth={1.4}
                style={{ opacity: 0.3, flexShrink: 0, marginTop: '2px' }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  color: '#111111',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                {r.summary}
              </p>
            </div>

            {/* 이름 + 기수 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                marginTop: 'auto',
                paddingTop: '6px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--navy)',
                }}
              >
                — {r.author}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--gray-light)',
                  letterSpacing: '0.01em',
                }}
              >
                {r.cohort}
              </span>
            </div>

            {/* 라이트박스 힌트 */}
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.68rem',
                color: 'var(--navy)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.75,
              }}
            >
              탭해서 원본 보기 →
            </span>
          </button>
        ))}
      </div>

      <ReviewLightbox review={open} onClose={() => setOpen(null)} />
    </>
  )
}
