'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

/**
 * /join 랜딩 전용 ViewContent 발화 (리타겟팅 오디언스용)
 * - Meta Pixel 은 layout 에서 PageView 자동, 여기선 ViewContent 만 추가로
 * - 페이지당 1회만
 */
export default function JoinPageView() {
  useEffect(() => {
    analytics.viewLanding('/join')
  }, [])
  return null
}
