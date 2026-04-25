'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { pixel } from '@/lib/meta-pixel'

/** 배우DB · 커뮤니티 · 대본분석 · 인증 · 상담신청 페이지에서는 CTA 표시 안 함 */
const HIDE_ON: string[] = ['/actors', '/board', '/ai-tools', '/auth', '/dashboard', '/admin', '/join']

export default function FloatingCTA() {
  const pathname = usePathname()

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
        onClick={() => pixel.contact()}
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '20px',
          zIndex: 901,
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: '#FEE500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 12px rgba(21,72,138,0.22)',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          textDecoration: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 5px 16px rgba(21,72,138,0.32)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 3px 12px rgba(21,72,138,0.22)'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/kakao.png" alt="카카오톡" width={22} height={22} style={{ objectFit: 'contain' }} />
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
        <Link
          href="/join"
          onClick={() => pixel.contact()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '48px',
            background: 'var(--navy)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            fontSize: 'clamp(0.8rem, 3.2vw, 1rem)',
            letterSpacing: '0.01em',
            textDecoration: 'none',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(21,72,138,0.25)',
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
          상담 신청 →
        </Link>
      </div>
    </>
  )
}
