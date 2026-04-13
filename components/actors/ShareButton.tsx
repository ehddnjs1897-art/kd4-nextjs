'use client'

import { useState } from 'react'

interface Props {
  title: string
  description: string
  imageUrl: string
  webUrl: string
}

export default function ShareButton({ webUrl }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: prompt
      prompt('아래 링크를 복사하세요:', webUrl)
    }
  }

  return (
    <button onClick={handleCopy} style={styles.btn} aria-label="링크 복사">
      <LinkIcon />
      {copied ? '복사됐어요 ✓' : '링크 복사'}
    </button>
  )
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }} aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '9px 16px',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'background 0.2s',
    width: '100%',
    justifyContent: 'center',
  },
}
