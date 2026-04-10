'use client'

/**
 * /auth/setup
 * Google · 카카오 OAuth로 첫 가입한 유저가 회원 유형을 선택하는 페이지.
 * 이메일 가입 유저는 signup 폼에서 이미 선택하므로 여기 오지 않음.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MemberType = 'actor' | 'director'

export default function SetupPage() {
  const router = useRouter()
  const [memberType, setMemberType] = useState<MemberType>('actor')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // 로그인 여부 확인 (비로그인이면 login 페이지로)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/login')
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

    // profiles.role 업데이트
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ role: memberType })
      .eq('id', user.id)

    if (updateErr) {
      setError('저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
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
          <span style={styles.logoSub}>ACTING STUDIO</span>
        </div>

        <h1 style={styles.title}>회원 유형을 선택하세요</h1>
        <p style={styles.subtitle}>가입 목적에 맞는 유형을 선택해 주세요.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.typeGrid}>
            <button
              type="button"
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
              type="button"
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
            type="submit"
            disabled={loading}
            style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '저장 중...' : '완료 →'}
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
    color: '#f87171',
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
}
