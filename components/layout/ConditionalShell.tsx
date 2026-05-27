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

  // /join, /game 등 클린 라우트도 <main> 랜드마크 필요 (WCAG 2.4.1)
  if (isClean) return <main id="main-content" style={{ paddingBottom: '80px' }}>{children}</main>

  return (
    <>
      {/* Skip navigation link — keyboard/AT accessibility (CSS .skip-nav handles show/hide via :focus-visible) */}
      <a href="#main-content" className="skip-nav">
        본문 바로가기
      </a>
      <Navbar />
      <main id="main-content" style={{ paddingBottom: '88px' }}>{children}</main>
      <Footer />
      <FloatingCTA />
    </>
  )
}
