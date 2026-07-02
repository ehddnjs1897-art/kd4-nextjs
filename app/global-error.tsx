'use client'

/**
 * app/global-error.tsx — 루트 레이아웃 오류 포함 전역 오류 경계
 * <html><body>를 직접 렌더링해야 함 (layout.tsx가 교체됨)
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // 프로덕션 로그 보존 — next.config.ts removeConsole이 console.error는 유지
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 360 }}>
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', color: '#c4a55a', textTransform: 'uppercase', marginBottom: 16 }}>
              <span lang="en">CRITICAL ERROR</span>
            </p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
              오류가 발생했습니다
            </h1>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>
              페이지를 불러오는 중 치명적인 오류가 발생했습니다.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '10px 24px',
                minHeight: 44,
                background: '#c4a55a',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: 4,
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error는 라우터 컨텍스트 없음 */}
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: 12,
                padding: '10px 24px',
                minHeight: 44,
                border: '1px solid #333',
                borderRadius: 4,
                color: '#888',
                fontSize: '0.85rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              홈으로
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
