'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// 일반 사용자 카테고리
const USER_CATEGORIES = ['질문', '자유', '수업'] as const
// 관리자 추가 카테고리
const ADMIN_CATEGORIES = ['질문', '자유', '수업', '공지'] as const

type Category = '질문' | '자유' | '수업' | '공지'

export default function WritePage() {
  const router = useRouter()
  const [category, setCategory] = useState<Category>('질문')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login?next=/board/write')
        return
      }
      // 역할 확인 (관리자면 '공지' 탭 노출)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'admin') setIsAdmin(true)
      setCheckingAuth(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category }),
      })

      let json: { id?: string; error?: string } = {}
      try { json = await res.json() } catch { /* empty */ }

      if (!res.ok) {
        setError(json.error ?? `오류가 발생했습니다. (${res.status})`)
      } else if (json.id) {
        router.push(`/board/${json.id}`)
      } else {
        setError('게시글 ID를 받지 못했습니다.')
      }
    } catch (err) {
      setError(`네트워크 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const CATEGORIES = isAdmin ? ADMIN_CATEGORIES : USER_CATEGORIES

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray)' }}>확인 중...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{
            color: 'var(--gold)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            Community
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: 'var(--white)',
          }}>
            글쓰기
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#e74c3c22',
              border: '1px solid #e74c3c55',
              borderRadius: 'var(--radius)',
              color: '#e74c3c',
              fontSize: '0.875rem',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {/* 카테고리 */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>카테고리</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat as Category)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.85rem',
                    fontWeight: category === cat ? 600 : 400,
                    color: category === cat ? 'var(--bg)' : 'var(--gray)',
                    background: category === cat ? 'var(--gold)' : 'transparent',
                    border: `1px solid ${category === cat ? 'var(--gold)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle} htmlFor="title">제목</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
              maxLength={200}
              style={inputStyle}
            />
          </div>

          {/* 내용 */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle} htmlFor="content">내용</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              required
              rows={14}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.7,
              }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '10px 22px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'transparent',
                color: 'var(--gray)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              style={{
                padding: '10px 26px',
                background: submitting || !title.trim() || !content.trim() ? 'var(--border)' : 'var(--gold)',
                color: submitting || !title.trim() || !content.trim() ? 'var(--gray)' : 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: submitting || !title.trim() || !content.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                transition: 'var(--transition)',
              }}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  color: 'var(--gray)',
  fontWeight: 500,
  letterSpacing: '0.03em',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--white)',
  padding: '11px 14px',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
}
