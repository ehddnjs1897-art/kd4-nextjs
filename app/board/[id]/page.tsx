import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CommentSection from '@/components/board/CommentSection'
import DeletePostButton from '@/components/board/DeletePostButton'
import PostViewTracker from '@/components/board/PostViewTracker'
import PostHtmlContent from '@/components/board/PostHtmlContent'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// React cache() deduplicates the DB fetch across generateMetadata and PostDetailPage
// (both run in the same request, so only 1 Supabase round-trip happens)
const getPost = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase
    .from('posts')
    .select('id, title, content, category, author_id, author_name, views, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
})

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

function isHtmlContent(content: string) {
  return /<[a-z][\s\S]*>/i.test(content)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    공지: '#e74c3c',
    질문: '#4a9eff',
    수업: '#c4a55a',
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
      color: '#fff',
      background: color === '#888888' ? '#5a5652' : color,
      border: `1px solid ${color === '#888888' ? '#5a5652' : color}`,
    }}>
      {category}
    </span>
  )
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params
  const { data } = await getPost(id)
  const title = data?.title ?? 'KD4 커뮤니티'
  const description = data?.content ? data.content.slice(0, 120).replace(/\n/g, ' ') + '…' : 'KD4 커뮤니티 게시글'
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/board/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/board/${id}`,
      siteName: 'KD4 액팅 스튜디오',
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
      locale: 'ko_KR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
    },
  }
}

export default async function PostDetailPage({ params }: { params: Params }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const supabase = await createClient()

  // 게시글 조회 + 유저 인증 병렬 (getPost는 cache()로 generateMetadata와 중복 제거됨)
  const [{ data: post, error }, { data: { user } }] = await Promise.all([
    getPost(id),
    supabase.auth.getUser(),
  ])

  if (error || !post) notFound()
  if (!user) redirect(`/auth/login?next=/board/${id}`)

  // 조회수 증가 → 클라이언트 PostViewTracker로 이전 (봇/SSR 스팸 방지 + sessionStorage 중복 제거)
  // 역할 조회만 수행
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const currentUserRole: string | null = profile?.role ?? null

  const isAdmin = currentUserRole === 'admin'
  const isAuthor = user?.id === post.author_id
  const canEdit = isAuthor || isAdmin

  const typedPost = post as Post
  // content는 DB nullable(posts는 title만 NOT NULL) — NULL이면 .split()에서 TypeError 크래시.
  // RLS posts_public_read=USING(TRUE)라 NULL content 행도 읽힘. (2026-06-13 방어)
  const safeContent = typedPost.content ?? ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <PageJsonLd schemas={[buildBreadcrumb([
        { name: '홈', url: SITE_URL },
        { name: '커뮤니티', url: `${SITE_URL}/board` },
        { name: typedPost.title, url: `${SITE_URL}/board/${id}` },
      ])]} />
      {/* 조회수 클라이언트 추적 — SSR/봇 제외, sessionStorage 중복 방지 */}
      <PostViewTracker postId={id} />
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
          <span aria-hidden="true">← </span>목록으로
        </Link>

        <article aria-labelledby="post-title">
        {/* 게시글 헤더 */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: '24px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CategoryBadge category={typedPost.category} />
          </div>
          <h1 id="post-title" style={{
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
              <time dateTime={typedPost.created_at} style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
                {formatDate(typedPost.created_at)}
              </time>
              {typedPost.updated_at && typedPost.updated_at !== typedPost.created_at && (
                // 수정일자: AT 사용자가 수정 날짜를 들을 수 있도록 날짜 텍스트 포함 (WCAG 1.3.3)
                <time dateTime={typedPost.updated_at} style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                  (수정: {formatDate(typedPost.updated_at)})
                </time>
              )}
              <span style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>
                조회 {typedPost.views ?? 0}
              </span>
            </div>

            {/* 수정/삭제 버튼 */}
            {canEdit && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/board/${id}/edit`}
                  style={{
                    padding: '6px 14px',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
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

        {/* 본문 — HTML이면 클라이언트 컴포넌트(DOMPurify), 아니면 줄바꿈 렌더 */}
        {isHtmlContent(safeContent) ? (
          <PostHtmlContent html={safeContent} />
        ) : (
          <div style={{ fontSize: '0.95rem', color: 'var(--white)', lineHeight: 1.9, minHeight: '200px', marginBottom: '16px' }}>
            {safeContent.split('\n').map((line, i) => (
              <p key={i} style={{ margin: 0 }}>{line || <>&nbsp;</>}</p>
            ))}
          </div>
        )}
        </article>

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
