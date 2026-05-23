import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: '마이페이지 | KD4 액팅 스튜디오',
  robots: { index: false, follow: false },
}
import LogoutButton from '@/components/layout/LogoutButton'
import CrewRequestButton from '@/components/dashboard/CrewRequestButton'
import DirectorRequestButton from '@/components/dashboard/DirectorRequestButton'
import ProfileEditForm from '@/components/dashboard/ProfileEditForm'
import EnrollmentsPanel from '@/components/dashboard/EnrollmentsPanel'
import { UserRole } from '@/lib/types'
import { canViewActorDb as canViewActorDbFn } from '@/lib/access'

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  editor: '편집자',
  director: '디렉터',
  director_pending: '디렉터 승인 대기',
  crew: 'KD4 크루',
  crew_pending: '크루 신청 대기',
  actor: '배우 멤버',
  member: '배우 멤버',
  user: '일반 회원',
}

const ROLE_COLOR: Record<string, string> = {
  admin: '#c9403a',
  editor: 'var(--navy)',
  director: 'var(--navy)',
  director_pending: '#999',
  crew: 'var(--navy)',
  crew_pending: '#999',
  actor: 'var(--gold)',
  member: 'var(--gold)',
  user: 'var(--gray)',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // profile + enrollments 병렬 조회 (enrollments는 user.id만 있으면 됨)
  const now = new Date()
  const [{ data: profile, error: profileErr }, { data: enrData, error: enrErr }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email, phone, role, created_at, actor_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('enrollments')
      .select('id, class_name, year_month, amount, status, payment_status')
      .eq('user_id', user.id)
      .order('year_month', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  // DB 오류 시 (일시적 네트워크/RLS 문제 등) → error boundary로 전달
  if (profileErr) throw new Error(`프로필 조회 실패: ${profileErr.message}`)
  if (enrErr) console.error('[dashboard] 수강 내역 조회 오류:', enrErr.message)

  const name = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '이름 없음'
  const email = profile?.email || user.email || '—'
  const role: UserRole = (profile?.role as UserRole) || 'user'
  const createdAt = profile?.created_at || user.created_at
  const actorId: string | null = profile?.actor_id ?? null
  const enrollments = enrData ?? []

  // actor_id가 있어도 실제 DB row가 없으면 404 → 미리 확인
  let actorExists = false
  if (actorId) {
    const { data: actorCheck } = await supabaseAdmin
      .from('actors').select('id').eq('id', actorId).maybeSingle()
    actorExists = !!actorCheck
  }

  const isAdmin = role === 'admin'
  const isActorMember = role === 'member' || role === 'actor' || isAdmin
  const canViewActorDb = canViewActorDbFn(role as UserRole)
  const isCrewPending = role === 'crew_pending'
  const isDirectorPending = role === 'director_pending'
  const isDirector = role === 'director'
  const canRequestCrew = role === 'user'
  const memberType = user.user_metadata?.member_type as string | undefined
  const canRequestDirector = memberType === 'director' && ['user', 'member', 'actor'].includes(role)

  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  const joinedDate = new Date(createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const roleLabel = ROLE_LABEL[role] || role
  const roleColor = ROLE_COLOR[role] || 'var(--gray)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 페이지 헤더 */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>MY PAGE</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--white)' }}>마이페이지</h1>
        </div>

        {/* 내 계정 카드 */}
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--navy)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700,
              flexShrink: 0,
            }}>
              {name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>{name}</span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                  borderRadius: 20, border: `1px solid ${roleColor}`,
                  color: roleColor, background: 'transparent',
                  fontFamily: 'var(--font-display)', letterSpacing: '0.03em',
                }}>
                  {roleLabel}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 3 }}>가입일 {joinedDate}</div>
            </div>
          </div>
          <ProfileEditForm
            initialName={name}
            initialPhone={profile?.phone || ''}
            email={email}
            role={role}
            createdAt={createdAt}
          />
        </section>

        {/* 배우 프로필 섹션 — member/actor/admin */}
        {isActorMember && (
          <section style={{ ...card, borderColor: 'rgba(21,72,138,0.2)', background: 'rgba(21,72,138,0.03)' }}>
            <h2 style={sectionTitle}>내 배우 프로필</h2>
            {actorId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {actorExists ? (
                  <Link href={`/actors/${actorId}`} style={primaryBtn}>
                    내 배우 페이지 보기 →
                  </Link>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray)', padding: '4px 0' }}>
                    ⏳ 프로필 검토 준비 중 — 자료를 등록하면 관리자 검토 후 공개됩니다.
                  </p>
                )}
                <Link href="/dashboard/edit" style={tileBtn}>
                  <span style={tileIcon}>✏️</span>
                  <span>프로필 관리</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
                  사진·영상·필모그래피를 등록하면 관리자 검토 후 배우 DB에 공개됩니다.
                </p>
                <div style={{
                  padding: '10px 14px', borderRadius: 6,
                  background: 'rgba(196,165,90,0.06)', border: '1px solid rgba(196,165,90,0.18)',
                  fontSize: '0.78rem', color: 'rgba(196,165,90,0.8)', lineHeight: 1.7,
                }}>
                  📌 기존 KD4 배우라면 — 가입 시 KD4에 등록된 전화번호와 동일하게 입력해야 프로필이 자동 연결됩니다.
                  전화번호를 수정하려면 내 정보 &gt; 전화번호를 변경해 주세요.
                </div>
                <Link href="/dashboard/edit" style={primaryBtn}>프로필 자료 올리기</Link>
              </div>
            )}
          </section>
        )}

        {/* 내 수강 */}
        <EnrollmentsPanel enrollments={enrollments} thisMonth={thisMonth} nextMonth={nextMonth} />

        {/* KD4 크루 전용 */}
        {canViewActorDb && (
          <section style={card}>
            <h2 style={sectionTitle}>KD4 크루</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Link href="/actors" style={tileBtn}>
                <span style={tileIcon}>🎬</span>
                <span>배우 DB</span>
              </Link>
              <Link href="/board" style={tileBtn}>
                <span style={tileIcon}>💬</span>
                <span>커뮤니티</span>
              </Link>
              <Link href="/ai-tools" style={tileBtn}>
                <span style={tileIcon}>🤖</span>
                <span>대본 분석</span>
              </Link>
            </div>
          </section>
        )}

        {/* 디렉터 승인 완료 */}
        {isDirector && (
          <section style={{ ...card, borderColor: 'rgba(196,165,90,0.3)' }}>
            <h2 style={{ ...sectionTitle, color: 'var(--gold)' }}>디렉터 승인 완료</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
              배우 DB에서 <strong style={{ color: 'var(--gold)' }}>연락처 열람 + 사진·프로필 다운로드</strong>가 가능합니다.
            </p>
          </section>
        )}

        {/* 디렉터 권한 신청 */}
        {canRequestDirector && (
          <section style={{ ...card, borderColor: 'rgba(196,165,90,0.2)' }}>
            <h2 style={sectionTitle}>디렉터 권한 신청</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 8 }}>
              승인 시 배우 <strong style={{ color: 'var(--gold)' }}>연락처 열람 + 사진·프로필 다운로드</strong> 가능.
            </p>
            <DirectorRequestButton />
          </section>
        )}

        {/* 디렉터 승인 대기 */}
        {isDirectorPending && (
          <section style={{ ...card, borderColor: 'rgba(240,173,78,0.3)' }}>
            <h2 style={{ ...sectionTitle, color: '#f0ad4e' }}>디렉터 승인 대기 중</h2>
            <div style={pendingBadge}>⏳ 관리자 승인 검토 중입니다</div>
          </section>
        )}

        {/* KD4 크루 신청 */}
        {canRequestCrew && (
          <section style={card}>
            <h2 style={sectionTitle}>KD4 크루 신청</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 8 }}>
              배우 DB · 커뮤니티 · 대본 분석 등 크루 전용 기능 이용 시 필요.
            </p>
            <CrewRequestButton />
          </section>
        )}

        {/* KD4 크루 대기 */}
        {isCrewPending && (
          <section style={card}>
            <h2 style={{ ...sectionTitle, color: '#f0ad4e' }}>KD4 크루 신청 대기 중</h2>
            <div style={pendingBadge}>⏳ 관리자 승인 검토 중입니다</div>
          </section>
        )}

        {/* 관리자 */}
        {isAdmin && (
          <section style={{ ...card, borderColor: 'rgba(201,64,58,0.2)' }}>
            <h2 style={{ ...sectionTitle, color: '#c9403a' }}>관리자</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { href: '/admin/enrollments', label: '수강 현황' },
                { href: '/admin/actors', label: '배우 목록 관리' },
                { href: '/admin/users', label: '회원 관리' },
                { href: '/admin', label: '관리자 홈' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{
                  display: 'block', padding: '10px 14px',
                  background: 'rgba(201,64,58,0.05)', border: '1px solid rgba(201,64,58,0.15)',
                  borderRadius: 6, fontSize: '0.84rem', color: 'var(--white)', textDecoration: 'none',
                }}>
                  {label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 커뮤니티 */}
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={sectionTitle}>커뮤니티</h2>
            <Link href="/board?my=1" style={{ fontSize: '0.82rem', color: 'var(--navy)', textDecoration: 'none' }}>내 게시글 →</Link>
          </div>
        </section>

        {/* 로그아웃 */}
        <div style={{ marginTop: 4 }}>
          <LogoutButton />
        </div>

      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--gray)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 4,
}

const tileBtn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  padding: '14px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.8rem',
  color: 'var(--white)',
  textDecoration: 'none',
  fontFamily: 'var(--font-display)',
  textAlign: 'center',
  fontWeight: 500,
}

const tileIcon: React.CSSProperties = {
  fontSize: '1.3rem',
  lineHeight: 1,
}

const primaryBtn: React.CSSProperties = {
  display: 'block',
  textAlign: 'center',
  background: 'var(--navy)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 7,
  padding: '12px 0',
  fontSize: '0.88rem',
  fontWeight: 700,
  fontFamily: 'var(--font-display)',
  letterSpacing: '0.04em',
  textDecoration: 'none',
}

const pendingBadge: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  background: 'rgba(240,173,78,0.08)',
  border: '1px solid rgba(240,173,78,0.2)',
  borderRadius: 6,
  fontSize: '0.82rem',
  color: '#f0ad4e',
}
