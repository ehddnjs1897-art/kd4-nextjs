import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '마이페이지',
  description: 'KD4 멤버 마이페이지 — 프로필 편집, 수강 내역, 배우 DB 관리.',
  robots: { index: false, follow: false },
  openGraph: {
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    type: 'website',
    url: `${SITE_URL}/dashboard`,
    title: '마이페이지 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 마이페이지',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 마이페이지' }],
  },
}

export const dynamic = 'force-dynamic'
import LogoutButton from '@/components/layout/LogoutButton'
import CrewRequestButton from '@/components/dashboard/CrewRequestButton'
import DirectorRequestButton from '@/components/dashboard/DirectorRequestButton'
import ProfileEditForm from '@/components/dashboard/ProfileEditForm'
import ProfileCompletenessCard from '@/components/dashboard/ProfileCompletenessCard'
import EnrollmentsPanel from '@/components/dashboard/EnrollmentsPanel'
import { UserRole } from '@/lib/types'
import { canViewActorDb as canViewActorDbFn } from '@/lib/access'
import { matchActorOnSignup } from '@/lib/actor-matching'

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
  director_pending: 'var(--gray)',
  crew: 'var(--navy)',
  crew_pending: 'var(--gray)',
  actor: 'var(--gold)',
  member: 'var(--gold)',
  user: 'var(--gray)',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard')

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

  // ── 자가 복구 (2026-06-12 대표 지시) ────────────────────────────────────
  // 가입 마지막 단계(on-signup) 호출이 끊겨 '일반 회원'으로 남았거나, actors 전화번호
  // 공란으로 자동 연결이 실패한 멤버 → 대시보드 방문만 해도 이름 매칭으로 재연결.
  let healedRole: string | null = null
  let healedActorId: string | null = null
  if (profile) {
    const r0 = (profile.role as string | null) ?? 'user'
    if (!profile.actor_id && ['user', 'actor', 'member'].includes(r0)) {
      try {
        const r = await matchActorOnSignup(user.id, profile.name ?? '', profile.phone ?? '')
        if (r.matched && r.actorId) {
          healedActorId = r.actorId
          if (r0 === 'user') healedRole = 'actor' // matchActorOnSignup이 DB에서 승급한 것을 화면에도 반영
        }
      } catch (e) {
        console.error('[dashboard] 자가 복구 매칭 오류:', e instanceof Error ? e.message : String(e))
      }
    } else if (profile.actor_id && r0 === 'user') {
      // 연결은 됐는데 등급만 '일반 회원' 잔재로 남은 경우
      const { error: promoteErr } = await supabaseAdmin
        .from('profiles').update({ role: 'actor' }).eq('id', user.id)
      if (!promoteErr) healedRole = 'actor'
      else console.error('[dashboard] 등급 정리 실패:', promoteErr.message)
    }
  }

  const name = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '이름 없음'
  const email = profile?.email || user.email || '—'
  const role: UserRole = (healedRole ?? profile?.role ?? 'user') as UserRole
  const createdAt = profile?.created_at || user.created_at
  const actorId: string | null = healedActorId ?? profile?.actor_id ?? null
  const enrollments = enrData ?? []

  // actor_id가 있어도 실제 DB row가 없으면 404 → 미리 확인
  // + 존재하면 프로필 완성도 표시용 데이터(메타 + 카운트)를 가볍게 함께 조회
  let actorExists = false
  let completeness: import('@/lib/profile-completeness').CompletenessInput | null = null
  if (actorId) {
    // 메타(특기·소개·사투리). dialects 컬럼 미적용(42703) 시 단계적 fallback — edit 페이지와 동일 패턴
    const metaPromise = supabaseAdmin
      .from('actors')
      .select('id, casting_summary, skills, dialects, profile_photo')
      .eq('id', actorId)
      .maybeSingle()
      .then(async (r) => {
        if (r.error && r.error.code === '42703') {
          const f = await supabaseAdmin
            .from('actors')
            .select('id, casting_summary, skills, profile_photo')
            .eq('id', actorId)
            .maybeSingle()
          if (f.data) return { data: { ...f.data, dialects: null }, error: null, hasDialects: false }
          return { ...f, hasDialects: false }
        }
        return { ...r, hasDialects: true }
      })

    // 카운트는 head:true 로 row 본문 없이 개수만 (가벼움)
    const [meta, photoCnt, ytVidCnt, r2VidCnt, filmCnt] = await Promise.all([
      metaPromise,
      supabaseAdmin.from('actor_photos').select('id', { count: 'exact', head: true }).eq('actor_id', actorId),
      supabaseAdmin.from('actor_videos').select('id', { count: 'exact', head: true }).eq('actor_id', actorId).not('youtube_id', 'is', null),
      supabaseAdmin.from('actor_videos').select('id', { count: 'exact', head: true }).eq('actor_id', actorId).not('r2_key', 'is', null),
      supabaseAdmin.from('actor_filmography').select('id', { count: 'exact', head: true }).eq('actor_id', actorId),
    ])

    actorExists = !!meta.data
    if (meta.data) {
      const m = meta.data as { casting_summary: string | null; skills: string[] | null; dialects: string[] | null; profile_photo: string | null }
      const hasProfilePhotoRes = await supabaseAdmin
        .from('actor_photos').select('id', { count: 'exact', head: true })
        .eq('actor_id', actorId).eq('is_profile', true)
      completeness = {
        // actor_photos에 is_profile 행이 없어도 actors.profile_photo가 있으면 완성으로 인정
        // (관리자 스크립트가 actors.profile_photo만 직접 갱신하는 경로 대비 — 2026-07-07 오탐 발견·수정)
        hasProfilePhoto: (hasProfilePhotoRes.count ?? 0) > 0 || !!m.profile_photo,
        photoCount: photoCnt.count ?? 0,
        videoCount: (ytVidCnt.count ?? 0) + (r2VidCnt.count ?? 0),
        hasCastingSummary: !!(m.casting_summary && m.casting_summary.trim().length > 0),
        filmographyCount: filmCnt.count ?? 0,
        skillsCount: Array.isArray(m.skills) ? m.skills.length : 0,
        dialectsCount: Array.isArray(m.dialects) ? m.dialects.length : 0,
        hasDialectsColumn: meta.hasDialects,
      }
    }
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
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.35em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}><span lang="en">MY PAGE</span></p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--white)' }}>마이페이지</h1>
          {/* 공개 네비에서 /enroll 제거(무료 상담으로 교체)됨 — 멤버 수강신청은 여기서만 진입 */}
          <a href="/enroll" style={{ display: 'inline-block', marginTop: 12, padding: '10px 18px', background: 'var(--gold)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700, borderRadius: 'var(--radius)', textDecoration: 'none' }}>멤버 수강신청 →</a>
        </div>

        {/* 서비스 동의 배너 — 방침·약관 v1 신설(2026-07-07), 기존 배우 멤버 1회 동의 수집 */}
        {isActorMember && actorId && typeof user.user_metadata?.consent_dist !== 'string' && (
          <Link href="/consent" style={{ display: 'block', padding: '14px 18px', borderRadius: 8, background: 'rgba(21,72,138,0.06)', border: '1px solid rgba(21,72,138,0.3)', textDecoration: 'none' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>서비스 이용 동의 한 번만 확인해 주세요 <span aria-hidden="true">→</span></p>
            <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6 }}>
              개인정보처리방침·이용약관이 새로 생겼어요. 프로필 공개와 캐스팅 연결을 계속 받으려면 동의가 필요해요.
            </p>
          </Link>
        )}

        {/* 내 계정 카드 */}
        <section aria-label="내 계정" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div
              aria-hidden="true"
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--navy)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700,
                flexShrink: 0,
              }}
            >
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
          <section aria-label="내 배우 프로필" style={{ ...card, borderColor: 'rgba(21,72,138,0.2)', background: 'rgba(21,72,138,0.03)' }}>
            <h2 style={sectionTitle}>내 배우 프로필</h2>
            {actorId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {actorExists && completeness && (
                  <ProfileCompletenessCard {...completeness} />
                )}
                {actorExists ? (
                  <Link href={`/actors/${actorId}`} style={primaryBtn}>
                    내 배우 페이지 보기 <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray)', padding: '4px 0' }}>
                    <span aria-hidden="true">⏳</span> 프로필 검토 준비 중 — 자료를 등록하면 관리자 검토 후 공개됩니다.
                  </p>
                )}
                {/* 완성도 카드 안에 편집 버튼이 이미 있으므로, 카드가 없을 때만 별도 타일 노출 (중복 방지) */}
                {!(actorExists && completeness) && (
                  <Link href="/dashboard/edit" style={tileBtn}>
                    <span style={tileIcon} aria-hidden="true">✏️</span>
                    <span>내 프로필 수정</span>
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
                  사진·영상·필모그래피를 등록하면 관리자 검토 후 배우 DB에 공개됩니다.
                </p>
                <div style={{
                  padding: '10px 14px', borderRadius: 6,
                  background: 'rgba(196,165,90,0.06)', border: '1px solid rgba(196,165,90,0.18)',
                  fontSize: '0.78rem', color: 'var(--navy)', lineHeight: 1.7,
                }}>
                  <span aria-hidden="true">📌</span> 기존 KD4 멤버라면 — 가입 시 KD4에 등록된 전화번호와 동일하게 입력해야 프로필이 자동 연결됩니다.
                  전화번호를 수정하려면 내 정보 &gt; 전화번호를 변경해 주세요.
                </div>
                <Link href="/dashboard/edit" style={primaryBtn}>프로필 자료 올리기</Link>
              </div>
            )}
          </section>
        )}

        {/* 내 수강 */}
        {enrErr ? (
          <div role="alert" aria-atomic="true" style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid #e74c3c44', marginBottom: 24 }}>
            <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: 0 }}>수강 내역을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>
          </div>
        ) : (
          <EnrollmentsPanel enrollments={enrollments} thisMonth={thisMonth} nextMonth={nextMonth} />
        )}

        {/* KD4 크루 전용 */}
        {canViewActorDb && (
          <section aria-label="KD4 크루" style={card}>
            <h2 style={sectionTitle}>KD4 크루</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Link href="/actors" style={tileBtn}>
                <span style={tileIcon} aria-hidden="true">🎬</span>
                <span>배우 DB</span>
              </Link>
              <Link href="/board" style={tileBtn}>
                <span style={tileIcon} aria-hidden="true">💬</span>
                <span>커뮤니티</span>
              </Link>
              <Link href="/ai-tools" style={tileBtn}>
                <span style={tileIcon} aria-hidden="true">🤖</span>
                <span>대본 분석</span>
              </Link>
            </div>
          </section>
        )}

        {/* 디렉터 승인 완료 */}
        {isDirector && (
          <section aria-label="디렉터 승인 완료" style={{ ...card, borderColor: 'rgba(196,165,90,0.3)' }}>
            <h2 style={{ ...sectionTitle, color: 'var(--gold)' }}>디렉터 승인 완료</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
              배우 DB에서 <strong style={{ color: 'var(--gold)' }}>연락처 열람 + 사진·프로필 다운로드</strong>가 가능합니다.
            </p>
          </section>
        )}

        {/* 캐스팅 숏리스트 — 디렉터 회원 전용 (2026-07-06 대표 지시: admin 마이페이지에서도 숨김, /shortlist 직접 접근은 유지) */}
        {isDirector && (
          <section aria-label="캐스팅 숏리스트" style={card}>
            <h2 style={sectionTitle}>캐스팅 숏리스트</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>
              배우 DB에서 ♡로 담아둔 관심 배우를 한눈에 모아봅니다. (이 기기에 저장)
            </p>
            <Link href="/shortlist" style={tileBtn}>
              <span style={tileIcon} aria-hidden="true">♥</span>
              <span>내 숏리스트 보기</span>
            </Link>
          </section>
        )}

        {/* 디렉터 권한 신청 */}
        {canRequestDirector && (
          <section aria-label="디렉터 권한 신청" style={{ ...card, borderColor: 'rgba(196,165,90,0.2)' }}>
            <h2 style={sectionTitle}>디렉터 권한 신청</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 8 }}>
              승인 시 배우 <strong style={{ color: 'var(--gold)' }}>연락처 열람 + 사진·프로필 다운로드</strong> 가능.
            </p>
            <DirectorRequestButton />
          </section>
        )}

        {/* 디렉터 승인 대기 */}
        {isDirectorPending && (
          <section aria-label="디렉터 승인 대기 중" style={{ ...card, borderColor: 'rgba(240,173,78,0.3)' }}>
            <h2 style={{ ...sectionTitle, color: '#f0ad4e' }}>디렉터 승인 대기 중</h2>
            <div style={pendingBadge}><span aria-hidden="true">⏳</span> 관리자 승인 검토 중입니다</div>
          </section>
        )}

        {/* KD4 크루 신청 */}
        {canRequestCrew && (
          <section aria-label="KD4 크루 신청" style={card}>
            <h2 style={sectionTitle}>KD4 크루 신청</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6, marginBottom: 8 }}>
              배우 DB · 커뮤니티 · 대본 분석 등 크루 전용 기능 이용 시 필요.
            </p>
            <CrewRequestButton />
          </section>
        )}

        {/* KD4 크루 대기 */}
        {isCrewPending && (
          <section aria-label="KD4 크루 신청 대기 중" style={card}>
            <h2 style={{ ...sectionTitle, color: '#f0ad4e' }}>KD4 크루 신청 대기 중</h2>
            <div style={pendingBadge}><span aria-hidden="true">⏳</span> 관리자 승인 검토 중입니다</div>
          </section>
        )}

        {/* 관리자 */}
        {isAdmin && (
          <section aria-label="관리자" style={{ ...card, borderColor: 'rgba(201,64,58,0.2)' }}>
            <h2 style={{ ...sectionTitle, color: '#c9403a' }}>관리자</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { href: '/admin/enrollments', label: '수강 현황' },
                { href: '/admin/actors', label: '배우 목록 관리' },
                { href: '/admin/users', label: '회원 관리' },
                { href: '/admin', label: '관리자 홈' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', padding: '10px 14px', minHeight: 44,
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
        <section aria-label="커뮤니티" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={sectionTitle}>커뮤니티</h2>
            <Link href="/board?my=1" style={{ fontSize: '0.82rem', color: 'var(--navy)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px' }}>내 게시글 <span aria-hidden="true">→</span></Link>
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
  minHeight: 44,
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--navy)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 7,
  padding: '12px 0',
  minHeight: 44,
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
