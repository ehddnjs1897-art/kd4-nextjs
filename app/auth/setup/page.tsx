'use client'

/**
 * /auth/setup
 * Google · 카카오 OAuth로 첫 가입한 유저가 회원 유형과 휴대폰 번호를 입력하는 페이지.
 * 2026-09-12 대표 지시 «번호 안 남기면 가입 못 하게» — 번호는 필수.
 * 번호 없이 가입된 기존 회원도 대시보드에서 이리로 보내져 번호만 입력한다(유형 선택은 숨김).
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MemberType = 'actor' | 'director'

export default function SetupPage() {
  const router = useRouter()
  const [memberType, setMemberType] = useState<MemberType>('actor')
  const [phone, setPhone] = useState('')
  // 이미 회원 유형이 정해진 기존 가입자(번호만 없음) → 유형 선택 숨기고 번호만 받음
  const [typeLocked, setTypeLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  // 에러 발생 시 포커스 이동 (WCAG 2.4.3)
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  // 로그인 여부 확인 (비로그인이면 login, 이미 setup 완료된 유저면 dashboard로)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      const mt = user.user_metadata?.member_type
      const hasPhone = !!String(user.user_metadata?.phone ?? '').trim()
      // 유형·번호 둘 다 있으면 설정 완료 → dashboard. 번호가 없으면 기존 가입자도 여기서 번호를 받는다
      if (mt && hasPhone) { router.replace('/dashboard'); return }
      if (mt === 'actor' || mt === 'director') { setMemberType(mt); setTypeLocked(true) }
      setChecking(false)
    })
  }, [router])

  function formatPhone(value: string) {
    // signup 폼과 동일 — 마지막 4자리 기준 분할
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length < 4) return d
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!phone.trim()) { setError('휴대폰 번호를 입력해 주세요.'); return }
    if (!/^0[0-9]{1,2}[\-\s]?[0-9]{3,4}[\-\s]?[0-9]{4}$/.test(phone.replace(/\s/g, ''))) {
      setError('연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)')
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    // member_type은 user_metadata에만 저장 (role은 관리자만 변경 가능)
    const { error: updateErr } = await supabase.auth.updateUser({
      data: { member_type: memberType, phone }
    })

    if (updateErr) {
      setError('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    // profiles.phone 저장 + 배우 프로필 재매칭 — 대시보드 연락처 저장과 같은 경로(/api/profile PATCH).
    // 이름은 현재 profiles 값을 그대로 보내 덮어쓰기 방지. 실패해도 metadata.phone 은 저장됐으므로 흐름은 계속.
    try {
      const { data: prof } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()
      const name = (prof?.name || user.user_metadata?.name || user.user_metadata?.full_name || '').toString().trim()
      if (name) {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone }),
          signal: AbortSignal.timeout(10_000),
        })
      }
    } catch { /* metadata.phone 저장 완료 — 프로필 행 반영은 다음 저장 시 */ }

    // 디렉터 선택 시(신규 설정일 때만): 승인 대기 상태로 신청 + 관리자 알림 (승인 후 연락처 열람 가능)
    if (memberType === 'director' && !typeLocked) {
      try {
        await fetch('/api/director-request', { method: 'POST', signal: AbortSignal.timeout(10_000) })
      } catch {
        // 신청 실패해도 대시보드에서 다시 신청 가능 → 흐름 막지 않음
      }
    }

    router.replace('/dashboard')
  }

  if (checking) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ color: 'var(--gray)', textAlign: 'center' }}>확인 중...</p>
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

        <h1 style={styles.title}>{typeLocked ? '휴대폰 번호를 입력해 주세요' : '회원 유형을 선택하세요'}</h1>
        <p style={styles.subtitle}>
          {typeLocked
            ? '캐스팅·수업 연락을 위해 휴대폰 번호가 필요합니다.'
            : '가입 목적에 맞는 유형을 선택하고 휴대폰 번호를 입력해 주세요.'}
        </p>

        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          aria-atomic="true"
          style={{ outline: 'none', ...(error ? styles.errorBox : {}) }}
        >{error ?? ''}</div>

        <form onSubmit={handleSubmit} aria-label="회원 정보 입력">
          {!typeLocked && (
          <div role="group" aria-label="회원 유형" style={styles.typeGrid}>
            <button
              type="button"
              aria-pressed={memberType === 'actor'}
              style={{
                ...styles.typeCard,
                ...(memberType === 'actor' ? styles.typeCardActive : {}),
              }}
              onClick={() => setMemberType('actor')}
            >
              <span style={styles.typeIcon} aria-hidden="true">🎬</span>
              <span style={styles.typeLabel}>배우 회원</span>
              <span style={styles.typeDesc}>
                KD4에서 활동하는 배우
                <br />내 프로필·갤러리 관리 + KD4 멤버 열람
              </span>
            </button>

            <button
              type="button"
              aria-pressed={memberType === 'director'}
              style={{
                ...styles.typeCard,
                ...(memberType === 'director' ? styles.typeCardActive : {}),
              }}
              onClick={() => setMemberType('director')}
            >
              <span style={styles.typeIcon} aria-hidden="true">🎥</span>
              <span style={styles.typeLabel}>디렉터 회원</span>
              <span style={styles.typeDesc}>
                캐스팅 디렉터, 조감독, 제작사
                <br />승인 후 배우 연락처·프로필 열람
              </span>
            </button>
          </div>
          )}

          <div style={styles.fieldGroup}>
            <label htmlFor="setup-phone" style={styles.label}>
              휴대폰 번호 <span aria-hidden="true" style={{ color: 'var(--gold)' }}>*</span>
            </label>
            <input
              id="setup-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              disabled={loading}
              maxLength={13}
              required
              aria-required="true"
              autoComplete="tel"
              aria-describedby="setup-phone-hint"
              style={styles.input}
            />
            <p id="setup-phone-hint" style={styles.hint}>
              <span aria-hidden="true">📌</span> {memberType === 'actor'
                ? 'KD4에 등록된 번호와 같으면 기존 배우 프로필과 자동 연결됩니다.'
                : '승인 안내와 배우 연락 관련 연락을 드릴 번호예요.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '저장 중...' : <>완료 <span aria-hidden="true">→</span></>}
          </button>
        </form>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--gray)',
    marginBottom: 28,
  },
  errorBox: {
    background: 'rgba(220,38,38,0.12)',
    border: '1px solid rgba(220,38,38,0.4)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: '#b91c1c',
    marginBottom: 20,
    lineHeight: 1.5,
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
    minWidth: 44,
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
  typeIcon: { fontSize: '1.8rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '1rem',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--white)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  hint: { fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.5, margin: 0 },
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
    minHeight: 44,
  },
}
