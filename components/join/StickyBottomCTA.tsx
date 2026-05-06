'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { analytics } from '@/lib/analytics'

/**
 * 하단 고정 CTA — UX 개선 2차
 * - 스크롤 30% 이후에만 노출 (너무 일찍 떠서 방해 안 되도록)
 * - Hero 직후 폼(#form-hero) 또는 마지막 폼(#form) 진입 시 자동 숨김
 * - 점프 대상: 가까운 #form-hero (도달 거리 짧음)
 */
export default function StickyBottomCTA() {
  const [visible, setVisible] = useState(false)
  const [formInView, setFormInView] = useState(false)

  useEffect(() => {
    /* 스크롤 깊이 30% 이후부터 노출 */
    function handleScroll() {
      const scrollY = window.scrollY
      const threshold = window.innerHeight * 0.3
      setVisible(scrollY > threshold)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    /* 폼 두 개(form-hero, form) 진입 감지 → 둘 중 하나라도 보이면 sticky 숨김 */
    const formIds = ['form-hero', 'form']
    const targets = formIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return () => window.removeEventListener('scroll', handleScroll)

    const inView = new Set<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) inView.add(e.target)
          else inView.delete(e.target)
        })
        setFormInView(inView.size > 0)
      },
      { threshold: 0.15 },
    )
    targets.forEach((el) => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  const shouldShow = visible && !formInView

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
        transform: shouldShow ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: shouldShow ? 'auto' : 'none',
      }}
      aria-hidden={!shouldShow}
    >
      <a
        href="#form-hero"
        className="pulse-cta"
        onClick={() => analytics.ctaClick('sticky_bottom', '무료 상담 신청')}
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
        무료 상담 신청
        <ArrowRight size={15} strokeWidth={2.5} />
      </a>
    </div>
  )
}
