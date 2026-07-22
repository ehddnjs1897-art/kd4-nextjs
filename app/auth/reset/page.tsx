'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Step = 'form' | 'sent'

// 2026-07-22 이메일 → 문자(SMS) 재설정 전환.
// 기존 이메일 방식은 Supabase 기본 메일서버 제한으로 실제 도착하지 않는데
// "발송했습니다"라고만 떠서 허위 안내 상태였음(대표 지시로 교체).
// 가입 이메일 + 등록된 휴대폰이 모두 일치해야 그 등록 번호로 링크가 발송된다.
export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  // 에러 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
        signal: AbortSignal.timeout(15_000),
      })
      const data = (await res.json()) as { ok?: boolean; maskedPhone?: string; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error || '요청에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        setLoading(false)
        return
      }
      setMaskedPhone(data.maskedPhone ?? '등록된 번호')
      setStep('sent')
    } catch {
      setError('요청에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span lang="en" style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        <h1 style={styles.title}>비밀번호 재설정</h1>

        {step === 'sent' ? (
          <div role="status" style={{ textAlign: 'center' }}>
            <p style={styles.sentMsg}>
              등록된 휴대폰 <strong style={{ color: 'var(--gold)' }}>{maskedPhone}</strong>로
              재설정 링크를 문자로 보냈습니다.
              <br />
              1시간 안에 문자의 링크를 눌러주세요.
            </p>
            <Link href="/auth/login" style={styles.btnBack}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={styles.form} aria-label="비밀번호 재설정">
            <p style={styles.guideMsg}>
              가입 이메일과 등록된 휴대폰 번호가 일치하면
              <br />그 번호로 재설정 링크를 <strong>문자</strong>로 보내드려요.
            </p>

            <div
              ref={errorRef}
              id="reset-error"
              tabIndex={-1}
              role="alert"
              aria-atomic="true"
              style={{ outline: 'none', ...(error ? styles.errorBox : {}) }}
            >{error ?? ''}</div>

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
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? "reset-error" : undefined}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="phone" style={styles.label}>
                등록된 휴대폰 번호
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                required
                disabled={loading}
                autoComplete="tel"
                aria-invalid={!!error}
                aria-describedby={error ? "reset-error" : undefined}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '발송 중...' : '문자로 재설정 링크 받기'}
            </button>

            <p style={styles.helpMsg}>
              문자를 받을 수 없거나 번호가 바뀌었다면 010-8564-0244로 문의해 주세요.
            </p>

            <Link href="/auth/login" style={styles.backLink}>
              <span aria-hidden="true">← </span>로그인으로 돌아가기
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
    padding: 'clamp(28px, 6vw, 40px) clamp(18px, 6vw, 36px)',
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
  guideMsg: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
    lineHeight: 1.7,
    textAlign: 'center',
    marginBottom: 4,
  },
  helpMsg: {
    fontSize: '0.78rem',
    color: 'var(--gray)',
    lineHeight: 1.6,
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
}
