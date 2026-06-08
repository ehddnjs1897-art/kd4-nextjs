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
  hasVideo?: boolean
}

interface Props {
  actors: Actor[]
  totalBeforeSearch: number
}

// ── 한국어 초성검색 (외부 라이브러리 없이) ──
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
function toChoseong(str: string): string {
  let out = ''
  for (const ch of str) {
    const code = ch.charCodeAt(0)
    if (code >= 0xac00 && code <= 0xd7a3) out += CHO[Math.floor((code - 0xac00) / 588)]
    else out += ch
  }
  return out
}
// 입력이 초성(자음)만으로 이뤄졌는지 (예: "ㄱㄷㅇ")
const CHOSEONG_ONLY = /^[ㄱ-ㅎ\s]+$/

export default function ActorsSearchGrid({ actors, totalBeforeSearch }: Props) {
  const [query, setQuery] = useState('')
  const [videoOnly, setVideoOnly] = useState(false)
  const anyVideo = useMemo(() => actors.some((a) => a.hasVideo), [actors])

  const filtered = useMemo(() => {
    const raw = query.trim()
    let list = actors
    if (raw) {
      // 초성만 입력한 경우 (ㄱㄷㅇ → 권동원): 이름·태그의 초성으로 매칭
      if (CHOSEONG_ONLY.test(raw)) {
        const qCho = raw.replace(/\s/g, '')
        list = actors.filter((a) =>
          toChoseong(a.name).includes(qCho) ||
          (a.casting_tags ?? []).some((t) => toChoseong(t).includes(qCho))
        )
      } else {
        const q = raw.toLowerCase()
        list = actors.filter((a) =>
          a.name.toLowerCase().includes(q) ||
          (a.casting_summary ?? '').toLowerCase().includes(q) ||
          (a.casting_tags ?? []).some((t) => t.toLowerCase().includes(q))
        )
      }
    }
    if (videoOnly) list = list.filter((a) => a.hasVideo)
    return list
  }, [actors, query, videoOnly])

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
          placeholder="이름·초성(ㄱㄷㅇ)·캐스팅 타입으로 검색..."
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

      {/* 출연영상 보유 배우 필터 토글 (영상 보유 배우가 있을 때만) */}
      {anyVideo && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setVideoOnly((v) => !v)}
            aria-pressed={videoOnly}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
              fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
              background: videoOnly ? 'var(--navy)' : 'var(--bg2)',
              color: videoOnly ? '#fff' : 'var(--gray)',
              border: `1px solid ${videoOnly ? 'var(--navy)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >
            <span aria-hidden="true">🎬</span> 출연영상 있는 배우만
          </button>
        </div>
      )}

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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
          {/* 서버사이드 필터 초기화 — URL 파라미터 포함 (WCAG 3.3.2) */}
          <a
            href="/actors"
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '8px 20px',
              minHeight: 44, border: '1px solid var(--border)', borderRadius: 4,
              color: 'var(--gray)', fontSize: '0.85rem', textDecoration: 'none',
            }}
          >
            전체 필터 초기화
          </a>
        </div>
      </div>
      {filtered.length > 0 && (
        <ul style={{ ...gridStyle, listStyle: 'none', padding: 0, margin: 0 }} className="actors-grid" aria-label="배우 목록">
          {filtered.map((actor, idx) => (
            <li key={actor.id} style={cardStyle}>
            <Link href={`/actors/${actor.id}`} style={{ display: 'block', position: 'absolute', inset: 0, textDecoration: 'none' }} className="actor-card" aria-label={`${actor.name} 배우 프로필 보기`}>
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
            </li>
          ))}
        </ul>
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
