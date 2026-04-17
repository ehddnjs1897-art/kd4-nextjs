'use client'

import { ArrowRight } from 'lucide-react'
import CountdownTimer from '@/components/ui/CountdownTimer'

/**
 * /join 전용 상단 고정 바.
 * - lib/classes.ts 데이터 기반 잔여석(props)
 * - 모바일에서도 1줄로 떨어지도록 콘텐츠 간소화
 * - 노란색 사용 안 함 (kd4.club 톤 일관성)
 */
export default function StickyTopBar({
  deadline,
  seats,
}: {
  deadline: string
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
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'nowrap',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      {/* 잔여석 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent-red)',
          }}
        />
        <span style={{ fontSize: '0.76rem', color: '#111', fontWeight: 600 }}>
          잔여석 <strong style={{ color: 'var(--navy)' }}>{seats}석</strong>
        </span>
      </div>

      {/* 데스크탑 전용 중간 */}
      <span
        style={{
          color: 'var(--border-strong)',
          fontSize: '0.72rem',
          flexShrink: 0,
        }}
        className="sticky-bar-divider"
      >
        |
      </span>

      {/* 카운트다운 */}
      <span
        style={{
          color: 'var(--navy)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '0.78rem',
          flexShrink: 0,
        }}
      >
        <CountdownTimer deadline={deadline} compact />
      </span>

      {/* CTA — 모바일 우선 */}
      <a
        href="#form"
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
