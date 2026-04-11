'use client'

import { useState, useEffect } from 'react'

/** 오늘 자정까지 남은 시간 — 하얀색 카운트다운 */
function getTimeLeft() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return { h, m, s }
}

export default function CountdownTimer() {
  const [time, setTime] = useState(getTimeLeft())

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1_000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={digitStyle}>{pad(time.h)}</span>
      <span style={colonStyle}>:</span>
      <span style={digitStyle}>{pad(time.m)}</span>
      <span style={colonStyle}>:</span>
      <span style={digitStyle}>{pad(time.s)}</span>
    </div>
  )
}

const digitStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#ffffff',
  letterSpacing: '0.06em',
  lineHeight: 1,
  minWidth: '32px',
  textAlign: 'center',
}

const colonStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.5)',
  lineHeight: 1,
}
