import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/layout/LogoutButton'
import CrewRequestButton from '@/components/dashboard/CrewRequestButton'
import ProfileEditForm from '@/components/dashboard/ProfileEditForm'

type UserRole = 'user' | 'crew_pending' | 'crew' | 'actor' | 'editor' | 'director' | 'admin'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as UserProfile
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const ROLE_LABEL: Record<UserRole, string> = {
  user: '일반 회원',
  crew_pending: 'KD4 크루 (승인 대기)',
  crew: 'KD4 크루',
  actor: '배우 회원 (승인 대기)',
  editor: '배우 회원',
  director: '디렉터 회원',
  admin: '관리자',
}

export default async function DashboardPage() {
  /* ---- 인증 확인 ---- */
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  /* ---- 프로필 fetch ---- */
  const profile = await getUserProfile(user.id)

  const name =
    profile?.name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    '이름 없음'

  const email = profile?.email || user.email || '—'
  const role: UserRole = (profile?.role as UserRole) || 'user'
  const createdAt = profile?.created_at || user.created_at
  const canEdit = role === 'editor' || role === 'admin'
  const canViewActorDb = role === 'crew' || role === 'editor' || role === 'director' || role === 'admin'
  const isCrewPending = role === 'crew_pending'
  const canRequestCrew = role === 'user'

  return (
    <div style={styles.page}>
      <div className="container">
        {/* 페이지 헤더 */}
        <div style={styles.header}>
          <p style={styles.eyebrow}>MY PAGE</p>
          <h1 style={styles.pageTitle}>마이페이지</h1>
        </div>

        <div style={styles.layout} className="dashboard-layout">
          {/* ---- 내 정보 카드 (수정 포함) ---- */}
          <section style={styles.card}>
            <ProfileEditForm
              initialName={name}
              initialPhone={profile?.phone || ''}
              email={email}
              role={role}
              createdAt={createdAt}
            />
          </section>

          {/* ---- 우측 사이드 ---- */}
          <div style={styles.sideCol}>
            {/* 배우 회원: 갤러리 관리 */}
            {canEdit && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>갤러리 관리</h2>
                <p style={styles.cardDesc}>
                  내 배우 프로필 사진, 영상, 필모그래피를 관리합니다.
                </p>
                <Link href="/dashboard/edit" style={styles.btnPrimary}>
                  내 갤러리 편집
                </Link>
              </section>
            )}

            {/* KD4 크루 신청 (일반 회원) */}
            {canRequestCrew && (
              <section style={{
                ...styles.card,
                border: '1px solid rgba(196,165,90,0.25)',
                background: 'rgba(196,165,90,0.04)',
              }}>
                <h2 style={styles.cardTitle}>KD4 크루 신청</h2>
                <p style={styles.cardDesc}>
                  배우 DB, 커뮤니티, 대본 분석 등 크루 전용 기능에 접근하려면
                  관리자 승인이 필요합니다.
                </p>
                <CrewRequestButton />
              </section>
            )}

            {/* KD4 크루 대기 중 */}
            {isCrewPending && (
              <section style={{
                ...styles.card,
                border: '1px solid rgba(240,173,78,0.3)',
                background: 'rgba(240,173,78,0.04)',
              }}>
                <h2 style={{ ...styles.cardTitle, color: '#f0ad4e' }}>KD4 크루 승인 대기 중</h2>
                <p style={styles.cardDesc}>
                  크루 신청이 접수되었습니다. 관리자 승인 후 배우 DB, 커뮤니티,
                  대본 분석 기능을 이용하실 수 있습니다.
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'rgba(240,173,78,0.08)',
                  border: '1px solid rgba(240,173,78,0.2)',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  color: '#f0ad4e',
                }}>
                  <span>⏳</span>
                  <span>승인 검토 중입니다</span>
                </div>
              </section>
            )}

            {/* KD4 크루 전용: 배우 DB 바로가기 */}
            {canViewActorDb && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>KD4 크루 전용</h2>
                <p style={styles.cardDesc}>
                  배우 DB, 커뮤니티, 대본 분석 등 크루 전용 기능을 이용합니다.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/actors" style={styles.btnSecondary}>
                    배우 DB 보기
                  </Link>
                  <Link href="/board" style={styles.btnSecondary}>
                    커뮤니티
                  </Link>
                  <Link href="/ai-tools" style={styles.btnSecondary}>
                    대본 분석
                  </Link>
                </div>
              </section>
            )}

            {/* 관리자 메뉴 */}
            {role === 'admin' && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>관리자 메뉴</h2>
                <div style={styles.adminLinks}>
                  <Link href="/admin/actors" style={styles.adminLink}>
                    배우 목록 관리
                  </Link>
                  <Link href="/admin/users" style={styles.adminLink}>
                    회원 관리
                  </Link>
                </div>
              </section>
            )}

            {/* 커뮤니티 */}
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>커뮤니티</h2>
              <p style={styles.cardDesc}>내가 작성한 게시글을 확인합니다.</p>
              <Link href="/board?my=1" style={styles.btnSecondary}>
                내 게시글 보기
              </Link>
            </section>

            {/* 로그아웃 */}
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 80,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 40,
  },
  eyebrow: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gold)',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
    fontWeight: 700,
    color: 'var(--white)',
  },
  layout: {
    /* layout handled by .dashboard-layout CSS class */
    gap: 28,
    alignItems: 'start',
  },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '28px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--white)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    paddingBottom: 14,
    borderBottom: '1px solid var(--border)',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
    lineHeight: 1.6,
    marginTop: -4,
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'rgba(196,165,90,0.15)',
    border: '2px solid var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--gold)',
    flexShrink: 0,
  },
  userName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--white)',
    marginBottom: 4,
  },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    background: 'rgba(196,165,90,0.1)',
    border: '1px solid rgba(196,165,90,0.3)',
    borderRadius: 12,
    fontSize: '0.72rem',
    color: 'var(--gold-light)',
    letterSpacing: '0.04em',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    alignItems: 'baseline',
    gap: 12,
  },
  infoKey: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
  },
  infoVal: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    wordBreak: 'break-all',
  },
  sideCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  btnPrimary: {
    display: 'block',
    textAlign: 'center',
    background: 'var(--gold)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 6,
    padding: '11px 0',
    fontSize: '0.88rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    textDecoration: 'none',
    marginTop: 4,
  },
  btnSecondary: {
    display: 'block',
    textAlign: 'center',
    border: '1px solid var(--gold)',
    color: 'var(--gold)',
    borderRadius: 6,
    padding: '10px 0',
    fontSize: '0.85rem',
    fontWeight: 500,
    textDecoration: 'none',
    marginTop: 4,
  },
  adminLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  adminLink: {
    display: 'block',
    padding: '10px 14px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    fontSize: '0.85rem',
    color: 'var(--white)',
    textDecoration: 'none',
    transition: 'border-color 0.2s',
  },
}
