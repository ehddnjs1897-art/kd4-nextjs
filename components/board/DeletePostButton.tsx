'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePostButtonProps {
  postId: string
}

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    setDeleting(true)

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setDeleting(false)
      } else {
        router.push('/board')
        router.refresh()
      }
    } catch {
      setDeleting(false)
    }
  }

  const baseStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    fontSize: '0.82rem',
    cursor: deleting ? 'not-allowed' : 'pointer',
    transition: 'var(--transition)',
    fontFamily: 'var(--font-sans)',
  }

  if (confirming) {
    return (
      <div style={{ display: 'inline-flex', gap: 6 }}>
        <button
          onClick={() => setConfirming(false)}
          style={{ ...baseStyle, border: '1px solid var(--border)', color: 'var(--gray)', background: 'transparent' }}
        >
          취소
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ ...baseStyle, border: 'none', background: '#ef4444', color: '#fff' }}
        >
          삭제 확인
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      style={{ ...baseStyle, border: '1px solid #e74c3c55', color: deleting ? 'var(--gray)' : '#e74c3c', background: 'transparent' }}
    >
      {deleting ? '삭제 중...' : '삭제'}
    </button>
  )
}
