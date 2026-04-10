'use client'

import { usePathname } from 'next/navigation'

/** 배우DB · 커뮤니티 · 대본분석 · 인증 페이지에서는 CTA 표시 안 함 */
const HIDE_ON: string[] = ['/actors', '/board', '/ai-tools', '/auth', '/dashboard', '/admin']

export default function FloatingCTA() {
  const pathname = usePathname()

  // 숨겨야 하는 경로 prefix 중 하나라도 일치하면 렌더하지 않음
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

      {/* 수강신청 바 */}
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
            background: '#4A7FFF',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 'clamp(0.68rem, 2.9vw, 0.9rem)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(74,127,255,0.45)',
            transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#3A6FEF'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(74,127,255,0.55)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#4A7FFF'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(74,127,255,0.45)'
          }}
        >
          지금 신청하면 10만원 즉시 할인 → 수강신청하기
        </a>
      </div>
    </>
  )
}
