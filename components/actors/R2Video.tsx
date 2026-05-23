'use client'

/**
 * R2에 저장된 출연영상 재생
 * - 마운트 즉시 signed URL 미리 발급 → 재생 버튼 클릭 즉시 영상 시작
 * - poster: 재생 전 썸네일 이미지 (배우 프로필 사진 등)
 */

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function R2Video({
  videoId,
  title,
  poster,
  allowDownload,
}: {
  videoId: string
  title?: string | null
  poster?: string | null
  allowDownload?: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [prefetching, setPrefetching] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 마운트 시 URL 미리 발급 — AbortController로 언마운트 시 fetch 정리
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/videos/${videoId}/signed-url`, { signal: controller.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j.url) setUrl(j.url)
        else setError(j.error || '영상을 불러올 수 없습니다.')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return
        setError('영상을 불러올 수 없습니다.')
      })
      .finally(() => setPrefetching(false))
    return () => controller.abort()
  }, [videoId])

  function handlePlay() {
    if (!url) return
    setPlaying(true)
    setTimeout(() => videoRef.current?.play(), 50)
  }

  async function downloadVideo() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/signed-url?download=1`)
      const j = await res.json()
      if (!res.ok || !j.url) {
        setError(j.error || '다운로드 링크 발급에 실패했습니다.')
        return
      }
      const a = document.createElement('a')
      a.href = j.url
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      setError('다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={s.item}>
      <div style={s.wrapper}>
        {/* 영상 (항상 렌더, playing일 때만 보임) */}
        {url && (
          <video
            ref={videoRef}
            src={url}
            title={title || '배우 출연영상'}
            controls
            preload="none"
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            style={{ ...s.video, opacity: playing ? 1 : 0, pointerEvents: playing ? 'auto' : 'none' }}
          >
            {/* WCAG 1.2.2: 자막 트랙 — 현재 자막 미제공 (배우 오디션 영상) */}
            <track kind="captions" label="자막 없음" srcLang="ko" default />
          </video>
        )}

        {/* 썸네일 + 재생 오버레이 (playing 전) */}
        {!playing && (
          <div style={s.overlay}>
            {/* 썸네일 배경 */}
            {poster ? (
              <Image
                src={poster}
                alt={title || '영상 썸네일'}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', opacity: 0.7 }}
                unoptimized
              />
            ) : (
              <div style={s.darkBg} />
            )}

            {/* 재생 버튼 */}
            <button
              type="button"
              onClick={handlePlay}
              disabled={prefetching || !!error}
              style={s.playBtn}
              aria-label="영상 재생"
            >
              {prefetching ? (
                <span style={s.spinner} />
              ) : error ? (
                <span role="alert" style={{ fontSize: '0.75rem', color: '#fff', padding: '0 12px', textAlign: 'center' }}>{error}</span>
              ) : (
                /* 재생 삼각형 */
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      {title && <p style={s.title}>{title}</p>}
      {allowDownload && (
        <button
          type="button"
          onClick={downloadVideo}
          disabled={downloading}
          aria-label={downloading ? '영상 다운로드 중' : '영상 다운로드'}
          aria-busy={downloading}
          style={{ ...s.dlBtn, opacity: downloading ? 0.6 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
        >
          {downloading ? '⏳ 다운로드 중...' : '⤓ 영상 다운로드'}
        </button>
      )}
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
    background: '#111',
  },
  video: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    border: 'none', background: '#000',
    transition: 'opacity 0.2s',
  },
  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  darkBg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #1a1a2e, #0d0d0d)',
  },
  playBtn: {
    position: 'relative', zIndex: 2,
    width: 60, height: 60,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.8)',
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.15s, background 0.15s',
  },
  spinner: {
    width: 20, height: 20,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTop: '2.5px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  title: { fontSize: '0.85rem', color: 'var(--gray)' },
  dlBtn: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    padding: '6px 14px',
    fontSize: '0.78rem',
    color: 'var(--gold)',
    background: 'rgba(196,165,90,0.06)',
    border: '1px solid rgba(196,165,90,0.3)',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.03em',
  },
}
