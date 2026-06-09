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
  cohorts,
}: {
  seats?: number
  cohorts?: Cohort[]
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
        gap: '8px',
        rowGap: '5px',
        flexWrap: 'wrap',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 첫 달 라벨 */}
      <span style={{ fontSize: '0.7rem', color: 'var(--gray)', flexShrink: 0 }}>
        첫 달
      </span>

      {/* 클래스별 가격 + HOT 뱃지 */}
      {cohorts && cohorts.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: '4px', gap: '6px', flex: 1, minWidth: 0 }}>
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
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', background: 'var(--accent-red)', borderRadius: '999px', padding: '2px 7px', letterSpacing: '0.04em' }}>
                🔥 HOT
              </span>
            </span>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-display)', flex: 1 }}>
          ₩250,000~ &nbsp;
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', background: 'var(--accent-red)', borderRadius: '999px', padding: '2px 7px', letterSpacing: '0.04em' }}>
            🔥 HOT
          </span>
        </span>
      )}

      {/* CTA */}
      <a
        href="#form-hero"
        aria-label="무료 상담 신청 폼으로 이동"
        style={{
          background: 'var(--navy)',
          color: '#ffffff',
          padding: '5px 12px',
          minHeight: 44,
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
        <ArrowRight aria-hidden={true} size={11} strokeWidth={2.2} />
      </a>
    </div>
  )
}
