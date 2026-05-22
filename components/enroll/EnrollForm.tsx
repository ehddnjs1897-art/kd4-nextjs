'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

interface ClassOption {
  nameKo: string
  nameEn: string
  step: string
  price: string
  course: string | null
  capacity: string
}

const TYPES = ['신규 등록', '기존 KD4 멤버', '브랜딩 서비스'] as const

function priceToInt(p: string): number {
  return parseInt(p.replace(/[^0-9]/g, ''), 10) || 0
}
function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function ymLabel(s: string): string {
  const [y, m] = s.split('-')
  return `${y}년 ${parseInt(m, 10)}월`
}

export default function EnrollForm({
  classes,
  userName,
  userPhone,
  userEmail,
}: {
  classes: ClassOption[]
  userName: string
  userPhone: string
  userEmail: string
}) {
  // 수강월은 자동으로 다음 달 고정 (선택 안 함)
  const now = new Date()
  const nextMonth = ym(new Date(now.getFullYear(), now.getMonth() + 1, 1))

  const [type, setType] = useState<string>('기존 KD4 멤버')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const total = selected.reduce((sum, cn) => {
    const c = classes.find((x) => x.nameKo === cn)
    return sum + (c ? priceToInt(c.price) : 0)
  }, 0)

  function toggle(cn: string) {
    setSelected((prev) => (prev.includes(cn) ? prev.filter((x) => x !== cn) : [...prev, cn]))
  }

  async function submit() {
    if (selected.length === 0) {
      setError('수강할 클래스를 1개 이상 선택해 주세요.')
      return
    }
    if (!userPhone) {
      setError('연락처가 없습니다. 마이페이지에서 연락처를 먼저 등록해 주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // 연락처는 회원정보(서버 profiles) 자동 사용 · 수강월은 다음 달 자동
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_type: type, class_names: selected, year_month: nextMonth }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '신청 중 오류가 발생했습니다.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(64px,12vw,120px) 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(21,72,138,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <CheckCircle size={28} color="var(--navy)" strokeWidth={1.8} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: '#111', marginBottom: 10 }}>
            수강 신청 완료
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, marginBottom: 28 }}>
            {ymLabel(nextMonth)} · {selected.length}개 클래스 신청이 접수되었습니다.<br />
            마이페이지에서 신청 내역과 결제 안내를 확인하세요.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
            마이페이지로 이동 <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    )
  }

  const labelStyle: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 10, display: 'block', letterSpacing: '0.02em' }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64, color: '#111' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(48px,9vw,80px) 24px' }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.25em', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: 14 }}>
            CLASS ENROLLMENT
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem,4vw,2.1rem)', fontWeight: 700, marginBottom: 10 }}>
            클래스 신청
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
            {userName ? `${userName}님, ` : ''}수강하실 클래스를 선택해 주세요.
          </p>
        </div>

        {/* 1. 유형 */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>1. 신청 유형</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: '1 1 auto',
                  minHeight: 44,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${type === t ? 'var(--navy)' : 'var(--border)'}`,
                  background: type === t ? 'rgba(21,72,138,0.06)' : '#fff',
                  color: type === t ? 'var(--navy)' : 'var(--gray)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 클래스 (다중) */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>2. 수강 클래스 (복수 선택 가능)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {classes.map((c) => {
              const on = selected.includes(c.nameKo)
              return (
                <button
                  key={c.nameKo}
                  type="button"
                  onClick={() => toggle(c.nameKo)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${on ? 'var(--navy)' : 'var(--border)'}`,
                    background: on ? 'rgba(21,72,138,0.05)' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${on ? 'var(--navy)' : 'var(--border)'}`,
                    background: on ? 'var(--navy)' : '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <CheckCircle size={14} color="#fff" strokeWidth={2.5} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{c.nameKo}</span>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gray)' }}>
                      {c.step} · 정원 {c.capacity}{c.course ? ` · ${c.course}` : ''}
                    </span>
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                    {c.price}원
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 수강 시작월(다음 달 자동) + 연락처(회원정보 연동) 안내 */}
        <div style={{ marginBottom: 24, padding: '16px 18px', background: 'var(--bg2)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.86rem', color: 'var(--gray)' }}>
            📅 수강 시작
            <strong style={{ color: 'var(--navy)', marginLeft: 6 }}>{ymLabel(nextMonth)}</strong>
            <span style={{ fontSize: '0.76rem', marginLeft: 6 }}>(다음 달 자동)</span>
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--gray)' }}>
            📞 연락처
            {userPhone
              ? <strong style={{ color: '#111', marginLeft: 6 }}>{userPhone}</strong>
              : <span style={{ color: 'var(--accent-red)', marginLeft: 6 }}>미등록</span>}
            <span style={{ fontSize: '0.76rem', marginLeft: 6 }}>(회원정보 연동)</span>
          </div>
          {!userPhone && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', lineHeight: 1.5 }}>
              ※ 마이페이지에서 연락처를 먼저 등록해 주세요.
            </div>
          )}
        </div>

        {/* 합계 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'var(--bg2)', borderRadius: 12, marginBottom: 20 }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--gray)', fontWeight: 600 }}>
            합계 ({selected.length}개)
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)' }}>
            {total.toLocaleString()}원
          </span>
        </div>

        {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: 14 }}>{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%', padding: 16, background: loading ? 'rgba(21,72,138,0.5)' : 'var(--navy)',
            color: '#fff', fontWeight: 800, fontSize: '1.05rem', borderRadius: 12, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {loading ? '신청 중...' : '수강 신청하기'}
        </button>

        <p style={{ fontSize: '0.76rem', color: 'var(--gray)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          신청 후 결제 안내를 드립니다. 결제 완료 시 수강이 확정됩니다.
        </p>
      </div>
    </div>
  )
}
