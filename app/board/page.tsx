import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BoardClient from '@/components/board/BoardClient'
import PublicLanding from '@/components/board/PublicLanding'
import { SITE_URL } from '@/lib/constants'

const BOARD_URL = `${SITE_URL}/board`

export const metadata: Metadata = {
  title: '커뮤니티 — KD4 액팅 스튜디오',
  description: 'KD4 멤버들의 연기·오디션 이야기, 클래스 후기, 공지사항을 공유하는 커뮤니티입니다.',
  alternates: { canonical: BOARD_URL },
  openGraph: {
    type: 'website',
    title: '커뮤니티 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 커뮤니티 — 연기·오디션·클래스 이야기',
    url: BOARD_URL,
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '커뮤니티 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 커뮤니티 — 연기·오디션·클래스 이야기',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 커뮤니티' }],
  },
}

type SearchParams = Promise<{ my?: string }>

export default async function BoardPage({ searchParams }: { searchParams: SearchParams }) {
  const { my } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 비로그인: 안내 페이지 노출 (이전엔 즉시 /auth/login으로 redirect → "여기 뭐 하는 데지?" 이탈 유발)
  if (!user) {
    return <PublicLanding />
  }

  const isMyPosts = my === '1'

  // 첫 20개만 fetch + 총 개수 — my=1이면 내 게시글만, BoardClient에서 페이지네이션
  let postsQ = supabase
    .from('posts')
    .select('id, title, category, author_name, views, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19)

  if (isMyPosts) postsQ = postsQ.eq('author_id', user.id)

  const { data: posts, error: postsError, count } = await postsQ

  if (postsError) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
        <div className="container">
          <p role="alert" style={{ color: 'var(--gray)', fontSize: '0.95rem', marginTop: '40px' }}>
            게시판을 불러오지 못했습니다. 새로고침 해주세요.
          </p>
        </div>
      </div>
    )
  }

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

        {/* 탭 + 목록 (클라이언트 컴포넌트 — 페이지네이션) */}
        <BoardClient
          initialPosts={posts ?? []}
          initialTotal={count ?? 0}
          isLoggedIn={!!user}
          currentUserId={user.id}
          showMyPosts={isMyPosts}
        />
      </div>
    </div>
  )
}
