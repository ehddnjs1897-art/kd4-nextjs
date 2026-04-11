'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** 오늘 자정까지 남은 시간 계산 */
function getTimeLeft() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 배우DB · 커뮤니티 · 대본분석 · 인증 페이지에서는 CTA 표시 안 함 */
const HIDE_ON: string[] = ['/actors', '/board', '/ai-tools', '/auth', '/dashboard', '/admin']

export default function FloatingCTA() {
  const pathname = usePathname()
  const [countdown, setCountdown] = useState(getTimeLeft())

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeLeft()), 1_000)
    return () => clearInterval(id)
  }, [])

  const isHidden = HIDE_ON.some((prefix) => pathname.startsWith(prefix))
  if (isHidden) return null

  return (
    <>
      {/* 카카오 플로팅 버블 */}
      <a
        href="https://pf.kakao.com/_ximxdqn"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="카카오 채널 상담"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '20px',
          zIndex: 901,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#FEE500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          textDecoration: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/kakao.png" alt="카카오톡" width={28} height={28} style={{ objectFit: 'contain' }} />
      </a>

      {/* 수강신청 바 + 카운트다운 */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 900,
        }}
      >
        <a
          href="https://forms.gle/68E7yFFFoDiPCRwD9"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '48px',
            background: 'var(--gold)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 'clamp(0.72rem, 2.8vw, 0.9rem)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0,102,255,0.45)',
            animation: 'subtlePulse 2.5s ease-in-out infinite',
            transition: 'opacity 0.2s, transform 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.88'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span style={{ fontSize: '0.9em' }}>⏱</span>
          <span>5월 한정 10만원 할인</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontVariantNumeric: 'tabular-nums',
            background: 'rgba(0,0,0,0.2)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.85em',
            letterSpacing: '0.08em',
          }}>
            {countdown}
          </span>
          <span>→ 수강신청</span>
        </a>
      </div>
    </>
  )
}
