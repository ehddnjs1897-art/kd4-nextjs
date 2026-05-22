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
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    setDeleting(true)
    setDeleteError('')

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setDeleteError(json.error || '삭제 중 오류가 발생했습니다.')
        setDeleting(false)
      } else {
        router.push('/board')
        router.refresh()
      }
    } catch {
      setDeleteError('네트워크 오류가 발생했습니다.')
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

  if (deleteError) {
    return (
      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{deleteError}</span>
        <button onClick={() => setDeleteError('')} aria-label="오류 닫기" style={{ fontSize: '0.75rem', color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
      </div>
    )
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
