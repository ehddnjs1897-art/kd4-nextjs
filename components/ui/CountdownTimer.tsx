'use client'

import { useState, useEffect } from 'react'

interface Props {
  /** ISO 날짜 문자열 전달 시 해당 시점까지, 없으면 오늘 자정까지 */
  deadline?: string
  /** true = sticky 바용 인라인 컴팩트 텍스트 */
  compact?: boolean
}

function calcTimeLeft(deadline?: string) {
  const target = deadline
    ? new Date(deadline)
    : (() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d })()
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
  }
}

export default function CountdownTimer({ deadline, compact = false }: Props) {
  const [time, setTime] = useState<ReturnType<typeof calcTimeLeft> | null>(null)

  useEffect(() => {
    setTime(calcTimeLeft(deadline))
    const id = setInterval(() => setTime(calcTimeLeft(deadline)), 1_000)
    return () => clearInterval(id)
  }, [deadline])

  const pad = (n: number) => String(n).padStart(2, '0')

  if (!time) return null

  /* ── 컴팩트 모드: sticky 바 인라인 ─────────────────────────── */
  if (compact) {
    return (
      <span style={{
        fontFamily: 'monospace',
        fontWeight: 700,
        color: '#FEE500',
        fontSize: '0.82rem',
        letterSpacing: '0.05em',
      }}>
        {time.days > 0 ? `${time.days}일 ` : ''}{pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
    )
  }

  /* ── 풀 모드: 가격 섹션용 박스 타이머 ─────────────────────── */
  const blocks = [
    { label: '일', value: time.days },
    { label: '시', value: time.h },
    { label: '분', value: time.m },
    { label: '초', value: time.s },
  ]

  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
      {blocks.map(({ label, value }, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            background: '#15488A',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '10px 14px',
            textAlign: 'center',
            minWidth: '52px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 700,
              lineHeight: 1,
            }}>
              {pad(value)}
            </div>
            <div style={{ fontSize: '0.62rem', opacity: 0.75, marginTop: '4px' }}>{label}</div>
          </div>
          {i < 3 && (
            <span style={{ color: '#15488A', fontWeight: 700, fontSize: '1.4rem', marginBottom: '14px' }}>:</span>
          )}
        </div>
      ))}
    </div>
  )
}
