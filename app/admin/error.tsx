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
      background: '#F5F0E8',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
      color: '#1a1a1a',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.3rem',
          fontWeight: 800,
          marginBottom: 12,
        }}>
          대시보드를 불러오지 못했습니다
        </h2>
        <p style={{ color: '#6b6560', fontSize: '0.88rem', marginBottom: 8, lineHeight: 1.6 }}>
          {error.message || '일시적인 오류가 발생했습니다.'}
        </p>
        {error.digest && (
          <p style={{ color: '#9a938b', fontSize: '0.75rem', marginBottom: 20 }}>
            오류 코드: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#15488a',
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
              background: '#fff',
              border: '1px solid #e4ddd3',
              borderRadius: 6,
              padding: '10px 22px',
              fontSize: '0.88rem',
              color: '#6b6560',
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
