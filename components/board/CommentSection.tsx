'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

interface CommentSectionProps {
  postId: string
  currentUserId: string | null
  currentUserRole: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function CommentSection({
  postId,
  currentUserId,
  currentUserRole,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const errorRef = useRef<HTMLDivElement>(null)

  // 에러 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  // Escape 키로 삭제 확인 닫기 (alertdialog 접근성)
  useEffect(() => {
    if (!confirmingDeleteId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirmingDeleteId(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [confirmingDeleteId])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchComments = useCallback(async () => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, post_id, author_id, author_name, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(500)

    if (!mountedRef.current) return
    if (!fetchError && data) {
      setComments(data as Comment[])
    }
    setLoading(false)
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content }),
        signal: AbortSignal.timeout(10_000),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '댓글 작성 중 오류가 발생했습니다.')
      } else {
        setContent('')
        await fetchComments()
      }
    } catch {
      setError('댓글 작성 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    if (confirmingDeleteId !== commentId) {
      setConfirmingDeleteId(commentId)
      return
    }
    setConfirmingDeleteId(null)
    setDeletingId(commentId)

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '댓글 삭제 중 오류가 발생했습니다.')
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch {
      setError('댓글 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const isAdmin = currentUserRole === 'admin'

  return (
    <section aria-label="댓글" style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '36px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'var(--white)',
        marginBottom: '24px',
        letterSpacing: '0.05em',
      }}>
        댓글 <span aria-live="polite" aria-atomic="true" style={{ color: 'var(--gold)', marginLeft: '6px' }}>{comments.length > 0 ? comments.length : ''}</span>
      </h2>

      {/* 댓글 목록 */}
      {loading ? (
        <p role="status" aria-live="polite" style={{ color: 'var(--gray)', fontSize: '0.875rem' }}>댓글을 불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '32px' }}>
          첫 댓글을 남겨보세요.
        </p>
      ) : (
        <ul role="list" style={{ marginBottom: '32px' }}>
          {comments.map((comment) => {
            const canDelete = currentUserId === comment.author_id || isAdmin
            return (
              <li
                key={comment.id}
                style={{
                  padding: '16px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px',
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--white)',
                      }}>
                        {comment.author_name}
                      </span>
                      <time dateTime={comment.created_at} style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                        {formatDate(comment.created_at)}
                      </time>
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--gray-light, #bbb)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {comment.content}
                    </p>
                  </div>
                  {canDelete && (
                    confirmingDeleteId === comment.id ? (
                      <div role="group" aria-label="댓글 삭제 확인" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          aria-label={`${comment.author_name} 댓글 삭제 취소`}
                          onClick={() => setConfirmingDeleteId(null)}
                          style={{ fontSize: '0.75rem', color: 'var(--gray)', background: 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', minHeight: '44px', minWidth: '44px' }}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          aria-label={`${comment.author_name} 댓글 삭제 확인`}
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          aria-busy={deletingId === comment.id}
                          style={{ fontSize: '0.75rem', color: '#fff', background: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', minHeight: '44px', minWidth: '44px' }}
                        >
                          삭제
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        aria-busy={deletingId === comment.id}
                        aria-label={`${comment.author_name} 댓글 삭제`}
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--gray)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          flexShrink: 0,
                          opacity: deletingId === comment.id ? 0.5 : 1,
                          minHeight: '44px',
                          minWidth: '44px',
                        }}
                      >
                        삭제
                      </button>
                    )
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* 댓글 작성 폼 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit}>
          {/* 항상 DOM에 존재 — 스크린 리더 즉시 알림 보장 (WCAG 4.1.3) + 포커스 이동 (WCAG 2.4.3) */}
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{ outline: 'none', ...(error ? {
              color: '#e74c3c',
              fontSize: '0.85rem',
              marginBottom: '10px',
            } : {}) }}
          >
            {error ?? ''}
          </div>
          <label htmlFor="comment-input" className="sr-only">댓글 입력</label>
          <textarea
            id="comment-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={3}
            required
            maxLength={2000}
            aria-describedby="comment-char-count"
            style={{
              width: '100%',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--white)',
              padding: '12px 14px',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.6,
              resize: 'vertical',
              marginBottom: '6px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span
              id="comment-char-count"
              aria-live="off"
              aria-atomic="true"
              style={{
                fontSize: '0.75rem',
                color: content.length > 1800 ? '#e74c3c' : 'var(--gray)',
              }}
            >
              {content.length}/2000
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              aria-busy={submitting}
              style={{
                padding: '12px 22px',
                minHeight: 44,
                background: submitting || !content.trim() ? 'var(--border)' : 'var(--gold)',
                color: submitting || !content.trim() ? 'var(--gray)' : 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
                transition: 'var(--transition)',
              }}
            >
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          padding: '20px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '12px' }}>
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
          <a
            href="/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              minHeight: 44,
              background: 'var(--gold)',
              color: '#ffffff',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            로그인
          </a>
        </div>
      )}
    </section>
  )
}
