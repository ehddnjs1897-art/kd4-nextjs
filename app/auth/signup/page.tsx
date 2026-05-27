'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MemberType = 'actor' | 'director'
type Step = 'type-select' | 'form' | 'success'

export default function SignupPage() {
  const router = useRouter()
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
  const successRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // 성공 화면 전환 시 포커스 이동 (WCAG 2.4.3 Focus Order)
  useEffect(() => {
    if (step === 'success') successRef.current?.focus()
  }, [step])

  // 에러 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
    })
  }, [router])

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
    if (memberType === 'actor' && phone && !/^0[0-9]{1,2}[\-\s]?[0-9]{3,4}[\-\s]?[0-9]{4}$/.test(phone.replace(/\s/g, ''))) {
      setError('연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)')
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

    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'https://kd4.club')}/auth/callback`,
      },
    })

    if (authError) {
      const msg = authError.message
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        // 이미 존재하는 이메일과 아닌 경우를 구분하지 않음 — 이메일 열거 공격 방지
        setError('입력하신 정보를 다시 확인해 주세요.')
      } else if (msg.includes('rate limit') || msg.includes('Email rate limit')) {
        setError('이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
      } else if (msg.includes('disabled') || msg.includes('not enabled')) {
        setError('이메일 회원가입이 현재 비활성화되어 있습니다.')
      } else {
        // 내부 오류 메시지 노출 금지 — 서버 로그로만 확인
        console.error('[signup] authError:', msg)
        setError('가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      }
      setLoading(false)
      return
    }

    // 이메일 인증 OFF: signUp이 즉시 세션 반환 → 메일 안내 대신 dashboard 직행
    // 이메일 인증 ON: 세션 없음 → success 화면에서 메일 확인 안내
    const userId = signUpData?.user?.id
    const hasSession = !!signUpData?.session

    if (userId && hasSession) {
      // role 설정 + 배우 매칭은 서버에서 처리 (클라이언트에선 role 변경 불가 - RLS)
      const onSignupRes = await fetch('/api/auth/on-signup', { method: 'POST', signal: AbortSignal.timeout(15_000) })
      if (!onSignupRes.ok) {
        // 초기화 실패 시 사용자에게 알림 (role이 user로 남아 배우 기능 못 쓸 수 있음)
        console.error('[signup] on-signup failed:', await onSignupRes.text())
        setError('계정 초기 설정에 실패했습니다. 잠시 후 다시 시도하거나 관리자에게 문의하세요.')
        setLoading(false)
        return
      }
    }

    setLoading(false)

    if (hasSession) {
      // 이미 로그인됨 — 곧바로 대시보드로
      router.push('/dashboard')
    } else {
      // 메일 인증 대기 화면
      setStep('success')
    }
  }

  /* ---- Step 1: 유형 선택 ---- */
  if (step === 'type-select') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoArea}>
            <span style={styles.logoText}>KD4</span>
            <span lang="en" style={styles.logoSub}>ACTING STUDIO</span>
          </div>

          <h1 id="type-group-label" style={styles.title}>회원 유형을 선택하세요</h1>
          <p style={styles.subtitle}>가입 목적에 맞는 유형을 선택해 주세요.</p>

          <div role="group" aria-labelledby="type-group-label" style={styles.typeGrid}>
            <button
              type="button"
              style={{
                ...styles.typeCard,
                ...(memberType === 'actor' ? styles.typeCardActive : {}),
              }}
              onClick={() => setMemberType('actor')}
              aria-pressed={memberType === 'actor'}
            >
              <span style={styles.typeIcon}>🎬</span>
              <span style={styles.typeLabel}>배우 회원</span>
              <span style={styles.typeDesc}>
                KD4에서 활동하는 배우
                <br />내 프로필·갤러리 관리 + KD4 멤버 열람
              </span>
            </button>

            <button
              type="button"
              style={{
                ...styles.typeCard,
                ...(memberType === 'director' ? styles.typeCardActive : {}),
              }}
              onClick={() => setMemberType('director')}
              aria-pressed={memberType === 'director'}
            >
              <span style={styles.typeIcon}>🎥</span>
              <span style={styles.typeLabel}>디렉터 회원</span>
              <span style={styles.typeDesc}>
                캐스팅 디렉터, 조감독, 제작사
                <br />승인 후 배우 연락처·프로필 열람
              </span>
            </button>
          </div>

          <button
            type="button"
            aria-label="다음 단계로"
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
        <div ref={successRef} tabIndex={-1} role="status" style={{ ...styles.card, outline: 'none' }}>
          <div style={styles.successIcon} aria-hidden="true">✓</div>
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
          <span lang="en" style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        {/* 유형 배지 */}
        <div style={styles.typeBadgeRow}>
          <span style={styles.typeBadge}>
            {memberType === 'actor' ? '🎬 배우 회원' : '🎥 디렉터 회원'}
          </span>
          <button
            type="button"
            style={styles.typeChangeBtn}
            onClick={() => setStep('type-select')}
            aria-label="회원 유형 변경"
          >
            변경
          </button>
        </div>

        <h1 style={styles.title}>회원가입</h1>

        <div
          ref={errorRef}
          id="signup-error"
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ outline: 'none', ...(error ? styles.errorBox : {}) }}
        >{error ?? ''}</div>

        <p className="sr-only">별표(*)는 필수 항목입니다</p>
        <form onSubmit={handleSignup} style={styles.form}>
          {/* 이름 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="name" style={styles.label}>
              이름 <span aria-hidden="true" style={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="실명을 입력하세요"
              required
              disabled={loading}
              autoComplete="name"
              maxLength={50}
              spellCheck={false}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'signup-error' : undefined}
              style={styles.input}
            />
          </div>

          {/* 이메일 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              이메일 <span aria-hidden="true" style={styles.required}>*</span>
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
              maxLength={254}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'signup-error' : undefined}
              style={styles.input}
            />
          </div>

          {/* 비밀번호 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              비밀번호 <span aria-hidden="true" style={styles.required}>*</span>
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
              maxLength={128}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? 'password-hint signup-error' : 'password-hint'}
              style={styles.input}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div style={styles.fieldGroup}>
            <label htmlFor="passwordConfirm" style={styles.label}>
              비밀번호 확인 <span aria-hidden="true" style={styles.required}>*</span>
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력하세요"
              required
              disabled={loading}
              autoComplete="new-password"
              maxLength={128}
              aria-invalid={!!error || (passwordConfirm ? password !== passwordConfirm : false) || undefined}
              aria-describedby={[error ? 'signup-error' : '', 'signup-pw-mismatch'].filter(Boolean).join(' ')}
              style={{
                ...styles.input,
                borderColor:
                  passwordConfirm && password !== passwordConfirm
                    ? 'rgba(220,38,38,0.6)'
                    : undefined,
              }}
            />
            {/* 항상 DOM에 존재 — aria-describedby 참조 유효성 + 스크린 리더 즉시 알림 (WCAG 4.1.3) */}
            <span
              id="signup-pw-mismatch"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              style={passwordConfirm && password !== passwordConfirm ? styles.fieldError : {}}
            >
              {passwordConfirm && password !== passwordConfirm ? '비밀번호가 일치하지 않습니다.' : ''}
            </span>
          </div>

          {/* 배우 회원: 전화번호 */}
          {memberType === 'actor' && (
            <div style={styles.fieldGroup}>
              <label htmlFor="phone" style={styles.label}>
                전화번호 <span aria-hidden="true" style={styles.required}>*</span>
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="010-0000-0000"
                disabled={loading}
                maxLength={13}
                required
                autoComplete="tel"
                aria-invalid={!!error || undefined}
                aria-describedby={['phone-hint', error ? 'signup-error' : ''].filter(Boolean).join(' ') || undefined}
                style={styles.input}
              />
              <p id="phone-hint" style={styles.hint}>
                📌 KD4에 등록된 번호와 동일해야 배우 프로필과 자동 연결됩니다.
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
                autoComplete="organization"
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'signup-error' : undefined}
                style={styles.input}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
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
    padding: 'clamp(20px, 6vw, 40px) clamp(16px, 6vw, 36px)',
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
    color: 'var(--gray-light)',
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
    minHeight: 44,
    paddingInline: '8px',
  },
  errorBox: {
    background: 'rgba(220, 38, 38, 0.12)',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: '#991111',
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
    width: '100%',
    fontFamily: 'inherit',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#b91c1c',
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--gold)',
    letterSpacing: '0.02em',
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
    color: '#ffffff',
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
