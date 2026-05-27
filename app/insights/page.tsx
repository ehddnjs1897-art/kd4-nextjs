'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Insight, InsightSourceType } from '@/lib/types'

const CATEGORIES = ['전체', '연기', '비즈니스', '크리에이티브', '디자인', '기술', '라이프', '기타']
const SOURCE_TYPES = [
  { key: '전체', label: '전체' },
  { key: 'video', label: '영상' },
  { key: 'blog', label: '블로그' },
  { key: 'article', label: '아티클' },
  { key: 'image', label: '이미지' },
  { key: 'other', label: '기타' },
]

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [memo, setMemo] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  const [tab, setTab] = useState<'url' | 'image'>('url')
  const [imageTitle, setImageTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [filterCategory, setFilterCategory] = useState('전체')
  const [filterSource, setFilterSource] = useState('전체')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [bookmarkletOrigin, setBookmarkletOrigin] = useState('')

  useEffect(() => {
    setBookmarkletOrigin(window.location.origin)
  }, [])

  const buildBookmarklet = () =>
    `javascript:(function(){var u=location.href;var s=window.getSelection().toString();var m=s?s.slice(0,200):'';fetch('${bookmarkletOrigin}/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({url:u,memo:m})}).then(r=>r.json()).then(d=>{alert('저장됨: '+(d.title||u))}).catch(()=>alert('저장 실패'));})();`

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const params = new URLSearchParams()
      if (filterCategory !== '전체') params.set('category', filterCategory)
      if (filterSource !== '전체') params.set('source_type', filterSource)
      if (filterFavorite) params.set('favorite', 'true')
      if (search) params.set('q', search)

      const res = await fetch(`/api/insights?${params}`, { signal: AbortSignal.timeout(15_000) })
      const json = await res.json()
      if (!res.ok) { setFetchError('목록을 불러오지 못했습니다.'); return }
      setInsights(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      setFetchError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterSource, filterFavorite, search])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  const handleSave = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    // URL 형식 검증
    try { new URL(trimmed) } catch {
      setSaveError('올바른 URL 형식이 아닙니다. (https://... 형태로 입력해주세요)')
      setTimeout(() => setSaveError(''), 4000)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, memo: memo.trim() || undefined }),
        signal: AbortSignal.timeout(30_000), // AI 요약 처리 최대 30초
      })
      if (res.status === 401) { window.location.href = '/auth/login'; return }
      if (!res.ok) throw new Error()
      setUrl('')
      setMemo('')
      setShowMemo(false)
      await fetchInsights()
      setSaveSuccess('인사이트가 저장되었습니다.')
      setTimeout(() => setSaveSuccess(''), 3000)
    } catch {
      setSaveError('저장 실패. 다시 시도해주세요.')
      setTimeout(() => setSaveError(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  const toggleFavorite = async (insight: Insight) => {
    // 낙관적 업데이트 먼저
    setInsights((prev: Insight[]) => prev.map((i: Insight) => i.id === insight.id ? { ...i, is_favorite: !i.is_favorite } : i))
    try {
      const res = await fetch(`/api/insights/${insight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !insight.is_favorite }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error()
    } catch {
      // 실패 시 낙관적 업데이트 롤백
      setInsights((prev: Insight[]) => prev.map((i: Insight) => i.id === insight.id ? { ...i, is_favorite: insight.is_favorite } : i))
    }
  }

  const deleteInsight = async (id: string) => {
    if (confirmingDeleteId !== id) { setConfirmingDeleteId(id); return }
    setConfirmingDeleteId(null)
    try {
      await fetch(`/api/insights/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
      setInsights((prev: Insight[]) => prev.filter((i: Insight) => i.id !== id))
      setTotal((t: number) => t - 1)
    } catch { /* 낙관적 업데이트 실패 시 무시 */ }
  }

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  const changeCategory = async (insight: Insight, category: string) => {
    setEditingCategoryId(null)
    const prevCategory = insight.category
    // 낙관적 업데이트 먼저
    setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, category: category as Insight['category'] } : i))
    try {
      const res = await fetch(`/api/insights/${insight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error()
    } catch {
      // 실패 시 롤백
      setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, category: prevCategory } : i))
    }
  }

  const sourceLabel = (t: InsightSourceType | null) =>
    ({ video: '영상', blog: '블로그', article: '아티클', other: '기타', image: '이미지' } as Record<InsightSourceType, string>)[t ?? 'other'] ?? '기타'

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setSaveError('')
    let failed = 0
    for (const file of arr) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        if (imageTitle) fd.append('title', imageTitle)
        if (memo) fd.append('memo', memo)
        const res = await fetch('/api/insights/upload', { method: 'POST', body: fd })
        if (!res.ok) failed++
      } catch { failed++ }
    }
    setImageTitle('')
    setMemo('')
    if (failed > 0) {
      setSaveError(`${failed}개 파일 업로드 실패. 나머지는 저장되었습니다.`)
      setTimeout(() => setSaveError(''), 5000)
    }
    await fetchInsights()
    setUploading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--white)', fontFamily: 'var(--font-sans)' }}>
      <style>{`
        .ins-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color .2s; }
        .ins-card:hover { border-color: var(--gold); }
        .ins-tag { background: var(--bg3); border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; color: #3E3A37; }
        .filter-btn { padding: 5px 14px; min-height: 44px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--gray); cursor: pointer; font-size: 0.8125rem; transition: all .15s; }
        .filter-btn.active { background: var(--gold); color: #000; border-color: var(--gold); font-weight: 600; }
        .ins-input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--white); font-size: 0.875rem; font-family: var(--font-sans); }
        .ins-input:focus { outline: 2px solid var(--gold); outline-offset: -1px; border-color: var(--gold); box-shadow: 0 0 0 2px rgba(21,72,138,0.15); }
        .ins-btn { padding: 10px 22px; background: var(--gold); color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.875rem; white-space: nowrap; min-height: 44px; }
        .ins-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ins-btn-ghost { padding: 10px 22px; background: transparent; color: var(--gray); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 0.875rem; min-height: 44px; }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: 4 }}>인사이트 <span aria-hidden="true">📎</span></h1>
        <p style={{ color: 'var(--gray)', fontSize: '0.8125rem', marginBottom: 32 }}>
          보다가 좋았던 영상·블로그 링크를 모아두는 공간 · 총 {total}개
        </p>

        {/* 입력 영역 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
          {/* 탭 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button type="button" className={`filter-btn${tab === 'url' ? ' active' : ''}`} aria-pressed={tab === 'url'} onClick={() => setTab('url')}>🔗 링크</button>
            <button type="button" className={`filter-btn${tab === 'image' ? ' active' : ''}`} aria-pressed={tab === 'image'} onClick={() => setTab('image')}>🖼 이미지</button>
          </div>

          {tab === 'url' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: showMemo ? 10 : 0 }}>
                <input
                  className="ins-input"
                  aria-label="링크 URL"
                  placeholder="링크 붙여넣기 (https://...)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !saving && handleSave()}
                  maxLength={2000}
                />
                <button type="button" className="ins-btn" aria-label="인사이트 저장" onClick={handleSave} disabled={saving || !url.trim()} aria-busy={saving}>
                  {saving ? '저장 중…' : '저장'}
                </button>
                <button type="button" className="ins-btn-ghost" aria-expanded={showMemo} aria-controls="ins-memo-panel" aria-label={showMemo ? '메모 접기' : '메모 펼치기'} onClick={() => setShowMemo(v => !v)} style={{ fontSize: '0.8125rem' }}>
                  메모 {showMemo ? '▲' : '▼'}
                </button>
              </div>
              <p role="alert" aria-live="assertive" aria-atomic="true" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 6 }}>{saveError ?? ''}</p>
              {/* 저장 성공 AT 알림 — 항상 DOM에 존재, 내용 변경 시 aria-live가 발화 */}
              <p role="status" aria-live="polite" className="sr-only">{saveSuccess}</p>
              {showMemo && (
                <div id="ins-memo-panel">
                  <textarea
                    className="ins-input"
                    aria-label="메모"
                    placeholder="짧은 메모 — AI가 3줄 요약으로 확장해줌"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    rows={2}
                    maxLength={500}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div
                role="button"
                tabIndex={0}
                aria-label="이미지 파일 드래그 또는 클릭해서 업로드"
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 10,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: dragOver ? 'var(--gold)' : 'var(--gray)',
                  transition: 'all .15s',
                  marginBottom: 10,
                }}
              >
                {uploading ? '업로드 중…' : '여기에 이미지 드래그 또는 클릭해서 선택'}
                <br />
                <span style={{ fontSize: 11 }}>jpg / png / gif / webp · 최대 10MB · 여러 장 동시 가능</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  aria-hidden="true"
                  tabIndex={-1}
                  style={{ display: 'none' }}
                  onChange={e => e.target.files && uploadFiles(e.target.files)}
                />
              </div>
              <input
                className="ins-input"
                aria-label="이미지 제목"
                placeholder="제목 (선택)"
                value={imageTitle}
                onChange={e => setImageTitle(e.target.value)}
                maxLength={200}
                style={{ marginBottom: 8 }}
              />
              <textarea
                className="ins-input"
                aria-label="메모"
                placeholder="메모 (선택) — 왜 저장했는지"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                rows={2}
                maxLength={500}
                style={{ resize: 'vertical' }}
              />
            </>
          )}
        </div>

        {/* 필터 */}
        <div role="group" aria-label="카테고리 필터" style={{ marginBottom: 10 }}>
          <div aria-hidden="true" style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>카테고리</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button
                type="button"
                key={c}
                className={`filter-btn${filterCategory === c ? ' active' : ''}`}
                aria-pressed={filterCategory === c}
                onClick={() => setFilterCategory(c)}
              >{c}</button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="인사이트 유형 필터" style={{ marginBottom: 16 }}>
          <div aria-hidden="true" style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>유형</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SOURCE_TYPES.map(s => (
              <button
                type="button"
                key={s.key}
                className={`filter-btn${filterSource === s.key ? ' active' : ''}`}
                aria-pressed={filterSource === s.key}
                onClick={() => setFilterSource(s.key)}
              >{s.label}</button>
            ))}
            <button
              type="button"
              className={`filter-btn${filterFavorite ? ' active' : ''}`}
              aria-pressed={filterFavorite}
              aria-label="즐겨찾기 필터"
              onClick={() => setFilterFavorite(v => !v)}
            >★ 즐겨찾기</button>
          </div>
        </div>

        {/* 검색 */}
        <form role="search" aria-label="인사이트 검색" onSubmit={e => { e.preventDefault(); setSearch(searchInput) }} style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <input
            className="ins-input"
            aria-label="인사이트 검색"
            placeholder="검색…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            style={{ maxWidth: 320 }}
          />
          {/* 모바일 키보드 "검색/Go" 키 활성화용 숨김 제출 버튼 */}
          <button type="submit" className="sr-only">검색</button>
          {search && (
            <button type="button" className="ins-btn-ghost" style={{ fontSize: 13 }} onClick={() => { setSearch(''); setSearchInput('') }}>
              초기화
            </button>
          )}
        </form>

        {/* 검색/필터 결과 수 — AT 사용자 알림 */}
        <p role="status" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
          {loading ? '로딩 중' : `${insights.length}건의 인사이트`}
        </p>

        {/* 카드 목록 */}
        {/* 항상 DOM에 존재 — 스크린 리더 즉시 알림 보장 (WCAG 4.1.3) */}
        <p role="alert" aria-live="assertive" aria-atomic="true" style={fetchError ? { fontSize: 13, color: '#ef4444', marginBottom: 8, textAlign: 'center' } : {}}>{fetchError}</p>
        {fetchError && (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <button type="button" className="ins-btn-ghost" style={{ fontSize: 13 }} onClick={fetchInsights}>다시 시도</button>
          </div>
        )}
        {loading ? (
          <p role="status" aria-live="polite" style={{ color: 'var(--gray)', textAlign: 'center', padding: '60px 0' }}>불러오는 중…</p>
        ) : insights.length === 0 ? (
          <p role="status" aria-live="polite" style={{ color: 'var(--gray)', textAlign: 'center', padding: '60px 0' }}>저장된 인사이트가 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
            {insights.map(insight => (
              <div key={insight.id} className="ins-card">
                {insight.image_url && (
                  <div style={{ height: 160, overflow: 'hidden', background: 'var(--bg3)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={insight.image_url}
                      alt={insight.title ?? '인사이트 이미지'}
                      width={640}
                      height={160}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, position: 'relative' }}>
                    <button
                      type="button"
                      className="ins-tag"
                      onClick={() => setEditingCategoryId(editingCategoryId === insight.id ? null : insight.id)}
                      aria-label={`카테고리 변경: ${insight.category ?? '기타'}`}
                      aria-haspopup="dialog"
                      aria-expanded={editingCategoryId === insight.id}
                      aria-controls={`ins-cat-panel-${insight.id}`}
                      style={{ cursor: 'pointer', borderBottom: '1px dashed var(--gray)', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                    >
                      {insight.category ?? '기타'} ▾
                    </button>
                    {editingCategoryId === insight.id && (
                      <div
                        id={`ins-cat-panel-${insight.id}`}
                        role="group"
                        aria-label="카테고리 선택"
                        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setEditingCategoryId(null) } }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, zIndex: 10,
                          background: 'var(--bg2)', border: '1px solid var(--gold)',
                          borderRadius: 8, padding: 6, display: 'flex', flexWrap: 'wrap', gap: 4, width: 220,
                        }}
                      >
                        {CATEGORIES.filter(c => c !== '전체').map(c => (
                          <button
                            type="button"
                            key={c}
                            aria-pressed={insight.category === c}
                            onClick={() => changeCategory(insight, c)}
                            style={{
                              padding: '3px 10px', minHeight: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12,
                              background: insight.category === c ? 'var(--gold)' : 'var(--bg3)',
                              color: insight.category === c ? '#000' : 'var(--white)',
                              fontWeight: insight.category === c ? 700 : 400,
                            }}
                          >{c}</button>
                        ))}
                      </div>
                    )}
                    <span className="ins-tag">{sourceLabel(insight.source_type)}</span>
                    {insight.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="ins-tag">#{tag}</span>
                    ))}
                  </div>
                  <a
                    href={insight.url}
                    target="_blank" rel="noopener noreferrer"
                    aria-label={`${insight.title || insight.url} (새 탭에서 열림)`}
                    style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--white)', textDecoration: 'none', marginBottom: 6, lineHeight: 1.4 }}
                  >
                    {insight.title || insight.url}
                  </a>
                  {insight.description && (
                    <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 8, whiteSpace: 'pre-line' }}>
                      {insight.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <time dateTime={insight.created_at} style={{ fontSize: 11, color: 'var(--gray)' }}>
                      {new Date(insight.created_at).toLocaleDateString('ko-KR')}
                    </time>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(insight)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: insight.is_favorite ? 'var(--gold)' : 'var(--gray)', minHeight: 44, minWidth: 44 }}
                        aria-label={insight.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
                      >★</button>
                      {confirmingDeleteId === insight.id ? (
                        <>
                          <button
                            type="button"
                            aria-label="삭제 취소"
                            onClick={() => setConfirmingDeleteId(null)}
                            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: 'var(--gray)', padding: '2px 6px', minHeight: 44, minWidth: 44 }}
                          >취소</button>
                          <button
                            type="button"
                            aria-label="인사이트 삭제 확인"
                            onClick={() => deleteInsight(insight.id)}
                            style={{ background: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: '#fff', padding: '2px 6px', minHeight: 44, minWidth: 44 }}
                          >삭제</button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deleteInsight(insight.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--gray)', minHeight: 44, minWidth: 44 }}
                          aria-label={`${insight.title || insight.url} 삭제`}
                        >✕</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 북마클릿 안내 */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, marginTop: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>브라우저 북마클릿 설정</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 12, lineHeight: 1.7 }}>
            아래 코드를 복사 → 브라우저 즐겨찾기에 새 항목 추가 → URL 칸에 붙여넣기.<br />
            이후 아무 페이지에서 그 즐겨찾기 클릭하면 자동 저장됩니다.
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              readOnly
              aria-label="브라우저 북마클릿 코드"
              value={bookmarkletOrigin ? buildBookmarklet() : '페이지를 새로고침하면 코드가 나타납니다.'}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--gray)',
                fontSize: 11,
                fontFamily: 'monospace',
                resize: 'none',
              }}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>
            * 페이지에서 텍스트를 드래그한 뒤 클릭하면 해당 텍스트가 메모로 함께 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
