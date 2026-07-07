'use client'

import { useState, type CSSProperties } from 'react'

type Props = {
  videoId: string
  /** 비공개/미등록(unlisted) Vimeo 영상 재생에 필요한 private hash */
  hash: string
  title: string
  allow?: string
  /** facade 컨테이너 추가 스타일 (border, shadow 등) */
  containerStyle?: CSSProperties
}

const DEFAULT_ALLOW = 'autoplay; fullscreen; picture-in-picture'

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

/**
 * Vimeo는 YouTube(i.ytimg.com)처럼 예측 가능한 썸네일 URL 패턴이 없다 —
 * oEmbed API 호출이 필요하고, 비공개 영상은 그마저도 실패할 수 있다.
 * 따라서 썸네일 이미지 없이 어두운 배경 + 재생 버튼만으로 facade를 구성한다.
 */
export default function VimeoFacade({ videoId, hash, title, allow, containerStyle }: Props) {
  const [loaded, setLoaded] = useState(false)
  const mergedWrapperStyle = { ...wrapperStyle, ...containerStyle }

  if (loaded) {
    return (
      <div style={mergedWrapperStyle}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?h=${hash}&autoplay=1`}
          style={fillStyle}
          allow={allow ?? DEFAULT_ALLOW}
          allowFullScreen
          title={title}
        />
        <p className="sr-only">자막이 있는 경우 영상 플레이어의 CC 버튼을 이용하세요.</p>
      </div>
    )
  }

  return (
    <div style={mergedWrapperStyle}>
      <div style={{ ...fillStyle, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#999', fontSize: '0.8rem' }}>동영상</span>
      </div>
      <button
        type="button"
        onClick={() => setLoaded(true)}
        aria-label={`${title} 재생`}
        style={playButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(26, 183, 234, 0.85)'
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
