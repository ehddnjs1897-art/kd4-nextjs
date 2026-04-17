'use client'

import { useState } from 'react'
import { MessageCircle, FileText, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/classes'
import { pixel } from '@/lib/meta-pixel'

const MEISNER_OPTIONS = [
  { value: '', label: '마이즈너 경험 선택 (선택사항)' },
  { value: '처음이다', label: '처음이다' },
  { value: '몇 번 해봤다', label: '몇 번 해봤다' },
  { value: '6개월 이상 훈련했다', label: '6개월 이상 훈련했다' },
]

const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen)

export default function JoinForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [className, setClassName] = useState('')
  const [meisnerExp, setMeisnerExp] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ticketNo, setTicketNo] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: '#ffffff',
    border: `1px solid ${focused === field ? '#15488A' : '#D2D2C8'}`,
    borderRadius: '12px',
    padding: '14px 18px',
    color: '#111111',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    appearance: 'none' as any,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !phone) {
      setError('이름과 연락처는 필수입니다.')
      return
    }
    setLoading(true)
    setError('')

    const motivationParts = [
      '유입경로: 인스타그램광고',
      className && `희망클래스: ${className}`,
      meisnerExp && `마이즈너경험: ${meisnerExp}`,
    ].filter(Boolean)
    const motivation = motivationParts.join(' / ')

    const supabase = createClient()
    const { error: dbError } = await supabase.from('applications').insert({
      name,
      phone,
      email: null,
      class_name: className || null,
      motivation,
      status: '대기',
    })

    if (dbError) {
      setError('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    pixel.lead()

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record: {
          name,
          phone,
          email: null,
          class_name: className || null,
          source: '인스타그램광고',
          motivation,
          status: '대기',
          created_at: new Date().toISOString(),
        },
      }),
    }).catch(() => {})

    /* 간단한 접수번호 생성 (UX용) — KD 연-월-일-4자리 */
    const now = new Date()
    const ymd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const rand = Math.floor(Math.random() * 9000 + 1000)
    setTicketNo(`KD-${ymd}-${rand}`)

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div
        style={{
          background: 'rgba(21,72,138,0.06)',
          border: '1px solid rgba(21,72,138,0.25)',
          borderRadius: '16px',
          padding: '40px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(21,72,138,0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
        >
          <CheckCircle size={28} color="#15488A" strokeWidth={1.8} />
        </div>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#111111',
          }}
        >
          접수 완료되었습니다
        </p>

        {/* 접수번호 */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.78rem',
            color: '#6B6660',
            letterSpacing: '0.1em',
            marginBottom: '20px',
          }}
        >
          접수번호 <strong style={{ color: '#15488A' }}>{ticketNo}</strong>
        </p>

        {/* 다음 안내 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #D2D2C8',
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '20px',
            textAlign: 'left',
          }}
        >
          <p style={{ fontSize: '0.88rem', color: '#111', lineHeight: 1.75, marginBottom: '10px' }}>
            <strong>24시간 이내</strong>{' '}
            <strong style={{ color: '#15488A' }}>권동원 대표</strong>가 직접 카카오톡으로 연락드립니다.
          </p>
          <p style={{ fontSize: '0.82rem', color: '#6B6660', lineHeight: 1.7 }}>
            30분 상담 예약 일정을 잡은 뒤, 스튜디오에서 만나 뵙거나 비대면 상담으로 진행합니다.
          </p>
        </div>

        {/* 리드마그넷 — 가이드 PDF */}
        <a
          href="https://pf.kakao.com/_ximxdqn"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#15488A',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: '10px',
          }}
        >
          <FileText size={15} strokeWidth={2} />
          오디션 합격 가이드 받기
        </a>

        <p style={{ fontSize: '0.78rem', color: '#6B6660', marginTop: '14px', lineHeight: 1.7 }}>
          급하시면{' '}
          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#15488A',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <MessageCircle size={12} strokeWidth={2.2} />
            카카오 채널
          </a>
          로 먼저 문의하셔도 됩니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 이름 */}
      <input
        type="text"
        placeholder="이름 *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={() => setFocused('name')}
        onBlur={() => setFocused(null)}
        style={inputStyle('name')}
        required
      />

      {/* 연락처 */}
      <input
        type="tel"
        placeholder="연락처 * (010-0000-0000)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onFocus={() => setFocused('phone')}
        onBlur={() => setFocused(null)}
        style={inputStyle('phone')}
        required
        aria-describedby="phone-hint"
      />
      <p
        id="phone-hint"
        style={{
          fontSize: '0.72rem',
          color: '#6B6660',
          margin: '-4px 0 0 4px',
          letterSpacing: '0.01em',
        }}
      >
        카카오톡으로만 연락드립니다 · 광고 전화 없음
      </p>

      {/* 희망 클래스 */}
      <div style={{ position: 'relative' }}>
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          onFocus={() => setFocused('class')}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle('class'), cursor: 'pointer' }}
        >
          <option value="">희망 클래스 선택 (선택사항)</option>
          {OPEN_CLASSES.map((c) => (
            <option key={c.nameKo} value={c.nameKo}>
              {c.nameKo}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6B6660',
            fontSize: '0.8rem',
          }}
        >
          ▼
        </span>
      </div>

      {/* 마이즈너 경험 */}
      <div style={{ position: 'relative' }}>
        <select
          value={meisnerExp}
          onChange={(e) => setMeisnerExp(e.target.value)}
          onFocus={() => setFocused('meisner')}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle('meisner'), cursor: 'pointer' }}
        >
          {MEISNER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6B6660',
            fontSize: '0.8rem',
          }}
        >
          ▼
        </span>
      </div>

      {/* 에러 */}
      {error && (
        <p style={{ color: '#C73E3E', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          background: loading ? 'rgba(21,72,138,0.5)' : '#15488A',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.05rem',
          letterSpacing: '0.04em',
          borderRadius: '12px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, transform 0.15s',
          marginTop: '4px',
          fontFamily: 'inherit',
        }}
      >
        {loading ? '신청 중...' : '무료 상담 신청하기 →'}
      </button>
    </form>
  )
}
