'use client'

import { ArrowRight } from 'lucide-react'
import { analytics } from '@/lib/analytics'

export default function StickyTopBar({
  seats,
}: {
  deadline?: string
  seats: number
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '9px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'nowrap',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      {/* 월 수강료 */}
      <span style={{ fontSize: '0.76rem', color: 'var(--gray-light)', flexShrink: 0 }}>
        월 수강료
      </span>
      <span
        style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: 'var(--navy)',
          fontFamily: 'var(--font-display)',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        ₩250,000~
      </span>

      <span style={{ color: 'var(--border)', fontSize: '0.72rem', flexShrink: 0 }}>|</span>

      {/* 잔여석 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent-red)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.76rem', color: 'var(--white)', fontWeight: 600 }}>
          잔여 <strong style={{ color: 'var(--navy)' }}>{seats}석</strong>
        </span>
      </div>

      {/* CTA */}
      <a
        href="#form"
        onClick={() => analytics.ctaClick('sticky_top', '무료상담')}
        style={{
          background: 'var(--navy)',
          color: '#ffffff',
          padding: '5px 12px',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.73rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textDecoration: 'none',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
          marginLeft: 'auto',
        }}
      >
        무료상담
        <ArrowRight size={11} strokeWidth={2.2} />
      </a>
    </div>
  )
}
