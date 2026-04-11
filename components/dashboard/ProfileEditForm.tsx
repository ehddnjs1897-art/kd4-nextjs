'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialName: string
  initialPhone: string
  email: string
  role: string
  createdAt: string
}

const ROLE_LABEL: Record<string, string> = {
  user: '일반 회원',
  crew_pending: 'KD4 크루 (승인 대기)',
  crew: 'KD4 크루',
  actor: '배우 회원 (승인 대기)',
  editor: '배우 회원',
  director: '디렉터 회원',
  admin: '관리자',
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function ProfileEditForm({ initialName, initialPhone, email, role, createdAt }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '저장 중 오류가 발생했습니다.')
      } else {
        setSuccess(true)
        setEditing(false)
        router.refresh()
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(initialName)
    setPhone(initialPhone)
    setEditing(false)
    setError('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--gold)',
    borderRadius: 6,
    color: 'var(--white)',
    padding: '9px 12px',
    fontSize: '0.88rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  }

  const readonlyStyle: React.CSSProperties = {
    fontSize: '0.88rem',
    color: 'var(--white)',
    padding: '9px 0',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    color: 'var(--gray)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 5,
    display: 'block',
    fontWeight: 500,
  }

  return (
    <div>
      {/* 헤더: 제목 + 수정/완료 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--white)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          내 정보
        </h2>

        {!editing ? (
          <button
            onClick={() => { setEditing(true); setSuccess(false) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--gray)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.color = 'var(--gold)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--gray)'
            }}
          >
            ✏️ 수정
          </button>
        ) : null}
      </div>

      {/* 아바타 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(59,91,219,0.15)',
          border: '2px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem', fontWeight: 700,
          color: 'var(--gold)', flexShrink: 0,
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>
            {name}
          </p>
          <span style={{
            display: 'inline-block', padding: '2px 10px',
            background: 'rgba(59,91,219,0.1)', border: '1px solid rgba(59,91,219,0.3)',
            borderRadius: 12, fontSize: '0.72rem', color: 'var(--gold-light)', letterSpacing: '0.04em',
          }}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 이름 */}
          <div>
            <label style={labelStyle}>이름</label>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required maxLength={50}
                style={inputStyle}
                autoFocus
              />
            ) : (
              <p style={readonlyStyle}>{name}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label style={labelStyle}>전화번호</label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                maxLength={20}
                style={inputStyle}
              />
            ) : (
              <p style={{ ...readonlyStyle, color: phone ? 'var(--white)' : 'var(--gray)' }}>
                {phone || '미입력'}
              </p>
            )}
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label style={labelStyle}>이메일</label>
            <p style={{ ...readonlyStyle, color: 'var(--gray-light)' }}>{email}</p>
          </div>

          {/* 가입일 (읽기 전용) */}
          <div>
            <label style={labelStyle}>가입일</label>
            <p style={{ ...readonlyStyle, color: 'var(--gray-light)' }}>{formatDate(createdAt)}</p>
          </div>

          {/* 역할 (읽기 전용) */}
          <div>
            <label style={labelStyle}>역할</label>
            <p style={{ ...readonlyStyle, color: 'var(--gray-light)' }}>{ROLE_LABEL[role] ?? role}</p>
          </div>

        </div>

        {/* 에러 */}
        {error && (
          <p style={{
            fontSize: '0.8rem', color: '#ff6b6b', marginTop: 14,
            padding: '8px 12px', background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)', borderRadius: 5,
          }}>
            {error}
          </p>
        )}

        {/* 저장 / 취소 버튼 */}
        {editing && (
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: '10px 0',
                background: saving ? 'var(--border)' : 'var(--gold)',
                color: saving ? 'var(--gray)' : '#fff',
                border: 'none', borderRadius: 6,
                fontSize: '0.9rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                transition: 'background 0.2s',
              }}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--gray)',
                fontSize: '0.9rem', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              취소
            </button>
          </div>
        )}
      </form>

      {/* 성공 메시지 */}
      {success && !editing && (
        <p style={{
          fontSize: '0.82rem', color: '#4ade80',
          marginTop: 14, padding: '8px 12px',
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: 5,
        }}>
          ✓ 정보가 저장되었습니다.
        </p>
      )}
    </div>
  )
}
