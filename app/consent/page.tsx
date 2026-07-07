'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * 기존 회원 서비스 동의 페이지 (방침·약관 v1 신설, 2026-07-07)
 * — 대시보드 배너에서 진입. 동의하면 /api/consent가 auth metadata에 버전 기록.
 */
export default function ConsentPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [memberType, setMemberType] = useState<string | null>(null)
  const [agreeTos, setAgreeTos] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeDist, setAgreeDist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login?next=/consent')
        return
      }
      setMemberType((user.user_metadata?.member_type as string | undefined) ?? null)
      // 이미 기록된 동의는 미리 체크된 상태로
      if (typeof user.user_metadata?.consent_tos === 'string') setAgreeTos(true)
      if (typeof user.user_metadata?.consent_privacy === 'string') setAgreePrivacy(true)
      if (typeof user.user_metadata?.consent_dist === 'string') setAgreeDist(true)
      setChecking(false)
    })
  }, [router])

  const isDirector = memberType === 'director'
  // 배우 멤버(또는 유형 미기록 일반 회원)는 프로필 공개·제공 동의까지 필수
  const distRequired = !isDirector

  async function submit() {
    setError('')
    if (!agreeTos || !agreePrivacy) {
      setError('이용약관과 개인정보 수집·이용 동의(필수)에 체크해 주세요.')
      return
    }
    if (distRequired && !agreeDist) {
      setError('프로필 공개·캐스팅 관계자 제공 동의(필수)에 체크해 주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tos: agreeTos, privacy: agreePrivacy, dist: agreeDist }),
        signal: AbortSignal.timeout(15_000),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || '동의 저장에 실패했습니다.')
      router.push('/dashboard?consent=done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.eyebrow}><span lang="en">SERVICE CONSENT</span></p>
        <h1 style={s.title}>서비스 이용 동의</h1>
        <p style={s.desc}>
          개인정보처리방침과 이용약관이 새로 마련됐어요. (2026년 7월 7일 시행)
          <br />프로필 공개와 캐스팅 연결을 계속 받으시려면 아래 동의가 필요합니다.
        </p>

        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          aria-atomic="true"
          style={{ outline: 'none', ...(error ? s.errorBox : {}) }}
        >{error ?? ''}</div>

        {checking ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--gray)', textAlign: 'center', padding: '24px 0' }}>확인 중...</p>
        ) : (
          <>
            <div style={s.group}>
              <label style={s.row}>
                <input type="checkbox" checked={agreeTos} onChange={(e) => setAgreeTos(e.target.checked)} disabled={loading} style={s.box} />
                <span style={s.text}>
                  <Link href="/terms" target="_blank" style={s.link}>이용약관</Link> 동의 <span aria-hidden="true" style={s.req}>*</span>
                </span>
              </label>
              <label style={s.row}>
                <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} disabled={loading} style={s.box} />
                <span style={s.text}>
                  <Link href="/privacy" target="_blank" style={s.link}>개인정보 수집·이용</Link> 동의 <span aria-hidden="true" style={s.req}>*</span>
                </span>
              </label>
              <label style={s.row}>
                <input type="checkbox" checked={agreeDist} onChange={(e) => setAgreeDist(e.target.checked)} disabled={loading} style={s.box} />
                <span style={s.text}>
                  프로필 공개 및 캐스팅 관계자 제공·사진영상 이용 동의
                  {distRequired ? <span aria-hidden="true" style={s.req}> *</span> : <span style={s.sub}> (배우 멤버 해당)</span>}
                  <br /><span style={s.sub}>캐스팅 연결을 위한 동의예요 — 언제든 비공개 전환할 수 있어요</span>
                </span>
              </label>
            </div>

            <button type="button" onClick={submit} disabled={loading} aria-busy={loading} style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}>
              {loading ? '저장 중...' : '동의하고 계속하기'}
            </button>
          </>
        )}

        <p style={s.backText}>
          <Link href="/dashboard" style={{ color: 'var(--gray)' }}>마이페이지로 돌아가기</Link>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 'clamp(24px, 6vw, 40px) clamp(18px, 6vw, 36px)',
  },
  eyebrow: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    letterSpacing: '0.3em',
    color: 'var(--navy)',
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.3rem',
    fontWeight: 600,
    color: 'var(--white)',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: '0.85rem',
    color: 'var(--gray)',
    lineHeight: 1.7,
    textAlign: 'center',
    marginBottom: 20,
    wordBreak: 'keep-all',
  },
  errorBox: {
    background: 'rgba(220, 38, 38, 0.12)',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: '0.85rem',
    color: '#991111',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '16px 14px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    marginBottom: 18,
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    cursor: 'pointer',
  },
  box: {
    width: 20,
    height: 20,
    marginTop: 1,
    accentColor: 'var(--navy)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  text: {
    fontSize: '0.85rem',
    color: 'var(--white)',
    lineHeight: 1.6,
  },
  link: {
    color: 'var(--gold)',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  sub: {
    fontSize: '0.73rem',
    color: 'var(--gray)',
    lineHeight: 1.6,
  },
  req: {
    color: 'var(--gold)',
  },
  btn: {
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '13px 0',
    minHeight: 48,
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    width: '100%',
  },
  backText: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: '0.8rem',
  },
}
