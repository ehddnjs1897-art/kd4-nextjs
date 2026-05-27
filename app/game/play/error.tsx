'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[game/play] 렌더링 오류:', error)
  }, [error])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'var(--font-oswald), sans-serif',
        flexDirection: 'column',
        gap: 16,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <p style={{ fontSize: 13, letterSpacing: '0.15em', color: '#aaa' }}>ERROR</p>
      <p style={{ fontSize: 15, fontWeight: 600 }}>게임을 시작하지 못했습니다</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            background: '#0057FF',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            minHeight: 44,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          RETRY
        </button>
        <Link
          href="/game"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid #333',
            borderRadius: 8,
            padding: '10px 24px',
            minHeight: 44,
            fontSize: 13,
            color: '#aaa',
            textDecoration: 'none',
          }}
        >
          BACK
        </Link>
      </div>
    </div>
  )
}
