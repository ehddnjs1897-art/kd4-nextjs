'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

/**
 * 스크롤 깊이 추적 — 25/50/75/100% 도달 시 1회만 발화
 * - GA4 `scroll` 이벤트 (percent_scrolled)
 * - 75% 이상 도달 시 Meta Pixel `DeepScroll` 커스텀 이벤트 (리타겟팅용)
 *
 * 사용: 랜딩 페이지 root 에 <ScrollDepth /> 한 번만 mount
 */
export default function ScrollDepth() {
  useEffect(() => {
    const reached = new Set<25 | 50 | 75 | 100>()

    function onScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      ) - window.innerHeight
      if (docHeight <= 0) return

      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100))
      const thresholds: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100]
      for (const t of thresholds) {
        if (pct >= t && !reached.has(t)) {
          reached.add(t)
          analytics.scrollDepth(t)
        }
      }
    }

    /* 첫 로드에 이미 하단 근처라면 즉시 발화 */
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
