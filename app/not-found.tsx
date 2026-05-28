import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  description: '요청하신 페이지를 찾을 수 없습니다. KD4 액팅 스튜디오 홈으로 이동하세요.',
  robots: { index: false },
}

const QUICK_LINKS = [
  { href: '/about', label: '스튜디오 소개', desc: 'KD4 철학과 마이즈너 테크닉' },
  { href: '/classes', label: '클래스 둘러보기', desc: '마이즈너 정규반·출연영상 외 9개' },
  { href: '/actors', label: '배우 DB', desc: 'KD4 멤버 프로필' },
  { href: '/join', label: '무료 상담 신청', desc: '30분 부담 없이' },
]

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '560px', width: '100%' }}>
        <p
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '5rem',
            fontWeight: 900,
            color: 'var(--gold)',
            lineHeight: 1,
            marginBottom: '16px',
            opacity: 0.6,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
            fontWeight: 700,
            color: 'var(--white)',
            marginBottom: '12px',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.02em',
          }}
        >
          페이지를 찾을 수 없습니다
        </h1>
        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--gray)',
            lineHeight: 1.7,
            marginBottom: '36px',
            wordBreak: 'keep-all',
          }}
        >
          요청하신 페이지가 존재하지 않거나 이동되었습니다.<br />
          아래에서 찾으시던 페이지로 이동해 보세요.
        </p>

        {/* 핵심 페이지 빠른 링크 — 이탈 방지 */}
        <ul
          role="list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            marginBottom: 28,
            listStyle: 'none',
            padding: 0,
            textAlign: 'left',
          }}
        >
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  minHeight: 44,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <p
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--white)',
                    marginBottom: 2,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {link.label}
                </p>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--gray)',
                    lineHeight: 1.5,
                    wordBreak: 'keep-all',
                  }}
                >
                  {link.desc}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {/* 홈으로 fallback */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 28px',
            minHeight: 44,
            background: 'var(--gold)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.05em',
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
