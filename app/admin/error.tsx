'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin] 렌더링 오류:', error)
  }, [error])

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--white)',
          marginBottom: 12,
        }}>
          대시보드를 불러오지 못했습니다
        </h2>
        <p style={{ color: 'var(--gray)', fontSize: '0.88rem', marginBottom: 8, lineHeight: 1.6 }}>
          {error.message || '일시적인 오류가 발생했습니다.'}
        </p>
        {error.digest && (
          <p style={{ color: 'var(--gray)', fontSize: '0.75rem', marginBottom: 20 }}>
            오류 코드: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 22px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            다시 시도
          </button>
          <Link
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '10px 22px',
              fontSize: '0.88rem',
              color: 'var(--gray)',
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            관리자 홈
          </Link>
        </div>
      </div>
    </div>
  )
}
