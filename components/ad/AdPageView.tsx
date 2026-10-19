'use client'

import { useEffect } from 'react'

/** 광고 전용 랜딩(/ad/[cls]) 조회 이벤트 — JoinPageView와 같은 방식, 페이지 이름만 클래스별로 */
export default function AdPageView({ path }: { path: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.gtag) {
      window.gtag('event', 'page_view', { page_path: path })
    }

    // fbq는 afterInteractive로 늦게 붙을 수 있어 짧게 재시도 (~3초)
    let fired = false
    const tryFire = () => {
      if (fired || !window.fbq) return
      window.fbq('track', 'ViewContent', { content_name: path, content_category: 'landing' })
      fired = true
    }

    tryFire()
    if (fired) return

    const timers = [200, 600, 1200, 2500].map((d) => setTimeout(tryFire, d))
    return () => timers.forEach(clearTimeout)
  }, [path])

  return null
}
