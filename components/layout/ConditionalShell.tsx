'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingCTA from '@/components/layout/FloatingCTA'

/** 광고 랜딩 등 클린 라우트에서 Navbar/Footer/FloatingCTA를 완전 제거 */
const CLEAN_ROUTES = ['/join']

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
      <Navbar />
      <main style={{ paddingBottom: '88px' }}>{children}</main>
      <Footer />
      <FloatingCTA />
    </>
  )
}
