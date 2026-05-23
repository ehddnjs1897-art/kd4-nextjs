'use client'

import { useState } from 'react'

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: string
  created_at: string
  actor_id: string | null
}

interface Props {
  profiles: Profile[]
}

const ROLE_CYCLE: Record<string, string> = {
  user: 'crew',
  crew_pending: 'crew',
  crew: 'editor',
  editor: 'admin',
  admin: 'user',
  // 배우 멤버: crew로 순환 (크루 기능 추가)
  member: 'crew',
  actor: 'crew',
  // 디렉터: pending → 승인, director → 일반 user로 revoke
  director_pending: 'director',
  director: 'user',
}

const ROLE_LABEL: Record<string, string> = {
  user: '일반회원',
  crew_pending: '크루 신청 대기',
  crew: 'KD4 크루',
  actor: '배우 멤버',
  member: '배우 멤버',
  editor: '편집자',
  director: '디렉터',
  director_pending: '디렉터 대기',
  admin: '관리자',
}

const ROLE_COLOR: Record<string, string> = {
  user: 'var(--gray)',
  crew_pending: '#f0ad4e',
  crew: 'var(--navy)',
  actor: 'var(--gold)',
  member: 'var(--gold)',
  editor: '#5bc0de',
  director: '#5bc0de',
  director_pending: '#f0ad4e',
  admin: '#c9403a',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function UsersManagementTable({ profiles: initialProfiles }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleRoleChange(profileId: string, currentRole: string) {
    if (loadingId) return
    const newRole = ROLE_CYCLE[currentRole] ?? 'user'
    setLoadingId(profileId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profileId, role: newRole }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        showToast(`역할 변경 실패: ${error}`)
        return
      }
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p))
    } catch {
      showToast('역할 변경 중 오류가 발생했습니다.')
    } finally {
      setLoadingId(null)
    }
  }

  const filtered = search.trim()
    ? profiles.filter(p =>
        (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        ROLE_LABEL[p.role]?.includes(search)
      )
    : profiles

  // 역할별 통계
  const counts: Record<string, number> = {}
  for (const p of profiles) { counts[p.role] = (counts[p.role] ?? 0) + 1 }

  return (
    <div>
      {toast && (
        <p role="alert" style={{ fontSize: '0.82rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
          {toast}
        </p>
      )}

      {/* 역할 통계 칩 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([role, cnt]) => (
          <span key={role} style={{
            fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20,
            border: `1px solid ${ROLE_COLOR[role] ?? 'var(--border)'}`,
            color: ROLE_COLOR[role] ?? 'var(--gray)',
            background: 'transparent',
          }}>
            {ROLE_LABEL[role] ?? role} {cnt}
          </span>
        ))}
      </div>

      {/* 검색 */}
      <input
        aria-label="사용자 검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="이름, 이메일, 역할 검색..."
        style={{
          width: '100%', maxWidth: 320, marginBottom: 16,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '8px 12px', color: 'var(--white)',
          fontSize: '0.85rem', fontFamily: 'var(--font-sans)', outline: 'none',
        }}
      />

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['이름', '이메일', '역할', '배우 연결', '가입일'].map(h => (
                <th key={h} scope="col" style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--gray)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--gray)' }}>
                  {search ? '검색 결과가 없습니다.' : '회원이 없습니다.'}
                </td>
              </tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--white)', fontWeight: 500 }}>
                  {p.name || '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--gray)' }}>
                  {p.email || '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => handleRoleChange(p.id, p.role)}
                    disabled={loadingId === p.id}
                    title="클릭 시 역할 순환 변경"
                    style={{
                      padding: '3px 10px', borderRadius: 12,
                      border: `1px solid ${ROLE_COLOR[p.role] ?? 'var(--border)'}`,
                      color: ROLE_COLOR[p.role] ?? 'var(--gray)',
                      background: 'transparent', cursor: loadingId === p.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
                      opacity: loadingId === p.id ? 0.5 : 1,
                    }}
                  >
                    {loadingId === p.id ? '…' : (ROLE_LABEL[p.role] ?? p.role)}
                  </button>
                </td>
                <td style={{ padding: '10px 12px', color: p.actor_id ? 'var(--gold)' : 'var(--gray)', fontSize: '0.8rem' }}>
                  {p.actor_id ? '✓ 연결됨' : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--gray)' }}>
                  {formatDate(p.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
