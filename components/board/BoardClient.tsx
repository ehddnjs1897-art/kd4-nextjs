'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

type Category = '전체' | '공지' | '질문' | '자유' | '수업'
const CATEGORIES: Category[] = ['전체', '질문', '자유', '수업', '공지']
const PAGE_SIZE = 20

interface Post {
  id: string
  title: string
  category: string
  author_name: string
  views: number
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    공지: '#e74c3c',
    질문: '#4a9eff',
    자유: '#888888',
    수업: '#a855f7',
  }
  const color = colorMap[category] ?? '#888888'
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '2px',
      fontSize: '0.72rem',
      fontWeight: 600,
      color: color === '#888888' ? 'var(--gray)' : '#fff',
      background: color + '22',
      border: `1px solid ${color}55`,
      letterSpacing: '0.03em',
    }}>
      {category}
    </span>
  )
}

export default function BoardClient({
  initialPosts,
  initialTotal,
  isLoggedIn,
}: {
  initialPosts: Post[]
  initialTotal: number
  isLoggedIn: boolean
}) {
  const [activeCategory, setActiveCategory] = useState<Category>('전체')
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchPosts = useCallback(async (category: Category, page: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setFetchError(null)

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (category !== '전체') params.set('category', category)
      const res = await fetch(`/api/posts?${params}`)
      const json: { data?: Post[]; total?: number } = await res.json()
      if (res.ok) {
        const incoming = json.data ?? []
        setPosts(prev => append ? [...prev, ...incoming] : incoming)
        setTotal(json.total ?? 0)
      } else {
        setFetchError('게시글을 불러오지 못했습니다.')
      }
    } catch {
      setFetchError('게시글을 불러오지 못했습니다.')
    } finally {
      if (append) setLoadingMore(false)
      else setLoading(false)
    }
  }, [])

  function handleCategoryChange(cat: Category) {
    if (cat === activeCategory) return
    setActiveCategory(cat)
    setCurrentPage(1)
    fetchPosts(cat, 1, false)
  }

  function handleLoadMore() {
    const next = currentPage + 1
    setCurrentPage(next)
    fetchPosts(activeCategory, next, true)
  }

  const hasMore = posts.length < total

  return (
    <div>
      {/* 카테고리 탭 + 글쓰기 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <nav style={{ display: 'flex', gap: '4px' }} aria-label="게시판 카테고리 필터">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={activeCategory === cat}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: activeCategory === cat ? 600 : 400,
                color: activeCategory === cat ? 'var(--bg)' : 'var(--gray)',
                background: activeCategory === cat ? 'var(--gold)' : 'transparent',
                border: `1px solid ${activeCategory === cat ? 'var(--gold)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </nav>

        {isLoggedIn && (
          <Link
            href="/board/write"
            style={{
              padding: '9px 22px',
              background: 'var(--gold)',
              color: '#ffffff',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
            }}
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* 게시글 테이블 */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {/* 테이블 헤더 */}
        <div className="board-header">
          <span>분류</span>
          <span>제목</span>
          <span className="board-col-hide-sm" style={{ textAlign: 'center' }}>작성자</span>
          <span className="board-col-hide-xs" style={{ textAlign: 'center' }}>날짜</span>
          <span className="board-col-hide-xs" style={{ textAlign: 'right' }}>조회</span>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>
            <p role="status" aria-live="polite">게시글을 불러오는 중...</p>
          </div>
        ) : fetchError ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p role="alert" style={{ color: '#e74c3c', fontSize: '0.875rem' }}>{fetchError}</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>
            {activeCategory !== '전체' ? `${activeCategory} 카테고리에 ` : ''}게시글이 없습니다.
          </div>
        ) : (
          posts.map((post, idx) => (
            <div
              key={post.id}
              className="board-row"
              style={{ borderBottom: idx < posts.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span><CategoryBadge category={post.category} /></span>
              <span>
                <Link
                  href={`/board/${post.id}`}
                  style={{ color: 'var(--white)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 400 }}
                >
                  {post.title}
                </Link>
              </span>
              <span className="board-col-hide-sm" style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gray)' }}>
                {post.author_name ?? '익명'}
              </span>
              <span className="board-col-hide-xs" style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gray)' }}>
                {formatDate(post.created_at)}
              </span>
              <span className="board-col-hide-xs" style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--gray)' }}>
                {post.views ?? 0}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 더 보기 버튼 */}
      {!loading && !fetchError && hasMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              padding: '10px 28px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: loadingMore ? 'var(--gray)' : 'var(--white)',
              fontSize: '0.875rem',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!loadingMore) {
                e.currentTarget.style.borderColor = 'var(--gold)'
                e.currentTarget.style.color = 'var(--gold)'
              }
            }}
            onMouseLeave={e => {
              if (!loadingMore) {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--white)'
              }
            }}
          >
            {loadingMore ? '불러오는 중...' : `더 보기 (${total - posts.length}개 남음)`}
          </button>
        </div>
      )}

      <style>{`
        .board-header {
          display: grid;
          grid-template-columns: 80px 1fr 110px 100px 70px;
          padding: 12px 20px;
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          font-size: 0.78rem;
          color: var(--gray);
          font-weight: 500;
          letter-spacing: 0.03em;
        }
        .board-row {
          display: grid;
          grid-template-columns: 80px 1fr 110px 100px 70px;
          padding: 14px 20px;
          align-items: center;
        }
        .board-row:hover { background: var(--bg3); }
        .board-row:hover a { color: var(--gold) !important; }
        @media (max-width: 560px) {
          .board-header, .board-row { grid-template-columns: 72px 1fr; }
          .board-col-hide-sm, .board-col-hide-xs { display: none; }
        }
        @media (min-width: 561px) and (max-width: 720px) {
          .board-header, .board-row { grid-template-columns: 72px 1fr 90px; }
          .board-col-hide-xs { display: none; }
        }
      `}</style>
    </div>
  )
}
