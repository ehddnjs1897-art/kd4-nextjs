'use client'

import { useState, useMemo, useEffect, useDeferredValue, useCallback } from 'react'
import Link from 'next/link'
import ActorCardImage from './ActorCardImage'

function CopyLinkButton({ actorId, actorName }: { actorId: string; actorName: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/actors/${actorId}`
    if (!navigator.clipboard?.writeText) {
      // 카카오톡 인앱 브라우저 등 clipboard API 미지원 환경
      setState('error')
      setTimeout(() => setState('idle'), 1500)
      return
    }
    navigator.clipboard.writeText(url).then(() => {
      setState('copied')
      setTimeout(() => setState('idle'), 1500)
    }).catch(() => {
      setState('error')
      setTimeout(() => setState('idle'), 1500)
    })
  }, [actorId])
  return (
    <button
      onClick={handleCopy}
      aria-label={`${actorName} 배우 링크 복사`}
      title={state === 'copied' ? '복사됨!' : state === 'error' ? '복사 실패' : '링크 복사'}
      style={{
        position: 'absolute',
        bottom: 0, right: 0,
        zIndex: 2,
        minWidth: 44, minHeight: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: state === 'copied' ? 'var(--gold)' : state === 'error' ? 'rgba(180,40,40,0.7)' : 'rgba(0,0,0,0.5)',
        color: '#fff',
        border: 'none',
        borderRadius: '0 0 8px 0',
        padding: '0 8px',
        fontSize: '0.68rem',
        cursor: 'pointer',
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        backdropFilter: 'blur(4px)',
        transition: 'background 0.18s',
        userSelect: 'none',
      }}
    >
      {state === 'copied' ? '✓ 복사됨' : state === 'error' ? '복사 실패' : '링크'}
    </button>
  )
}

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

// 연령대 세부 필터 옵션 (서버 age_group 값 기반)
const AGE_DETAIL_OPTIONS = [
  { value: 'all', label: '전체 연령' },
  { value: '20대', label: '20대' },
  { value: '30대', label: '30대' },
  { value: '40대', label: '40대' },
  { value: '50대 이상', label: '50대+' },
]

// 성별 필터 옵션 (클라이언트 추가 필터용)
const GENDER_DETAIL_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '남', label: '남' },
  { value: '여', label: '여' },
]

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

// 성별 키워드 → gender 값 (멀티워드 AND 검색에서 "형사 여자", "30대 남자" 지원)
const GENDER_KEYWORD_MAP: Record<string, '남' | '여'> = {
  '여자': '여', '여성': '여', '여배우': '여',
  '남자': '남', '남성': '남', '남배우': '남',
}

// 검색 동의어 — 캐스팅 디렉터가 쓰는 일상 표현을 whitelist 태그로 매핑
const SYNONYM_MAP: Record<string, string[]> = {
  '경찰': ['형사'], '수사관': ['형사'], '탐정': ['형사'],
  '검사': ['변호사'], '판사': ['변호사'], '법조인': ['변호사'],
  '간호사': ['의사'],
  '직장인': ['회사원'], '사원': ['회사원'], '직원': ['회사원'], '팀장': ['회사원'], '회계사': ['회사원'],
  '여고생': ['학생'], '여학생': ['학생'], '남학생': ['학생'], '고등학생': ['학생'], '중학생': ['학생'],
  '주인공엄마': ['엄마'], '선생님': ['회사원'],
  '어머니': ['엄마'], '모친': ['엄마'],
  '아버지': ['아빠'], '부친': ['아빠'],
  '클라이밍': ['액션'], '격투': ['액션'], '무술': ['액션'],
  '멜로': ['로맨스'], '연애': ['로맨스'],
  '개그': ['코믹'], '유머': ['코믹'],
  '악당': ['악역'], '빌런': ['악역'],
  '순수한': ['순수'], '청순': ['순수'],
  '권위': ['카리스마'],
  '가정주부': ['주부'], '아줌마': ['주부'],
}
// 검색어에 동의어를 태그 검색에 확장 (UI 불변)
function expandQuery(q: string): string[] {
  const lq = q.toLowerCase()
  const extra: string[] = []
  for (const [k, vs] of Object.entries(SYNONYM_MAP)) {
    if (lq.includes(k.toLowerCase())) extra.push(...vs)
  }
  return extra
}

export default function ActorsSearchGrid({ actors, totalBeforeSearch }: Props) {
  const [query, setQuery] = useState('')
  const [videoOnly, setVideoOnly] = useState(false)
  const [ageFilter, setAgeFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  // 타이핑 즉시성 유지 + 초성 변환 필터링은 한 박자 뒤에 (디바운스 효과)
  const deferredQuery = useDeferredValue(query)
  // URL 복원이 끝나기 전에는 URL을 덮어쓰지 않기 위한 플래그
  const [urlReady, setUrlReady] = useState(false)
  const anyVideo = useMemo(() => actors.some((a) => a.hasVideo), [actors])

  // 마운트 시 URL에서 클라이언트 필터 복원 — 새로고침·뒤로가기·URL 공유 시 상태 유지
  // (서버 필터 파라미터 gender/ageGroup/tag와 충돌하지 않도록 별도 키 q/g/age/video 사용)
  // URL은 SSR에서 읽을 수 없는 외부 시스템 → 마운트 후 1회 동기화가 hydration-safe한 유일한 방법
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const q = sp.get('q')
    if (q) setQuery(q)
    if (sp.get('video') === '1') setVideoOnly(true)
    const age = sp.get('age')
    if (age && AGE_DETAIL_OPTIONS.some((o) => o.value === age)) setAgeFilter(age)
    const g = sp.get('g')
    if (g === '남' || g === '여') setGenderFilter(g)
    setUrlReady(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // 필터 상태 → URL 동기화 (replaceState — 히스토리 스택 오염 없음)
  useEffect(() => {
    if (!urlReady) return
    const sp = new URLSearchParams(window.location.search)
    const sync = (key: string, value: string, isDefault: boolean) => {
      if (isDefault) sp.delete(key)
      else sp.set(key, value)
    }
    sync('q', query.trim(), !query.trim())
    sync('video', '1', !videoOnly)
    sync('age', ageFilter, ageFilter === 'all')
    sync('g', genderFilter, genderFilter === 'all')
    const qs = sp.toString()
    window.history.replaceState(window.history.state, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }, [urlReady, query, videoOnly, ageFilter, genderFilter])

  // 현재 목록에 실제 존재하는 연령대만 필터 버튼 표시
  const availableAges = useMemo(() => {
    const seen = new Set(actors.map((a) => a.age_group).filter(Boolean))
    return AGE_DETAIL_OPTIONS.filter((o) => o.value === 'all' || seen.has(o.value))
  }, [actors])

  // 현재 목록에 실제 존재하는 성별만 필터 버튼 표시
  const availableGenders = useMemo(() => {
    const seen = new Set<string>(actors.map((a) => a.gender).filter((g): g is '남' | '여' => g !== null))
    return GENDER_DETAIL_OPTIONS.filter((o) => o.value === 'all' || seen.has(o.value))
  }, [actors])

  const filtered = useMemo(() => {
    const raw = deferredQuery.trim()
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
        const words = raw.toLowerCase().split(/\s+/).filter(Boolean)
        // 단어 하나가 매칭되는지 — 성별 키워드 우선 체크, 이후 필드/태그 검색
        const wordMatches = (a: Actor, word: string): boolean => {
          const genderMatch = GENDER_KEYWORD_MAP[word]
          if (genderMatch) return a.gender === genderMatch
          const et = expandQuery(word)
          return (
            a.name.toLowerCase().includes(word) ||
            (a.casting_summary ?? '').toLowerCase().includes(word) ||
            (a.casting_tags ?? []).some((t) => t.toLowerCase().includes(word)) ||
            (a.age_group ?? '').toLowerCase().includes(word) ||
            (et.length > 0 && (a.casting_tags ?? []).some((t) => et.includes(t)))
          )
        }
        if (words.length > 1) {
          // 다중 단어 AND 검색: "주부 40대", "형사 여자", "30대 남자" 등 복합 조건
          list = actors.filter((a) => words.every((word) => wordMatches(a, word)))
        } else {
          list = actors.filter((a) => wordMatches(a, words[0]))
        }
      }
    }
    // 연령대 클라이언트 세부 필터
    if (ageFilter !== 'all') list = list.filter((a) => a.age_group === ageFilter)
    // 성별 클라이언트 세부 필터
    if (genderFilter !== 'all') list = list.filter((a) => a.gender === genderFilter)
    if (videoOnly) list = list.filter((a) => a.hasVideo)
    return list
  }, [actors, deferredQuery, videoOnly, ageFilter, genderFilter])

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
          placeholder="이름·초성·캐스팅·연령대 검색 (예: 형사 30대)"
          aria-label="배우 이름 또는 캐스팅 타입 검색"
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

      {/* 클라이언트 세부 필터 — 성별 + 연령대 + 영상 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {/* 성별 필터 (서버 필터와 중복되지 않을 때만 표시) */}
        {availableGenders.length > 2 && (
          <div role="group" aria-label="성별 필터" style={{ display: 'flex', gap: 4 }}>
            {availableGenders.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGenderFilter(opt.value)}
                aria-pressed={genderFilter === opt.value}
                style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
                  background: genderFilter === opt.value ? 'var(--navy)' : 'var(--bg2)',
                  color: genderFilter === opt.value ? '#fff' : 'var(--gray)',
                  border: `1px solid ${genderFilter === opt.value ? 'var(--navy)' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}
              >{opt.label}</button>
            ))}
          </div>
        )}

        {/* 연령대 세부 필터 */}
        {availableAges.length > 2 && (
          <div role="group" aria-label="연령대 필터" style={{ display: 'flex', gap: 4 }}>
            {availableAges.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgeFilter(opt.value)}
                aria-pressed={ageFilter === opt.value}
                style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  fontSize: '0.78rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
                  background: ageFilter === opt.value ? 'var(--navy-tint-2)' : 'var(--bg2)',
                  color: ageFilter === opt.value ? 'var(--navy)' : 'var(--gray)',
                  border: `1px solid ${ageFilter === opt.value ? 'var(--navy-tint-3)' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}
              >{opt.label}</button>
            ))}
          </div>
        )}

        {/* 출연영상 보유 배우 필터 토글 (영상 보유 배우가 있을 때만) */}
        {anyVideo && (
          <button
            type="button"
            onClick={() => setVideoOnly((v) => !v)}
            aria-pressed={videoOnly}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              fontSize: '0.78rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
              background: videoOnly ? 'var(--navy)' : 'var(--bg2)',
              color: videoOnly ? '#fff' : 'var(--gray)',
              border: `1px solid ${videoOnly ? 'var(--navy)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >
            <span aria-hidden="true">🎬</span> 영상 있는 배우만
          </button>
        )}

        {/* 클라이언트 필터 초기화 */}
        {(ageFilter !== 'all' || genderFilter !== 'all' || videoOnly) && (
          <button
            type="button"
            onClick={() => { setAgeFilter('all'); setGenderFilter('all'); setVideoOnly(false) }}
            aria-label="연령대·성별·영상 필터 초기화"
            style={{
              padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
              fontSize: '0.72rem', fontFamily: 'var(--font-sans)',
              background: 'none', color: 'var(--gray)',
              border: '1px solid var(--border)',
            }}
          >✕ 필터 초기화</button>
        )}
      </div>

      {/* 결과 수 */}
      <p role="status" aria-live="polite" aria-atomic="true" style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 20 }}>
        {deferredQuery
          ? `"${deferredQuery}" — ${filtered.length}명`
          : (ageFilter !== 'all' || genderFilter !== 'all' || videoOnly)
            ? `${filtered.length}명`
            : `총 ${totalBeforeSearch}명`}
      </p>

      {/* 배우 그리드 — 빈 결과 status 영역은 항상 마운트(aria-live 사전마운트 WCAG 요건) */}
      <div
        role="status"
        aria-live="polite"
        style={filtered.length === 0 ? { textAlign: 'center', padding: '80px 0' } : { display: 'none' }}
      >
        <p style={{ fontSize: '0.95rem', color: 'var(--gray)', marginBottom: 16 }}>
          {deferredQuery
            ? `"${deferredQuery}" 에 해당하는 배우가 없습니다.`
            : videoOnly
              ? '출연영상 보유 배우가 없습니다.'
              : '등록된 배우가 없습니다.'}
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
            <CopyLinkButton actorId={actor.id} actorName={actor.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// 🚨 카드는 가로형(3/2) 유지 — 썸네일이 가로 프로필 기반(첫장 가로). 세로형(3/4) 절대 금지.
//    (2026-06-09 대표 지시: 세로형으로 바꿔서 가로 프로필이 잘렸음 → 가로형으로 영구 고정)
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
  aspectRatio: '3/2',                       // 🚨 가로형 — 세로(3/4)로 바꾸지 말 것
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
  color: '#fff',                            // 어두운 오버레이 위 → 흰색(가독성). --white(=#111) 쓰면 검정·검정 묻힘
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
