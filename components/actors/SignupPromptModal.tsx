'use client'

/**
 * 회원 전용 콘텐츠 안내 모달 — 영상 시청·자료 다운로드 잠금 시 노출.
 *
 * variant
 *  - 'signup'   : 비로그인 → 무료 회원가입 / 로그인 CTA
 *  - 'director' : 로그인했지만 디렉터 아님 → 마이페이지 디렉터 신청 CTA
 *
 * (2026-06-12 대표 지시: 비회원도 프로필 열람 가능, 영상·다운로드 클릭 시 회원가입 안내)
 */

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  message: string
  /** 가입·로그인 후 돌아올 경로 (예: /actors/[id]) */
  nextUrl: string
  variant?: 'signup' | 'director'
}

export default function SignupPromptModal({ open, onClose, message, nextUrl, variant = 'signup' }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape 닫기 + 열릴 때 닫기 버튼 포커스 + body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const next = encodeURIComponent(nextUrl)

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(17,17,17,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="회원 전용 안내"
        style={{
          background: 'var(--bg, #fff)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 'clamp(24px, 5vw, 32px)',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
        }}
      >
        <p aria-hidden="true" style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</p>
        <p style={{
          fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)',
          marginBottom: 8, lineHeight: 1.5,
        }}>
          {variant === 'signup' ? 'KD4 회원 전용입니다' : '디렉터 전용 기능입니다'}
        </p>
        <p style={{ fontSize: '0.84rem', color: 'var(--gray)', lineHeight: 1.7, marginBottom: 20 }}>
          {message}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variant === 'signup' ? (
            <>
              <a
                href={`/auth/signup?next=${next}`}
                style={{
                  display: 'block', padding: '12px 16px', minHeight: 44,
                  background: 'var(--gold)', color: '#fff',
                  fontWeight: 700, fontSize: '0.88rem',
                  borderRadius: 8, textDecoration: 'none',
                }}
              >
                무료 회원가입
              </a>
              <a
                href={`/auth/login?next=${next}`}
                style={{
                  display: 'block', padding: '11px 16px', minHeight: 44,
                  background: 'transparent', color: 'var(--gold)',
                  border: '1px solid var(--gold)',
                  fontWeight: 600, fontSize: '0.86rem',
                  borderRadius: 8, textDecoration: 'none',
                }}
              >
                이미 회원이라면 로그인
              </a>
            </>
          ) : (
            <a
              href="/dashboard"
              style={{
                display: 'block', padding: '12px 16px', minHeight: 44,
                background: 'var(--gold)', color: '#fff',
                fontWeight: 700, fontSize: '0.88rem',
                borderRadius: 8, textDecoration: 'none',
              }}
            >
              마이페이지에서 디렉터 신청
            </a>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px', minHeight: 44,
              background: 'none', border: 'none',
              color: 'var(--gray)', fontSize: '0.82rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
