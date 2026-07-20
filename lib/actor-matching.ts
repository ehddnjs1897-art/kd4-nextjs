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
      const candidate = sameName[0]
      const candidatePhone = normalizePhone(candidate.phone ?? '')
      // 🔒 보안(2026-06-13): 후보 배우에 전화가 등록돼 있으면 입력 전화와 일치할 때만 연결.
      //    동명만으로 전화 등록된 배우 계정을 탈취(연락처 열람·프로필 편집권)하는 것 차단.
      //    전화 미등록 배우는 기존대로 이름 단독 허용 (2026-06-12 대표 지시 — 데이터 미비 멤버 자동연결)
      const phoneOk = !candidatePhone || (!!inputPhone && candidatePhone === inputPhone)
      if (phoneOk) {
        const { data: claimedBy } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('actor_id', candidate.id)
          .neq('id', profileId)
          .limit(1)
        if (!claimedBy || claimedBy.length === 0) {
          matched = candidate
        }
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
 * 배우 본인 온보딩(프로필 파일 업로드) 시점의 동일인 매칭.
 *
 * matchActorOnSignup보다 한 단계 더 적극적이다. 본인이 로그인해 **자기 사진·PPT·영상을
 * 직접 업로드**하는 강한 의도 신호이므로, "기존 배우행에 전화가 등록돼 있는데 업로드자가
 * 전화를 입력하지 않은" 케이스(박우진·김이영 사고)도 동일인으로 보고 병합한다.
 *
 * 🔒 사칭 방어는 유지: 전화가 **둘 다 있는데 서로 다르면**(phone_conflict) 자동연결 거부,
 *    동명 배우가 **2명 이상이면**(ambiguous) 누구인지 단정 불가하여 거부 → 관리자 검토용 신규행.
 *    이미 다른 계정이 점유한 배우(claimed)도 거부(연결 탈취 방지).
 *
 * 매칭 성공 시 profiles.actor_id를 연결하고 { matched, actorId, reason:'linked' } 반환.
 * 호출부(intake)는 이후 그 배우행에 최신 업로드를 덮어써 "최신 우선 반영"을 완성한다.
 *
 * @returns reason: 'linked' | 'none' | 'ambiguous' | 'phone_conflict' | 'claimed' | 'link_failed'
 */
export async function matchActorForIntake(
  profileId: string,
  name: string,
  phone: string
): Promise<{ matched: boolean; actorId?: string; reason: string }> {
  const inputName = normalizeName(name)
  if (!inputName) return { matched: false, reason: 'none' } // 빈 이름 false-positive 방지

  const inputPhone = normalizePhone(phone)

  const { data: actors, error } = await supabaseAdmin
    .from('actors')
    .select('id, name, phone')
    .limit(5000)
  if (error) {
    console.error('[actor-matching:intake] actors 조회 실패:', error.message)
    return { matched: false, reason: 'none' }
  }
  if (!actors || actors.length === 0) return { matched: false, reason: 'none' }

  // 1. 이름+전화 완전 일치 (가장 강한 신호)
  let candidate = inputPhone
    ? actors.find(
        (a) =>
          normalizeName(a.name ?? '') === inputName &&
          normalizePhone(a.phone ?? '') === inputPhone
      )
    : undefined

  // 2. 이름 일치 — 정확히 1명일 때만. 동명 2명+ 는 모호 → 자동병합 금지.
  if (!candidate) {
    const sameName = actors.filter((a) => normalizeName(a.name ?? '') === inputName)
    if (sameName.length > 1) return { matched: false, reason: 'ambiguous' }
    if (sameName.length === 1) {
      const c = sameName[0]
      const cPhone = normalizePhone(c.phone ?? '')
      // 🔒 전화가 둘 다 있는데 서로 다르면 사칭 위험 → 자동병합 거부(관리자 검토).
      //    한쪽이라도 전화가 없으면(입력 누락 등) 본인 업로드로 보고 허용 — 박우진/김이영 케이스.
      if (cPhone && inputPhone && cPhone !== inputPhone) {
        return { matched: false, reason: 'phone_conflict' }
      }
      candidate = c
    }
  }
  if (!candidate) return { matched: false, reason: 'none' }

  // 3. 다른 계정이 이미 점유한 배우면 연결 금지 (계정 탈취 방지)
  const { data: claimedBy } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('actor_id', candidate.id)
    .neq('id', profileId)
    .limit(1)
  if (claimedBy && claimedBy.length > 0) return { matched: false, reason: 'claimed' }

  // 4. profiles 연결 ('일반 회원' 잔재면 '배우 멤버'로 정리 — editor 승급은 여전히 수동만)
  const { data: prof } = await supabaseAdmin
    .from('profiles').select('role').eq('id', profileId).maybeSingle()
  const patch: { actor_id: string; matched_at: string; role?: string } = {
    actor_id: candidate.id,
    matched_at: new Date().toISOString(),
  }
  if ((prof?.role ?? 'user') === 'user') patch.role = 'actor'

  const { data: linked, error: upErr } = await supabaseAdmin
    .from('profiles').update(patch).eq('id', profileId).select('id').maybeSingle()
  if (upErr || !linked) {
    console.error('[actor-matching:intake] profiles 연결 실패:', upErr?.message ?? 'row 소실')
    return { matched: false, reason: 'link_failed' }
  }

  return { matched: true, actorId: candidate.id, reason: 'linked' }
}

/**
 * profiles 행 자체가 없는 경우의 자가복구 (2026-07-10, 육군길 케이스).
 *
 * 정상 흐름은 회원가입 페이지가 signUp() 직후 /api/auth/on-signup을 호출해 profiles 행을
 * 만든다. 하지만 signUp()이 세션을 즉시 안 돌려주면(이메일은 서버에서 이미 자동승인됐는데도
 * 클라이언트 응답에 session이 없는 경우 실측됨) on-signup 호출 자체가 스킵되고, 이후 로그인은
 * 별도 페이지라 on-signup을 다시 안 부름 → profiles 행이 영영 안 생겨 대시보드 접속 자체가
 * 깨진다("연락처 저장 안 됨", "크루신청 버튼이 안 먹음" 전부 이 증상).
 *
 * on-signup/route.ts의 핵심 로직(업서트+배우매칭+수강연결)과 동일 — 대시보드류 서버 컴포넌트가
 * profile 조회 결과가 null일 때 이걸 불러 즉석 복구한다. user는 이미 auth.getUser()로 받은
 * 객체를 그대로 넘기면 된다(재조회 불필요).
 */
export async function ensureProfileRow(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): Promise<{
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  created_at: string
  actor_id: string | null
} | null> {
  const meta = user.user_metadata ?? {}
  const name = ((meta.name as string) ?? '').toString().slice(0, 100)
  const rawPhone = ((meta.phone as string) ?? '').toString().slice(0, 20)
  const phoneNormalized = rawPhone.replace(/[^\d]/g, '')
  const phone = /^[+]?[\d\s\-().]{7,20}$/.test(rawPhone) && phoneNormalized.length >= 7 ? phoneNormalized : ''
  const ALLOWED_MEMBER_TYPES = new Set(['actor', 'director'])
  const rawMemberType = (meta.member_type as string) ?? 'actor'
  const memberType = ALLOWED_MEMBER_TYPES.has(rawMemberType) ? rawMemberType : 'actor'
  const role = memberType === 'director' ? 'member' : 'actor'
  // 가입 metadata의 출생연도 (2026-07-21) — 범위 검증 후 배우 레코드 반영용
  const byRaw = Number(meta.birth_year)
  const birthYear = Number.isInteger(byRaw) && byRaw >= 1930 && byRaw <= new Date().getFullYear() ? byRaw : null

  const { data: upserted, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      { id: user.id, name: name || null, phone: memberType === 'actor' ? (phone || null) : null, email: user.email || null, role },
      { onConflict: 'id' }
    )
    .select('id, name, email, phone, role, created_at, actor_id')
    .maybeSingle()

  if (error || !upserted) {
    console.error('[ensureProfileRow] profiles upsert 실패:', error?.message ?? 'no row')
    return null
  }

  if (name && memberType !== 'director' && !upserted.actor_id) {
    try {
      const res = await matchActorOnSignup(user.id, name, phone)
      if (res.matched && res.actorId) {
        upserted.actor_id = res.actorId
        upserted.role = 'actor'
      }
    } catch (e) {
      console.error('[ensureProfileRow] matching error:', e instanceof Error ? e.message : String(e))
    }
  }
  // 가입 시 입력한 출생연도 반영 — 비어있을 때만 (기존 데이터 안 덮음)
  if (birthYear && upserted.actor_id) {
    const { error: byErr } = await supabaseAdmin
      .from('actors')
      .update({ birth_year: birthYear })
      .eq('id', upserted.actor_id)
      .is('birth_year', null)
    if (byErr) console.error('[ensureProfileRow] birth_year 반영 실패:', byErr.message)
  }

  if (name) {
    try {
      await linkEnrollmentsOnSignup(user.id, name, upserted.actor_id ?? undefined)
    } catch (e) {
      console.error('[ensureProfileRow] enrollment link error:', e instanceof Error ? e.message : String(e))
    }
  }

  return upserted
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
  // 🔒 보안(2026-06-13): actorId(이름+전화 검증된 강한 매칭)가 없으면 수강기록 연결 금지.
  //    이름만으로 운영자가 미리 심어둔 타인 enrollments(결제금액·수강이력)를 탈취·변조하는 IDOR 방지.
  //    전화 미등록 배우라도 matchActorOnSignup이 이름단독으로 actorId를 부여하면 그 경로로 정상 연결됨.
  if (!actorId) return 0

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
