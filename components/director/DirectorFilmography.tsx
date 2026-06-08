/**
 * 권동원 대표 필모그래피 공용 컴포넌트
 * page.tsx·join/page.tsx 공용 사용.
 * 데이터 단일 소스: lib/classes.ts DIRECTOR
 */
import { DIRECTOR } from '@/lib/classes'
import type React from 'react'

interface Props {
  /** 카테고리 라벨 색상 (기본: var(--gold)) */
  labelColor?: string
}

const GROUPS = [
  { cat: '드라마', items: DIRECTOR.filmography.drama },
  { cat: '영화',   items: DIRECTOR.filmography.film },
  { cat: 'CF',     items: DIRECTOR.filmography.cf },
] as const

export default function DirectorFilmography({ labelColor = 'var(--gold)' }: Props) {
  return (
    <>
      <p
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          color: labelColor,
          marginBottom: '16px',
        }}
      >
        <span lang="en">FILMOGRAPHY</span>
      </p>
      {GROUPS.map((group) => (
        <div key={group.cat} style={{ marginBottom: '14px' }}>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--gray)',
              marginBottom: '6px',
              letterSpacing: '0.05em',
            }}
          >
            {group.cat}
          </p>
          <ul
            role="list"
            aria-label={`권동원 ${group.cat} 필모그래피`}
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0 }}
          >
            {group.items.map((item) => (
              <li key={item} style={{ fontSize: '0.82rem', color: 'var(--gray-light)' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}
