'use client'

import { useState, useEffect } from 'react'
import type { ClassRow } from '@/lib/types'
import { s, formatMoney, statusColor } from './shared'

export default function ClassesTab() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/classes')
      .then((r) => r.json())
      .then(setClasses)
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, current: boolean) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setClasses((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c))
    } finally {
      setLoadingId(null)
    }
  }

  async function toggleHighlight(id: string, current: boolean) {
    setLoadingId(id + '_hl')
    try {
      const res = await fetch(`/api/admin/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_highlight: !current }),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setClasses((prev) => prev.map((c) => c.id === id ? { ...c, is_highlight: !current } : c))
    } finally {
      setLoadingId(null)
    }
  }

  if (loading) return <p style={{ color: 'var(--gray)', padding: 24 }}>로딩 중...</p>

  return (
    <section style={s.section}>
      <h2 style={s.sectionTitle}>클래스 관리 ({classes.length}개)</h2>
      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead>
            <tr>
              {['STEP', '클래스명', '가격', '정원', '잔여석', '강사', '신규모집', '하이라이트', '공개', '조작'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr><td colSpan={10} style={s.emptyRow}>클래스 없음</td></tr>
            ) : classes.map((c) => (
              <tr key={c.id} style={s.tr}>
                <td style={s.td}><span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>{c.step}</span></td>
                <td style={{ ...s.td, maxWidth: 200 }}>
                  <span style={{ fontWeight: 600 }}>{c.name_ko}</span>
                  {c.promo_label && <span style={{ display: 'block', fontSize: '0.7rem', color: '#f0ad4e', marginTop: 2 }}>{c.promo_label}</span>}
                </td>
                <td style={s.td}>
                  <span>{formatMoney(c.price)}</span>
                  {c.original_price && (
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--gray)', textDecoration: 'line-through' }}>
                      {formatMoney(c.original_price)}
                    </span>
                  )}
                </td>
                <td style={s.td}>{c.capacity_label || '—'}</td>
                <td style={s.td}>
                  {c.remaining_seats != null
                    ? <span style={statusColor(c.remaining_seats > 0 ? 'active' : 'cancelled')}>{c.remaining_seats}석</span>
                    : '—'}
                </td>
                <td style={s.td}>{c.instructor_label || '—'}</td>
                <td style={s.td}>
                  <span style={statusColor(c.is_new_member_open ? 'active' : 'cancelled')}>
                    {c.is_new_member_open ? '모집중' : '마감'}
                  </span>
                </td>
                <td style={s.td}>
                  <button
                    onClick={() => toggleHighlight(c.id, c.is_highlight)}
                    disabled={loadingId === c.id + '_hl'}
                    style={c.is_highlight ? s.actionBtnGold : s.actionBtn}
                  >
                    {c.is_highlight ? '★ ON' : '☆ OFF'}
                  </button>
                </td>
                <td style={s.td}>
                  <span style={statusColor(c.is_active ? 'active' : 'cancelled')}>
                    {c.is_active ? '공개' : '비공개'}
                  </span>
                </td>
                <td style={s.td}>
                  <button
                    onClick={() => toggleActive(c.id, c.is_active)}
                    disabled={loadingId === c.id}
                    style={c.is_active ? s.actionBtnDanger : s.actionBtn}
                  >
                    {loadingId === c.id ? '...' : c.is_active ? '비공개로' : '공개로'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
