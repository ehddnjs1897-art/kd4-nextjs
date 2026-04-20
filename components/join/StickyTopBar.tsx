'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { analytics } from '@/lib/analytics'

interface Cohort {
  name: string
  cohort: string
  seats: number
}

/**
 * 상단 Sticky CTA — Hero 이후 스크롤 시 슬라이드다운 등장
 * - 초기 로드 시 숨김 (덜 공격적)
 * - 스크롤 300px 이후 노출
 * - 현재 모집 중인 반 2개 (마이즈너 정규 · 출연영상) 분류 표기
 * - 가격은 본문 가격 카드에서 확인
 */
export default function StickyTopBar({
  cohorts,
}: {
  deadline?: string
  cohorts: Cohort[]
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
      {/* 상단 라벨 — 현재 모집 중 안내 */}
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.62rem',
          letterSpacing: '0.12em',
          color: 'var(--navy)',
          textAlign: 'center',
          margin: '0 0 4px 0',
          textTransform: 'uppercase',
          fontWeight: 600,
          opacity: 0.75,
        }}
      >
        모집 중
      </p>

      {/* 반별 정보 · CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          rowGap: '4px',
        }}
      >
        {cohorts.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--navy)',
                letterSpacing: '0.01em',
              }}
            >
              {c.name} {c.cohort}
            </span>
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--accent-red)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--gray-light)',
                fontWeight: 600,
              }}
            >
              잔여 <strong style={{ color: 'var(--accent-red)' }}>{c.seats}석</strong>
            </span>
            {i < cohorts.length - 1 && (
              <span
                style={{
                  color: 'var(--border)',
                  fontSize: '0.7rem',
                  marginLeft: '4px',
                }}
              >
                |
              </span>
            )}
          </div>
        ))}

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
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            marginLeft: '4px',
          }}
        >
          무료 상담 신청
          <ArrowRight size={11} strokeWidth={2.2} />
        </a>
      </div>
    </div>
  )
}
