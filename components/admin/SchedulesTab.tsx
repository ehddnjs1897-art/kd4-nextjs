'use client'

import { useState, useEffect } from 'react'
import type { ClassRow, ClassSchedule } from '@/lib/types'
import { s, formatDateTime, statusColor } from './shared'

const STATUS_NEXT: Record<string, string> = {
  scheduled: 'in_progress',
  in_progress: 'completed',
  completed: 'scheduled',
  cancelled: 'scheduled',
}
const STATUS_LABEL: Record<string, string> = {
  scheduled: '예정', in_progress: '진행중', completed: '완료', cancelled: '취소',
}

export default function SchedulesTab() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/classes').then((r) => r.json()).then(setClasses)
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = selectedClass === 'all'
      ? '/api/admin/schedules'
      : `/api/admin/schedules?class_id=${selectedClass}`
    fetch(url).then((r) => r.json()).then(setSchedules).finally(() => setLoading(false))
  }, [selectedClass])

  async function handleStatusChange(id: string, current: string) {
    const next = STATUS_NEXT[current] ?? 'scheduled'
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, status: next as ClassSchedule['status'] } : s))
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    setLoadingId(id + '_del')
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, { method: 'DELETE' })
      if (!res.ok) { alert('삭제 실패'); return }
      setSchedules((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section style={s.section}>
      <div style={s.toolbar}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>스케줄 관리</h2>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={s.select}
        >
          <option value="all">전체 클래스</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name_ko}</option>
          ))}
        </select>
      </div>
      {loading ? <p style={{ color: 'var(--gray)', padding: 24 }}>로딩 중...</p> : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['클래스', '회차', '제목', '시작', '종료', '장소', '상태', '조작'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr><td colSpan={8} style={s.emptyRow}>일정 없음</td></tr>
              ) : schedules.map((sch) => (
                <tr key={sch.id} style={s.tr}>
                  <td style={s.td}>
                    {(sch as unknown as { classes?: { name_ko: string } }).classes?.name_ko || '—'}
                  </td>
                  <td style={s.td}>{sch.session_no ?? '—'}</td>
                  <td style={s.td}>{sch.title || '—'}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDateTime(sch.starts_at)}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDateTime(sch.ends_at)}</td>
                  <td style={s.td}>{sch.location}</td>
                  <td style={s.td}><span style={statusColor(sch.status)}>{STATUS_LABEL[sch.status]}</span></td>
                  <td style={{ ...s.td, display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleStatusChange(sch.id, sch.status)}
                      disabled={loadingId === sch.id}
                      style={s.actionBtn}
                    >
                      {loadingId === sch.id ? '...' : `→ ${STATUS_LABEL[STATUS_NEXT[sch.status]]}`}
                    </button>
                    <button
                      onClick={() => handleDelete(sch.id)}
                      disabled={loadingId === sch.id + '_del'}
                      style={s.actionBtnDanger}
                    >
                      삭제
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
