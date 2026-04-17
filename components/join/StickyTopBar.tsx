'use client'

import CountdownTimer from '@/components/ui/CountdownTimer'

/** /join 랜딩 전용 — 항상 상단에 고정되는 긴급 바 */
export default function StickyTopBar({ deadline }: { deadline: string }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: '#0d0d0d',
        padding: '9px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      {/* 잔여석 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            display: 'inline-block',
            boxShadow: '0 0 5px #ef4444',
          }}
        />
        <span style={{ fontSize: '0.79rem', color: '#ffffff', fontWeight: 700 }}>
          잔여석{' '}
          <span style={{ color: '#FEE500' }}>5석</span>
        </span>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>|</span>

      {/* 카운트다운 */}
      <span style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.7)' }}>봄맞이 마감까지</span>
      <CountdownTimer deadline={deadline} compact />

      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>|</span>

      {/* CTA */}
      <a
        href="#form"
        style={{
          background: '#15488A',
          color: '#ffffff',
          padding: '5px 14px',
          borderRadius: '20px',
          fontSize: '0.77rem',
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        무료 상담 →
      </a>
    </div>
  )
}
