'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CrewRequestButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleRequest() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/crew-request', { method: 'POST' })
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'rgba(74,158,255,0.08)',
        border: '1px solid rgba(74,158,255,0.2)',
        borderRadius: 6,
        fontSize: '0.82rem',
        color: '#7ab8ff',
      }}>
        <span>✓</span>
        <span>신청이 접수되었습니다. 관리자 승인 후 이용 가능합니다.</span>
      </div>
    )
  }

  return (
    <>
      {error && (
        <p style={{
          fontSize: '0.8rem',
          color: '#ff6b6b',
          padding: '8px 12px',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 5,
        }}>
          {error}
        </p>
      )}
      <button
        onClick={handleRequest}
        disabled={loading}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          background: loading ? 'rgba(196,165,90,0.4)' : 'var(--gold)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 6,
          padding: '11px 0',
          fontSize: '0.88rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.05em',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          marginTop: 4,
        }}
      >
        {loading ? '신청 중...' : 'KD4 크루 신청하기'}
      </button>
    </>
  )
}
