'use client'

import { useEffect } from 'react'

export default function InsightsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[insights] 렌더링 오류:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '60vh',
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
          오류
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          color: 'var(--white)',
          marginBottom: 12,
        }}>
          인사이트를 불러오지 못했습니다
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: '0.88rem', marginBottom: 24 }}>
          잠시 후 다시 시도해주세요.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '11px 24px',
              minHeight: 44,
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
          <a href="/insights" style={{ color: 'var(--gray)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>인사이트로</a>
        </div>
      </div>
    </div>
  )
}
