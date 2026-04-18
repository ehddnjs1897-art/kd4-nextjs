'use client'

import { useState, useEffect } from 'react'
import type { Payment } from '@/lib/types'
import { s, formatDate, formatMoney, statusColor } from './shared'

const TYPE_LABEL: Record<string, string> = {
  payment: '결제', installment: '분할', refund: '환불', partial_refund: '부분환불',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '대기', completed: '완료', failed: '실패', cancelled: '취소',
}
const METHOD_LABEL: Record<string, string> = {
  card: '카드', transfer: '계좌이체', kakaopay: '카카오페이',
  tosspay: '토스페이', naverpay: '네이버페이', cash: '현금', other: '기타',
}

type PaymentWithRelations = Payment & {
  enrollments?: { enrollee_name: string } | null
  classes?: { name_ko: string } | null
}

export default function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentWithRelations[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const url = statusFilter === 'all' ? '/api/admin/payments' : `/api/admin/payments?status=${statusFilter}`
    fetch(url).then((r) => r.json()).then(setPayments).finally(() => setLoading(false))
  }, [statusFilter])

  async function handleStatusChange(id: string, next: Payment['status']) {
    setLoadingId(id)
    const body: Record<string, unknown> = { status: next }
    if (next === 'completed') body.paid_at = new Date().toISOString()
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: next } : p))
    } finally {
      setLoadingId(null)
    }
  }

  const totalRevenue = payments
    .filter((p) => p.status === 'completed' && p.type === 'payment')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <section style={s.section}>
      <div style={s.toolbar}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>결제 내역 ({payments.length}건)</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.select}>
          <option value="all">전체 상태</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {totalRevenue > 0 && (
          <span style={{ marginLeft: 'auto', color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem' }}>
            완료 합계: {formatMoney(totalRevenue)}
          </span>
        )}
      </div>

      {loading ? <p style={{ color: 'var(--gray)', padding: 24 }}>로딩 중...</p> : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['결제자', '클래스', '금액', '유형', '수단', '상태', '결제일', '조작'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8} style={s.emptyRow}>결제 내역 없음</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} style={s.tr}>
                  <td style={s.td}>{p.payer_name || p.enrollments?.enrollee_name || '—'}</td>
                  <td style={s.td}>{p.classes?.name_ko || '—'}</td>
                  <td style={{ ...s.td, fontWeight: 700, color: p.amount < 0 ? '#ff6b6b' : 'var(--white)' }}>
                    {p.amount < 0 ? '-' : ''}{formatMoney(Math.abs(p.amount))}
                  </td>
                  <td style={s.td}><span style={statusColor(p.type === 'refund' || p.type === 'partial_refund' ? 'cancelled' : 'active')}>{TYPE_LABEL[p.type]}</span></td>
                  <td style={s.td}>{p.method ? METHOD_LABEL[p.method] : '—'}</td>
                  <td style={s.td}><span style={statusColor(p.status)}>{STATUS_LABEL[p.status]}</span></td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    {p.paid_at ? formatDate(p.paid_at) : '—'}
                  </td>
                  <td style={{ ...s.td, display: 'flex', gap: 6 }}>
                    {p.status === 'pending' && (
                      <button onClick={() => handleStatusChange(p.id, 'completed')} disabled={loadingId === p.id} style={s.actionBtnGold}>
                        {loadingId === p.id ? '...' : '완료처리'}
                      </button>
                    )}
                    {p.status === 'completed' && p.type === 'payment' && (
                      <button onClick={() => handleStatusChange(p.id, 'cancelled')} disabled={loadingId === p.id} style={s.actionBtnDanger}>
                        취소
                      </button>
                    )}
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
