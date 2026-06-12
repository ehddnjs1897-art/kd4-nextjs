import 'server-only'

/**
 * 회원가입 시 배우DB(actors 테이블)와 이름+전화번호 매칭
 *
 * actors 테이블 규모가 소규모이므로 full scan 후 정규화 비교.
 * 매칭 성공 시 profiles 테이블의 actor_id / role / matched_at 업데이트.
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

// ─── 정규화 헬퍼 ────────────────────────────────────────────────────────────

/** 이름: 공백 제거 후 소문자 */
function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase()
}

/** 전화번호: 하이픈·점·공백 제거, 숫자만 추출 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-.()+]/g, '').replace(/[^0-9]/g, '')
}

// ─── 매칭 함수 ──────────────────────────────────────────────────────────────

/**
 * 회원가입 직후 호출.
 * actors 테이블의 name + phone과 대조하여 동일인이면
 * profiles 테이블을 업데이트하고 { matched: true, actorId } 반환.
 *
 * @param profileId   auth.users.id (profiles.id)
 * @param name        회원가입 시 입력한 이름
 * @param phone       회원가입 시 입력한 전화번호
 */
export async function matchActorOnSignup(
  profileId: string,
  name: string,
  phone: string
): Promise<{ matched: boolean; actorId?: string }> {
  // 1. actors 테이블 전체 조회 (소규모 테이블이므로 full scan OK)
  const { data: actors, error: fetchError } = await supabaseAdmin
    .from('actors')
    .select('id, name, phone')
    .limit(5000) // 소규모 스튜디오 최대 5,000명 대비 (51명 현재 — 향후 성장 고려)

  if (fetchError) {
    console.error('[actor-matching] actors 조회 실패:', fetchError.message)
    return { matched: false }
  }

  if (!actors || actors.length === 0) {
    return { matched: false }
  }

  const inputName = normalizeName(name)
  const inputPhone = normalizePhone(phone)

  // 빈 이름으로 인한 false-positive 방지
  if (!inputName) {
    return { matched: false }
  }

  // 2-①. 이름 + 전화 완전 일치 (가장 강한 신호)
  let matched = inputPhone
    ? actors.find(
        (actor) =>
          normalizeName(actor.name ?? '') === inputName &&
          normalizePhone(actor.phone ?? '') === inputPhone
      )
    : undefined

  // 2-②. 이름 단독 매칭 폴백 (2026-06-12 대표 지시: 이름 일치 멤버는 배우 멤버로)
  //    actors.phone 공란이 많아 전화 매칭만으로는 대부분 실패 →
  //    동명 actor가 정확히 1명이고 아직 어떤 계정과도 연결되지 않은 row만 허용 (기존 연결 탈취 방지)
  if (!matched) {
    const sameName = actors.filter((a) => normalizeName(a.name ?? '') === inputName)
    if (sameName.length === 1) {
      const { data: claimedBy } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('actor_id', sameName[0].id)
        .neq('id', profileId)
        .limit(1)
      if (!claimedBy || claimedBy.length === 0) {
        matched = sameName[0]
      }
    }
  }

  if (!matched) {
    return { matched: false }
  }

  // 3. profiles 업데이트 — actor_id 연결 + '일반 회원'(user) 잔재면 '배우 멤버'(actor)로 정리.
  //    editor 같은 편집 권한 승급은 여전히 관리자 수동 승인만 (사칭 가입 방어 유지)
  const { data: prof } = await supabaseAdmin
    .from('profiles').select('role').eq('id', profileId).maybeSingle()
  const patch: { actor_id: string; matched_at: string; role?: string } = {
    actor_id: matched.id,
    matched_at: new Date().toISOString(),
  }
  if ((prof?.role ?? 'user') === 'user') patch.role = 'actor'

  const { data: linked, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', profileId)
    .select('id').maybeSingle()

  if (updateError) {
    console.error('[actor-matching] profiles 업데이트 실패:', updateError.message)
    return { matched: false }
  }
  if (!linked) {
    console.error('[actor-matching] profiles row 소실 — profileId:', profileId)
    return { matched: false }
  }

  return { matched: true, actorId: matched.id }
}

/**
 * 회원가입 직후 호출.
 * 운영 시트에서 미리 넣어둔 수강 기록(enrollments) 중
 * user_id가 비어있고 이름이 일치하는 것을 가입 계정과 연결한다.
 * (회원이 아직 가입 안 한 상태로 수강 데이터를 먼저 넣어둔 경우 대응)
 *
 * @returns 연결된 수강 기록 수
 */
export async function linkEnrollmentsOnSignup(
  profileId: string,
  name: string,
  actorId?: string | null
): Promise<number> {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 0

  const patch: { user_id: string; actor_id?: string } = { user_id: profileId }
  if (actorId) patch.actor_id = actorId

  // 1단계: 매칭 ID 목록 조회 (최대 10개 캡 — 동명이인 대량 연결 방지)
  let selectQ = supabaseAdmin
    .from('enrollments')
    .select('id')
    .is('user_id', null)
    .eq('name', trimmed)
    .limit(10)
  if (actorId) {
    selectQ = selectQ.eq('actor_id', actorId)
  } else {
    selectQ = selectQ.is('actor_id', null)
  }
  const { data: matches, error: selectErr } = await selectQ

  if (selectErr) {
    console.error('[enrollment-link] 조회 실패:', selectErr.message)
    return 0
  }
  if (!matches || matches.length === 0) return 0

  // 2단계: ID 목록으로만 업데이트 (mass-update 방지)
  const ids = matches.map((r) => r.id)
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update(patch)
    .in('id', ids)
    .select('id')

  if (error) {
    console.error('[enrollment-link] 연결 실패:', error.message)
    return 0
  }
  return data?.length ?? 0
}
