'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'success'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
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
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('이미 가입된 이메일입니다. 로그인 페이지로 이동해 주세요.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      }
      setLoading(false)
      return
    }

    setStep('success')
    setLoading(false)
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
  }

  if (step === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.title}>이메일을 확인해 주세요</h1>
          <p style={styles.successDesc}>
            <strong style={{ color: 'var(--gold)' }}>{email}</strong>으로
            인증 메일을 발송했습니다.
            <br />
            메일함을 확인하고 링크를 클릭해 가입을 완료해 주세요.
          </p>
          <p style={{ ...styles.successDesc, color: 'var(--gray)', fontSize: '0.8rem', marginTop: 12 }}>
            메일이 오지 않는 경우 스팸 메일함을 확인해 주세요.
          </p>
          <Link href="/auth/login" style={styles.btnBack}>
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* 로고 */}
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        <h1 style={styles.title}>회원가입</h1>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSignup} style={styles.form}>
          {/* 이름 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="name" style={styles.label}>
              이름 <span style={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="실명을 입력하세요"
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          {/* 이메일 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              이메일 <span style={styles.required}>*</span>
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

          {/* 비밀번호 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              비밀번호 <span style={styles.required}>*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              required
              disabled={loading}
              style={styles.input}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="passwordConfirm" style={styles.label}>
              비밀번호 확인 <span style={styles.required}>*</span>
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력하세요"
              required
              disabled={loading}
              style={{
                ...styles.input,
                borderColor:
                  passwordConfirm && password !== passwordConfirm
                    ? 'rgba(220,38,38,0.6)'
                    : undefined,
              }}
            />
            {passwordConfirm && password !== passwordConfirm && (
              <span style={styles.fieldError}>비밀번호가 일치하지 않습니다.</span>
            )}
          </div>

          {/* 전화번호 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="phone" style={styles.label}>
              전화번호
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              disabled={loading}
              maxLength={13}
              style={styles.input}
            />
            <p style={styles.hint}>
              전화번호 입력 시 배우 DB와 자동 매칭됩니다.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              opacity: loading ? 0.6 : 1,
              marginTop: 8,
            }}
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p style={styles.loginText}>
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" style={styles.loginLink}>
            로그인
          </Link>
        </p>
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
    padding: '60px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
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
  required: {
    color: 'var(--gold)',
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
  fieldError: {
    fontSize: '0.75rem',
    color: '#f87171',
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--gold)',
    letterSpacing: '0.02em',
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
  },
  loginText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: '0.875rem',
    color: 'var(--gray)',
  },
  loginLink: {
    color: 'var(--gold)',
    fontWeight: 600,
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
  successDesc: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    textAlign: 'center',
    lineHeight: 1.7,
  },
  btnBack: {
    display: 'block',
    marginTop: 28,
    background: 'var(--gold)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 6,
    padding: '12px 0',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    textAlign: 'center',
    letterSpacing: '0.05em',
    cursor: 'pointer',
  },
}
