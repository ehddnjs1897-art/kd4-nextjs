'use client'

import { useState, useEffect } from 'react'

/**
 * 하단 고정 CTA — kd4.club 톤 일관성 유지.
 * 폼(#form)이 뷰포트에 들어오면 자동으로 숨겨짐.
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
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(21,72,138,0.08)',
      }}
    >
      <a
        href="#form"
        className="pulse-cta"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          maxWidth: '480px',
          margin: '0 auto',
          padding: '15px',
          background: 'var(--navy)',
          color: '#ffffff',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.9rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        무료 상담 신청하기 →
      </a>
    </div>
  )
}
