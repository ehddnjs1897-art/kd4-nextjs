'use client'

/**
 * 비밀번호 재설정 메일 링크 클릭 시 도달하는 페이지.
 * Supabase가 자동으로 recovery 세션을 설정해주므로 새 비밀번호만 입력하면 됨.
 *
 * 흐름: /auth/reset → 메일 발송 → 메일 링크 클릭 → /auth/callback (Supabase 토큰 교환)
 *   → /auth/update-password (이 페이지)
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'success'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 페이지 진입 시 recovery 세션이 있는지 확인
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionReady(!!user)
    })
    // 리다이렉트 타이머 언마운트 시 정리
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('비밀번호 변경에 실패했습니다. 링크가 만료된 경우 비밀번호 찾기를 다시 요청해 주세요.')
      setLoading(false)
      return
    }

    setStep('success')
    setLoading(false)

    // 3초 후 자동으로 대시보드로 (언마운트 시 정리)
    redirectTimer.current = setTimeout(() => router.push('/dashboard'), 3000)
  }

  // 세션 확인 중
  if (sessionReady === null) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ color: 'var(--gray)', textAlign: 'center' }}>확인 중...</p>
        </div>
      </div>
    )
  }

  // 세션 없음 — 링크 만료 또는 직접 접근
  if (sessionReady === false) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <span style={styles.logoText}>KD4</span>
            <span lang="en" style={styles.logoSub}>ACTING STUDIO</span>
          </div>
          <h1 style={styles.title}>링크가 만료되었습니다</h1>
          <p style={styles.sentMsg}>
            비밀번호 재설정 링크의 유효 시간이 지났거나 잘못된 링크입니다.
            <br />
            다시 재설정을 요청해 주세요.
          </p>
          <Link href="/auth/reset" style={styles.btnBack}>
            재설정 다시 요청
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span lang="en" style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        {step === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={styles.successIcon} aria-hidden="true">✓</div>
            <h1 style={styles.title}>변경 완료</h1>
            <p role="status" aria-live="polite" style={styles.sentMsg}>
              새 비밀번호로 변경되었습니다.
              <br />
              잠시 후 대시보드로 이동합니다.
            </p>
            <Link href="/dashboard" style={styles.btnBack}>
              대시보드로 이동
            </Link>
          </div>
        ) : (
          <>
            <h1 style={styles.title}>새 비밀번호 입력</h1>

            <form onSubmit={handleUpdate} style={styles.form} aria-label="새 비밀번호 입력">
              {/* 항상 DOM에 존재 — aria-describedby 참조 유효성 + 스크린 리더 즉시 알림 (WCAG 4.1.3) */}
              <div id="update-error" role="alert" aria-live="assertive" aria-atomic="true" style={error ? styles.errorBox : {}}>{error}</div>

              <div style={styles.fieldGroup}>
                <label htmlFor="password" style={styles.label}>
                  새 비밀번호
                </label>
                <span id="password-hint" className="sr-only">8자 이상 입력해주세요</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  aria-invalid={!!error}
                  aria-describedby="password-hint update-error"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="passwordConfirm" style={styles.label}>
                  새 비밀번호 확인
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 한 번 더 입력"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  aria-invalid={!!error}
                  aria-describedby="update-error"
                  style={{
                    ...styles.input,
                    borderColor:
                      passwordConfirm && password !== passwordConfirm
                        ? 'rgba(220,38,38,0.6)'
                        : undefined,
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

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
    fontSize: '1.3rem',
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
    color: '#b91c1c',
    marginBottom: 4,
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
    width: '100%',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '12px 0',
    minHeight: 44,
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    width: '100%',
  },
  sentMsg: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    lineHeight: 1.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  btnBack: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 44,
    background: 'var(--gold)',
    color: '#ffffff',
    borderRadius: 6,
    padding: '11px 24px',
    fontSize: '0.88rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(196, 165, 90, 0.15)',
    border: '2px solid var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    color: 'var(--gold)',
    margin: '0 auto 20px',
  },
}
