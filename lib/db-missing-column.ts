/**
 * 마이그레이션 미실행(누락) 컬럼 감지 — UPDATE/INSERT 재시도 루프용.
 *
 * ⚠️ PostgREST는 "없는 컬럼" 에러를 두 가지 코드로 낸다:
 *   - SELECT 시        → Postgres 그대로 `42703` ("column ... does not exist")
 *   - UPDATE/INSERT 시 → PostgREST 스키마캐시 단계에서 `PGRST204`
 *                        ("Could not find the 'X' column of '...' in the schema cache")
 *                        — Postgres까지 도달하지 못하므로 42703이 절대 안 옴.
 * 그래서 UPDATE/INSERT 폴백은 반드시 두 코드를 모두 봐야 한다.
 *
 * 🩹 2026-06-23 사고: intake 패치 루프가 `42703`만 검사 → birth_year 미생성 상태에서
 *    출생연도를 입력한 모든 배우의 프로필 제출이 500으로 실패(민원). 이 헬퍼로 양식 통일.
 */
type DbErr = { code?: string; message?: string } | null

/** UPDATE/INSERT에서 누락 컬럼으로 인한 실패인지 (42703 + PGRST204 모두 포함) */
export function isMissingColumnError(err: DbErr): boolean {
  if (!err) return false
  if (err.code === '42703' || err.code === 'PGRST204') return true
  const m = err.message ?? ''
  return /does not exist/i.test(m) || /schema cache/i.test(m)
}

/**
 * age_group CHECK 제약 위반(23514)인지 — 제약 확장 SQL 미적용 구간에서 신규 나이대 값
 * ('50대'·'60대 이상')을 쓰려다 막힐 때 감지용. intake가 레거시 '50대 이상'으로 폴백해 500을 막는다.
 */
export function isAgeGroupCheckError(err: DbErr): boolean {
  if (!err) return false
  const m = err.message ?? ''
  return err.code === '23514' && /age_group/i.test(m)
}

/** 에러 메시지에서 누락된 옵션 컬럼명을 특정 (42703·PGRST204 양식 모두). 못 찾으면 null. */
export function findMissingOptionalCol(
  err: DbErr,
  optionalCols: readonly string[],
  dropped: Set<string>,
): string | null {
  const m = err?.message ?? ''
  return (
    optionalCols.find(
      (c) =>
        !dropped.has(c) &&
        (new RegExp(`column .*${c}.* does not exist`, 'i').test(m) || // 42703 양식
          new RegExp(`'${c}'\\s+column`, 'i').test(m) || // PGRST204 양식
          new RegExp(`\\b${c}\\b`, 'i').test(m)), // 폴백: 컬럼명 포함
    ) ?? null
  )
}
