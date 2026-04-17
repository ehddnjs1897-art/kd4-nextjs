'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/classes'
import { pixel } from '@/lib/meta-pixel'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '14px 18px',
  color: '#111111',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  fontWeight: 400,
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--gray)',
  letterSpacing: '0.02em',
  marginBottom: '8px',
  display: 'block',
  fontWeight: 500,
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
  { value: '방문 상담',                           label: '방문 상담',  icon: '😊', desc: '자세한 상담' },
  { value: '바로 수강신청 (첫 달 10만원 할인)',  label: '봄 맞이, 웰컴 할인',   icon: '🌸', desc: '(마이즈너 정규, 출연영상)' },
  { value: '무료 오픈클래스',                    label: '오픈클래스', icon: '🎁', desc: '무료 체험 클래스\n(대기 신청)' },
]

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    class_name: '',
    source: '',
    inquiry_type: '',
  })
  const [maiznerExp, setMaiznerExp] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === field ? 'var(--navy)' : 'var(--border)',
    background: focusedField === field ? 'rgba(21,72,138,0.04)' : '#ffffff',
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
      maiznerExp && `마이즈너경험: ${maiznerExp}`,
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
        background: 'rgba(21,72,138,0.06)',
        border: '1px solid rgba(21,72,138,0.2)',
        borderRadius: '20px',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '2.4rem', marginBottom: '16px' }}>🌸</p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '10px', color: '#111111' }}>
          접수 완료!
        </p>
        <p style={{ color: 'var(--gray)', fontSize: '0.9rem', lineHeight: 1.8 }}>
          <strong style={{ color: '#111111' }}>24시간 이내</strong> 카카오톡으로 연락드립니다.<br />
          급하시면{' '}
          <a href="https://pf.kakao.com/_ximxdqn" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--navy)', textDecoration: 'underline' }}>카카오 채널</a>로 바로 문의해주세요.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* 무엇을 원하시나요 — 카드형 택1 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>무엇을 원하시나요?</label>
          <span style={{ fontSize: '0.68rem', color: 'var(--gray-light)', letterSpacing: '0.02em' }}>택 1</span>
        </div>
        <div className="inquiry-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}>
          {INQUIRY_OPTIONS.map(opt => {
            const selected = form.inquiry_type === opt.value
            const anySelected = form.inquiry_type !== ''
            const dimmed = anySelected && !selected
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
                  background: selected ? 'rgba(21,72,138,0.08)' : '#ffffff',
                  border: selected ? '1.5px solid var(--navy)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'center',
                  boxShadow: selected ? '0 0 0 3px rgba(21,72,138,0.08)' : 'none',
                  opacity: dimmed ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{opt.icon}</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: selected ? 700 : 500,
                  color: selected ? '#111111' : 'var(--gray)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                }}>
                  {opt.label}
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  color: selected ? 'var(--navy)' : 'var(--gray-light)',
                  lineHeight: 1.3,
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
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
          <label style={labelStyle}>이름 <span style={{ color: 'var(--navy)' }}>*</span></label>
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
          <label style={labelStyle}>연락처 <span style={{ color: 'var(--navy)' }}>*</span></label>
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

      {/* 마이즈너 테크닉 경험 여부 */}
      <div>
        <label style={labelStyle}>마이즈너 테크닉 경험 여부 <span style={{ color: 'var(--gray-light)', fontSize: '0.7rem' }}>(선택)</span></label>
        <select
          style={{ ...focusStyle('meisner'), cursor: 'pointer' }}
          value={maiznerExp}
          onChange={(e) => setMaiznerExp(e.target.value)}
          onFocus={() => setFocusedField('meisner')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="">선택 안 함</option>
          <option value="처음이다.">처음이다.</option>
          <option value="몇 번 해봤다.">몇 번 해봤다.</option>
          <option value="6개월 이상 훈련 했다.">6개월 이상 훈련 했다.</option>
        </select>
      </div>

      {/* 관심 클래스 */}
      <div>
        <label style={labelStyle}>관심 클래스 <span style={{ color: 'var(--gray-light)', fontSize: '0.7rem' }}>(선택)</span></label>
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

      <p style={{ color: 'var(--gray-light)', fontSize: '0.72rem', margin: '-6px 0', lineHeight: 1.5 }}>
        개인정보는 상담 목적 외 사용되지 않으며, 언제든 삭제 요청 가능합니다.
      </p>

      {error && (
        <p style={{ color: '#C73E3E', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? 'rgba(21,72,138,0.5)' : 'var(--navy)',
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
          boxShadow: loading ? 'none' : '0 6px 20px rgba(21,72,138,0.25)',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      >
        {loading ? '전송 중...' : '상담 접수'}
      </button>
    </form>
  )
}
