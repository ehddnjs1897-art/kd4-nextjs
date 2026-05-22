'use client'

/**
 * R2에 저장된 출연영상 재생 (비공개 → 클릭 시 signed URL 발급받아 재생).
 * 멤버(배우/크루/디렉터/관리자)만 /api/videos/[id]/signed-url 로 URL을 받음.
 */

import { useState } from 'react'

export default function R2Video({ videoId, title }: { videoId: string; title?: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/videos/${videoId}/signed-url`)
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || '영상을 불러올 수 없습니다.')
      setUrl(j.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.item}>
      <div style={s.wrapper}>
        {url ? (
          <video
            src={url}
            controls
            autoPlay
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            style={s.video}
          />
        ) : (
          <button type="button" onClick={load} disabled={loading} style={s.playBtn}>
            {loading ? '불러오는 중...' : '▶  영상 재생'}
          </button>
        )}
      </div>
      {title && <p style={s.title}>{title}</p>}
      {error && <p style={s.error}>{error}</p>}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  item: { display: 'flex', flexDirection: 'column', gap: 8 },
  wrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    borderRadius: 6,
    background: '#000',
  },
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', background: '#000' },
  playBtn: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    background: 'linear-gradient(135deg,#1a1a1a,#000)',
    color: 'var(--gold)',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
    cursor: 'pointer',
  },
  title: { fontSize: '0.85rem', color: 'var(--gray)' },
  error: { fontSize: '0.78rem', color: 'var(--accent-red, #f87171)' },
}
