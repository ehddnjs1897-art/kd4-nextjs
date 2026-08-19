'use client'

import { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react'
import Link from 'next/link'
import type { MonologueListItem } from '@/lib/monologues'

const PAGE_SIZE = 48
// 카드 이미지(1400×1400 PNG ~230KB) → Supabase 변환 480×480 WebP(~16KB). 실패 시 onError로 원본 폴백.
function cardThumb(url: string) {
  const marker = '/storage/v1/object/public/'
  if (!url.includes(marker)) return url
  return url.replace(marker, '/storage/v1/render/image/public/') + '?width=480&height=480&resize=contain&quality=80&format=webp'
}

interface Props {
  monologues: MonologueListItem[]
  initialQuery?: string
  /** ?page=N (1-base) — SSR 시 N페이지까지(1~N) 한 번에 렌더해 크롤러에 목록 링크를 노출 */
  initialPage?: number
  /** 현재 필터 쿼리스트링(page 제외) — '더 보기' 앵커 href 조립용 */
  filterQuery?: string
}

export default function MonologuesSearchGrid({
  monologues,
  initialQuery = '',
  initialPage = 1,
  filterQuery = '',
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  // 타이핑 즉시성 유지 + 필터링은 한 박자 뒤에 (디바운스 효과) — ActorsSearchGrid와 동일 패턴
  const deferredQuery = useDeferredValue(query)
  // URL 복원이 끝나기 전에는 URL을 덮어쓰지 않기 위한 플래그
  const [urlReady, setUrlReady] = useState(false)

  // 마운트 시 URL에서 검색어 복원 — 새로고침·뒤로가기·URL 공유 시 상태 유지
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const q = sp.get('q')
    if (q && q !== initialQuery) setQuery(q)
    setUrlReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // 검색어 → URL 동기화 (replaceState — 히스토리 스택 오염 없음, gender/genre/medium/age 등
  // 서버 필터 파라미터는 그대로 유지하고 q만 갱신)
  useEffect(() => {
    if (!urlReady) return
    const sp = new URLSearchParams(window.location.search)
    if (query.trim()) sp.set('q', query.trim())
    else sp.delete('q')
    const qs = sp.toString()
    window.history.replaceState(window.history.state, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }, [urlReady, query])

  const filtered = useMemo(() => {
    const raw = deferredQuery.trim().toLowerCase()
    if (!raw) return monologues
    const words = raw.split(/\s+/).filter(Boolean)
    const wordMatches = (m: MonologueListItem, word: string): boolean =>
      m.role.toLowerCase().includes(word) ||
      m.work.toLowerCase().includes(word) ||
      m.genre.toLowerCase().includes(word) ||
      m.medium.toLowerCase().includes(word) ||
      m.target.toLowerCase().includes(word) ||
      // 감정선 검색 (2026-07-22 대표 지시) — "슬픔"으로 "슬픔 → 절망" 매칭.
      // NOT NULL 컬럼이지만 런타임 가드는 하우스룰(MISTAKES ⓐ)대로 유지.
      (m.emotion ?? '').toLowerCase().includes(word)
    return monologues.filter((m) => words.every((w) => wordMatches(m, w)))
  }, [monologues, deferredQuery])

  // 점진 렌더 — 731장 전량 DOM 대신 48장씩 (저사양 모바일 하이드레이션 비용 절감). 검색/필터 바뀌면 리셋.
  // ?page=N으로 들어오면 N*48장까지 서버에서 렌더 → 크롤러가 '더 보기' 앵커를 따라 목록 링크를 다 본다.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE * Math.max(1, initialPage))
  // 마운트 직후 리셋은 건너뛴다 — ?page=N으로 펼쳐둔 화면이 하이드레이션 순간 48장으로 줄어들지 않게.
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setVisibleCount(PAGE_SIZE)
  }, [filtered])
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visibleCount >= filtered.length) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
    }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visibleCount, filtered.length])

  return (
    <>
      {/* 검색 입력 */}
      <form
        role="search"
        aria-label="독백 검색"
        onSubmit={(e) => e.preventDefault()}
        style={{ position: 'relative', marginBottom: 20 }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--gray)', fontSize: '1rem', pointerEvents: 'none',
          }}
        >
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="배역·작품·장르·감정으로 검색 (예: 슬픔 30대)"
          aria-label="독백 배역, 작품, 장르, 감정 검색"
          style={{
            width: '100%',
            paddingLeft: 40,
            paddingRight: query ? 36 : 14,
            paddingTop: 12,
            paddingBottom: 12,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--black)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="검색어 지우기"
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--gray)',
              cursor: 'pointer', fontSize: '1rem', padding: 8, minHeight: 44, minWidth: 44,
            }}
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </form>

      {/* 검색 중일 때만 결과 수 표시 — 검색 전 기본 개수는 상단 헤더 문구가 이미 안내함 */}
      {deferredQuery && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 20 }}
        >
          &quot;{deferredQuery}&quot; — {filtered.length}편
        </p>
      )}

      {filtered.length === 0 ? (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--gray)', marginBottom: 16 }}>
            {deferredQuery
              ? `"${deferredQuery}" 에 해당하는 독백이 없습니다.`
              : '조건에 맞는 독백이 아직 없습니다. 다른 필터를 시도해보세요.'}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                display: 'inline-flex', alignItems: 'center', padding: '8px 20px', minHeight: 44,
                border: '1px solid var(--navy)', borderRadius: 'var(--radius)', color: 'var(--navy)',
                fontSize: '0.85rem', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              검색 초기화
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.slice(0, visibleCount).map((m) => (
            <Link
              key={m.id}
              href={`/monologues/${m.id}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#fff',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--bg3)' }}>
                {m.card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cardThumb(m.card_image_url)}
                    alt={`${m.role} - ${m.work} 독백 대본 카드${m.target ? ` (${m.target})` : ''}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.src !== m.card_image_url) img.src = m.card_image_url as string
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-serif)',
                      color: 'var(--navy)',
                      opacity: 0.3,
                      fontSize: '1.4rem',
                    }}
                  >
                    {m.role}
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--black)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.role} · {m.work}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray)', marginTop: 2 }}>
                  {m.medium} · {m.genre} · {m.target}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {visibleCount < filtered.length && (
        <div ref={sentinelRef} style={{ textAlign: 'center', padding: '28px 0 8px' }}>
          {/* 크롤러가 다음 페이지를 따라올 수 있게 <a href="?page=N+1"> — 사람이 누르면
              기존처럼 페이지 이동 없이 48장만 더 펼친다(외형·클래스는 button 시절 그대로). */}
          <a
            href={`/monologues${filterQuery ? `?${filterQuery}&` : '?'}page=${Math.ceil(visibleCount / PAGE_SIZE) + 1}`}
            onClick={(e) => {
              e.preventDefault()
              setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
            }}
            className="btn-outline"
            style={{ minHeight: 44 }}
          >
            더 보기 (남은 {filtered.length - visibleCount}편)
          </a>
        </div>
      )}
    </>
  )
}
