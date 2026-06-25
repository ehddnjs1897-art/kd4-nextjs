/**
 * 캐스팅 전환 추적 — 집계 레이어 (서버 전용)
 *
 * 설계서: ~/Desktop/KD4-HUB/04-ops/전략설계_캐스팅전환추적+장면메타데이터_2026-06-12.md (①)
 * 데이터: Supabase actor_castings (마이그레이션 2026-06-18_actor_castings.sql)
 *
 * 대표 결정 반영:
 *   ① 저장위치 = Supabase actor_castings
 *   ② 전환율 분모 = (b) 최근 6개월 수강이력 있는 "활동 멤버"
 *      → enrollments 에서 status='확정' 이고 최근 6개월(year_month) 수강한 distinct actor_id 수
 *
 * ⚠️ 이 파일은 데이터 레이어만 제공한다. UI(admin 대시보드/주간보고) 연결은
 *    다른 세션과의 충돌을 피하기 위해 보류 상태 — 호출부는 추후 추가.
 *
 * ⚠️ RLS: actor_castings 는 admin-only. 반드시 service_role(getSupabaseAdmin) 로만 조회.
 *    절대 브라우저 클라이언트에서 import 금지.
 */
import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export interface CastingFunnel {
  /** 집계 기간 (개월) */
  periodMonths: number
  /** 캐스팅 확정된 고유 멤버 수 (status='cast' distinct actor_id) */
  castMembers: number
  /** 캐스팅 확정 건수 (status='cast' rows) */
  castCount: number
  /** 오디션 이상 진행 건수 (audition/callback/cast) */
  auditionCount: number
  /** 총 지원 건수 (전체 rows) */
  totalApplications: number
  /** 활동 멤버 수 = 분모(b): 최근 6개월 수강 확정 멤버 (distinct actor_id) */
  activeMembers: number
  /** 건당 전환율 % = cast건수 / 총지원건수 (소수1) */
  conversionPerApplication: number
  /** 멤버 전환율 % = 캐스팅된 멤버수 / 활동 멤버수 (소수1) — 마케팅 "X%" 숫자 */
  conversionPerMember: number
}

/** year_month('YYYY-MM') 문자열로 N개월 전 경계 생성 */
function monthsAgoYM(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** ISO date 문자열로 N개월 전 경계 생성 (result_at/applied_at 비교용) */
function monthsAgoDate(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

/**
 * 분모(b): 최근 6개월 수강 확정 활동 멤버 수.
 * enrollments status='확정' & year_month >= 6개월 전 의 distinct actor_id.
 */
export async function getActiveMemberCount(months = 6): Promise<number> {
  const supabase = getSupabaseAdmin()
  const since = monthsAgoYM(months)
  const { data, error } = await supabase
    .from('enrollments')
    .select('actor_id')
    .eq('status', '확정')
    .gte('year_month', since)
    .not('actor_id', 'is', null)
  if (error) throw error
  const ids = new Set((data ?? []).map((r) => r.actor_id as string))
  return ids.size
}

/**
 * 캐스팅 깔때기 + 전환율 집계.
 * 기간(periodMonths)은 COALESCE(result_at, applied_at) 기준으로 필터.
 * 분모(활동 멤버)는 항상 최근 6개월 enrollments 기준(대표 결정 b).
 */
export async function getCastingFunnel(periodMonths = 3): Promise<CastingFunnel> {
  const supabase = getSupabaseAdmin()
  const since = monthsAgoDate(periodMonths)

  // actor_castings 기간 내 전체 행 조회 (행 수가 작아 클라 측 집계가 단순/안전)
  const { data, error } = await supabase
    .from('actor_castings')
    .select('actor_id, status, applied_at, result_at')
  if (error) throw error

  const inPeriod = (data ?? []).filter((r) => {
    const ref = (r.result_at as string | null) ?? (r.applied_at as string | null)
    return ref != null && ref >= since
  })

  const castRows = inPeriod.filter((r) => r.status === 'cast')
  const auditionRows = inPeriod.filter((r) =>
    ['audition', 'callback', 'cast'].includes(r.status as string),
  )
  const castMembers = new Set(castRows.map((r) => r.actor_id as string)).size
  const totalApplications = inPeriod.length
  const castCount = castRows.length

  const activeMembers = await getActiveMemberCount(6)

  const round1 = (n: number) => Math.round(n * 10) / 10

  return {
    periodMonths,
    castMembers,
    castCount,
    auditionCount: auditionRows.length,
    totalApplications,
    activeMembers,
    conversionPerApplication:
      totalApplications > 0 ? round1((100 * castCount) / totalApplications) : 0,
    conversionPerMember:
      activeMembers > 0 ? round1((100 * castMembers) / activeMembers) : 0,
  }
}

/**
 * 주간 보고 1줄용 요약 문자열.
 * 예: "최근 3개월 캐스팅: 멤버 8명 캐스팅(활동멤버 32명 중 25.0%) · 지원 40건→확정 12건(30.0%)"
 */
export async function getWeeklyCastingLine(periodMonths = 3): Promise<string> {
  const f = await getCastingFunnel(periodMonths)
  return (
    `최근 ${f.periodMonths}개월 캐스팅: ` +
    `멤버 ${f.castMembers}명 캐스팅(활동멤버 ${f.activeMembers}명 중 ${f.conversionPerMember}%) · ` +
    `지원 ${f.totalApplications}건→확정 ${f.castCount}건(${f.conversionPerApplication}%)`
  )
}

/**
 * 참고용 — Supabase SQL Editor에서 직접 돌릴 수 있는 원시 집계 쿼리 (설계서 §5).
 * 분모(b) = 최근 6개월 enrollments 확정 distinct actor_id.
 *
 * WITH active AS (
 *   SELECT COUNT(DISTINCT actor_id) AS n
 *   FROM enrollments
 *   WHERE status = '확정'
 *     AND actor_id IS NOT NULL
 *     AND to_date(year_month || '-01','YYYY-MM-DD') >= (CURRENT_DATE - INTERVAL '6 months')
 * )
 * SELECT
 *   COUNT(DISTINCT actor_id) FILTER (WHERE status = 'cast')                         AS cast_members,
 *   COUNT(*) FILTER (WHERE status = 'cast')                                         AS cast_count,
 *   COUNT(*)                                                                        AS total_applications,
 *   (SELECT n FROM active)                                                          AS active_members,
 *   ROUND(100.0 * COUNT(*) FILTER (WHERE status='cast') / NULLIF(COUNT(*),0), 1)    AS conv_per_application,
 *   ROUND(100.0 * COUNT(DISTINCT actor_id) FILTER (WHERE status='cast')
 *         / NULLIF((SELECT n FROM active),0), 1)                                    AS conv_per_member
 * FROM actor_castings
 * WHERE COALESCE(result_at, applied_at) >= (CURRENT_DATE - INTERVAL '3 months');
 */
