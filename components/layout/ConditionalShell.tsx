'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingCTA from '@/components/layout/FloatingCTA'

/** 광고 랜딩 등 클린 라우트에서 Navbar/Footer/FloatingCTA를 완전 제거 */
const CLEAN_ROUTES = ['/join', '/game']

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isClean = CLEAN_ROUTES.some((r) => pathname.startsWith(r))

  if (isClean) return <>{children}</>

  return (
    <>
      {/* Skip navigation link — keyboard/AT accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'fixed',
          top: '-100px',
          left: '8px',
          zIndex: 9999,
          padding: '8px 16px',
          background: 'var(--gold)',
          color: 'var(--bg)',
          fontWeight: 700,
          borderRadius: '4px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-sans)',
        }}
        onFocus={e => { e.currentTarget.style.top = '8px' }}
        onBlur={e => { e.currentTarget.style.top = '-100px' }}
      >
        본문 바로가기
      </a>
      <Navbar />
      <main id="main-content" style={{ paddingBottom: '88px' }}>{children}</main>
      <Footer />
      <FloatingCTA />
    </>
  )
}
