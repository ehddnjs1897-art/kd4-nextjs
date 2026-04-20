'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { analytics } from '@/lib/analytics'

/**
 * 상단 Sticky CTA — Hero 이후 스크롤 시 슬라이드다운 등장
 * - 초기 로드 시 숨김 (덜 공격적)
 * - 스크롤 300px 이후 노출 → Hero 대부분 지난 시점부터 따라다님
 * - 어떤 클래스 가격인지 상단 라벨에 명시 ("마이즈너 테크닉 정규반")
 */
export default function StickyTopBar({
  seats,
}: {
  deadline?: string
  seats: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        boxShadow: visible ? '0 2px 12px rgba(21,72,138,0.08)' : 'none',
        padding: '8px 16px',
        fontFamily: 'var(--font-sans)',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-hidden={!visible}
    >
      {/* 상단 라벨 — 어떤 클래스 가격인지 명시 */}
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.64rem',
          letterSpacing: '0.12em',
          color: 'var(--navy)',
          textAlign: 'center',
          margin: '0 0 4px 0',
          textTransform: 'uppercase',
          fontWeight: 600,
          opacity: 0.8,
        }}
      >
        마이즈너 테크닉 정규반
      </p>

      {/* 가격 · 잔여석 · CTA 한 줄 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {/* 첫 달 가격 */}
        <span style={{ fontSize: '0.74rem', color: 'var(--gray-light)', flexShrink: 0 }}>
          첫 달
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
          ₩250,000
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--gray)',
            textDecoration: 'line-through',
            flexShrink: 0,
          }}
        >
          ₩350,000
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
          <span style={{ fontSize: '0.74rem', color: 'var(--gray-light)', fontWeight: 600 }}>
            잔여 <strong style={{ color: 'var(--navy)' }}>{seats}석</strong>
          </span>
        </div>

        {/* CTA */}
        <a
          href="#form"
          onClick={() => analytics.ctaClick('sticky_top', '무료 상담 신청')}
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
            marginLeft: '6px',
          }}
        >
          무료 상담 신청
          <ArrowRight size={11} strokeWidth={2.2} />
        </a>
      </div>
    </div>
  )
}
