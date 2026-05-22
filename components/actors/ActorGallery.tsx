'use client'

/**
 * 배우 상세 페이지 좌측 갤러리.
 *  - 큰 메인 사진 + 아래 썸네일. 썸네일 클릭 시 메인 사진 전환.
 *  - 가로/세로 혼합 대응: object-fit contain (전체가 보이게).
 *  - allowDownload(디렉터/관리자) 아니면 우클릭·드래그 차단(저작권 보호).
 */

import { useState } from 'react'

export default function ActorGallery({
  photos,
  name,
  allowDownload,
}: {
  photos: string[]
  name: string
  allowDownload: boolean
}) {
  const [active, setActive] = useState(0)
  if (!photos.length) return null
  const activeUrl = photos[Math.min(active, photos.length - 1)]

  return (
    <div>
      {/* 메인 사진 */}
      <div
        style={{
          ...s.main,
          backgroundImage: `url("${activeUrl}")`,
        }}
        onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {!allowDownload && <div style={s.overlay} />}
        {allowDownload && (
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={s.download}
          >
            ↓ 저장
          </a>
        )}
      </div>

      {/* 썸네일 (2장 이상일 때) */}
      {photos.length > 1 && (
        <div style={s.thumbRow}>
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${name} 사진 ${i + 1}`}
              onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
              style={{
                ...s.thumb,
                backgroundImage: `url("${p}")`,
                borderColor: i === active ? 'var(--gold)' : 'var(--border)',
                opacity: i === active ? 1 : 0.65,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  main: {
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg3) center / contain no-repeat',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    border: '1px solid var(--border)',
    position: 'relative',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  overlay: { position: 'absolute', inset: 0, zIndex: 1, cursor: 'default' },
  download: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 2,
    padding: '6px 12px',
    fontSize: '0.75rem',
    color: 'var(--gold)',
    textDecoration: 'none',
    border: '1px solid rgba(196,165,90,0.4)',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.55)',
    letterSpacing: '0.04em',
  },
  thumbRow: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: 5,
    border: '1.5px solid var(--border)',
    background: 'var(--bg3) center / cover no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: 'opacity 0.15s, border-color 0.15s',
  },
}
