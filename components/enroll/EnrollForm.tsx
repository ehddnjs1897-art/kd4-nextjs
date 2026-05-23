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
  isNewMemberOpen?: boolean
  promoLabel?: string
  remainingSeats?: number
  schedule?: string
  duration?: string
  highlight?: boolean
}

// 퍼스널 브랜딩 서비스 목록
const BRANDING_SERVICES: ClassOption[] = [
  {
    nameKo: '프로필 투어 서비스',
    nameEn: 'Profile Tour Service (Replay)',
    step: '서비스',
    price: '30,000',
    course: 'VAT 별도 · VAT 포함 33,000원',
    capacity: '-',
    schedule: '40장 기준',
    duration: '캐스팅 에이전시 배포',
  },
  {
    nameKo: '출연영상 편집 서비스',
    nameEn: 'Film Editing Service',
    step: '서비스',
    price: '50,000',
    course: null,
    capacity: '-',
    schedule: '일정 협의',
    duration: '결과물 납품',
  },
  {
    nameKo: '프로필 편집 서비스',
    nameEn: 'Profile Editing Service',
    step: '서비스',
    price: '30,000',
    course: null,
    capacity: '-',
    schedule: '일정 협의',
    duration: '결과물 납품',
  },
]

const TYPE_META: Record<string, { desc: string }> = {
  '신규 등록':         { desc: 'KD4를 처음 시작하시는 분' },
  '수업 유지':         { desc: '지금 다니는 수업을 다음 달도 그대로 신청해요' },
  '클래스 추가·변경':  { desc: '새로운 클래스나 추가 수강을 신청해요' },
  '퍼스널 브랜딩 서비스': { desc: '프로필 투어·출연영상·프로필 편집 서비스' },
}

const TYPES = ['신규 등록', '수업 유지', '클래스 추가·변경', '퍼스널 브랜딩 서비스'] as const

const STEP_STYLE: Record<string, { bg: string; color: string }> = {
  'STEP 1': { bg: 'rgba(21,72,138,0.10)', color: '#15488A' },
  'STEP 2': { bg: 'rgba(120,90,20,0.12)', color: '#7A5A14' },
  'STEP 3': { bg: 'rgba(140,20,20,0.10)', color: '#8C1414' },
  '별도':   { bg: 'rgba(60,60,60,0.09)',  color: '#555' },
  '서비스': { bg: 'rgba(0,100,70,0.10)',  color: '#006446' },
}

function priceToInt(p: string): number {
  return parseInt(p.replace(/[^0-9]/g, ''), 10) || 0
}
function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function ymLabel(s: string): string {
  const [, m] = s.split('-')
  return `${parseInt(m, 10)}월`
}

