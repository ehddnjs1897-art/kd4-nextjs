'use client'

import { useState, type CSSProperties } from 'react'

type Props = {
  videoId: string
  title: string
  allow?: string
  /** facade 컨테이너 추가 스타일 (border, shadow 등) */
  containerStyle?: CSSProperties
}

const DEFAULT_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'

const wrapperStyle: CSSProperties = {
  position: 'relative',
  paddingBottom: '56.25%',
  height: 0,
  overflow: 'hidden',
}

const fillStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 0,
}

const playButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '68px',
  height: '48px',
  background: 'rgba(0,0,0,0.55)',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'background 0.2s',
}

export default function YouTubeFacade({ videoId, title, allow, containerStyle }: Props) {
  const [loaded, setLoaded] = useState(false)
  const mergedWrapperStyle = { ...wrapperStyle, ...containerStyle }

  if (loaded) {
    return (
      <div style={mergedWrapperStyle}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          style={fillStyle}
          allow={allow ?? DEFAULT_ALLOW}
          allowFullScreen
          title={title}
        />
      </div>
    )
  }

  return (
    <div style={mergedWrapperStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        style={{ ...fillStyle, objectFit: 'cover' }}
      />
      <button
        type="button"
        onClick={() => setLoaded(true)}
        aria-label={`${title} 재생`}
        style={playButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(220, 0, 0, 0.85)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.55)'
        }}
      >
        <svg width="36" height="26" viewBox="0 0 68 48" aria-hidden="true">
          <path d="M 45,24 27,14 27,34" fill="#fff" />
        </svg>
      </button>
    </div>
  )
}
