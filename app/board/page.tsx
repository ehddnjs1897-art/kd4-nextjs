import { createClient } from '@/lib/supabase/server'
import BoardClient from '@/components/board/BoardClient'
import PublicLanding from '@/components/board/PublicLanding'

export const metadata = {
  title: '커뮤니티 — KD4 액팅 스튜디오',
  description: 'KD4 멤버들의 연기·오디션 이야기, 클래스 후기, 공지사항을 공유하는 커뮤니티입니다.',
  alternates: { canonical: 'https://kd4.club/board' },
  openGraph: {
    title: '커뮤니티 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 커뮤니티 — 연기·오디션·클래스 이야기',
    url: 'https://kd4.club/board',
  },
}

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 비로그인: 안내 페이지 노출 (이전엔 즉시 /auth/login으로 redirect → "여기 뭐 하는 데지?" 이탈 유발)
  if (!user) {
    return <PublicLanding />
  }

  // 전체 포스트 한 번에 fetch — 카테고리 필터링은 클라이언트에서 처리 (탭 딜레이 없음)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, category, author_name, views, created_at')
    .order('created_at', { ascending: false })
    .limit(300)

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

        {/* 탭 + 목록 (클라이언트 컴포넌트 — 탭 전환 즉시) */}
        <BoardClient posts={posts ?? []} isLoggedIn={!!user} />
      </div>
    </div>
  )
}
