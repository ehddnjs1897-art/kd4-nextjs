'use client'

import { useEffect } from 'react'

export default function JoinPageView() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: '/join',
        content_category: 'landing',
      })
    }

    if (window.gtag) {
      window.gtag('event', 'page_view', { page_path: '/join' })
    }
  }, [])

  return null
}
