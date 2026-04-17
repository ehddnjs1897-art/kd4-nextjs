'use client'

import { ArrowRight } from 'lucide-react'
import CountdownTimer from '@/components/ui/CountdownTimer'

/** /join 랜딩 전용 — kd4.club 톤 일관성 유지. 노란색 사용 안 함. */
export default function StickyTopBar({ deadline }: { deadline: string }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 잔여석 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#C73E3E',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: '0.78rem', color: '#111111', fontWeight: 600 }}>
          잔여석{' '}
          <strong style={{ color: 'var(--navy)' }}>5석</strong>
        </span>
      </div>

      <span style={{ color: 'var(--border-strong)', fontSize: '0.72rem' }}>|</span>

      {/* 카운트다운 */}
      <span style={{ fontSize: '0.76rem', color: 'var(--gray-light)' }}>봄맞이 할인 마감까지</span>
      <span style={{ color: 'var(--navy)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem' }}>
        <CountdownTimer deadline={deadline} compact />
      </span>

      <span style={{ color: 'var(--border-strong)', fontSize: '0.72rem' }}>|</span>

      {/* CTA */}
      <a
        href="#form"
        style={{
          background: 'var(--navy)',
          color: '#ffffff',
          padding: '6px 14px',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        무료 상담
        <ArrowRight size={12} strokeWidth={2.5} />
      </a>
    </div>
  )
}
