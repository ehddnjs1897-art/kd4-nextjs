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
  // 대표 확정 (2026-06-12): 숫자 복원 90+ — '현직'은 라벨로 이동해 신뢰 신호 유지
  { value: '90+', label: '현직 배우 멤버' },
  // 사이트 전체 통일 표기: "최근 캐스팅 60건" (2026-07-23)
  { value: '60건', label: '최근 캐스팅' },
]
