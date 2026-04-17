import type React from 'react'

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatMoney(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export const s: Record<string, React.CSSProperties> = {
  section: { marginTop: 0 },
  sectionTitle: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '1rem', fontWeight: 600, color: 'var(--white)',
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16,
  },
  tableWrapper: {
    overflowX: 'auto', background: 'var(--bg2)',
    border: '1px solid var(--border)', borderRadius: 8,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem',
    fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.07em',
    textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '12px 16px', color: 'var(--white)', verticalAlign: 'middle' },
  actionBtn: {
    background: 'transparent', border: '1px solid var(--border)', borderRadius: 4,
    padding: '5px 12px', fontSize: '0.76rem', color: 'var(--white)',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  actionBtnGold: {
    background: 'transparent', border: '1px solid rgba(196,165,90,0.5)', borderRadius: 4,
    padding: '5px 12px', fontSize: '0.76rem', color: 'var(--gold)',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  actionBtnDanger: {
    background: 'transparent', border: '1px solid rgba(220,53,69,0.4)', borderRadius: 4,
    padding: '5px 12px', fontSize: '0.76rem', color: '#ff6b6b',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  badge: {
    display: 'inline-block', padding: '2px 10px',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    fontSize: '0.72rem', color: 'var(--white)',
  },
  toolbar: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  select: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '6px 12px', color: 'var(--white)', fontSize: '0.84rem', cursor: 'pointer',
  },
  input: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '6px 12px', color: 'var(--white)', fontSize: '0.84rem',
  },
  emptyRow: { textAlign: 'center', color: 'var(--gray)', padding: '32px 16px' },
}

export function statusColor(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    active:     { bg: 'rgba(92,184,92,0.15)',   color: '#7ed07e' },
    completed:  { bg: 'rgba(91,192,222,0.15)',  color: '#5bc0de' },
    pending:    { bg: 'rgba(240,173,78,0.15)',  color: '#f0ad4e' },
    cancelled:  { bg: 'rgba(220,53,69,0.15)',   color: '#ff6b6b' },
    refunded:   { bg: 'rgba(153,102,255,0.15)', color: '#b380ff' },
    draft:      { bg: 'rgba(255,255,255,0.07)', color: 'var(--gray)' },
    approved:   { bg: 'rgba(92,184,92,0.15)',   color: '#7ed07e' },
    paid:       { bg: 'rgba(196,165,90,0.2)',   color: 'var(--gold)' },
    disputed:   { bg: 'rgba(220,53,69,0.15)',   color: '#ff6b6b' },
    unpaid:     { bg: 'rgba(240,173,78,0.15)',  color: '#f0ad4e' },
    partial:    { bg: 'rgba(91,192,222,0.15)',  color: '#5bc0de' },
    scheduled:  { bg: 'rgba(74,158,255,0.15)',  color: '#7ab8ff' },
    in_progress:{ bg: 'rgba(92,184,92,0.15)',   color: '#7ed07e' },
    present:    { bg: 'rgba(92,184,92,0.15)',   color: '#7ed07e' },
    late:       { bg: 'rgba(240,173,78,0.15)',  color: '#f0ad4e' },
    absent:     { bg: 'rgba(220,53,69,0.15)',   color: '#ff6b6b' },
    excused:    { bg: 'rgba(91,192,222,0.15)',  color: '#5bc0de' },
    makeup:     { bg: 'rgba(153,102,255,0.15)', color: '#b380ff' },
  }
  const c = map[status] ?? { bg: 'rgba(255,255,255,0.07)', color: 'var(--gray)' }
  return { ...s.badge, background: c.bg, color: c.color, border: 'none' }
}
