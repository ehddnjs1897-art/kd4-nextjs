'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'sent'

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (resetError) {
      setError('재설정 메일 발송에 실패했습니다. 이메일을 확인해 주세요.')
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        <h1 style={styles.title}>비밀번호 재설정</h1>

        {step === 'sent' ? (
          <div style={{ textAlign: 'center' }}>
            <p style={styles.sentMsg}>
              <strong style={{ color: 'var(--gold)' }}>{email}</strong>으로
              재설정 링크를 발송했습니다.
              <br />
              메일을 확인해 주세요.
            </p>
            <Link href="/auth/login" style={styles.btnBack}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={styles.form}>
            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>
                가입한 이메일
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

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '발송 중...' : '재설정 링크 받기'}
            </button>

            <Link href="/auth/login" style={styles.backLink}>
              ← 로그인으로 돌아가기
            </Link>
          </form>
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
    color: '#f87171',
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
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '12px 0',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    width: '100%',
  },
  backLink: {
    textAlign: 'center',
    fontSize: '0.82rem',
    color: 'var(--gray)',
    textDecoration: 'none',
  },
  sentMsg: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    lineHeight: 1.7,
    marginBottom: 24,
  },
  btnBack: {
    display: 'inline-block',
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
}
