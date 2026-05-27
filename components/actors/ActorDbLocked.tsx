import Link from 'next/link'
import type { UserRole } from '@/lib/types'

/**
 * 배우 개인 프로필 페이지에 비로그인/권한 없음 접근 시 보여주는 안내 화면.
 * - 비로그인: 로그인 / 회원가입 유도 (목록은 누구나 볼 수 있고, 개별 프로필만 회원 전용)
 * - 디렉터 승인대기: 승인 대기 안내
 */
export default function ActorDbLocked({
  role,
  nextUrl = '/actors',
}: {
  role: UserRole | null
  nextUrl?: string
}) {
  const loggedOut = !role
  const pending = role === 'director_pending'

  let title = '배우 프로필은 KD4 회원 전용입니다'
  let desc =
    '배우 목록은 누구나 둘러볼 수 있지만, 개별 프로필 열람은 로그인 후 가능합니다. 연락처는 승인된 디렉터만 확인할 수 있습니다.'
  if (pending) {
    title = '디렉터 승인 대기 중입니다'
    desc =
      '디렉터 권한이 승인되면 배우 연락처까지 열람하실 수 있습니다. 승인까지 잠시만 기다려 주세요.'
  } else if (!loggedOut) {
    title = '배우 DB 열람 권한이 없습니다'
    desc =
      '현재 회원 유형으로는 배우 DB를 열람하실 수 없습니다. 회원 유형 변경 문의는 마이페이지를 통해 주세요.'
  }

  const loginHref = `/auth/login?next=${encodeURIComponent(nextUrl)}`

  return (
    <main style={styles.page}>
      <div style={styles.box}>
        <div style={styles.icon} aria-hidden="true">🔒</div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.desc}>{desc}</p>
        <div style={styles.btns}>
          {loggedOut ? (
            <>
              <Link href={loginHref} style={styles.btnPrimary}>로그인</Link>
              <Link href="/auth/signup" style={styles.btnSecondary}>회원가입</Link>
              <Link href="/actors" style={styles.btnTertiary}>← 배우 목록으로 돌아가기</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" style={styles.btnPrimary}>마이페이지로 이동</Link>
              <Link href="/actors" style={styles.btnTertiary}>← 배우 목록으로 돌아가기</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 80,
    paddingBottom: 80,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  box: {
    maxWidth: 460,
    margin: '60px 24px',
    textAlign: 'center',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '56px 40px',
  },
  icon: { fontSize: '2.6rem', marginBottom: 18 },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: 14,
    letterSpacing: '0.02em',
  },
  desc: {
    fontSize: '0.92rem',
    color: 'var(--gray)',
    lineHeight: 1.8,
    marginBottom: 28,
  },
  btns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--gold)',
    color: '#ffffff',
    borderRadius: 6,
    padding: '12px 0',
    minHeight: 44,
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  btnSecondary: {
    display: 'block',
    border: '1px solid var(--border)',
    color: 'var(--gray)',
    borderRadius: 6,
    padding: '12px 0',
    minHeight: 44,
    fontSize: '0.88rem',
    textDecoration: 'none',
  },
  btnTertiary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray)',
    padding: '8px 0',
    minHeight: 44,
    fontSize: '0.82rem',
    textDecoration: 'none',
    marginTop: 4,
  },
}
