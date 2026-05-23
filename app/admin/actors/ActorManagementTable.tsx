'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface ActorRow {
  id: string
  name: string
  is_public: boolean
  profile_doc_path: string | null
  age_group: string | null
  gender: string | null
  photoCount: number
  videoCount: number
  filmCount: number
  profileUserId: string | null
}

interface Props {
  actors: ActorRow[]
}

export default function ActorManagementTable({ actors: initialActors }: Props) {
  const [actors, setActors] = useState<ActorRow[]>(initialActors)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'private'>('all')

  const totalPublic = actors.filter(a => a.is_public).length
  const totalWithPhoto = actors.filter(a => a.photoCount > 0).length
  const totalWithVideo = actors.filter(a => a.videoCount > 0).length
  const totalWithFilm = actors.filter(a => a.filmCount > 0).length
  const totalWithPpt = actors.filter(a => !!a.profile_doc_path).length

  const filtered = useMemo(() => {
    let list = actors
    if (statusFilter === 'public') list = list.filter(a => a.is_public)
    if (statusFilter === 'private') list = list.filter(a => !a.is_public)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(a => a.name.toLowerCase().includes(q) || (a.age_group ?? '').toLowerCase().includes(q))
    return list
  }, [actors, query, statusFilter])

  async function handleToggle(actor: ActorRow) {
    if (loadingId) return
    setLoadingId(actor.id)
    const next = !actor.is_public
    try {
      const res = await fetch(`/api/admin/actors/${actor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
      })
      if (!res.ok) throw new Error('변경 실패')
      setActors(prev => prev.map(a => a.id === actor.id ? { ...a, is_public: next } : a))
    } catch {
      setErrorMsg('변경에 실패했습니다. 새로고침 후 다시 시도해 주세요.')
      setTimeout(() => setErrorMsg(''), 4000)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      {errorMsg && (
        <p role="alert" style={{ fontSize: '0.82rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
          {errorMsg}
        </p>
      )}
      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: '전체 배우', value: actors.length, color: 'var(--gold)' },
          { label: '공개 중', value: totalPublic, color: '#4ade80' },
          { label: '사진 있음', value: totalWithPhoto, color: 'var(--gray)' },
          { label: '영상 있음', value: totalWithVideo, color: 'var(--gray)' },
          { label: 'PPTX 있음', value: totalWithPpt, color: 'var(--gray)' },
          { label: '필모 있음', value: totalWithFilm, color: 'var(--gray)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 검색 + 필터 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)', fontSize: '0.85rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름으로 검색..."
            aria-label="배우 이름 검색"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--white)', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', outline: 'none',
            }}
          />
        </div>
        {(['all', 'public', 'private'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} aria-pressed={statusFilter === f} style={{
            padding: '7px 14px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
            background: statusFilter === f ? 'var(--gold)' : 'var(--bg2)',
            color: statusFilter === f ? 'var(--bg)' : 'var(--gray)',
            border: `1px solid ${statusFilter === f ? 'var(--gold)' : 'var(--border)'}`,
            fontWeight: statusFilter === f ? 700 : 400, fontFamily: 'var(--font-sans)',
          }}>
            {f === 'all' ? '전체' : f === 'public' ? '공개만' : '비공개만'}
          </button>
        ))}
        {(query || statusFilter !== 'all') && (
          <span style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>{filtered.length}명</span>
        )}
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['이름', '사진', '영상', 'PPTX', '필모', '상태', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 12px', textAlign: 'left',
                  fontFamily: 'var(--font-display)', fontSize: '0.68rem',
                  letterSpacing: '0.12em', color: 'var(--gray)',
                  textTransform: 'uppercase', fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(actor => (
              <tr key={actor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {/* 이름 */}
                <td style={{ padding: '12px 12px' }}>
                  <Link href={`/actors/${actor.id}`} target="_blank" rel="noopener noreferrer" style={{
                    color: 'var(--white)', textDecoration: 'none', fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                  }}>
                    {actor.name}
                  </Link>
                  {actor.age_group && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray)', marginLeft: 6 }}>
                      {actor.age_group}
                    </span>
                  )}
                </td>
                {/* 사진 */}
                <td style={{ padding: '12px 12px' }}>
                  <CountBadge count={actor.photoCount} />
                </td>
                {/* 영상 */}
                <td style={{ padding: '12px 12px' }}>
                  <CountBadge count={actor.videoCount} />
                </td>
                {/* PPTX */}
                <td style={{ padding: '12px 12px' }}>
                  {actor.profile_doc_path
                    ? <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>✓ 있음</span>
                    : <span style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>—</span>
                  }
                </td>
                {/* 필모 */}
                <td style={{ padding: '12px 12px' }}>
                  <CountBadge count={actor.filmCount} />
                </td>
                {/* 공개 상태 */}
                <td style={{ padding: '12px 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: actor.is_public ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${actor.is_public ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
                    color: actor.is_public ? '#4ade80' : 'var(--gray)',
                  }}>
                    {actor.is_public ? '● 공개' : '○ 비공개'}
                  </span>
                </td>
                {/* 액션 */}
                <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={`/actors/${actor.id}`} style={{
                      padding: '5px 10px', borderRadius: 5, fontSize: '0.74rem',
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--gray)', textDecoration: 'none',
                    }}>
                      보기
                    </Link>
                    <button
                      onClick={() => handleToggle(actor)}
                      disabled={loadingId === actor.id}
                      style={{
                        padding: '5px 10px', borderRadius: 5, fontSize: '0.74rem',
                        cursor: 'pointer', border: 'none',
                        background: actor.is_public ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)',
                        color: actor.is_public ? '#ef4444' : '#4ade80',
                        opacity: loadingId === actor.id ? 0.5 : 1,
                        fontWeight: 600,
                      }}
                    >
                      {loadingId === actor.id ? '…' : actor.is_public ? '비공개' : '공개'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: '0.88rem' }}>
            {query || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '등록된 배우가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) return <span style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>—</span>
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
      background: 'rgba(196,165,90,0.1)', border: '1px solid rgba(196,165,90,0.2)',
      color: 'var(--gold)',
    }}>
      {count}건
    </span>
  )
}
