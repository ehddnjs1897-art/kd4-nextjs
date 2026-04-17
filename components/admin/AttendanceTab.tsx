'use client'

import { useState, useEffect } from 'react'
import type { ClassRow, ClassSchedule, AttendanceRecord } from '@/lib/types'
import { s, formatDateTime, statusColor } from './shared'

const ATTENDANCE_STATUS: AttendanceRecord['status'][] = ['present', 'late', 'absent', 'excused', 'makeup']
const ATTENDANCE_LABEL: Record<string, string> = {
  present: '출석', late: '지각', absent: '결석', excused: '공결', makeup: '보강',
}

type AttendanceWithRelations = AttendanceRecord & {
  enrollments?: { enrollee_name: string; enrollee_phone: string | null }
  class_schedules?: { starts_at: string; title: string | null }
}

export default function AttendanceTab() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [attendance, setAttendance] = useState<AttendanceWithRelations[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSchedule, setSelectedSchedule] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/classes').then((r) => r.json()).then((data: ClassRow[]) => {
      setClasses(data)
      if (data.length > 0) setSelectedClass(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    fetch(`/api/admin/schedules?class_id=${selectedClass}`)
      .then((r) => r.json())
      .then(setSchedules)
    setSelectedSchedule('all')
  }, [selectedClass])

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)
    const url = selectedSchedule === 'all'
      ? `/api/admin/attendance?class_id=${selectedClass}`
      : `/api/admin/attendance?schedule_id=${selectedSchedule}`
    fetch(url).then((r) => r.json()).then(setAttendance).finally(() => setLoading(false))
  }, [selectedClass, selectedSchedule])

  async function handleStatusChange(id: string, next: AttendanceRecord['status']) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/attendance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) { alert('변경 실패'); return }
      setAttendance((prev) => prev.map((a) => a.id === id ? { ...a, status: next } : a))
    } finally {
      setLoadingId(null)
    }
  }

  const stats = {
    present: attendance.filter((a) => a.status === 'present').length,
    late: attendance.filter((a) => a.status === 'late').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    total: attendance.length,
  }

  return (
    <section style={s.section}>
      <div style={s.toolbar}>
        <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>출석 관리</h2>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={s.select}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name_ko}</option>)}
        </select>
        <select value={selectedSchedule} onChange={(e) => setSelectedSchedule(e.target.value)} style={s.select}>
          <option value="all">전체 수업</option>
          {schedules.map((sch) => (
            <option key={sch.id} value={sch.id}>
              {formatDateTime(sch.starts_at)}{sch.title ? ` — ${sch.title}` : ''}
            </option>
          ))}
        </select>
      </div>

      {attendance.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.84rem' }}>
          <span style={statusColor('present')}>출석 {stats.present}</span>
          <span style={statusColor('late')}>지각 {stats.late}</span>
          <span style={statusColor('absent')}>결석 {stats.absent}</span>
          <span style={{ color: 'var(--gray)' }}>총 {stats.total}명</span>
        </div>
      )}

      {loading ? <p style={{ color: 'var(--gray)', padding: 24 }}>로딩 중...</p> : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {['동료 배우', '연락처', '수업 일시', '출석 상태', '변경'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan={5} style={s.emptyRow}>출석 기록 없음</td></tr>
              ) : attendance.map((a) => (
                <tr key={a.id} style={s.tr}>
                  <td style={s.td}>{a.enrollments?.enrollee_name || '—'}</td>
                  <td style={s.td}>{a.enrollments?.enrollee_phone || '—'}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    {a.class_schedules?.starts_at ? formatDateTime(a.class_schedules.starts_at) : '—'}
                  </td>
                  <td style={s.td}><span style={statusColor(a.status)}>{ATTENDANCE_LABEL[a.status]}</span></td>
                  <td style={s.td}>
                    <select
                      value={a.status}
                      disabled={loadingId === a.id}
                      onChange={(e) => handleStatusChange(a.id, e.target.value as AttendanceRecord['status'])}
                      style={{ ...s.select, padding: '4px 8px', fontSize: '0.76rem' }}
                    >
                      {ATTENDANCE_STATUS.map((st) => (
                        <option key={st} value={st}>{ATTENDANCE_LABEL[st]}</option>
                      ))}
                    </select>
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
