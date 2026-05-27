'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'

const publicLinks = [
  { label: '스튜디오 소개', href: '/about' },
  { label: '클래스 소개', href: '/classes' },
  { label: '멤버 혜택', href: '/benefits' },
]

const crewLinks = [
  { label: '클래스 신청', href: '/enroll', public: true },
  { label: '배우 DB', href: '/actors', public: true },
  { label: '커뮤니티', href: '/board', public: false },
  { label: '대본 분석', href: '/ai-tools', public: false },
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
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const mobileOverlayRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

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

  /* ── 데스크탑 크루 드롭다운 Escape 닫기 ── */
  useEffect(() => {
    if (!crewDropOpen) return
    const onCrewKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCrewDropOpen(false)
    }
    document.addEventListener('keydown', onCrewKey)
    return () => document.removeEventListener('keydown', onCrewKey)
  }, [crewDropOpen])

  /* ── Escape 키로 모바일 메뉴 닫기 + Tab 포커스 트랩 ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!mobileOpen) return
      if (e.key === 'Escape') { setMobileOpen(false); return }
      if (e.key === 'Tab') {
        const overlay = mobileOverlayRef.current
        if (!overlay) return
        const focusables = Array.from(overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  /* ── 모바일 오버레이 열릴 때 포커스 이동, 닫힐 때 햄버거로 복귀 ── */
  useEffect(() => {
    if (mobileOpen) {
      const overlay = mobileOverlayRef.current
      if (!overlay) return
      const focusables = overlay.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      focusables[0]?.focus()
    } else {
      hamburgerRef.current?.focus()
    }
  }, [mobileOpen])

  /* ── 인증 상태 & 역할 fetch — Supabase 클라이언트 동적 로드 (메인 페이지 초기 번들에서 제외) ── */
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setAuthLoaded(true)
      return
    }
    let unsub: (() => void) | undefined
    let cancelled = false

    ;(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      if (cancelled) return
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
          .maybeSingle()
        setUserRole((data?.role as UserRole) || 'user')
        setAuthLoaded(true)
      }

      fetchRole()

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        // INITIAL_SESSION은 마운트 시 fetchRole()이 이미 호출되므로 중복 제외
        if (event !== 'INITIAL_SESSION') fetchRole()
      })
      unsub = () => subscription.unsubscribe()
    })()

    return () => {
      cancelled = true
      unsub?.()
    }
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
  useEffect(() => () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current) }, [])
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
        aria-label="주 내비게이션"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: 'background 0.3s ease, border-color 0.3s ease',
          background: scrolled ? 'rgba(240, 240, 232, 0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'none',
          willChange: 'background',
          borderBottom: scrolled
            ? '1px solid rgba(210, 210, 200, 0.6)'
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="/heart-logo.png"
              alt="KD4 Acting Studio"
              width={400}
              height={400}
              sizes="44px"
              priority
              style={{
                height: '44px',
                width: 'auto',
                objectFit: 'contain',
                background: '#D5D0C8',
                borderRadius: '6px',
                padding: '4px 8px',
              }}
            />
          </Link>

          {/* ── Desktop Nav ── */}
          {/* role="list": listStyle:none 시 Safari VoiceOver 리스트 의미 보존 (WCAG 1.3.1) */}
          <ul
            role="list"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3rem',
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
                  aria-current={pathname === link.href ? 'page' : undefined}
                  style={{
                    color: pathname === link.href ? 'var(--navy)' : '#111111',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: pathname === link.href ? 700 : 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
                  onMouseLeave={e => (e.currentTarget.style.color = pathname === link.href ? 'var(--navy)' : '#111111')}
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
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: crewDropOpen ? 'var(--navy)' : '#111111',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'color 0.2s',
                    padding: '4px 0',
                    minHeight: 44,
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
                  onMouseLeave={e => {
                    if (!crewDropOpen) e.currentTarget.style.color = '#111111'
                  }}
                  aria-expanded={crewDropOpen}
                  aria-controls="crew-nav-panel"
                  aria-haspopup="true"
                  onClick={() => setCrewDropOpen(v => !v)}
                >
                  KD4 크루
                  <svg
                    aria-hidden="true"
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

                {/* 드롭다운 패널 — 항상 DOM에 존재 (aria-controls 참조 깨짐 방지), hidden으로 숨김 */}
                <div
                  id="crew-nav-panel"
                  aria-label="KD4 크루 메뉴"
                  hidden={!crewDropOpen}
                  onMouseEnter={handleDropEnter}
                  onMouseLeave={handleDropLeave}
                  style={{
                    display: crewDropOpen ? 'block' : 'none',
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#E8E8DF',
                    border: '1px solid rgba(21,72,138,0.2)',
                    borderRadius: '8px',
                    padding: '8px',
                    minWidth: '150px',
                    boxShadow: '0 8px 24px rgba(21,72,138,0.12)',
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
                      borderBottom: '5px solid rgba(21,72,138,0.2)',
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
                      borderBottom: '5px solid #E8E8DF',
                    }} />

                    {crewLinks.map(item => (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={pathname === item.href ? 'page' : undefined}
                        onClick={item.public ? undefined : (e => handleCrewLinkClick(e, item.href))}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          color: pathname === item.href ? 'var(--navy)' : 'var(--gray-light)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.85rem',
                          fontWeight: pathname === item.href ? 700 : 500,
                          borderRadius: '5px',
                          transition: 'background 0.15s, color 0.15s',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(21,72,138,0.08)'
                          e.currentTarget.style.color = 'var(--navy)'
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
              </li>
            )}
          </ul>

          {/* ── CTA + 햄버거 ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 로그인/마이페이지 진입점 — 데스크탑 */}
            {authLoaded && !isLoggedIn && (
              <Link
                href="/auth/login"
                className="desktop-auth"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  padding: '8px 12px',
                  color: '#111111',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#111111')}
              >
                로그인
              </Link>
            )}
            {authLoaded && isLoggedIn && (
              <Link
                href="/dashboard"
                className="desktop-auth"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  padding: '8px 12px',
                  color: '#111111',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#111111')}
              >
                마이페이지
              </Link>
            )}

            <Link
              href="/enroll"
              className="desktop-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 20px',
                minHeight: 44,
                background: 'var(--gold)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.825rem',
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                letterSpacing: '0.04em',
                transition: 'background 0.2s, opacity 0.2s',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
            >
              클래스 신청
            </Link>

            {/* 햄버거 */}
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileOpen}
              aria-haspopup="dialog"
              aria-controls="mobile-nav-overlay"
              className="hamburger-btn"
              style={{
                display: 'none',
                flexDirection: 'column',
                gap: '5px',
                padding: '10px 11px',
                minHeight: 44,
                minWidth: 44,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                display: 'block',
                width: '22px',
                height: '2px',
                background: '#111111',
                borderRadius: '1px',
                transition: 'transform 0.25s, opacity 0.25s',
                transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block',
                width: '22px',
                height: '2px',
                background: '#111111',
                borderRadius: '1px',
                transition: 'opacity 0.25s',
                opacity: mobileOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block',
                width: '22px',
                height: '2px',
                background: '#111111',
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
          ref={mobileOverlayRef}
          id="mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="사이트 메뉴"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingTop: '72px',
            paddingBottom: '32px',
          }}
        >
          <nav aria-label="사이트 내비게이션" style={{ width: '100%', padding: '0 32px', flex: 1 }}>
            <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {/* 공개 링크 */}
              {publicLinks.map(link => (
                <li key={link.label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Link
                    href={link.href}
                    onClick={closeMobile}
                    aria-current={pathname === link.href ? 'page' : undefined}
                    style={{
                      display: 'block',
                      padding: '22px 0',
                      color: pathname === link.href ? 'var(--navy)' : '#111111',
                      fontFamily: 'var(--font-display), Oswald, sans-serif',
                      fontSize: '1.5rem',
                      fontWeight: pathname === link.href ? 700 : 400,
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
                    type="button"
                    onClick={() => setMobileCrewOpen(v => !v)}
                    aria-expanded={mobileCrewOpen}
                    aria-controls="mobile-crew-panel"
                    aria-label={mobileCrewOpen ? 'KD4 크루 메뉴 닫기' : 'KD4 크루 메뉴 열기'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '22px 0',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: mobileCrewOpen ? 'var(--navy)' : '#111111',
                      fontFamily: 'var(--font-display), Oswald, sans-serif',
                      fontSize: '1.5rem',
                      fontWeight: 400,
                      letterSpacing: '0.05em',
                      textAlign: 'left',
                    }}
                  >
                    KD4 크루
                    <svg
                      aria-hidden="true"
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
                    <div id="mobile-crew-panel" style={{
                      paddingBottom: '12px',
                      borderTop: '1px solid rgba(21,72,138,0.15)',
                      marginTop: '-4px',
                    }}>
                      {crewLinks.map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={item.public
                            ? closeMobile
                            : (e => { handleCrewLinkClick(e, item.href); if (isLoggedIn) closeMobile() })}
                          style={{
                            display: 'block',
                            padding: '14px 16px',
                            color: 'var(--gray-light)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '1.1rem',
                            fontWeight: 400,
                            letterSpacing: '0.03em',
                            textDecoration: 'none',
                            borderBottom: '1px solid rgba(17,17,17,0.06)',
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
              {/* 로그인/마이페이지 모바일 진입점 */}
              {authLoaded && (
                <Link
                  href={isLoggedIn ? '/dashboard' : '/auth/login'}
                  onClick={closeMobile}
                  style={{
                    display: 'block',
                    padding: '15px',
                    background: 'transparent',
                    border: '1px solid var(--border-strong)',
                    color: '#111111',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius)',
                    textAlign: 'center',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  {isLoggedIn ? '마이페이지' : '로그인'}
                </Link>
              )}
              <Link
                href="/enroll"
                onClick={closeMobile}
                style={{
                  display: 'block',
                  padding: '16px',
                  background: 'var(--navy)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                }}
              >
                클래스 신청하기
              </Link>
              <a
                href="https://pf.kakao.com/_ximxdqn"
                target="_blank" rel="noopener noreferrer"
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '15px',
                  background: 'transparent',
                  border: '1px solid var(--navy)',
                  color: 'var(--navy)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                }}
              >
                <Image src="/icons/kakao.png" alt="" aria-hidden="true" width={18} height={18} style={{ objectFit: 'contain' }} />
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
          .desktop-auth { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
