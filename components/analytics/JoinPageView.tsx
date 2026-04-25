'use client'

import { useEffect } from 'react'

export default function JoinPageView() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.gtag) {
      window.gtag('event', 'page_view', { page_path: '/join' })
    }

    // fbq is injected via afterInteractive — may not exist yet when this useEffect runs.
    // Retry with short delays until pixel is ready (gives up after ~3s).
    let fired = false
    const tryFire = () => {
      if (fired || !window.fbq) return
      window.fbq('track', 'ViewContent', {
        content_name: '/join',
        content_category: 'landing',
      })
      fired = true
    }

    tryFire()
    if (fired) return

    const delays = [200, 600, 1200, 2500]
    const timers = delays.map((d) => setTimeout(tryFire, d))
    return () => timers.forEach(clearTimeout)
  }, [])

  return null
}
