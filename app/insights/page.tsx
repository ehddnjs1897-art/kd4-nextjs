'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const [url, setUrl] = useState('')
  const [memo, setMemo] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  const [tab, setTab] = useState<'url' | 'image'>('url')
  const [imageTitle, setImageTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

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
    const params = new URLSearchParams()
    if (filterCategory !== '전체') params.set('category', filterCategory)
    if (filterSource !== '전체') params.set('source_type', filterSource)
    if (filterFavorite) params.set('favorite', 'true')
    if (search) params.set('q', search)

    const res = await fetch(`/api/insights?${params}`)
    const json = await res.json()
    setInsights(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [filterCategory, filterSource, filterFavorite, search])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  const handleSave = async () => {
    if (!url.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), memo: memo.trim() || undefined }),
      })
      if (!res.ok) throw new Error()
      setUrl('')
      setMemo('')
      setShowMemo(false)
      await fetchInsights()
    } catch {
      alert('저장 실패. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const toggleFavorite = async (insight: Insight) => {
    await fetch(`/api/insights/${insight.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: !insight.is_favorite }),
    })
    setInsights((prev: Insight[]) => prev.map((i: Insight) => i.id === insight.id ? { ...i, is_favorite: !i.is_favorite } : i))
  }

  const deleteInsight = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await fetch(`/api/insights/${id}`, { method: 'DELETE' })
    setInsights((prev: Insight[]) => prev.filter((i: Insight) => i.id !== id))
    setTotal((t: number) => t - 1)
  }

  const sourceLabel = (t: InsightSourceType | null) =>
    ({ video: '영상', blog: '블로그', article: '아티클', other: '기타', image: '이미지' } as Record<InsightSourceType, string>)[t ?? 'other'] ?? '기타'

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    for (const file of arr) {
      const fd = new FormData()
      fd.append('file', file)
      if (imageTitle) fd.append('title', imageTitle)
      if (memo) fd.append('memo', memo)
      await fetch('/api/insights/upload', { method: 'POST', body: fd })
    }
    setImageTitle('')
    setMemo('')
    await fetchInsights()
    setUploading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--white)', fontFamily: 'var(--font-sans)' }}>
      <style>{`
        .ins-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color .2s; }
        .ins-card:hover { border-color: var(--gold); }
        .ins-tag { background: var(--bg3); border-radius: 4px; padding: 2px 8px; font-size: 11px; color: var(--gray); }
        .filter-btn { padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--gray); cursor: pointer; font-size: 13px; transition: all .15s; }
        .filter-btn.active { background: var(--gold); color: #000; border-color: var(--gold); font-weight: 600; }
        .ins-input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--white); font-size: 14px; font-family: var(--font-sans); outline: none; }
        .ins-input:focus { border-color: var(--gold); }
        .ins-btn { padding: 10px 22px; background: var(--gold); color: #000; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; white-space: nowrap; }
        .ins-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ins-btn-ghost { padding: 10px 22px; background: transparent; color: var(--gray); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 14px; }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: 4 }}>인사이트 📎</h1>
        <p style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 32 }}>
          보다가 좋았던 영상·블로그 링크를 모아두는 공간 · 총 {total}개
        </p>

        {/* 입력 영역 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
          {/* 탭 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button className={`filter-btn${tab === 'url' ? ' active' : ''}`} onClick={() => setTab('url')}>🔗 링크</button>
            <button className={`filter-btn${tab === 'image' ? ' active' : ''}`} onClick={() => setTab('image')}>🖼 이미지</button>
          </div>

          {tab === 'url' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: showMemo ? 10 : 0 }}>
                <input
                  className="ins-input"
                  placeholder="링크 붙여넣기 (https://...)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !saving && handleSave()}
                />
                <button className="ins-btn" onClick={handleSave} disabled={saving || !url.trim()}>
                  {saving ? '저장 중…' : '저장'}
                </button>
                <button className="ins-btn-ghost" onClick={() => setShowMemo(v => !v)} style={{ fontSize: 13 }}>
                  메모 {showMemo ? '▲' : '▼'}
                </button>
              </div>
              {showMemo && (
                <textarea
                  className="ins-input"
                  placeholder="짧은 메모 — AI가 3줄 요약으로 확장해줌"
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              )}
            </>
          ) : (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
                onClick={() => document.getElementById('img-file-input')?.click()}
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
                  id="img-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => e.target.files && uploadFiles(e.target.files)}
                />
              </div>
              <input
                className="ins-input"
                placeholder="제목 (선택)"
                value={imageTitle}
                onChange={e => setImageTitle(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <textarea
                className="ins-input"
                placeholder="메모 (선택) — 왜 저장했는지"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </>
          )}
        </div>

        {/* 필터 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>카테고리</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`filter-btn${filterCategory === c ? ' active' : ''}`}
                onClick={() => setFilterCategory(c)}
              >{c}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6 }}>유형</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SOURCE_TYPES.map(s => (
              <button
                key={s.key}
                className={`filter-btn${filterSource === s.key ? ' active' : ''}`}
                onClick={() => setFilterSource(s.key)}
              >{s.label}</button>
            ))}
            <button
              className={`filter-btn${filterFavorite ? ' active' : ''}`}
              onClick={() => setFilterFavorite(v => !v)}
            >★ 즐겨찾기</button>
          </div>
        </div>

        {/* 검색 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <input
            className="ins-input"
            placeholder="검색…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            style={{ maxWidth: 320 }}
          />
          {search && (
            <button className="ins-btn-ghost" style={{ fontSize: 13 }} onClick={() => { setSearch(''); setSearchInput('') }}>
              초기화
            </button>
          )}
        </div>

        {/* 카드 목록 */}
        {loading ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '60px 0' }}>불러오는 중…</p>
        ) : insights.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '60px 0' }}>저장된 인사이트가 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
            {insights.map(insight => (
              <div key={insight.id} className="ins-card">
                {insight.image_url && (
                  <div style={{ height: 160, overflow: 'hidden', background: 'var(--bg3)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={insight.image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {insight.category && <span className="ins-tag">{insight.category}</span>}
                    <span className="ins-tag">{sourceLabel(insight.source_type)}</span>
                    {insight.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="ins-tag">#{tag}</span>
                    ))}
                  </div>
                  <a
                    href={insight.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      {new Date(insight.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleFavorite(insight)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: insight.is_favorite ? 'var(--gold)' : 'var(--gray)' }}
                        title={insight.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
                      >★</button>
                      <button
                        onClick={() => deleteInsight(insight.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--gray)' }}
                        title="삭제"
                      >✕</button>
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
