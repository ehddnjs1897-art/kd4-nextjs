'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectorRequestButton({ initialAffiliation = '', initialPurpose = '' }: { initialAffiliation?: string; initialPurpose?: string } = {}) {
  const [affiliation, setAffiliation] = useState(initialAffiliation)
  const [purpose, setPurpose] = useState(initialPurpose)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 에러 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function handleRequest() {
    setError('')
    // 소속·용도 필수 — 대표가 이 내용을 보고 승인한다 (2026-09-19 대표 지시)
    if (affiliation.trim().length < 2) { setError('소속을 입력해 주세요. (예: ○○캐스팅, ○○제작사 조감독)'); return }
    if (purpose.trim().length < 5) { setError('이용 용도를 입력해 주세요. (예: 진행 중인 작품의 배역 캐스팅)'); return }
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { error: metaErr } = await createClient().auth.updateUser({
        data: { affiliation: affiliation.trim().slice(0, 60), purpose: purpose.trim().slice(0, 300) },
      })
      if (metaErr) { setError('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); return }
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
      {/* 항상 DOM에 존재 — 스크린 리더 즉시 알림 보장 (WCAG 4.1.3) + 포커스 이동 (WCAG 2.4.3) */}
      <div
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        aria-atomic="true"
        style={{ outline: 'none', ...(error ? {
          fontSize: '0.8rem',
          color: '#ff6b6b',
          padding: '8px 12px',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 5,
        } : {}) }}
      >
        {error}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <label htmlFor="dir-affiliation" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--white)' }}>소속 <span aria-hidden="true" style={{ color: 'var(--gold)' }}>*</span></label>
        <input id="dir-affiliation" type="text" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} maxLength={60} disabled={loading} required aria-required="true" placeholder="제작사, 캐스팅사, 방송국 등" style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--white)', fontFamily: 'inherit' }} />
        <label htmlFor="dir-purpose" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--white)', marginTop: 4 }}>이용 용도 <span aria-hidden="true" style={{ color: 'var(--gold)' }}>*</span></label>
        <textarea id="dir-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={300} rows={3} disabled={loading} required aria-required="true" placeholder="어떤 작품·배역 캐스팅에 쓰실지 적어 주세요." style={{ padding: '10px 12px', fontSize: '0.9rem', lineHeight: 1.6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--white)', fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--gray)', margin: 0 }}>적어주신 소속과 용도를 확인한 뒤 승인해 드립니다.</p>
      </div>
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
