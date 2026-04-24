'use client'

import { useEffect } from 'react'

export default function ScrollDepth() {
  useEffect(() => {
    const milestones = [25, 50, 75, 100]
    const fired = new Set<number>()

    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight
      const total = document.documentElement.scrollHeight
      const pct = Math.round((scrolled / total) * 100)

      for (const m of milestones) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m)
          if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('trackCustom', 'DeepScroll', { depth: m })
          }
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth', { depth: m })
          }
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
