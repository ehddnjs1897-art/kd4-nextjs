'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectorRequestButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleRequest() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/director-request', { method: 'POST', signal: AbortSignal.timeout(10_000) })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '신청 중 오류가 발생했습니다.')
      } else {
        setDone(true)
        router.refresh()
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div role="status" aria-live="polite" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'rgba(240,173,78,0.08)',
        border: '1px solid rgba(240,173,78,0.2)',
        borderRadius: 6,
        fontSize: '0.82rem',
        color: 'var(--navy)',
      }}>
        <span aria-hidden="true">⏳</span>
        <span>신청이 접수되었습니다. 관리자 승인 후 배우 연락처를 열람할 수 있습니다.</span>
      </div>
    )
  }

  return (
    <>
      {/* 항상 DOM에 존재 — 스크린 리더 즉시 알림 보장 (WCAG 4.1.3) */}
      <p role="alert" aria-live="assertive" aria-atomic="true" style={error ? {
          fontSize: '0.8rem',
          color: '#ff6b6b',
          padding: '8px 12px',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 5,
        } : {}}>
        {error}
      </p>
      <button
        type="button"
        onClick={handleRequest}
        disabled={loading}
        aria-busy={loading}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          background: loading ? 'rgba(196,165,90,0.4)' : 'var(--gold)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 6,
          padding: '11px 0',
          minHeight: 44,
          fontSize: '0.88rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.05em',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          marginTop: 4,
        }}
      >
        {loading ? '신청 중...' : '디렉터 권한 신청하기'}
      </button>
    </>
  )
}
