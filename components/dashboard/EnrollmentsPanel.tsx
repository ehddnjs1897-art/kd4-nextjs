'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Enrollment {
  id: string
  class_name: string
  year_month: string
  amount: number
  status: string
  payment_status: string
}

function ymLabel(s: string): string {
  const [y, m] = s.split('-')
  return `${y}년 ${parseInt(m, 10)}월`
}

const STATUS_COLOR: Record<string, string> = {
  확정: '#2d8a56',
  휴강: '#9a938b',
  취소: '#c0392b',
}

export default function EnrollmentsPanel({
  enrollments,
  thisMonth,
  nextMonth,
}: {
  enrollments: Enrollment[]
  thisMonth: string
  nextMonth: string
}) {
  const router = useRouter()
  const [items, setItems] = useState<Enrollment[]>(enrollments)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmingRestId, setConfirmingRestId] = useState<string | null>(null)

  // 이번 달 '확정' 클래스 (이어서 수강 대상)
  const thisMonthActive = items.filter((e) => e.year_month === thisMonth && e.status === '확정')
  // 다음 달에 이미 신청한 클래스명
  const nextMonthNames = items.filter((e) => e.year_month === nextMonth).map((e) => e.class_name)
  // 이어서 수강 가능한(다음 달 아직 안 한) 클래스
  const continuable = thisMonthActive.filter((e) => !nextMonthNames.includes(e.class_name))

  async function continueNext() {
    if (continuable.length === 0 || loading) return
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_type: '수업 유지',
          class_names: continuable.map((e) => e.class_name),
          year_month: nextMonth,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || '처리 중 오류가 발생했습니다.')
        return
      }
      setMsg(`${ymLabel(nextMonth)} 수강이 신청되었습니다.`)
      router.refresh()
    } catch {
      setMsg('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function setRest(id: string) {
    if (confirmingRestId !== id) { setConfirmingRestId(id); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '휴강' }),
      })
      if (res.ok) {
        setConfirmingRestId(null)
        setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status: '휴강' } : e)))
      } else {
        const json = await res.json().catch(() => ({}))
        setMsg(json.error || '휴강 처리 중 오류가 발생했습니다.')
      }
    } catch {
      setMsg('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={S.card}>
      <h2 style={S.title}>내 수강</h2>

      {/* 이어서 수강하기 */}
      {continuable.length > 0 && (
        <div style={{ background: 'rgba(196,165,90,0.06)', border: '1px solid rgba(196,165,90,0.25)', borderRadius: 6, padding: 14 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--white)', marginBottom: 4, fontWeight: 600 }}>
            {ymLabel(nextMonth)}에도 이어서 수강하시겠어요?
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginBottom: 10, lineHeight: 1.5 }}>
            {continuable.map((e) => e.class_name).join(', ')}
          </p>
          <button type="button" onClick={continueNext} disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
            {loading ? '처리 중...' : '이어서 수강하기'}
          </button>
        </div>
      )}

      {msg && <p role="status" aria-live="polite" style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>{msg}</p>}

      {/* 수강 내역 */}
      {items.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
          아직 신청한 클래스가 없어요. 아래에서 클래스를 신청해 보세요.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg3, rgba(255,255,255,0.03))', border: '1px solid var(--border)', borderRadius: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)' }}>{e.class_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                  {ymLabel(e.year_month)} · {e.amount.toLocaleString()}원
                </div>
              </div>
              {/* 상태 배지 */}
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: STATUS_COLOR[e.status] ?? '#9a938b' }}>
                {e.status}
              </span>
              {/* 결제 배지 */}
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: e.payment_status === '결제완료' ? '#2d8a56' : '#d4851f' }}>
                {e.payment_status}
              </span>
              {/* 휴강 버튼 (확정 상태만) */}
              {e.status === '확정' && (
                confirmingRestId === e.id ? (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button type="button" onClick={() => setConfirmingRestId(null)} style={{ ...S.btnGhost, fontSize: '0.75rem', padding: '4px 8px' }}>취소</button>
                    <button type="button" onClick={() => setRest(e.id)} disabled={loading} style={{ ...S.btnGhost, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.75rem', padding: '4px 8px' }}>확인</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setRest(e.id)} disabled={loading} style={S.btnGhost}>
                    휴강
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* 다른 클래스 신청 */}
      <Link href="/enroll" style={S.btnSecondary}>
        + 다른 클래스 신청
      </Link>
    </section>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--white)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    paddingBottom: 14,
    borderBottom: '1px solid var(--border)',
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '11px 0',
    fontSize: '0.88rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
  },
  btnSecondary: {
    display: 'block',
    textAlign: 'center',
    border: '1px solid var(--gold)',
    color: 'var(--gold)',
    borderRadius: 6,
    padding: '10px 0',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
  btnGhost: {
    flexShrink: 0,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--gray)',
    borderRadius: 5,
    padding: '5px 10px',
    fontSize: '0.74rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
