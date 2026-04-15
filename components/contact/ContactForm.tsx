'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/classes'
import { pixel } from '@/lib/meta-pixel'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '12px 16px',
  color: 'var(--white)',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--gray-light)',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  display: 'block',
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
  { value: '방문 상담', label: '방문 상담' },
  { value: '바로 수강신청 (첫 달 10만원 할인)', label: '바로 수강신청 (첫 달 10만원 할인)' },
  { value: '무료 오픈클래스', label: '무료 오픈클래스' },
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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      setError('이름과 연락처는 필수입니다.')
      return
    }
    setLoading(true)
    setError('')

    // 유입경로 + 문의유형을 motivation에 결합
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

    pixel.lead()   // Meta Pixel: Lead 이벤트

    // Fire-and-forget: Make.com → Google Sheets + SMS (서버 경유)
    // source/inquiry_type 분리 전송 → 구글시트 컬럼별 매핑 가능
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
        background: 'rgba(196,165,90,0.08)',
        border: '1px solid rgba(196,165,90,0.3)',
        borderRadius: '8px',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '2rem', marginBottom: '16px' }}>✓</p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
          접수가 완료되었습니다
        </p>
        <p style={{ color: 'var(--gray-light)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--white)' }}>24시간 이내</strong> 카카오톡으로 연락드립니다.<br />
          긴급하시면{' '}
          <a href="https://pf.kakao.com/_ximxdqn" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--gold)', textDecoration: 'underline' }}>카카오 채널</a>로 문의해주세요.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 이름 + 연락처 */}
      <div className="contact-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>이름 <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input style={inputStyle} type="text" placeholder="홍길동" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label style={labelStyle}>연락처 <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input style={inputStyle} type="tel" placeholder="010-0000-0000" value={form.phone} onChange={set('phone')} required />
        </div>
      </div>

      {/* KD4를 어떻게 알게 되셨나요 */}
      <div>
        <label style={labelStyle}>KD4를 어떻게 알게 되셨나요?</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.source}
          onChange={set('source')}
        >
          <option value="">선택해 주세요</option>
          {SOURCE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* 관심 클래스 */}
      <div>
        <label style={labelStyle}>관심 클래스</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.class_name}
          onChange={set('class_name')}
        >
          <option value="">선택 안 함</option>
          {CLASSES.filter(c => c.isNewMemberOpen).map(c => (
            <option key={c.nameKo} value={c.nameKo}>{c.nameKo}</option>
          ))}
        </select>
      </div>

      {/* 문의 유형 */}
      <div>
        <label style={labelStyle}>무엇을 원하시나요?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {INQUIRY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: form.inquiry_type === opt.value ? 'rgba(0,102,255,0.12)' : 'var(--bg3)',
                border: form.inquiry_type === opt.value ? '1px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
                color: form.inquiry_type === opt.value ? 'var(--white)' : 'var(--gray-light)',
              }}
            >
              <input
                type="radio"
                name="inquiry_type"
                value={opt.value}
                checked={form.inquiry_type === opt.value}
                onChange={set('inquiry_type')}
                style={{ accentColor: 'var(--gold)', width: '16px', height: '16px', flexShrink: 0 }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', margin: '-8px 0' }}>
        개인정보는 상담 목적 외 사용되지 않습니다.
      </p>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: 'var(--gold)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          padding: '14px 0',
          fontSize: '0.95rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.06em',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '전송 중...' : '24시간 이내 회신받기'}
      </button>
    </form>
  )
}
