'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePostButtonProps {
  postId: string
}

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.')) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? '게시글 삭제 중 오류가 발생했습니다.')
        setDeleting(false)
      } else {
        router.push('/board')
        router.refresh()
      }
    } catch {
      alert('게시글 삭제 중 오류가 발생했습니다.')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      style={{
        padding: '6px 14px',
        border: '1px solid #e74c3c55',
        borderRadius: 'var(--radius)',
        fontSize: '0.82rem',
        color: deleting ? 'var(--gray)' : '#e74c3c',
        background: 'transparent',
        cursor: deleting ? 'not-allowed' : 'pointer',
        transition: 'var(--transition)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {deleting ? '삭제 중...' : '삭제'}
    </button>
  )
}
