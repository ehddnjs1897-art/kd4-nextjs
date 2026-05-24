'use client'

/**
 * app/error.tsx — Server/Client Component 런타임 오류 경계
 * Next.js가 자동으로 렌더링. 사용자가 흰 화면 대신 안내 화면을 봄.
 */

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error)
    }
  }, [error])

  return (
    <div role="main" style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.68rem',
          letterSpacing: '0.35em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          <span lang="en">ERROR</span>
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
          color: 'var(--white)',
          marginBottom: 12,
        }}>
          오류가 발생했습니다
        </h2>
        <p style={{ color: 'var(--gray)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 28 }}>
          일시적인 문제입니다. 다시 시도하거나 페이지를 새로고침해 주세요.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 22px',
              minHeight: 44,
              background: 'var(--gold)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
            }}
          >
            다시 시도
          </button>
          <a
            href="/"
            style={{
              padding: '10px 22px',
              minHeight: 44,
              background: 'transparent',
              color: 'var(--gray)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textDecoration: 'none',
              fontFamily: 'var(--font-sans)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  )
}
