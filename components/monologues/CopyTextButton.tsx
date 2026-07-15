'use client'

import { useState, useCallback } from 'react'

interface Props {
  text: string
}

export default function CopyTextButton({ text }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
        .catch(() => prompt('아래 대사를 복사하세요:', text))
    } else {
      prompt('아래 대사를 복사하세요:', text)
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="대사 전체 복사"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        border: '1px solid var(--navy)',
        borderRadius: 6,
        background: copied ? 'var(--navy)' : 'transparent',
        color: copied ? '#fff' : 'var(--navy)',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {copied ? '✓ 복사됨' : '대사 복사'}
    </button>
  )
}
