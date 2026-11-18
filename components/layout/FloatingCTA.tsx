'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { analytics } from '@/lib/analytics'

/** 배우DB · 커뮤니티 · 대본분석 · 인증 · 상담신청 페이지에서는 CTA 표시 안 함 */
const HIDE_ON: string[] = ['/actors', '/board', '/ai-tools', '/auth', '/dashboard', '/admin', '/join']

export default function FloatingCTA() {
  const pathname = usePathname()

  /* 홈 첫 화면 A안 (2026-11-16 대표 확정): 홈에서는 첫 화면에 밑줄 «상담 신청 →»이 이미 있으므로
     하단 막대는 첫 화면을 지난 뒤(화면 높이의 60% 이상 내린 뒤)에만 보인다. 다른 페이지는 예전 그대로 항상 표시. */
  const isHome = pathname === '/'
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6)
    const raf = requestAnimationFrame(onScroll)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isHome])

  /* 상담 버튼은 한 화면에 하나만 (2026-11-19 홈 피드백 «상담 신청 버튼 1개만 크게»):
     페이지 안의 상담 버튼(data-floating-cta-hide 표시)이 화면에 보이는 동안에는 아래 막대를 숨긴다. */
  /* 값에 페이지 주소를 같이 적어 두어, 다른 페이지로 옮기면 예전 페이지 값은 저절로 무시된다 */
  const [inlineCta, setInlineCta] = useState<{ path: string; visible: boolean }>({ path: '', visible: false })
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-floating-cta-hide]'))
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const seen = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target)
        else seen.delete(e.target)
      }
      setInlineCta({ path: pathname, visible: seen.size > 0 })
    })
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [pathname])
  const inlineCtaVisible = inlineCta.path === pathname && inlineCta.visible

  const barHidden = (isHome && !pastHero) || inlineCtaVisible

  const isHidden = HIDE_ON.some((prefix) => pathname.startsWith(prefix))
  if (isHidden) return null

  return (
    <>
      {/* 카카오 플로팅 버블 */}
      <a
        href="https://pf.kakao.com/_ximxdqn"
        target="_blank" rel="noopener noreferrer"
        aria-label="카카오 채널 상담"
        onClick={() => analytics.contact('kakao')}
        style={{
          position: 'fixed',
          bottom: barHidden ? '24px' : '84px',
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
          transition: 'transform 0.2s, box-shadow 0.2s, bottom 0.3s ease',
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
        <Image src="/icons/kakao.png" alt="카카오톡" width={22} height={22} style={{ objectFit: 'contain' }} />
      </a>

      {/* 수강신청 바 */}
      <div
        aria-hidden={barHidden || undefined}
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 900,
          opacity: barHidden ? 0 : 1,
          transform: barHidden ? 'translateY(14px)' : 'none',
          visibility: barHidden ? 'hidden' : 'visible',
          pointerEvents: barHidden ? 'none' : 'auto',
          transition: barHidden
            ? 'opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0.3s'
            : 'opacity 0.3s ease, transform 0.3s ease, visibility 0s',
        }}
      >
        <Link
          href="/join"
          onClick={() => analytics.ctaClick('floating_bar', '상담 신청')}
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
          상담 신청
        </Link>
      </div>
    </>
  )
}
