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
    .limit(500)

  if (fetchError) {
    console.error('[actor-matching] actors 조회 실패:', fetchError.message)
    return { matched: false }
  }

  if (!actors || actors.length === 0) {
    return { matched: false }
  }

  const inputName = normalizeName(name)
  const inputPhone = normalizePhone(phone)

  // 빈 값으로 인한 false-positive 방지 (blank name/phone → 매칭 스킵)
  if (!inputName || !inputPhone) {
    return { matched: false }
  }

  // 2. 정규화 매칭
  const matched = actors.find(
    (actor) =>
      normalizeName(actor.name ?? '') === inputName &&
      normalizePhone(actor.phone ?? '') === inputPhone
  )

  if (!matched) {
    return { matched: false }
  }

  // 3. profiles 테이블 업데이트 — actor_id만 연결, role은 변경 X
  //    (이전: role을 'editor'로 자동 승급 → 사칭 가입 시 갤러리 편집 권한 획득 위험)
  //    이제: actor_id 연결만, editor 권한은 관리자 수동 승인 필요
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      actor_id: matched.id,
      matched_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (updateError) {
    console.error('[actor-matching] profiles 업데이트 실패:', updateError.message)
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
  if (actorId) selectQ = selectQ.eq('actor_id', actorId)
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
