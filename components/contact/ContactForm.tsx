'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/classes'

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

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    class_name: '',
    motivation: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      setError('이름과 연락처는 필수입니다.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: dbError } = await supabase.from('applications').insert({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      class_name: form.class_name || null,
      motivation: form.motivation || null,
      status: '대기',
    })

    if (dbError) {
      setError('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }

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
          빠른 시일 내에 연락드리겠습니다.
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

      {/* 이메일 */}
      <div>
        <label style={labelStyle}>이메일</label>
        <input style={inputStyle} type="email" placeholder="example@email.com" value={form.email} onChange={set('email')} />
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
          {CLASSES.map(c => (
            <option key={c.nameKo} value={c.nameKo}>{c.nameKo}</option>
          ))}
        </select>
      </div>

      {/* 문의 내용 */}
      <div>
        <label style={labelStyle}>문의 내용</label>
        <textarea
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
          placeholder="궁금한 점이나 상담 내용을 자유롭게 적어주세요."
          value={form.motivation}
          onChange={set('motivation')}
        />
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: 'var(--gold)',
          color: '#0a0a0a',
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
        {loading ? '전송 중...' : '상담 접수하기'}
      </button>
    </form>
  )
}
