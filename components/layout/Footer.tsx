'use client'

import Link from 'next/link'
import { pixel } from '@/lib/meta-pixel'

const socialLinks = [
  {
    label: '인스타그램',
    href: 'https://www.instagram.com/kd4actingstudio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: '네이버 블로그',
    href: 'https://blog.naver.com/kd4actingstudio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
      </svg>
    ),
  },
  {
    label: '카카오 채널',
    href: 'https://pf.kakao.com/_ximxdqn',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.632 1.608 4.951 4.035 6.318L5.25 20.25l3.98-2.377A12.14 12.14 0 0 0 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        padding: '64px 0 40px',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--container)',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Top row: Logo + SNS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '2rem',
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

          {/* SNS Icons */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {socialLinks.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                onClick={s.label === '카카오 채널' ? () => pixel.contact() : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  color: 'var(--gray)',
                  transition: 'color 0.2s, border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--gold)'
                  e.currentTarget.style.borderColor = 'var(--gold)'
                  e.currentTarget.style.background = 'rgba(196,165,90,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--gray)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '32px' }} />

        {/* Contact & Address */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--gold)',
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 400,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Location
            </p>
            <p style={{ color: 'var(--gray-light)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              서울시 서대문구 대현동 90-7<br />
              아리움3차 1층 101호<br />
              <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>(신촌 대로)</span>
            </p>
          </div>

          <div>
            <p
              style={{
                color: 'var(--gold)',
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 400,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Contact
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <a
                  href="tel:010-8564-0244"
                  style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  010-8564-0244
                </a>
              </li>
              <li>
                <a
                  href="mailto:uikactors@gmail.com"
                  style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  uikactors@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/kd4actingstudio"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  인스타그램
                </a>
              </li>
              <li>
                <a
                  href="https://pf.kakao.com/_ximxdqn"
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => pixel.contact()}
                  style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  카카오채널
                </a>
              </li>
              <li>
                <a
                  href="https://blog.naver.com/kd4actingstudio"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  네이버 블로그
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@kd4actingstudio"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p
              style={{
                color: 'var(--gold)',
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 400,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Quick Links
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: '스튜디오 소개', href: '#about' },
                { label: '클래스 안내', href: '#classes' },
                { label: '배우 DB', href: '/actors' },
                { label: '커뮤니티', href: '/board' },
                { label: 'AI 도구', href: '/ai-tools' },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ color: 'var(--gray-light)', fontSize: '0.85rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-light)')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '24px' }} />

        {/* Bottom: Business info + Copyright */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ color: 'var(--gray)', fontSize: '0.75rem', lineHeight: 1.6 }}>
            유익액터스 &middot; 대표 권동원 &middot; 사업자등록번호 284-11-02669
          </p>
          <p style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>
            &copy; 2025 KD4 액팅 스튜디오. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
