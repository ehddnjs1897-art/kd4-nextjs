'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const publicLinks = [
  { label: '스튜디오 소개', href: '/about' },
  { label: '클래스', href: '/#classes' },
]

const crewLinks = [
  { label: '배우 DB', href: '/actors' },
  { label: '커뮤니티', href: '/board' },
  { label: '대본 분석', href: '/ai-tools' },
]

type UserRole = 'user' | 'crew_pending' | 'crew' | 'editor' | 'admin' | null

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [crewDropOpen, setCrewDropOpen] = useState(false)
  const [mobileCrewOpen, setMobileCrewOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── 스크롤 감지 ── */
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── 모바일 오버레이 시 body 스크롤 잠금 ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  /* ── 인증 상태 & 역할 fetch ── */
  useEffect(() => {
    const supabase = createClient()

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUserRole(null)
        setAuthLoaded(true)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setUserRole((data?.role as UserRole) || 'user')
      setAuthLoaded(true)
    }

    fetchRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole()
    })
    return () => subscription.unsubscribe()
  }, [])

  const isLoggedIn = authLoaded && userRole !== null
  const isCrewApproved = true  // 드롭다운은 항상 표시
  const closeMobile = () => setMobileOpen(false)

  /* ── 크루 링크 클릭: 비로그인 시 로그인 페이지로 ── */
  const router = useRouter()
  const handleCrewLinkClick = (e: React.MouseEvent, href: string) => {
    if (!isLoggedIn) {
      e.preventDefault()
      router.push(`/auth/login?next=${encodeURIComponent(href)}`)
    }
  }

  /* ── 드롭다운 hover (딜레이로 떨림 방지) ── */
  const handleDropEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setCrewDropOpen(true)
  }
  const handleDropLeave = () => {
    hoverTimeout.current = setTimeout(() => setCrewDropOpen(false), 120)
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: 'background 0.3s ease, border-color 0.3s ease',
          background: scrolled ? 'rgba(10, 10, 10, 0.96)' : 'transparent',
          willChange: 'background',
          borderBottom: scrolled
            ? '1px solid rgba(196, 165, 90, 0.15)'
            : '1px solid transparent',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container)',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* ── 로고 ── */}
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--gold)',
                letterSpacing: '0.05em',
              }}
            >
              KD4
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.55rem',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginTop: '6px',
              }}
            >
              Acting Studio
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <ul
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
            className="desktop-nav"
          >
            {/* 공개 링크 */}
            {publicLinks.map(link => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  style={{
                    color: '#ffffff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#ffffff')}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* KD4 크루 드롭다운 — 승인된 회원만 */}
            {isCrewApproved && (
              <li
                style={{ position: 'relative' }}
                onMouseEnter={handleDropEnter}
                onMouseLeave={handleDropLeave}
              >
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: crewDropOpen ? 'var(--gold)' : '#ffffff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'color 0.2s',
                    padding: '4px 0',
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => {
                    if (!crewDropOpen) e.currentTarget.style.color = '#ffffff'
                  }}
                  aria-haspopup="true"
                  aria-expanded={crewDropOpen}
                >
                  KD4 크루
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    style={{
                      transform: crewDropOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      marginTop: '1px',
                    }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* 드롭다운 패널 */}
                {crewDropOpen && (
                  <div
                    onMouseEnter={handleDropEnter}
                    onMouseLeave={handleDropLeave}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(17,17,17,0.98)',
                      border: '1px solid rgba(196,165,90,0.2)',
                      borderRadius: '8px',
                      padding: '8px',
                      minWidth: '150px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 10,
                    }}
                  >
                    {/* 위쪽 삼각형 */}
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid rgba(196,165,90,0.2)',
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid rgba(17,17,17,0.98)',
                    }} />

                    {crewLinks.map(item => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={e => handleCrewLinkClick(e, item.href)}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          color: 'var(--gray-light)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          borderRadius: '5px',
                          transition: 'background 0.15s, color 0.15s',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(196,165,90,0.1)'
                          e.currentTarget.style.color = 'var(--gold)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--gray-light)'
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}

                  </div>
                )}
              </li>
            )}
          </ul>

          {/* ── CTA + 햄버거 ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="https://forms.gle/68E7yFFFoDiPCRwD9"
              target="_blank"
              rel="noopener noreferrer"
              className="desktop-cta"
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: 'var(--gold)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.825rem',
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                letterSpacing: '0.04em',
                transition: 'background 0.2s, opacity 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
            >
              수강신청
            </a>

            {/* 햄버거 */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="메뉴 열기"
              className="hamburger-btn"
              style={{
                display: 'none',
                flexDirection: 'column',
                gap: '5px',
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                display: 'block',
                width: '22px',
                height: '2px',
                background: 'var(--white)',
                borderRadius: '1px',
                transition: 'transform 0.25s, opacity 0.25s',
                transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block',
                width: '22px',
                height: '2px',
                background: 'var(--white)',
                borderRadius: '1px',
                transition: 'opacity 0.25s',
                opacity: mobileOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block',
                width: '22px',
                height: '2px',
                background: 'var(--white)',
                borderRadius: '1px',
                transition: 'transform 0.25s, opacity 0.25s',
                transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── 모바일 오버레이 ── */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(10, 10, 10, 0.99)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingTop: '72px',
            paddingBottom: '32px',
          }}
        >
          <nav style={{ width: '100%', padding: '0 32px', flex: 1 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {/* 공개 링크 */}
              {publicLinks.map(link => (
                <li key={link.label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Link
                    href={link.href}
                    onClick={closeMobile}
                    style={{
                      display: 'block',
                      padding: '22px 0',
                      color: 'var(--white)',
                      fontFamily: 'var(--font-display), Oswald, sans-serif',
                      fontSize: '1.5rem',
                      fontWeight: 400,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {/* KD4 크루 아코디언 — 승인된 회원만 */}
              {isCrewApproved && (
                <li style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setMobileCrewOpen(v => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '22px 0',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: mobileCrewOpen ? 'var(--gold)' : 'var(--white)',
                      fontFamily: 'var(--font-display), Oswald, sans-serif',
                      fontSize: '1.5rem',
                      fontWeight: 400,
                      letterSpacing: '0.05em',
                      textAlign: 'left',
                    }}
                  >
                    KD4 크루
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      style={{
                        transform: mobileCrewOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                        color: 'var(--gold)',
                      }}
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </button>

                  {/* 아코디언 내부 링크 */}
                  {mobileCrewOpen && (
                    <div style={{
                      paddingBottom: '12px',
                      borderTop: '1px solid rgba(196,165,90,0.15)',
                      marginTop: '-4px',
                    }}>
                      {crewLinks.map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={e => { handleCrewLinkClick(e, item.href); if (isLoggedIn) closeMobile() }}
                          style={{
                            display: 'block',
                            padding: '14px 16px',
                            color: 'var(--gray-light)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '1.1rem',
                            fontWeight: 400,
                            letterSpacing: '0.03em',
                            textDecoration: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              )}
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
              <a
                href="https://forms.gle/68E7yFFFoDiPCRwD9"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobile}
                style={{
                  display: 'block',
                  padding: '16px',
                  background: 'var(--gold)',
                  color: '#0a0a0a',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  letterSpacing: '0.08em',
                }}
              >
                수강신청 하기
              </a>
              <a
                href="https://pf.kakao.com/_ximxdqn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobile}
                style={{
                  display: 'block',
                  padding: '15px',
                  background: '#FEE500',
                  color: '#191919',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                }}
              >
                카카오로 문의하기
              </a>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
