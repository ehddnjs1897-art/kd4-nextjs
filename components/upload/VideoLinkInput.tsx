'use client'

/**
 * VideoLinkInput — 유튜브 URL 입력 + ID 추출 + 추가 버튼
 */
import React, { useState } from 'react'

interface VideoLinkInputProps {
  actorId: string
  onAdd: (video: { youtube_id: string; title: string }) => void
}

// 유튜브 URL 에서 video ID 추출
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?/]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export default function VideoLinkInput({ onAdd }: VideoLinkInputProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function handleAdd() {
    setError(null)

    if (!url.trim()) {
      setError('유튜브 URL을 입력해 주세요.')
      return
    }

    const youtubeId = extractYoutubeId(url.trim())
    if (!youtubeId) {
      setError('유효한 유튜브 URL을 입력해 주세요. (watch, shorts, youtu.be 모두 지원)')
      return
    }

    if (!title.trim()) {
      setError('영상 제목을 입력해 주세요.')
      return
    }

    setAdding(true)
    // 부모 컴포넌트에 위임 (실제 API 호출은 부모에서)
    try {
      onAdd({ youtube_id: youtubeId, title: title.trim() })
      setUrl('')
      setTitle('')
    } finally {
      setAdding(false)
    }
  }

  // 미리보기 ID (입력 중 실시간)
  const previewId = url ? extractYoutubeId(url) : null

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          style={s.input}
        />
        <input
          type="text"
          placeholder="영상 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ ...s.input, maxWidth: 220 }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          style={adding ? { ...s.btnAdd, opacity: 0.5, cursor: 'not-allowed' } : s.btnAdd}
        >
          추가
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {/* URL 입력 중 ID 미리보기 */}
      {previewId && !error && (
        <div style={s.preview}>
          <img
            src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
            alt="유튜브 썸네일 미리보기"
            style={s.thumb}
          />
          <span style={s.previewId}>ID: {previewId}</span>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minWidth: 180,
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 5,
    padding: '9px 12px',
    fontSize: '0.85rem',
    color: 'var(--white)',
    outline: 'none',
  },
  btnAdd: {
    background: 'var(--gold)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 5,
    padding: '9px 18px',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  error: {
    fontSize: '0.8rem',
    color: '#f87171',
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 80,
    height: 45,
    objectFit: 'cover',
    borderRadius: 3,
    border: '1px solid var(--border)',
  },
  previewId: {
    fontSize: '0.75rem',
    color: 'var(--gray)',
    fontFamily: 'monospace',
  },
}
