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
  has_video: boolean
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
        <span aria-hidden="true" style={{
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
              cursor: 'pointer', fontSize: '1rem', padding: 8, minHeight: 44, minWidth: 44,
            }}
          ><span aria-hidden="true">✕</span></button>
        )}
      </form>

      {/* 결과 수 */}
      <p role="status" aria-live="polite" aria-atomic="true" style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 20 }}>
        {query
          ? `"${query}" — ${filtered.length}명`
          : `총 ${totalBeforeSearch}명`}
      </p>

      {/* 배우 그리드 — 빈 결과 status 영역은 항상 마운트(aria-live 사전마운트 WCAG 요건) */}
      <div
        role="status"
        aria-live="polite"
        style={filtered.length === 0 ? { textAlign: 'center', padding: '80px 0' } : { display: 'none' }}
      >
        <p style={{ fontSize: '0.95rem', color: 'var(--gray)', marginBottom: 16 }}>
          {query ? `"${query}" 에 해당하는 배우가 없습니다.` : '등록된 배우가 없습니다.'}
        </p>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '8px 20px',
              minHeight: 44, border: '1px solid var(--gold)', borderRadius: 4,
              color: 'var(--gold)', fontSize: '0.85rem',
              background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            검색 초기화
          </button>
        )}
      </div>
      {filtered.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="actors-grid" aria-label="배우 목록">
          {filtered.map((actor, idx) => (
            <li key={actor.id} style={cardStyle}>
              <Link
                href={`/actors/${actor.id}`}
                style={{ display: 'block', position: 'absolute', inset: 0, textDecoration: 'none' }}
                className="actor-card"
                aria-label={`${actor.name} 배우 프로필 보기`}
              >
                <div style={imageWrapStyle}>
                  <ActorCardImage
                    src={actor.photoSrc}
                    alt={actor.name}
                    unoptimized={actor.unoptimized}
                    priority={idx < 4}
                  />

                  {/* 출연영상 뱃지 — 골드, KD4 스타일 */}
                  {actor.has_video && (
                    <div style={videoBadgeStyle} aria-label="출연영상 보유">
                      <span aria-hidden="true" style={videoDotStyle} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>출연영상</span>
                    </div>
                  )}

                  {/* 하단 정보 오버레이 */}
                  <div style={overlayStyle}>
                    <span style={nameStyle}>{actor.name}</span>
                    <span style={metaStyle}>
                      {[actor.gender, actor.age_group].filter(Boolean).join(' · ')}
                    </span>
                    {actor.casting_tags && actor.casting_tags.length > 0 && (
                      <div style={tagsStyle}>
                        {actor.casting_tags.slice(0, 2).map((t) => (
                          <span key={t} style={tagStyle}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// 세로형 카드 스타일 (Portrait 2:3) — REPLAY와 다른 KD4 아트하우스 방향
const cardStyle: React.CSSProperties = {
  display: 'block',
  borderRadius: 10,
  overflow: 'hidden',
  border: '1px solid var(--border)',
  transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
  aspectRatio: '2/3',
  position: 'relative',
  background: 'var(--bg3)',
}

const imageWrapStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'var(--bg3)',
}

// 출연영상 뱃지 — 우상단, 골드 KD4 스타일
const videoBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  background: 'rgba(0,0,0,0.72)',
  border: '1px solid var(--gold)',
  borderRadius: 4,
  padding: '4px 9px',
  color: 'var(--gold)',
  backdropFilter: 'blur(6px)',
  zIndex: 2,
}

const videoDotStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: 'var(--gold)',
  flexShrink: 0,
  boxShadow: '0 0 4px var(--gold)',
}

// 하단 그라디언트 오버레이
const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0, left: 0, right: 0,
  padding: '48px 14px 16px',
  background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 50%, transparent 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const nameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--white)',
  letterSpacing: '0.02em',
  lineHeight: 1.2,
}

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.72rem',
  color: 'rgba(255,255,255,0.6)',
  letterSpacing: '0.04em',
}

const tagsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap' as const,
  marginTop: 5,
}

const tagStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  fontWeight: 600,
  color: 'var(--gold)',
  background: 'rgba(196,165,90,0.12)',
  border: '1px solid rgba(196,165,90,0.35)',
  borderRadius: 3,
  padding: '2px 6px',
  letterSpacing: '0.04em',
}
