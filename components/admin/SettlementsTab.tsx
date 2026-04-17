'use client'

import { useState, useEffect } from 'react'
import type { Settlement, ClassRow } from '@/lib/types'
import { s, formatDate, formatMoney, statusColor } from './shared'

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  draft: '초안', approved: '승인', paid: '지급완료', disputed: '이의제기',
}
const STATUS_NEXT: Record<string, string> = {
  draft: 'approved', approved: 'paid', paid: 'draft', disputed: 'draft',
}

type SettlementWithRelations = Settlement & {
  profiles?: { name: string | null }
  classes?: { name_ko: string } | null
}

export default function SettlementsTab() {
  const [settlements, setSettlements] = useState<SettlementWithRelations[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [computing, setComputing] = useState(false)
  const [computeForm, setComputeForm] = useState({ instructor_id: '', class_id: '', period_start: '', period_end: '' })

  useEffect(() => {
    fetch('/api/admin/classes').then((r) => r.json()).then(setClasses)
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = statusFilter === 'all' ? '/api/admin/settlements' : `/api/admin/settlements?status=${statusFilter}`
    fetch(url).then((r) => r.json()).then(setSettlements).finally(() => setLoading(false))
  }, [statusFilter])

  async function handleStatusChange(id: string, current: string) {
    const next = STATUS_NEXT[current] ?? 'draft'
    setLoadingId(id)
    const body: Record<string, unknown> = { status: next }
    if (next === 'paid') body.paid_at = new Date().toISOString()
    try {
      const res = await fetch(`/api/admin/settlements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setSettlements((prev) => prev.map((s) => s.id === id ? { ...s, status: next as Settlement['status'] } : s))
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCompute(e: React.FormEvent) {
    e.preventDefault()
    if (!computeForm.instructor_id || !computeForm.period_start || !computeForm.period_end) {
      alert('강사 ID, 시작일, 종료일을 입력해주세요.'); return
    }
    setComputing(true)
    try {
      const res = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(computeForm),
      })
      if (!res.ok) { const d = await res.json(); alert('정산 실패: ' + d.error); return }
      alert('정산이 생성됐습니다.')
      const url = statusFilter === 'all' ? '/api/admin/settlements' : `/api/admin/settlements?status=${statusFilter}`
      fetch(url).then((r) => r.json()).then(setSettlements)
    } finally {
      setComputing(false)
    }
  }

  return (
    <section style={s.section}>
      <div style={s.toolbar}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>강사 정산 ({settlements.length}건)</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.select}>
          <option value="all">전체 상태</option>
          {Object.entries(SETTLEMENT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 정산 계산 폼 */}
      <form onSubmit={handleCompute} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>강사 UID</label>
          <input
            value={computeForm.instructor_id}
            onChange={(e) => setComputeForm((f) => ({ ...f, instructor_id: e.target.value }))}
            placeholder="profiles.id (UUID)"
            style={{ ...s.input, width: 260 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>클래스</label>
          <select
            value={computeForm.class_id}
            onChange={(e) => setComputeForm((f) => ({ ...f, class_id: e.target.value }))}
            style={s.select}
          >
            <option value="">전체</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name_ko}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>시작일</label>
          <input type="date" value={computeForm.period_start}
            onChange={(e) => setComputeForm((f) => ({ ...f, period_start: e.target.value }))}
            style={s.input} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>종료일</label>
          <input type="date" value={computeForm.period_end}
            onChange={(e) => setComputeForm((f) => ({ ...f, period_end: e.target.value }))}
            style={s.input} />
        </div>
        <button type="submit" disabled={computing} style={s.actionBtnGold}>
          {computing ? '계산중...' : '정산 계산'}
        </button>
      </form>

      {loading ? <p style={{ color: 'var(--gray)', padding: 24 }}>로딩 중...</p> : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['강사', '클래스', '기간', '매출', '비율', '지급액', '회차', '출석', '상태', '조작'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr><td colSpan={10} style={s.emptyRow}>정산 내역 없음</td></tr>
              ) : settlements.map((st) => (
                <tr key={st.id} style={s.tr}>
                  <td style={s.td}>{st.profiles?.name || st.instructor_id.slice(0, 8)}</td>
                  <td style={s.td}>{st.classes?.name_ko || '전체'}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                    {formatDate(st.period_start)} ~ {formatDate(st.period_end)}
                  </td>
                  <td style={s.td}>{formatMoney(st.gross_revenue)}</td>
                  <td style={s.td}>{st.settlement_rate}%</td>
                  <td style={{ ...s.td, fontWeight: 700, color: 'var(--gold)' }}>{formatMoney(st.payout_amount)}</td>
                  <td style={s.td}>{st.session_count}회</td>
                  <td style={s.td}>{st.attendance_count}명</td>
                  <td style={s.td}><span style={statusColor(st.status)}>{SETTLEMENT_STATUS_LABEL[st.status]}</span></td>
                  <td style={s.td}>
                    <button
                      onClick={() => handleStatusChange(st.id, st.status)}
                      disabled={loadingId === st.id}
                      style={st.status === 'approved' ? s.actionBtnGold : s.actionBtn}
                    >
                      {loadingId === st.id ? '...' : `→ ${SETTLEMENT_STATUS_LABEL[STATUS_NEXT[st.status]]}`}
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
