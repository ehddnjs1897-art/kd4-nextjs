'use client'

import { useState } from 'react'
import Link from 'next/link'

type Category = '전체' | '공지' | '질문' | '자유' | '수업'
const CATEGORIES: Category[] = ['전체', '질문', '자유', '수업', '공지']

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
  posts,
  isLoggedIn,
}: {
  posts: Post[]
  isLoggedIn: boolean
}) {
  const [activeCategory, setActiveCategory] = useState<Category>('전체')

  const filtered = activeCategory === '전체'
    ? posts
    : posts.filter(p => p.category === activeCategory)

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
        <nav style={{ display: 'flex', gap: '4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 110px 100px 70px',
          padding: '12px 20px',
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.78rem',
          color: 'var(--gray)',
          fontWeight: 500,
          letterSpacing: '0.03em',
        }}>
          <span>분류</span>
          <span>제목</span>
          <span style={{ textAlign: 'center' }}>작성자</span>
          <span style={{ textAlign: 'center' }}>날짜</span>
          <span style={{ textAlign: 'right' }}>조회</span>
        </div>

        {/* 게시글 목록 */}
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>
            {activeCategory !== '전체' ? `${activeCategory} 카테고리에 ` : ''}게시글이 없습니다.
          </div>
        ) : (
          filtered.map((post, idx) => (
            <div
              key={post.id}
              className="board-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 110px 100px 70px',
                padding: '14px 20px',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
              }}
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
              <span style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gray)' }}>
                {post.author_name ?? '익명'}
              </span>
              <span style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--gray)' }}>
                {formatDate(post.created_at)}
              </span>
              <span style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--gray)' }}>
                {post.views ?? 0}
              </span>
            </div>
          ))
        )}
      </div>

      <style>{`
        .board-row:hover { background: var(--bg3) !important; }
        .board-row:hover a { color: var(--gold) !important; }
      `}</style>
    </div>
  )
}
