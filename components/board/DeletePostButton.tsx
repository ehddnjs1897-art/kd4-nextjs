'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePostButtonProps {
  postId: string
}

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    setDeleting(true)
    setDeleteError('')

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
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
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'var(--radius)',
    fontSize: '0.82rem',
    cursor: deleting ? 'not-allowed' : 'pointer',
    transition: 'var(--transition)',
    fontFamily: 'var(--font-sans)',
  }

  if (deleteError) {
    return (
      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span role="alert" aria-live="assertive" aria-atomic="true" style={{ fontSize: '0.78rem', color: '#ef4444' }}>{deleteError}</span>
        <button type="button" onClick={() => setDeleteError('')} aria-label="오류 닫기" style={{ fontSize: '0.75rem', color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 44, minWidth: 44 }}><span aria-hidden="true">✕</span></button>
      </div>
    )
  }

  if (confirming) {
    return (
      <div style={{ display: 'inline-flex', gap: 6 }}>
        <button
          type="button"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onClick={() => { setConfirming(false); setTimeout(() => deleteButtonRef.current?.focus(), 0) }}
          aria-label="삭제 취소"
          style={{ ...baseStyle, border: '1px solid var(--border)', color: 'var(--gray)', background: 'transparent' }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-busy={deleting}
          aria-label="게시글 삭제 확인"
          style={{ ...baseStyle, border: 'none', background: '#ef4444', color: '#fff' }}
        >
          삭제 확인
        </button>
      </div>
    )
  }

  return (
    <button
      ref={deleteButtonRef}
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-busy={deleting}
      style={{ ...baseStyle, border: '1px solid #e74c3c55', color: deleting ? 'var(--gray)' : '#e74c3c', background: 'transparent' }}
    >
      {deleting ? '삭제 중...' : '삭제'}
    </button>
  )
}
