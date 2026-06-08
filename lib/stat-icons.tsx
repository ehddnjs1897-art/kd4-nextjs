/**
 * KD4 통계 카드 아이콘 — 모듈 스코프 상수 (렌더마다 재생성 방지)
 * page.tsx·join/page.tsx 공용 사용.
 * 순서: [0] 누적 코칭 배우, [1] 출연영상 제작, [2] 배우 DB, [3] 캐스팅 결과
 */
export const STAT_ICONS = [
  // 0: 누적 코칭 배우 — 사람 그룹
  <svg key="people" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>,
  // 1: 출연영상 제작 — 카메라/영상
  <svg key="video" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>,
  // 2: 배우 DB — 데이터베이스
  <svg key="db" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
  </svg>,
  // 3: 캐스팅 — 차트 우상향
  <svg key="chart" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>,
]
