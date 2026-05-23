'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ActorCardImage from './ActorCardImage'

interface Actor {
  id: string
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  casting_tags: string[] | null
  casting_summary: string | null
  photoSrc: string
  unoptimized: boolean
}

interface Props {
  actors: Actor[]
  totalBeforeSearch: number
}

export default function ActorsSearchGrid({ actors, totalBeforeSearch }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actors
    return actors.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.casting_summary ?? '').toLowerCase().includes(q) ||
      (a.casting_tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  }, [actors, query])

  return (
    <>
      {/* 검색 입력 */}
      <form role="search" aria-label="배우 검색" onSubmit={e => e.preventDefault()} style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--gray)', fontSize: '1rem', pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 캐스팅 타입으로 검색..."
          aria-label="배우 검색"
          style={{
            width: '100%',
            paddingLeft: 40,
            paddingRight: query ? 36 : 14,
            paddingTop: 11,
            paddingBottom: 11,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--white)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="검색 초기화"
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--gray)',
              cursor: 'pointer', fontSize: '1rem', padding: 4,
            }}
          >✕</button>
        )}
      </form>

      {/* 결과 수 */}
      <p role="status" aria-live="polite" style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 20 }}>
        {query
          ? `"${query}" — ${filtered.length}명`
          : `총 ${totalBeforeSearch}명`}
      </p>

      {/* 배우 그리드 */}
      {filtered.length === 0 ? (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--gray)', marginBottom: 16 }}>
            {query ? `"${query}" 에 해당하는 배우가 없습니다.` : '등록된 배우가 없습니다.'}
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              display: 'inline-block', padding: '8px 20px',
              border: '1px solid var(--gold)', borderRadius: 4,
              color: 'var(--gold)', fontSize: '0.85rem',
              background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            검색 초기화
          </button>
        </div>
      ) : (
        <div style={gridStyle} className="actors-grid">
          {filtered.map((actor, idx) => (
            <Link key={actor.id} href={`/actors/${actor.id}`} style={cardStyle} className="actor-card">
              <div style={imageWrapStyle}>
                <ActorCardImage
                  src={actor.photoSrc}
                  alt={actor.name}
                  unoptimized={actor.unoptimized}
                  priority={idx < 2}
                />
                <div style={overlayStyle}>
                  <span style={nameStyle}>{actor.name}</span>
                  <span style={metaStyle}>
                    {actor.gender ?? ''}{actor.gender && actor.age_group ? ' · ' : ''}{actor.age_group ?? ''}
                  </span>
                  {actor.casting_tags && actor.casting_tags.length > 0 && (
                    <div style={tagsStyle}>
                      {actor.casting_tags.slice(0, 3).map((t) => (
                        <span key={t} style={tagStyle}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid var(--border)',
  transition: 'border-color 0.2s, transform 0.2s',
  aspectRatio: '3/2',
  position: 'relative',
  background: 'var(--bg3)',
}

const imageWrapStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'var(--bg3)',
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0, left: 0, right: 0,
  padding: '40px 18px 16px',
  background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const nameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--white)',
  letterSpacing: '0.04em',
}

const metaStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.65)',
}

const tagsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
  marginTop: 6,
}

const tagStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.92)',
  background: 'rgba(255,255,255,0.16)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 3,
  padding: '2px 7px',
  letterSpacing: '0.02em',
  backdropFilter: 'blur(4px)',
}
