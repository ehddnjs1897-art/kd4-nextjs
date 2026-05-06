'use client'

// SPA 라우팅 대응 — 경로가 바뀔 때마다 GA4 page_view 이벤트 재발생
// Next.js App Router는 페이지 이동 시 HTML을 리로드하지 않으므로
// 이 컴포넌트 없이는 초기 진입 1회만 GA4에 기록됨
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? 'G-8122KKQZ99').trim()

export default function GAPageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !GA_ID ||
      typeof window === 'undefined' ||
      !window.gtag
    ) return

    window.gtag('config', GA_ID, {
      page_path: pathname,
    })
  }, [pathname])

  return null
}
