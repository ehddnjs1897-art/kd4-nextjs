'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

/**
 * 하단 고정 CTA — UX 개선 2차
 * - 스크롤 30% 이후에만 노출 (너무 일찍 떠서 방해 안 되도록)
 * - 폼(#form) 진입 시 자동 숨김
 */
export default function StickyBottomCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    /* 스크롤 깊이 30% 이후부터 노출 */
    function handleScroll() {
      const scrollY = window.scrollY
      const threshold = window.innerHeight * 0.3
      setVisible(scrollY > threshold)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    /* 폼 진입 감지 → 숨김 */
    const formEl = document.getElementById('form')
    if (!formEl) return () => window.removeEventListener('scroll', handleScroll)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(false)
      },
      { threshold: 0.15 },
    )
    observer.observe(formEl)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 98,
        padding: '10px 16px',
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(21,72,138,0.08)',
        transform: visible ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-hidden={!visible}
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
          padding: '13px',
          background: 'var(--navy)',
          color: '#ffffff',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.88rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        무료 상담 신청하기
        <ArrowRight size={15} strokeWidth={2.5} />
      </a>
    </div>
  )
}
