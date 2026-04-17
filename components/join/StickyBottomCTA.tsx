'use client'

import { useState, useEffect } from 'react'

/**
 * 모바일 전용 하단 고정 CTA.
 * 폼(#form)이 뷰포트에 들어오면 자동으로 숨겨진다.
 */
export default function StickyBottomCTA() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const formEl = document.getElementById('form')
    if (!formEl) return

    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { threshold: 0.15 },
    )
    observer.observe(formEl)
    return () => observer.disconnect()
  }, [])

  if (hidden) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 98,
        padding: '12px 20px',
        background: '#15488A',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
      }}
    >
      <a
        href="#form"
        style={{
          display: 'block',
          maxWidth: '480px',
          margin: '0 auto',
          padding: '15px',
          background: '#ffffff',
          color: '#15488A',
          fontWeight: 800,
          fontSize: '1rem',
          borderRadius: '12px',
          textAlign: 'center',
          textDecoration: 'none',
          letterSpacing: '0.03em',
        }}
      >
        무료 상담 신청하기 →
      </a>
    </div>
  )
}
