'use client'

// SPA 라우팅 대응 — 경로가 바뀔 때마다 GA4 page_view 이벤트 재발생
// Next.js App Router는 페이지 이동 시 HTML을 리로드하지 않으므로
// 이 컴포넌트 없이는 초기 진입 1회만 GA4에 기록됨
// ※ 초기 마운트는 스킵: GoogleAnalytics 인라인 스크립트의 gtag('config') 가
//   이미 첫 번째 page_view 를 GA4 로 전송하므로 여기서 중복 발생 방지
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? 'G-8122KKQZ99').trim()

export default function GAPageTracker() {
  const pathname = usePathname()
  const isInitialMount = useRef(true)

  useEffect(() => {
    // 초기 마운트 스킵 — GoogleAnalytics gtag('config') 에서 이미 page_view 발생
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

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
