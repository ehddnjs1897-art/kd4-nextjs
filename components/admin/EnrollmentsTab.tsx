'use client'

import { useState, useEffect } from 'react'
import type { Enrollment } from '@/lib/types'
import { s, formatDate, formatMoney, statusColor } from './shared'

const ENROLLMENT_STATUS_NEXT: Record<string, string> = {
  pending: 'active', active: 'completed', completed: 'pending', cancelled: 'pending', refunded: 'cancelled',
}
const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  pending: '대기', active: '수강중', completed: '수료', cancelled: '취소', refunded: '환불',
}
const PAYMENT_STATUS_NEXT: Record<string, string> = {
  unpaid: 'partial', partial: 'paid', paid: 'unpaid', refunded: 'unpaid',
}
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: '미납', partial: '부분납', paid: '완납', refunded: '환불',
}

type EnrollmentWithClass = Enrollment & { classes?: { name_ko: string; step: string } }

export default function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const url = statusFilter === 'all'
      ? '/api/admin/enrollments'
      : `/api/admin/enrollments?status=${statusFilter}`
    fetch(url).then((r) => r.json()).then(setEnrollments).finally(() => setLoading(false))
  }, [statusFilter])

  async function handleStatusChange(id: string, current: string) {
    const next = ENROLLMENT_STATUS_NEXT[current] ?? 'pending'
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, status: next as Enrollment['status'] } : e))
    } finally {
      setLoadingId(null)
    }
  }

  async function handlePaymentChange(id: string, current: string) {
    const next = PAYMENT_STATUS_NEXT[current] ?? 'unpaid'
    setLoadingId(id + '_pay')
    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: next }),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, payment_status: next as Enrollment['payment_status'] } : e))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section style={s.section}>
      <div style={s.toolbar}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>수강 등록 ({enrollments.length}건)</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.select}>
          <option value="all">전체 상태</option>
          {Object.entries(ENROLLMENT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      {loading ? <p style={{ color: 'var(--gray)', padding: 24 }}>로딩 중...</p> : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['동료 배우', '연락처', '클래스', '시작일', '수강료', '할인', '상태', '결제', '조작'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={9} style={s.emptyRow}>등록 내역 없음</td></tr>
              ) : enrollments.map((e) => (
                <tr key={e.id} style={s.tr}>
                  <td style={s.td}>{e.enrollee_name}</td>
                  <td style={s.td}>{e.enrollee_phone || '—'}</td>
                  <td style={s.td}>{e.classes?.name_ko || '—'}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDate(e.started_on)}</td>
                  <td style={s.td}>{formatMoney(e.price_at_enroll)}</td>
                  <td style={s.td}>{e.discount_amount > 0 ? `-${formatMoney(e.discount_amount)}` : '—'}</td>
                  <td style={s.td}><span style={statusColor(e.status)}>{ENROLLMENT_STATUS_LABEL[e.status]}</span></td>
                  <td style={s.td}>
                    <button
                      onClick={() => handlePaymentChange(e.id, e.payment_status)}
                      disabled={loadingId === e.id + '_pay'}
                      style={s.actionBtn}
                    >
                      <span style={statusColor(e.payment_status)}>{PAYMENT_STATUS_LABEL[e.payment_status]}</span>
                    </button>
                  </td>
                  <td style={s.td}>
                    <button
                      onClick={() => handleStatusChange(e.id, e.status)}
                      disabled={loadingId === e.id}
                      style={s.actionBtn}
                    >
                      {loadingId === e.id ? '...' : `→ ${ENROLLMENT_STATUS_LABEL[ENROLLMENT_STATUS_NEXT[e.status]]}`}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
