'use client'

import { ArrowRight } from 'lucide-react'

interface Cohort {
  name: string
  cohort: string
  seats: number
  price?: number   // 첫 달 가격 (원)
}

function wan(price: number) {
  return Math.round(price / 10000) + '만'
}

export default function StickyTopBar({
  seats,
  cohorts,
}: {
  deadline?: string
  seats?: number
  cohorts?: Cohort[]
}) {
  const totalSeats = cohorts
    ? cohorts.reduce((sum, c) => sum + c.seats, 0)
    : (seats ?? 0)

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
        gap: '8px',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {/* 첫 달 라벨 */}
      <span style={{ fontSize: '0.7rem', color: 'var(--gray)', flexShrink: 0 }}>
        첫 달
      </span>

      {/* 클래스별 가격 + 잔여석 */}
      {cohorts && cohorts.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {cohorts.map((c, i) => (
            <span key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {i > 0 && (
                <span style={{ color: 'var(--border)', fontSize: '0.68rem' }}>·</span>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-light)' }}>{c.name}</span>
              {c.price && (
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>
                  ₩{wan(c.price)}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-red)', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: '0.73rem', color: 'var(--white)', fontWeight: 600 }}>
                  {c.seats}석
                </span>
              </span>
            </span>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)', flex: 1 }}>
          ₩250,000~ &nbsp;
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-red)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.73rem', color: 'var(--white)', fontWeight: 600 }}>잔여 {totalSeats}석</span>
          </span>
        </span>
      )}

      {/* CTA */}
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
