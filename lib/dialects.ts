/**
 * 사투리(가능 지역) 옵션 — 회원가입·마이페이지 입력 + 상세페이지 표시 + 검색에서 공용.
 * 한 곳에서 관리해 폼/저장/표시 간 값 불일치 방지.
 * (대표님 5/8 결정: 언어·억양은 기존 skills로 흡수, 사투리만 별도 / 06-08: 연령대 제외)
 */
export const DIALECT_OPTIONS = ['경상', '전라', '충청', '강원', '제주', '이북'] as const

/** 사투리 없음(표준어) — 지역과 상호배타. "없을 때 표시할 항목이 없다"는 배우 피드백(2026-06) 반영. */
export const DIALECT_NONE = '없음'

export type Dialect = (typeof DIALECT_OPTIONS)[number]

/** 입력값을 허용된 사투리 옵션으로만 정제 (화이트리스트 + 중복 제거 + 개수 상한).
 *  '없음'(표준어)이 포함되면 단독값으로 — 지역 선택과 상호배타. */
export function sanitizeDialects(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  if (input.includes(DIALECT_NONE)) return [DIALECT_NONE]
  const allowed = new Set<string>(DIALECT_OPTIONS)
  const out: string[] = []
  for (const v of input) {
    if (typeof v === 'string' && allowed.has(v) && !out.includes(v)) out.push(v)
    if (out.length >= DIALECT_OPTIONS.length) break
  }
  return out
}
