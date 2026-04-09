'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['일반', '공지', '질문', '자유'] as const
type Category = typeof CATEGORIES[number]

interface PostData {
  id: string
  title: string
  content: string
  category: Category
  author_id: string
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [post, setPost] = useState<PostData | null>(null)
  const [category, setCategory] = useState<Category>('일반')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPost = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.replace(`/auth/login?next=/board/${id}/edit`)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, content, category, author_id')
      .eq('id', id)
      .single()

    if (fetchError || !data) {
      setError('게시글을 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    // 권한 확인 (admin 여부도 클라이언트에서 확인)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    if (data.author_id !== user.id && !isAdmin) {
      setError('수정 권한이 없습니다.')
      setLoading(false)
      return
    }

    const typedPost = data as PostData
    setPost(typedPost)
    setTitle(typedPost.title)
    setContent(typedPost.content)
    setCategory(typedPost.category as Category)
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '게시글 수정 중 오류가 발생했습니다.')
      } else {
        router.push(`/board/${id}`)
      }
    } catch {
      setError('게시글 수정 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray)' }}>불러오는 중...</p>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#e74c3c' }}>{error}</p>
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
            글 수정
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
                  onClick={() => setCategory(cat)}
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
              {submitting ? '저장 중...' : '저장'}
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
