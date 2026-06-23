'use client'

import { useCallback } from 'react'
import { useFavorites } from '@/lib/useFavorites'

interface Props {
  actorId: string
  actorName: string
  /** 카드 위에 올릴 때: 'overlay' (절대위치), 상세 페이지: 'inline' */
  variant?: 'overlay' | 'inline'
}

export default function FavoriteButton({ actorId, actorName, variant = 'overlay' }: Props) {
  const { isFavorite, toggleFavorite, loaded } = useFavorites()
  const active = loaded && isFavorite(actorId)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite(actorId)
    },
    [actorId, toggleFavorite]
  )

  const label = active
    ? `${actorName} 숏리스트에서 제거`
    : `${actorName} 숏리스트에 추가`

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={active}
        title={active ? '숏리스트에서 제거' : '숏리스트에 추가'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '9px 18px',
          minHeight: 44,
          background: active ? '#c73e3e' : 'rgba(199,62,62,0.06)',
          border: `1px solid ${active ? '#c73e3e' : 'rgba(199,62,62,0.55)'}`,
          borderRadius: 8,
          color: active ? '#ffffff' : '#c73e3e',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.18s, border-color 0.18s, color 0.18s',
          letterSpacing: '-0.01em',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1 }}>
          {active ? '♥' : '♡'}
        </span>
        {active ? '숏리스트 추가됨' : '숏리스트 추가'}
      </button>
    )
  }

  // variant === 'overlay': 카드 왼쪽 하단 절대위치 버튼 (CopyLinkButton과 반대편)
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={active}
      title={active ? '숏리스트에서 제거' : '숏리스트에 추가'}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 2,
        minWidth: 44,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active
          ? 'rgba(199,62,62,0.75)'
          : 'rgba(0,0,0,0.5)',
        color: '#fff',
        border: 'none',
        borderRadius: '0 0 0 8px',
        padding: '0 8px',
        fontSize: '0.68rem',
        cursor: 'pointer',
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        backdropFilter: 'blur(4px)',
        transition: 'background 0.18s',
        userSelect: 'none',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '0.85rem' }}>
        {active ? '♥' : '♡'}
      </span>
    </button>
  )
}
