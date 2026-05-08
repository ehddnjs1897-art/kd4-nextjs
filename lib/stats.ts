/**
 * KD4 핵심 지표 — 메인 페이지 노출용
 *
 * 사용자(권동원) 확정 숫자 (2026-05-08).
 * 숫자 변경 시: 이 파일만 수정. 메인 페이지는 자동 반영.
 *
 * 향후 — 배우 DB는 Supabase actors 테이블에서 자동 카운트 가능
 * (현재 메인은 client component라 API route 통한 동적 갱신 필요. TODO)
 */

export interface StatItem {
  /** 숫자 (예: "400+") */
  value: string
  /** 라벨 (예: "누적 코칭 배우") */
  label: string
}

/** 메인 페이지 stats 섹션 데이터 */
export const KD4_STATS: StatItem[] = [
  { value: '400+', label: '누적 코칭 배우' },
  { value: '100+', label: '출연영상 제작' },
  { value: '60+', label: '배우 DB 등록' },
  { value: '60+', label: '캐스팅 연계 사례' },
]
