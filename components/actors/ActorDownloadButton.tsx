'use client'

/**
 * 배우 자료(프로필 + 출연영상) 통합 다운로드 버튼 (디렉터/관리자).
 * 한 번 누르면 있는 자료를 전부 다운로드 (프로필만 / 영상만 / 둘 다 자동).
 */

import { useState } from 'react'

export default function ActorDownloadButton({
  profileUrl,
  videoIds,
}: {
  profileUrl?: string | null
  videoIds: string[]
}) {
  const [loading, setLoading] = useState(false)

  function trigger(url: string) {
    const a = document.createElement('a')
    a.href = url
    a.rel = 'noopener'
    // same-origin(프로필 프록시)에서는 강제 다운로드, cross-origin(영상 presigned)에서는
    // 무시되고 서버의 Content-Disposition 헤더가 다운로드를 처리한다.
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function downloadAll() {
    setLoading(true)
    try {
      if (profileUrl) {
        trigger(profileUrl)
        await new Promise((r) => setTimeout(r, 500))
      }
      for (const id of videoIds) {
        try {
          const res = await fetch(`/api/videos/${id}/signed-url?download=1`, { signal: AbortSignal.timeout(10_000) })
          const j = await res.json()
          if (res.ok && j.url) {
            trigger(j.url)
            await new Promise((r) => setTimeout(r, 500)) // 다중 다운로드 차단 방지 간격
          }
        } catch {
          /* 개별 실패는 건너뜀 */
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const count = (profileUrl ? 1 : 0) + videoIds.length
  if (count === 0) return null

  return (
    <>
      <button type="button" onClick={downloadAll} disabled={loading} aria-busy={loading} style={styles.btn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {loading ? '다운로드 중...' : '자료 다운로드 (프로필·영상)'}
      </button>
      <span role="status" aria-live="polite" className="sr-only">{loading ? '자료를 다운로드하는 중입니다.' : ''}</span>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 16px',
    minHeight: 44,
    fontSize: '0.9rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    width: '100%',
  },
}
