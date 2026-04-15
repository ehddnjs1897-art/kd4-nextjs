'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/classes'
import { pixel } from '@/lib/meta-pixel'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '14px',
  padding: '14px 18px',
  color: 'var(--white)',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  fontWeight: 400,
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.02em',
  marginBottom: '8px',
  display: 'block',
  fontWeight: 400,
}

const SOURCE_OPTIONS = [
  '인스타그램',
  '네이버 블로그',
  '액터길드',
  '필름메이커스',
  'OTR',
  '네이버·구글 검색',
  'AI 추천',
  '지인소개',
  '리플레이 단톡방',
  '기타',
]

const INQUIRY_OPTIONS = [
  { value: '방문 상담',                           label: '방문 상담',     icon: '🌸', desc: '편하게 물어보세요' },
  { value: '바로 수강신청 (첫 달 10만원 할인)',  label: '수강신청',      icon: '⚡', desc: '첫 달 10만원 할인' },
  { value: '무료 오픈클래스',                    label: '오픈클래스',    icon: '🎁', desc: '부담없이 체험' },
]

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    class_name: '',
    source: '',
    inquiry_type: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === field ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
    background: focusedField === field ? 'rgba(0,87,255,0.06)' : 'rgba(255,255,255,0.04)',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      setError('이름과 연락처는 필수입니다.')
      return
    }
    setLoading(true)
    setError('')

    const motivationParts = [
      form.source && `유입경로: ${form.source}`,
      form.inquiry_type && `문의유형: ${form.inquiry_type}`,
    ].filter(Boolean)
    const motivation = motivationParts.length > 0 ? motivationParts.join(' / ') : null

    const supabase = createClient()
    const { error: dbError } = await supabase.from('applications').insert({
      name: form.name,
      phone: form.phone,
      email: null,
      class_name: form.class_name || null,
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
          name: form.name,
          phone: form.phone,
          email: null,
          class_name: form.class_name || null,
          source: form.source || null,
          inquiry_type: form.inquiry_type || null,
          motivation,
          status: '대기',
          created_at: new Date().toISOString(),
        }
      })
    }).catch(() => {})

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(0,87,255,0.06)',
        border: '1px solid rgba(0,87,255,0.2)',
        borderRadius: '20px',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '2.4rem', marginBottom: '16px' }}>🌸</p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '10px', color: 'var(--white)' }}>
          접수 완료!
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.8 }}>
          <strong style={{ color: 'var(--white)' }}>24시간 이내</strong> 카카오톡으로 연락드립니다.<br />
          급하시면{' '}
          <a href="https://pf.kakao.com/_ximxdqn" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--gold)', textDecoration: 'underline' }}>카카오 채널</a>로 바로 문의해주세요.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* 무엇을 원하시나요 — 카드형 택1 */}
      <div>
        <label style={labelStyle}>무엇을 원하시나요?</label>
        <div className="inquiry-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}>
          {INQUIRY_OPTIONS.map(opt => {
            const selected = form.inquiry_type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, inquiry_type: opt.value }))}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '16px 8px',
                  background: selected ? 'rgba(0,87,255,0.14)' : 'rgba(255,255,255,0.03)',
                  border: selected ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'center',
                  boxShadow: selected ? '0 0 0 3px rgba(0,87,255,0.12)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{opt.icon}</span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: selected ? 700 : 500,
                  color: selected ? 'var(--white)' : 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                }}>
                  {opt.label}
                </span>
                <span style={{
                  fontSize: '0.66rem',
                  color: selected ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                  lineHeight: 1.2,
                }}>
                  {opt.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 이름 + 연락처 */}
      <div className="contact-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>이름 <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input
            style={focusStyle('name')}
            type="text"
            placeholder="홍길동"
            value={form.name}
            onChange={set('name')}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>연락처 <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input
            style={focusStyle('phone')}
            type="tel"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={set('phone')}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
            required
          />
        </div>
      </div>

      {/* KD4를 어떻게 알게 되셨나요 */}
      <div>
        <label style={labelStyle}>KD4를 어떻게 알게 되셨나요?</label>
        <select
          style={{ ...focusStyle('source'), cursor: 'pointer' }}
          value={form.source}
          onChange={set('source')}
          onFocus={() => setFocusedField('source')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="">선택해 주세요</option>
          {SOURCE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* 관심 클래스 */}
      <div>
        <label style={labelStyle}>관심 클래스 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>(선택)</span></label>
        <select
          style={{ ...focusStyle('class_name'), cursor: 'pointer' }}
          value={form.class_name}
          onChange={set('class_name')}
          onFocus={() => setFocusedField('class_name')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="">아직 모르겠어요</option>
          {CLASSES.filter(c => c.isNewMemberOpen).map(c => (
            <option key={c.nameKo} value={c.nameKo}>{c.nameKo}</option>
          ))}
        </select>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', margin: '-6px 0', lineHeight: 1.5 }}>
        개인정보는 상담 목적 외 사용되지 않으며, 언제든 삭제 요청 가능합니다.
      </p>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? 'rgba(0,87,255,0.5)' : 'var(--gold)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '14px',
          padding: '17px 0',
          fontSize: '1rem',
          fontWeight: 800,
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.03em',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s, transform 0.15s',
          boxShadow: loading ? 'none' : '0 6px 24px rgba(0,87,255,0.3)',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      >
        {loading ? '전송 중...' : '나에게 맞는 클래스 찾기 →'}
      </button>
    </form>
  )
}
