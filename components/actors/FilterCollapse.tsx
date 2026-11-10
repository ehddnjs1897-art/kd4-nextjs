'use client'

/**
 * 배우 DB 검색 조건 접기 (2026-11-10)
 *
 * 폰에서는 성별·연령대·장르 조건 패널이 첫 화면을 거의 다 차지해 배우 얼굴이 한 명도 안 보였다.
 * 폰(640px 이하)에서만 한 줄짜리 버튼으로 접어 두고, 누르면 펼친다. 넓은 화면은 지금처럼 항상 펼침.
 * 조건 링크는 접혀 있어도 HTML에 그대로 남는다(검색엔진·내부 링크 유지) — CSS로만 가린다.
 * 표시 규칙은 app/actors/page.tsx 의 <style> 블록(.actors-filter-*)에 있다.
 */

import { useState, type ReactNode } from 'react'

export default function FilterCollapse({
  summary,
  children,
}: {
  /** 지금 걸린 조건 요약 (예: «여 · 30대»). 조건이 없으면 빈 문자열 */
  summary: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="actors-filter">
      <button
        type="button"
        className="actors-filter-toggle"
        aria-expanded={open}
        aria-controls="actors-filter-body"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="actors-filter-toggle-label">검색 조건</span>
        <span className={summary ? 'actors-filter-toggle-summary is-active' : 'actors-filter-toggle-summary'}>
          {summary || '성별 · 연령대 · 장르'}
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M3.5 6l4.5 4.5L12.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="actors-filter-body" className={open ? 'actors-filter-body is-open' : 'actors-filter-body'}>
        {children}
      </div>
    </div>
  )
}
