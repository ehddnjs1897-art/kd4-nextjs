'use client'

/**
 * R2에 저장된 출연영상 재생
 * - 마운트 즉시 signed URL 미리 발급 → 재생 버튼 클릭 즉시 영상 시작
 * - poster: 영상 첫 프레임이 뜨기 전(로딩 중·비로그인 안내 상태)에 깔리는 표지 = 배우 프로필 사진.
 *   첫 프레임이 그려지면 영상이 표지를 덮는다. 사진은 자르지 않고 통째로(contain) 보여준다. (2026-11-10)
 * - preload="auto"(2026-07-08): "재생하면 로딩이 길다" 제보 — signed URL만 미리
 *   받고 실제 영상 바이트는 재생 클릭 시점에야 받기 시작해 체감 버퍼링 발생.
 *   URL 확보 즉시 실제 영상 데이터도 미리 받아두게 변경.
 */

import { useState, useEffect, useRef } from 'react'

export default function R2Video({
  videoId,
  title,
  poster,
  allowDownload,
}: {
  videoId: string
  title?: string | null
  poster?: string | null  // 첫 프레임이 뜨기 전에만 보이는 표지 (없으면 기존처럼 어두운 배경)
  allowDownload?: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [frameReady, setFrameReady] = useState(false)
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
      const res = await fetch(`/api/videos/${videoId}/signed-url?download=1`, { signal: AbortSignal.timeout(10_000) })
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
        {/* 표지 — 영상 첫 프레임이 준비되기 전까지 보임 */}
        {poster && !frameReady && !playing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={s.poster}
          />
        )}
        {/* 영상 (항상 렌더 — 첫 프레임이 그려지면 표지를 덮음) */}
        {url && (
          <>
            <video
              ref={videoRef}
              src={`${url}#t=0.5`}
              title={title || '배우 출연영상'}
              controls={playing}
              preload="auto"
              playsInline
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              tabIndex={playing ? 0 : -1}
              onLoadedData={() => setFrameReady(true)}
              // 첫 프레임 전에는 배경을 비워 뒤의 표지가 비치게 한다. loadeddata가 안 오는 기기(iOS)에서도
              // 프레임이 그려지면 그대로 표지를 덮으므로, 이벤트에 기대어 영상을 숨기지 않는다.
              style={{ ...s.video, background: frameReady || playing || !poster ? '#000' : 'transparent' }}
            />
            {/* WCAG 1.2.2: 자막 미제공 안내 — 배우 오디션 영상은 자막 미제공 */}
            <p className="sr-only">이 영상은 자막을 제공하지 않습니다.</p>
          </>
        )}

        {/* 재생 오버레이 (playing 전) — 배경은 video 첫 프레임(#t=0.5)이 썸네일 역할 */}
        {!playing && (
          <div style={s.overlay}>
            {/* 영상 첫 프레임 위 살짝 어둡게 — 재생버튼 대비 */}
            <div style={{ ...s.scrim, background: error ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.28)' }} />

            {/* 재생 버튼 — 에러 텍스트는 버튼 바깥에 별도 배치 (버튼 accessible name 오염 방지) */}
            <button
              type="button"
              onClick={handlePlay}
              disabled={prefetching || !!error}
              aria-busy={prefetching}
              style={s.playBtn}
              aria-label={error ? `영상 로딩 실패: ${error}` : '영상 재생'}
            >
              {prefetching ? (
                <span style={s.spinner} />
              ) : (
                /* 재생 삼각형 — 에러 시 비표시 */
                <svg width="28" height="28" viewBox="0 0 24 24" fill={error ? 'transparent' : 'white'} aria-hidden="true">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
            {error && (
              <p role="status" aria-live="polite" style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: '0.75rem', color: '#ff6b6b', padding: '0 8px', zIndex: 3 }}>{error}</p>
            )}
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
          style={{ ...s.dlBtn, opacity: downloading ? 0.7 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
          onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.background = 'var(--gold-light)' }}
          onMouseLeave={(e) => { if (!downloading) e.currentTarget.style.background = 'var(--gold)' }}
        >
          {downloading ? '다운로드 중...' : '영상 다운로드'}
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
  poster: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    objectFit: 'contain',
    userSelect: 'none',
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
  scrim: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.28)',
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
    alignSelf: 'stretch',          // 썸네일 너비만큼 꽉 차게
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 48,
    marginTop: 2,
    padding: '13px 16px',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#ffffff',              // 흰 글씨 — 네이비 채움 위에서 또렷
    background: 'var(--gold)',      // var(--gold)=var(--navy)=#15488A 솔리드 채움 (잘 보이게)
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-display), inherit',
    letterSpacing: '0.04em',
    transition: 'background 0.15s',
  },
}
