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

  if (fetchError) {
    console.error('[actor-matching] actors 조회 실패:', fetchError.message)
    return { matched: false }
  }

  if (!actors || actors.length === 0) {
    return { matched: false }
  }

  const inputName = normalizeName(name)
  const inputPhone = normalizePhone(phone)

  // 2. 정규화 매칭
  const matched = actors.find(
    (actor) =>
      normalizeName(actor.name ?? '') === inputName &&
      normalizePhone(actor.phone ?? '') === inputPhone
  )

  if (!matched) {
    return { matched: false }
  }

  // 3. profiles 테이블 업데이트
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      actor_id: matched.id,
      role: 'editor',
      matched_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (updateError) {
    console.error('[actor-matching] profiles 업데이트 실패:', updateError.message)
    return { matched: false }
  }

  return { matched: true, actorId: matched.id }
}