export default function EnrollForm({
  classes,
  userName,
  userPhone,
  userEmail,
  initialType = '수업 유지',
  initialSelect = [],
}: {
  classes: ClassOption[]
  userName: string
  userPhone: string
  userEmail: string
  initialType?: string
  initialSelect?: string[]
}) {
  const now = new Date()
  const nextMonth = ym(new Date(now.getFullYear(), now.getMonth() + 1, 1))

  const [type, setType] = useState<string>(initialType)
  const [selected, setSelected] = useState<string[]>(initialSelect)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isMaintain = type === '수업 유지'

  const visibleClasses: ClassOption[] = (() => {
    if (type === '신규 등록') return classes.filter((c) => c.isNewMemberOpen)
    if (type === '퍼스널 브랜딩 서비스') return BRANDING_SERVICES
    if (type === '수업 유지') return []
    return classes // 클래스 추가·변경
  })()

  const allItems = [...classes, ...BRANDING_SERVICES]
  const total = selected.reduce((sum, cn) => {
    const c = allItems.find((x) => x.nameKo === cn)
    return sum + (c ? priceToInt(c.price) : 0)
  }, 0)

  function handleTypeChange(t: string) {
    setType(t)
    setSelected([])
    setError('')
  }

  function toggle(cn: string) {
    setSelected((prev) => (prev.includes(cn) ? prev.filter((x) => x !== cn) : [...prev, cn]))
  }

  async function submit() {
    if (loading) return  // 더블 클릭 방지
    if (!isMaintain && selected.length === 0) {
      setError('수강할 클래스를 1개 이상 선택해 주세요.')
      return
    }
    if (!userPhone) {
      setError('마이페이지에서 연락처를 등록해 주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const classNames = isMaintain ? ['수업 유지'] : selected
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_type: type, class_names: classNames, year_month: nextMonth }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '신청 중 오류가 발생했습니다.')
        setLoading(false)
        return
      }
      setLoading(false)
      setDone(true)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  /* ─── 완료 화면 ─── */
  if (done) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(64px,12vw,120px) 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(21,72,138,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle size={30} color="var(--navy)" strokeWidth={1.8} />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: 12 }}>
            ENROLLMENT COMPLETE
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,4vw,1.8rem)', fontWeight: 700, color: '#111', marginBottom: 14 }}>
            신청 완료
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.9, marginBottom: 32 }}>
            {ymLabel(nextMonth)} 클래스 신청이 접수되었습니다.<br />
            {isMaintain ? '현재 수업 유지로 접수되었어요.' : `${selected.length}개 클래스가 선택되었습니다.`}<br />
            결제 안내는 등록하신 연락처로 개별 안내드립니다.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
            마이페이지로 이동 <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 64, color: '#111' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(48px,9vw,80px) 24px' }}>

        {/* ── 헤더 ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.28em', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: 14, opacity: 0.7 }}>
            CLASS ENROLLMENT
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 700, marginBottom: 12 }}>
            클래스 신청
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7, marginBottom: 16 }}>
            {userName ? `${userName}님, ` : ''}수강하실 클래스를 선택해 주세요.
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 16px', borderRadius: 100,
            background: 'rgba(21,72,138,0.08)', border: '1px solid rgba(21,72,138,0.18)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--navy)', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)' }}>
              {ymLabel(nextMonth)} 클래스 모집 중
            </span>
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 36 }} />

        {/* ── 1. 신청 유형 ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>1</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>신청 유형</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TYPES.map((t) => {
              const active = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: 12,
                    border: `1.5px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
                    background: active ? 'rgba(21,72,138,0.05)' : '#ffffff',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: active ? 'var(--navy)' : '#222' }}>{t}</span>
                    <span style={{ fontSize: '0.77rem', color: 'var(--gray)' }}>{TYPE_META[t]?.desc}</span>
                  </span>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
                    background: active ? 'var(--navy)' : '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 2. 클래스 선택 (수업 유지는 생략) ── */}
        {isMaintain ? (
          /* 수업 유지 안내 박스 */
          <div style={{
            marginBottom: 28, padding: '20px 20px', borderRadius: 14,
            background: 'rgba(21,72,138,0.04)', border: '1.5px solid rgba(21,72,138,0.18)',
          }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
              현재 수업을 다음 달도 그대로 신청합니다
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.7 }}>
              별도 클래스 선택 없이 지금 다니는 수업이 자동으로 접수돼요.<br />
              다른 클래스를 추가하려면 위에서 <strong>클래스 추가·변경</strong>을 선택해 주세요.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>2</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {type === '퍼스널 브랜딩 서비스' ? '서비스 선택' : '클래스 선택'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>(복수 선택 가능)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleClasses.map((c) => {
                const on = selected.includes(c.nameKo)
                const ss = STEP_STYLE[c.step] ?? STEP_STYLE['별도']
                const isService = c.step === '서비스'
                return (
                  <button
                    key={c.nameKo}
                    type="button"
                    onClick={() => toggle(c.nameKo)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '16px 18px', borderRadius: 14,
                      border: `1.5px solid ${on ? 'var(--navy)' : c.highlight ? 'rgba(120,90,20,0.35)' : 'var(--border)'}`,
                      background: on ? 'rgba(21,72,138,0.05)' : '#ffffff',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {c.highlight && !on && (
                      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: 'rgba(120,90,20,0.45)' }} />
                    )}
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 3,
                      border: `1.5px solid ${on ? 'var(--navy)' : 'var(--border)'}`,
                      background: on ? 'var(--navy)' : '#fff',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <CheckCircle size={13} color="#fff" strokeWidth={2.5} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: ss.bg, color: ss.color, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                          {c.step}
                        </span>
                        {c.promoLabel && (
                          <span style={{ fontSize: '0.67rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(120,90,20,0.10)', color: '#7A5A14', whiteSpace: 'nowrap' }}>
                            {c.promoLabel}
                          </span>
                        )}
                        {c.remainingSeats !== undefined && c.remainingSeats <= 3 && (
                          <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(199,62,62,0.10)', color: 'var(--accent-red)', whiteSpace: 'nowrap' }}>
                            잔여 {c.remainingSeats}석
                          </span>
                        )}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', lineHeight: 1.3 }}>{c.nameKo}</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--gray)', display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
                        {c.schedule && <span>{c.schedule}</span>}
                        {c.duration && <span>{c.duration}</span>}
                        {c.capacity && c.capacity !== '-' && <span>정원 {c.capacity}</span>}
                        {c.course && <span>{c.course}</span>}
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                        {c.price}원
                      </span>
                      {!isService && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>/ 월</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 선택 요약 ── */}
        {selected.length > 0 && (
          <div style={{ marginBottom: 20, padding: '16px 18px', background: 'rgba(21,72,138,0.05)', borderRadius: 12, border: '1px solid rgba(21,72,138,0.14)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              선택 항목
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.map((cn) => {
                const c = allItems.find((x) => x.nameKo === cn)
                return (
                  <div key={cn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: '#333' }}>{cn}</span>
                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{c?.price ?? '—'}원</span>
                  </div>
                )
              })}
            </div>
            <div style={{ height: 1, background: 'rgba(21,72,138,0.14)', margin: '12px 0 10px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray)', fontWeight: 600 }}>합계</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)' }}>
                {total.toLocaleString()}원
              </span>
            </div>
          </div>
        )}

        {/* ── 연락처 ── */}
        <div style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#ffffff', gap: 12 }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--gray)', lineHeight: 1.5 }}>
              결제 안내 연락처
              <span style={{ fontSize: '0.72rem', display: 'block', color: 'var(--gray)', opacity: 0.7, marginTop: 2 }}>신청 후 결제 안내를 문자로 드립니다</span>
            </span>
            {userPhone
              ? <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>{userPhone}</span>
              : <Link href="/dashboard" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>마이페이지에서 등록 →</Link>
            }
          </div>
        </div>

        {/* ── 에러 ── */}
        {error && (
          <div role="alert" aria-live="assertive" style={{ padding: '12px 16px', background: 'var(--accent-red-soft)', border: '1px solid rgba(199,62,62,0.25)', borderRadius: 10, marginBottom: 16 }}>
            <p style={{ color: 'var(--accent-red)', fontSize: '0.84rem' }}>{error}</p>
          </div>
        )}

        {/* ── 신청 버튼 ── */}
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          aria-busy={loading}
          style={{
            width: '100%', padding: '15px 24px',
            background: loading ? 'rgba(21,72,138,0.45)' : 'var(--navy)',
            color: '#fff', fontWeight: 800, fontSize: '0.98rem', borderRadius: 14, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? '신청 중...' : (
            <>
              {ymLabel(nextMonth)} 클래스 신청하기
              <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </button>

        <p style={{ fontSize: '0.74rem', color: 'var(--gray)', textAlign: 'center', marginTop: 14, lineHeight: 1.8 }}>
          신청 후 개별 연락을 통해 결제 안내를 드립니다.<br />결제 완료 시 수강이 확정됩니다.
        </p>
      </div>
    </div>
  )
}
