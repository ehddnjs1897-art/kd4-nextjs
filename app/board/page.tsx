import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardClient from '@/components/board/BoardClient'

export const metadata = { title: '커뮤니티 — KD4 액팅 스튜디오' }

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/board')

  // 전체 포스트 한 번에 fetch — 카테고리 필터링은 클라이언트에서 처리 (탭 딜레이 없음)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, category, author_name, views, created_at')
    .order('created_at', { ascending: false })

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
