'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'

const publicLinks = [
  { label: '스튜디오 소개', href: '/about' },
  { label: '클래스 소개', href: '/classes' },
  { label: '후기', href: '/reviews' },
  { label: '멤버 혜택', href: '/benefits' },
  { label: 'FAQ', href: '/faq' },
]

// 멤버 전용 콘텐츠(배우 DB·독백 아카이브)는 메인 내비에 중복 노출하지 않고
// KD4 크루 드롭다운에서만 — 2026-07-10 대표 지시 ("배우DB 독백아카이브 크루 드롭박스에 넣어, 중복 없게")
const crewLinks = [
  { label: '무료 상담 신청', href: '/join', public: true },
  { label: '배우 DB', href: '/actors', public: true },
  { label: '독백 아카이브', href: '/monologues', public: true },
  { label: '커뮤니티', href: '/board', public: false },
  { label: '대본 분석', href: '/ai-tools', public: false },
]

type UserRole = 'user' | 'actor' | 'director_pending' | 'director' | 'crew_pending' | 'crew' | 'editor' | 'admin' | null

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [crewDropOpen, setCrewDropOpen] = useState(false)
  const [mobileCrewOpen, setMobileCrewOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [myActorId, setMyActorId] = useState<string | null>(null)
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

  /* ── 경로가 바뀌면 열려 있는 메뉴 전부 닫기 — 전체화면 모바일 오버레이가
     새 페이지를 가려 "눌러도 아무 반응 없음"으로 보이는 사고 방지 (2026-07-23 대표 제보) ── */
  useEffect(() => {
    setMobileOpen(false)
    setMobileCrewOpen(false)
    setCrewDropOpen(false)
  }, [pathname])

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
          setMyActorId(null)   // 비로그인/로그아웃 → '내 배우 DB' 링크 즉시 숨김 (이전 로그인 값 잔류 방지)
          setAuthLoaded(true)
          return
        }
        const { data } = await supabase
          .from('profiles')
          .select('role, actor_id')
          .eq('id', user.id)
          .maybeSingle()
        setUserRole((data?.role as UserRole) || 'user')
        setMyActorId(data?.actor_id ?? null)
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

  const router = useRouter()

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserRole(null)
    setMyActorId(null)
    router.push('/')
  }

  /* ── 크루 링크 클릭: 비로그인 시 회원가입 페이지로 안내 (2026-07-23 대표 지시 —
     "아무 응답 없음" 금지, 회원가입으로. next로 가입/로그인 후 원래 목적지 복귀) ── */
  const handleCrewLinkClick = (e: React.MouseEvent, href: string) => {
    if (!isLoggedIn) {
      e.preventDefault()
      router.push(`/auth/signup?next=${encodeURIComponent(href)}`)
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
      {/* 건너뛰기 링크 — 키보드 사용자가 반복 내비게이션을 건너뛸 수 있도록 (WCAG 2.4.1) */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 9999,
          padding: '8px 16px',
          background: 'var(--navy)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.875rem',
          textDecoration: 'none',
          borderRadius: '0 0 6px 0',
          transform: 'translateY(-100%)',
          transition: 'transform 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
        onBlur={(e) => { e.currentTarget.style.transform = 'translateY(-100%)' }}
      >
        본문 바로가기
      </a>
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
              gap: '1.5rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
            className="desktop-nav"
          >
            {/* 공개 링크 — whiteSpace:nowrap + flexShrink:0 필수: 없으면 항목이 늘면서(독백 아카이브·FAQ 추가 등)
                좁아진 폭을 flexbox가 강제로 나눠 가지면서 "배우 DB" 같은 텍스트가 글자 단위로 줄바꿈됨
                (2026-07-10 로그인 시 텍스트 밀림 제보 — 실측상 로그인 상태에서 1200px 컨테이너 기준 69px 초과) */}
            {publicLinks.map(link => (
              <li key={link.label} style={{ flexShrink: 0 }}>
                <Link
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
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
                style={{ position: 'relative', flexShrink: 0 }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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
            {/* 회원가입 — 비로그인 시 상단에 또렷하게 (네이비 아웃라인 버튼) */}
            {authLoaded && !isLoggedIn && (
              <Link
                href="/auth/signup"
                className="desktop-auth"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 44,
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--navy)',
                  border: '1px solid var(--navy)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--navy)' }}
              >
                회원가입
              </Link>
            )}
            {authLoaded && isLoggedIn && (
              <Link
                href={myActorId ? `/actors/${myActorId}` : '/dashboard/edit'}
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
                내 배우 DB
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
            {authLoaded && isLoggedIn && (
              <button
                type="button"
                className="desktop-auth"
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 44,
                  padding: '8px 12px',
                  color: '#888',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#888')}
              >
                로그아웃
              </button>
            )}

            <Link
              href="/join"
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
              무료 상담 신청
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
                            : (e => { handleCrewLinkClick(e, item.href); closeMobile() })}
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
              {/* 회원가입 — 비로그인 시 또렷하게 (네이비 채움 버튼) */}
              {authLoaded && !isLoggedIn && (
                <Link
                  href="/auth/signup"
                  onClick={closeMobile}
                  style={{
                    display: 'block',
                    padding: '15px',
                    background: 'var(--navy)',
                    border: '1px solid var(--navy)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius)',
                    textAlign: 'center',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  회원가입
                </Link>
              )}
              {authLoaded && isLoggedIn && (
                <button
                  type="button"
                  onClick={() => { closeMobile(); handleLogout() }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '15px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: '#888',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius)',
                    textAlign: 'center',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                  }}
                >
                  로그아웃
                </button>
              )}
              <Link
                href="/join"
                onClick={closeMobile}
                style={{
                  display: 'block',
                  padding: '16px',
                  background: 'var(--gold)',
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
                무료 상담 신청
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
        /* 1280px — 항목 5개(스튜디오소개·클래스소개·후기·멤버혜택·FAQ)+KD4크루+로그인상태
           (2026-07-10 배우DB·독백아카이브는 KD4크루 드롭다운으로 이동 — 중복 제거)
           실측상 1200px 컨테이너에서도 69px 초과했던 7개 시절 기준값 그대로 유지(여유만 커짐) */
        @media (max-width: 1280px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .desktop-auth { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}
