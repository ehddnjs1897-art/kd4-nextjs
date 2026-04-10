'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: '스튜디오 소개', href: '/about' },
  { label: '클래스', href: '/#classes' },
  { label: '배우 DB', href: '/actors' },
  { label: '커뮤니티', href: '/board' },
  { label: '대본 분석', href: '/ai-tools' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

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
          {/* Logo */}
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
                fontWeight: 300,
                color: 'var(--gray-light)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Acting Studio
            </span>
          </Link>

          {/* Desktop Nav */}
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
            {navLinks.map(link => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  style={{
                    color: 'var(--gray-light)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA + Hamburger */}
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
                color: '#0a0a0a',
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

            {/* Hamburger */}
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
              <span
                style={{
                  display: 'block',
                  width: '22px',
                  height: '2px',
                  background: 'var(--white)',
                  borderRadius: '1px',
                  transition: 'transform 0.25s, opacity 0.25s',
                  transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '22px',
                  height: '2px',
                  background: 'var(--white)',
                  borderRadius: '1px',
                  transition: 'opacity 0.25s',
                  opacity: mobileOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '22px',
                  height: '2px',
                  background: 'var(--white)',
                  borderRadius: '1px',
                  transition: 'transform 0.25s, opacity 0.25s',
                  transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(10, 10, 10, 0.99)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <nav style={{ width: '100%', padding: '0 32px' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {navLinks.map(link => (
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
            </ul>

            <a
              href="https://forms.gle/68E7yFFFoDiPCRwD9"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobile}
              style={{
                display: 'block',
                marginTop: '32px',
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
              수강신청
            </a>
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
