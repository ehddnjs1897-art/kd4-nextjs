'use client'

/**
 * /auth/setup
 * Google · 카카오 OAuth로 첫 가입한 유저가 회원 유형을 선택하는 페이지.
 * 이메일 가입 유저는 signup 폼에서 이미 선택하므로 여기 오지 않음.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MemberType = 'actor' | 'director'

export default function SetupPage() {
  const router = useRouter()
  const [memberType, setMemberType] = useState<MemberType>('actor')
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
      if (!user) router.replace('/auth/login')
      // OAuth 신규 유저만 이 페이지에 접근. 이미 member_type이 설정된 유저는 dashboard로
      else if (user.user_metadata?.member_type) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    // member_type은 user_metadata에만 저장 (role은 관리자만 변경 가능)
    const { error: updateErr } = await supabase.auth.updateUser({
      data: { member_type: memberType }
    })

    if (updateErr) {
      setError('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    // 디렉터 선택 시: 승인 대기 상태로 신청 + 관리자 알림 (승인 후 연락처 열람 가능)
    if (memberType === 'director') {
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

        <h1 style={styles.title}>회원 유형을 선택하세요</h1>
        <p style={styles.subtitle}>가입 목적에 맞는 유형을 선택해 주세요.</p>

        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          aria-atomic="true"
          style={{ outline: 'none', ...(error ? styles.errorBox : {}) }}
        >{error ?? ''}</div>

        <form onSubmit={handleSubmit} aria-label="회원 유형 선택">
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
