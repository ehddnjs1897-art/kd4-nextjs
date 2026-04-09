import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: '커뮤니티 — KD4 액팅 스튜디오' }

type Category = '전체' | '공지' | '질문' | '자유'
const CATEGORIES: Category[] = ['전체', '공지', '질문', '자유']

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

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const category = (params.category ?? '전체') as Category
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('posts')
    .select('id, title, category, author_name, views, created_at')
    .order('created_at', { ascending: false })

  if (category !== '전체') {
    query = query.eq('category', category)
  }

  const { data: posts, error } = await query

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <div className="container">
        {/* 헤더 */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            color: 'var(--gold)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Community
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            fontWeight: 700,
            color: 'var(--white)',
          }}>
            커뮤니티
          </h1>
        </div>

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
              <Link
                key={cat}
                href={cat === '전체' ? '/board' : `/board?category=${cat}`}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  fontWeight: category === cat ? 600 : 400,
                  color: category === cat ? 'var(--bg)' : 'var(--gray)',
                  background: category === cat ? 'var(--gold)' : 'transparent',
                  border: `1px solid ${category === cat ? 'var(--gold)' : 'var(--border)'}`,
                  transition: 'var(--transition)',
                  textDecoration: 'none',
                }}
              >
                {cat}
              </Link>
            ))}
          </nav>

          {user && (
            <Link
              href="/board/write"
              style={{
                padding: '9px 22px',
                background: 'var(--gold)',
                color: 'var(--bg)',
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
          {error ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>
              게시글을 불러오는 중 오류가 발생했습니다.
            </div>
          ) : !posts || posts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray)' }}>
              {category !== '전체' ? `${category} 카테고리에` : ''} 게시글이 없습니다.
            </div>
          ) : (
            (posts as Post[]).map((post, idx) => (
              <div
                key={post.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 110px 100px 70px',
                  padding: '14px 20px',
                  borderBottom: idx < posts.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={undefined}
                className="board-row"
              >
                <span>
                  <CategoryBadge category={post.category} />
                </span>
                <span>
                  <Link
                    href={`/board/${post.id}`}
                    style={{
                      color: 'var(--white)',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      fontWeight: 400,
                    }}
                  >
                    {post.title}
                  </Link>
                </span>
                <span style={{
                  textAlign: 'center',
                  fontSize: '0.82rem',
                  color: 'var(--gray)',
                }}>
                  {post.author_name ?? '익명'}
                </span>
                <span style={{
                  textAlign: 'center',
                  fontSize: '0.82rem',
                  color: 'var(--gray)',
                }}>
                  {formatDate(post.created_at)}
                </span>
                <span style={{
                  textAlign: 'right',
                  fontSize: '0.82rem',
                  color: 'var(--gray)',
                }}>
                  {post.views ?? 0}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .board-row:hover {
          background: var(--bg3) !important;
        }
        .board-row:hover a {
          color: var(--gold) !important;
        }
      `}</style>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    공지: '#e74c3c',
    질문: '#4a9eff',
    자유: '#888888',
    일반: '#888888',
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
