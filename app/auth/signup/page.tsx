'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type MemberType = 'actor' | 'director'
type Step = 'type-select' | 'form' | 'success'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('type-select')
  const [memberType, setMemberType] = useState<MemberType>('actor')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [affiliation, setAffiliation] = useState('') // 디렉터: 소속 (선택)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
  }

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

    const metadata: Record<string, string> = {
      name,
      member_type: memberType,
    }
    if (memberType === 'actor' && phone) {
      metadata.phone = phone
    }
    if (memberType === 'director' && affiliation) {
      metadata.affiliation = affiliation
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      const msg = authError.message
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('이미 가입된 이메일입니다. 로그인 페이지로 이동해 주세요.')
      } else if (msg.includes('rate limit') || msg.includes('Email rate limit')) {
        setError('이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
      } else if (msg.includes('disabled') || msg.includes('not enabled')) {
        setError('이메일 회원가입이 현재 비활성화되어 있습니다.')
      } else {
        setError(`오류: ${msg}`)
      }
      setLoading(false)
      return
    }

    setStep('success')
    setLoading(false)
  }

  /* ---- Step 1: 유형 선택 ---- */
  if (step === 'type-select') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <span style={styles.logoText}>KD4</span>
            <span style={styles.logoSub}>ACTING STUDIO</span>
          </div>

          <h1 style={styles.title}>회원 유형을 선택하세요</h1>
          <p style={styles.subtitle}>가입 목적에 맞는 유형을 선택해 주세요.</p>

          <div style={styles.typeGrid}>
            <button
              style={{
                ...styles.typeCard,
                ...(memberType === 'actor' ? styles.typeCardActive : {}),
              }}
              onClick={() => setMemberType('actor')}
            >
              <span style={styles.typeIcon}>🎬</span>
              <span style={styles.typeLabel}>배우 회원</span>
              <span style={styles.typeDesc}>
                KD4 스튜디오에서 활동하는 배우
                <br />내 갤러리 페이지 관리 가능
              </span>
            </button>

            <button
              style={{
                ...styles.typeCard,
                ...(memberType === 'director' ? styles.typeCardActive : {}),
              }}
              onClick={() => setMemberType('director')}
            >
              <span style={styles.typeIcon}>🎥</span>
              <span style={styles.typeLabel}>디렉터 회원</span>
              <span style={styles.typeDesc}>
                캐스팅 디렉터, 조감독, 제작사
                <br />배우 DB 전체 열람 가능
              </span>
            </button>
          </div>

          <button
            style={styles.btnPrimary}
            onClick={() => setStep('form')}
          >
            다음 →
          </button>

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

  /* ---- Step 3: 성공 ---- */
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

  /* ---- Step 2: 가입 폼 ---- */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoText}>KD4</span>
          <span style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        {/* 유형 배지 */}
        <div style={styles.typeBadgeRow}>
          <span style={styles.typeBadge}>
            {memberType === 'actor' ? '🎬 배우 회원' : '🎥 디렉터 회원'}
          </span>
          <button
            style={styles.typeChangeBtn}
            onClick={() => setStep('type-select')}
          >
            변경
          </button>
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

          {/* 배우 회원: 전화번호 */}
          {memberType === 'actor' && (
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
                전화번호 입력 시 배우 DB와 자동 연결됩니다.
              </p>
            </div>
          )}

          {/* 디렉터 회원: 소속 */}
          {memberType === 'director' && (
            <div style={styles.fieldGroup}>
              <label htmlFor="affiliation" style={styles.label}>
                소속 <span style={styles.optional}>(선택)</span>
              </label>
              <input
                id="affiliation"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="제작사, 캐스팅사, 방송국 등"
                disabled={loading}
                style={styles.input}
              />
            </div>
          )}

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
    maxWidth: 460,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--gray)',
    marginBottom: 28,
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px 12px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  typeCardActive: {
    borderColor: 'var(--gold)',
    background: 'rgba(196,165,90,0.08)',
  },
  typeIcon: {
    fontSize: '1.8rem',
  },
  typeLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--white)',
    letterSpacing: '0.03em',
  },
  typeDesc: {
    fontSize: '0.72rem',
    color: 'var(--gray)',
    lineHeight: 1.6,
  },
  typeBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  typeBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    background: 'rgba(196,165,90,0.1)',
    border: '1px solid rgba(196,165,90,0.35)',
    borderRadius: 20,
    fontSize: '0.8rem',
    color: 'var(--gold)',
    fontWeight: 600,
  },
  typeChangeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--gray)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
    padding: 0,
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
  optional: {
    color: 'var(--gray)',
    fontSize: '0.72rem',
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
    textDecoration: 'none',
  },
}
