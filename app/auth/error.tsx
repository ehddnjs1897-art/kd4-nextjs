'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[auth] 오류:', error.message)
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <h1 className="sr-only">인증 오류</h1>
      <p style={{ fontSize: '0.95rem', color: 'var(--gray)' }}>
        인증 처리 중 오류가 발생했습니다.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 22px',
            background: 'var(--navy)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '0.88rem',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <Link
          href="/auth/login"
          style={{
            padding: '10px 22px',
            background: 'transparent',
            color: 'var(--gray)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
