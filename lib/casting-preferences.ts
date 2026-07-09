/**
 * 오디션 알림 관심분야 — 배우가 마이페이지에서 직접 선택하는 공고 유형.
 * 미설정(null/빈배열)이면 전체 유형 수신 (기존 동작 유지 — 발송폭 급감 방지).
 *
 * 매칭기(kd4-audition-actor-match)가 공고 유형을 이 5개 버킷으로 분류해 대조하므로
 * 옵션 문자열을 바꾸면 매칭 스킬 문서도 함께 갱신해야 한다.
 */
export const CASTING_TYPE_OPTIONS = [
  '상업·장편영화',
  '단편·독립영화',
  '드라마·웹드라마',
  '연극·뮤지컬',
  '광고·기타',
] as const

export type CastingType = (typeof CASTING_TYPE_OPTIONS)[number]

/** 화이트리스트 밖 값 제거 + 중복 제거. 결과가 비면 null(=전체 수신). */
export function sanitizeCastingTypes(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null
  const valid = input.filter(
    (v): v is CastingType => typeof v === 'string' && (CASTING_TYPE_OPTIONS as readonly string[]).includes(v)
  )
  const deduped = [...new Set(valid)]
  return deduped.length > 0 ? deduped : null
}
