import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CommentSection from '@/components/board/CommentSection'
import DeletePostButton from '@/components/board/DeletePostButton'

type Params = Promise<{ id: string }>

interface Post {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  author_name: string
  views: number
  created_at: string
  updated_at: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
      padding: '3px 10px',
      borderRadius: '2px',
      fontSize: '0.78rem',
      fontWeight: 600,
      color: color === '#888888' ? 'var(--gray)' : '#fff',
      background: color + '22',
      border: `1px solid ${color}55`,
    }}>
      {category}
    </span>
  )
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('title')
    .eq('id', id)
    .single()
  return { title: data?.title ? `${data.title} — KD4 커뮤니티` : 'KD4 커뮤니티' }
}

export default async function PostDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  // 게시글 조회
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  // 조회수 증가 (서버 컴포넌트에서 직접 increment)
  await supabase
    .from('posts')
    .update({ views: (post.views ?? 0) + 1 })
    .eq('id', id)

  // 현재 로그인 유저
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/board/${id}`)

  let currentUserRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    currentUserRole = profile?.role ?? null
  }

  const isAdmin = currentUserRole === 'admin'
  const isAuthor = user?.id === post.author_id
  const canEdit = isAuthor || isAdmin

  const typedPost = post as Post

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* 뒤로가기 */}
        <Link
          href="/board"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--gray)',
            fontSize: '0.85rem',
            textDecoration: 'none',
            marginBottom: '32px',
          }}
        >
          ← 목록으로
        </Link>

        {/* 게시글 헤더 */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: '24px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CategoryBadge category={typedPost.category} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
            fontWeight: 700,
            color: 'var(--white)',
            lineHeight: 1.4,
            marginBottom: '16px',
          }}>
            {typedPost.title}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--white)', fontWeight: 500 }}>
                {typedPost.author_name ?? '익명'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
                {formatDate(typedPost.created_at)}
              </span>
              {typedPost.updated_at && typedPost.updated_at !== typedPost.created_at && (
                <span style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                  (수정됨)
                </span>
              )}
              <span style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
                조회 {(typedPost.views ?? 0) + 1}
              </span>
            </div>

            {/* 수정/삭제 버튼 */}
            {canEdit && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/board/${id}/edit`}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.82rem',
                    color: 'var(--gray)',
                    textDecoration: 'none',
                    transition: 'var(--transition)',
                  }}
                >
                  수정
                </Link>
                <DeletePostButton postId={id} />
              </div>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div style={{
          fontSize: '0.95rem',
          color: 'var(--white)',
          lineHeight: 1.9,
          minHeight: '200px',
          marginBottom: '16px',
        }}>
          {typedPost.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </div>

        {/* 댓글 섹션 */}
        <CommentSection
          postId={id}
          currentUserId={user?.id ?? null}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  )
}
