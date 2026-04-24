'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ReviewItem } from './ReviewLightbox'

export default function ReviewGrid({ reviews }: { reviews: ReviewItem[] }) {
  const [open, setOpen] = useState<ReviewItem | null>(null)

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(12px, 2.5vw, 20px)',
          maxWidth: '980px',
          margin: '0 auto',
        }}
      >
        {reviews.map((r) => (
          <button
            key={r.id}
            onClick={() => setOpen(r)}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
            }}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'var(--bg2)' }}>
              <Image
                src={r.image}
                alt={r.summary}
                fill
                sizes="(max-width: 768px) 90vw, 280px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '4px', lineHeight: 1.4 }}>
                "{r.summary}"
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                {r.author} · {r.cohort}
              </p>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg)', borderRadius: 'var(--radius)',
              padding: '28px', maxWidth: '480px', width: '100%',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                fontSize: '1rem', lineHeight: 1.75, marginBottom: '16px', color: 'var(--navy)',
              }}
            >
              "{open.fullQuote}"
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
              {open.author} · {open.cohort}
            </p>
            <button
              onClick={() => setOpen(null)}
              style={{
                marginTop: '20px', padding: '8px 18px',
                background: 'var(--navy)', color: '#fff',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
