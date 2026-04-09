'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      )
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (authError) {
      setError('구글 로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  function handleKakaoLogin() {
    window.location.href = '/api/auth/kakao'
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* 로고 영역 */}
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        <h1 style={styles.title}>로그인</h1>

        {/* 에러 메시지 */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleEmailLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.forgotRow}>
            <Link href="/auth/reset" style={styles.forgotLink}>
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '로그인 중...' : '이메일로 로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>또는</span>
          <span style={styles.dividerLine} />
        </div>

        {/* 소셜 로그인 */}
        <div style={styles.socialGroup}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              ...styles.btnSocial,
              ...styles.btnGoogle,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <GoogleIcon />
            Google로 계속하기
          </button>

          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            style={{
              ...styles.btnSocial,
              ...styles.btnKakao,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <KakaoIcon />
            카카오로 계속하기
          </button>
        </div>

        {/* 회원가입 링크 */}
        <p style={styles.signupText}>
          아직 계정이 없으신가요?{' '}
          <Link href="/auth/signup" style={styles.signupLink}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

/* ---- 인라인 아이콘 ---- */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M17.64 9.2a10.35 10.35 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26C11.17 14.27 10.17 14.6 9 14.6c-2.34 0-4.32-1.58-5.03-3.71H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.89A5.4 5.4 0 0 1 3.69 9c0-.65.11-1.28.28-1.89V4.77H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.23l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35L14.98 2.4A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.77l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="#3C1E1E"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.72 1.68 5.12 4.2 6.56l-1.08 4 4.36-2.88c.8.12 1.64.2 2.52.2 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
    </svg>
  )
}

/* ---- 스타일 ---- */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '40px 36px',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 28,
    gap: 4,
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.1em',
  },
  logoSub: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gray)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 600,
    color: 'var(--white)',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    background: 'rgba(220, 38, 38, 0.12)',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: '#f87171',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
    letterSpacing: '0.05em',
  },
  input: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '10px 14px',
    color: 'var(--white)',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: -4,
  },
  forgotLink: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
    transition: 'color 0.2s',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 6,
    padding: '12px 0',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.2s',
    marginTop: 4,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  dividerText: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
    flexShrink: 0,
  },
  socialGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  btnSocial: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '11px 0',
    borderRadius: 6,
    fontSize: '0.9rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'opacity 0.2s',
  },
  btnGoogle: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
  },
  btnKakao: {
    background: '#FEE500',
    color: '#3C1E1E',
    fontWeight: 700,
  },
  signupText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: '0.875rem',
    color: 'var(--gray)',
  },
  signupLink: {
    color: 'var(--gold)',
    fontWeight: 600,
  },
}
