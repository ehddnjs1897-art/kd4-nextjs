'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Enrollment {
  id: string
  name: string | null
  phone: string | null
  class_name: string
  year_month: string
  amount: number
  status: string
  payment_status: string
  created_at: string
}

function ymLabel(s: string): string {
  const [y, m] = s.split('-')
  return `${y}년 ${parseInt(m, 10)}월`
}

export default function AdminEnrollments({ enrollments }: { enrollments: Enrollment[] }) {
  const [items, setItems] = useState<Enrollment[]>(enrollments)
  const [month, setMonth] = useState<string>('all')
  const [busy, setBusy] = useState<string>('')
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMsg(msg)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 4000)
  }

  const months = Array.from(new Set(items.map((e) => e.year_month))).sort().reverse()
  const filtered = month === 'all' ? items : items.filter((e) => e.year_month === month)

  // 요약 (확정 기준 인원 / 결제완료 매출)
  const confirmedCount = filtered.filter((e) => e.status === '확정').length
  const paidRevenue = filtered
    .filter((e) => e.payment_status === '결제완료' && e.status !== '취소')
    .reduce((s, e) => s + e.amount, 0)

  async function setStatus(id: string, newStatus: string) {
    setEditingStatusId(null)
    setBusy(id)
    try {
      const res = await fetch(`/api/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)))
      } else {
        showToast('수강 상태 변경에 실패했습니다.')
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다.')
    }
    setBusy('')
  }

  async function togglePay(id: string, current: string) {
    const next = current === '결제완료' ? '결제대기' : '결제완료'
    setBusy(id)
    try {
      const res = await fetch(`/api/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: next }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((e) => (e.id === id ? { ...e, payment_status: next } : e)))
      } else {
        showToast('결제 상태 변경에 실패했습니다.')
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다.')
    }
    setBusy('')
  }

  return (
    <div style={{ background: '#F5F0E8', minHeight: '100vh', padding: '32px 20px', color: '#1a1a1a' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800 }}>수강 현황</h1>
          <Link href="/admin" style={{ fontSize: '0.85rem', color: '#15488a', textDecoration: 'underline' }}>← 관리자 홈</Link>
        </div>
        {toastMsg && (
          <p role="alert" style={{ fontSize: '0.82rem', color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
            {toastMsg}
          </p>
        )}

        {/* 월 필터 */}
        <div role="group" aria-label="월별 필터" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button type="button" onClick={() => setMonth('all')} style={chip(month === 'all')}>전체</button>
          {months.map((m) => (
            <button type="button" key={m} onClick={() => setMonth(m)} style={chip(month === m)}>{ymLabel(m)}</button>
          ))}
        </div>

        {/* 요약 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={summaryCard}>
            <div style={summaryLabel}>확정 인원</div>
            <div style={summaryNum}>{confirmedCount}건</div>
          </div>
          <div style={summaryCard}>
            <div style={summaryLabel}>결제완료 매출</div>
            <div style={summaryNum}>{paidRevenue.toLocaleString()}원</div>
          </div>
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: '#6b6560', fontSize: '0.9rem' }}>
            수강 신청 내역이 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e4ddd3', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ width: 80, fontSize: '0.78rem', color: '#6b6560' }}>{ymLabel(e.year_month)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{e.name || '(이름없음)'} · {e.class_name}</div>
                  <div style={{ fontSize: '0.76rem', color: '#4A4A4A' }}>{e.phone || '-'} · {e.amount.toLocaleString()}원</div>
                </div>
                {editingStatusId === e.id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['확정', '휴강', '취소'] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setStatus(e.id, s)}
                        disabled={busy === e.id}
                        style={{
                          padding: '3px 8px', borderRadius: 4, border: 'none',
                          fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit',
                          background: s === '확정' ? '#2d8a56' : s === '취소' ? '#c0392b' : '#9a938b',
                          color: '#fff', opacity: e.status === s ? 1 : 0.55,
                        }}
                      >{s}</button>
                    ))}
                    <button type="button" onClick={() => setEditingStatusId(null)} aria-label="닫기" style={{ padding: '3px 6px', minHeight: 44, minWidth: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #e4ddd3', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingStatusId(e.id)}
                    disabled={busy === e.id}
                    style={{
                      background: 'none', border: 'none', padding: '8px 10px', minHeight: 44, cursor: 'pointer',
                      fontSize: '0.74rem', fontWeight: 700,
                      color: e.status === '확정' ? '#2d8a56' : e.status === '취소' ? '#c0392b' : '#9a938b',
                    }}
                    title="클릭해서 상태 변경"
                  >
                    {e.status} ▾
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => togglePay(e.id, e.payment_status)}
                  disabled={busy === e.id}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: busy === e.id ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    color: e.payment_status === '결제완료' ? '#fff' : '#d4851f',
                    background: e.payment_status === '결제완료' ? '#2d8a56' : '#fbeed5',
                  }}
                >
                  {e.payment_status === '결제완료' ? '결제완료 ✓' : '결제대기'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const summaryCard: React.CSSProperties = { flex: 1, minWidth: 140, background: '#fff', border: '1px solid #e4ddd3', borderRadius: 10, padding: '16px 18px' }
const summaryLabel: React.CSSProperties = { fontSize: '0.76rem', color: '#6b6560', marginBottom: 6 }
const summaryNum: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: '#15488a' }

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${active ? '#15488a' : '#e4ddd3'}`,
    background: active ? '#15488a' : '#fff',
    color: active ? '#fff' : '#6b6560',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
