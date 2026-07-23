/**
 * GET /api/actors
 *
 * 배우 목록 조회 (is_public=true 기준)
 *
 * Query Parameters:
 *   gender    — 남 | 여  (선택)
 *   ageGroup  — 10대 | 20대 | 30대 | 40대 | 50대 | 60대 이상  (선택, '50대'는 레거시 '50대 이상' 포함)
 *   page      — 페이지 번호 (기본값: 1)
 *   limit     — 페이지당 결과 수 (기본값: 20, 최대: 100)
 *
 * 보안: 비로그인/비특권 시 phone, email 컬럼 제외 (API 레벨 처리, RLS 미적용 기간 대응)
 * 공개: 비로그인 호출 허용 — 공개 배우(is_public)만, PII 제외 (2026-07-23 대표 지시)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Actor, ActorPublic } from '@/lib/types'

// GET 엔드포인트 IP 기반 레이트 리밋 (60 req/min — DoS 방어)
const actorsGetRateMap = new Map<string, { count: number; resetAt: number }>()
const ACTORS_GET_RATE_LIMIT = 60
const ACTORS_GET_RATE_WINDOW_MS = 60_000

export async function GET(request: NextRequest) {
  try {
    // IP 레이트 리밋: 1분 60회 초과 차단
    // x-real-ip: Vercel이 직접 설정 — 클라이언트 위조 불가. x-forwarded-for는 위조 가능하므로 사용 안 함
    const ipActor = request.headers.get('x-real-ip') ?? null
    if (!ipActor && process.env.VERCEL === '1') {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
    if (ipActor) {
      const nowA = Date.now()
      const bucketA = actorsGetRateMap.get(ipActor)
      if (bucketA && nowA < bucketA.resetAt) {
        if (bucketA.count >= ACTORS_GET_RATE_LIMIT) {
          return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
        }
        bucketA.count++
      } else {
        actorsGetRateMap.set(ipActor, { count: 1, resetAt: nowA + ACTORS_GET_RATE_WINDOW_MS })
        if (actorsGetRateMap.size > 2000) {
          for (const [k, v] of actorsGetRateMap) {
            if (nowA > v.resetAt) actorsGetRateMap.delete(k)
          }
        }
      }
    }

    const { searchParams } = new URL(request.url)

    // 허용 목록 — 예상치 않은 값은 무시 (불필요한 DB 쿼리 방지)
    const ALLOWED_GENDERS = new Set(['남', '여'])
    // '50대 이상'(공백 포함)이 실제 DB 저장값 — 과거 '50대이상'(공백 없음)은 매칭 0이던 버그. 동시 교정.
    const ALLOWED_AGE_GROUPS = new Set(['10대', '20대', '30대', '40대', '50대', '60대 이상', '50대 이상'])
    const rawGender = searchParams.get('gender')
    const rawAgeGroup = searchParams.get('ageGroup')
    const gender = rawGender && ALLOWED_GENDERS.has(rawGender) ? rawGender : null
    const ageGroup = rawAgeGroup && ALLOWED_AGE_GROUPS.has(rawAgeGroup) ? rawAgeGroup : null
    // parseInt → NaN 방어: Math.max/min(NaN) = NaN → .range(NaN,NaN) → DB 500 방지
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
    const page = Math.min(10_000, Math.max(1, Number.isFinite(rawPage) ? rawPage : 1))
    const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20))
    const offset = (page - 1) * limit

    // 2026-07-23 대표 지시: 배우 DB 전체 공개 — 비로그인도 공개 배우 목록 조회 가능 (401/403 게이트 제거).
    // 연락처(phone/email)는 여전히 디렉터/관리자만, 비공개 배우 포함 조회는 admin만.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    let canSeeContact = false
    let isAdmin = false
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).maybeSingle()
      canSeeContact = ['director', 'admin'].includes(profile?.role ?? '')
      isAdmin = profile?.role === 'admin'
    }

    // admin은 ?include_non_public=true 로 비공개 배우도 조회 가능 (검토 대기 중 배우 관리용)
    const includeNonPublic = isAdmin && searchParams.get('include_non_public') === 'true'

    // 접촉 권한 없는 경우 DB에서 PII(phone/email)를 애초에 조회하지 않음 (defence-in-depth)
    // 타입 단언은 아래 as unknown as Actor 캐스트로 처리
    // Internal operational fields (drive IDs, storage paths, source provenance) omitted — not needed by public consumers
    // Aligned with SAFE_ACTOR_DETAIL in /api/actors/[id]/route.ts
    const SAFE_COLS = 'id,name,name_en,gender,age_group,height,weight,skills,is_public,profile_photo,instagram,casting_tags,casting_summary,created_at,updated_at'
    // Internal path fields (drive IDs, R2 keys, storage paths, source) excluded — consistent with SAFE_ACTOR_DETAIL in /api/actors/[id]
    const PRIV_LIST_COLS = 'id,name,name_en,gender,age_group,height,weight,skills,is_public,profile_photo,instagram,casting_tags,casting_summary,phone,email,created_at,updated_at'
    let query = supabaseAdmin
      .from('actors')
      .select(canSeeContact ? PRIV_LIST_COLS : SAFE_COLS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (!includeNonPublic) query = query.eq('is_public', true)

    if (gender) {
      query = query.eq('gender', gender)
    }
    if (ageGroup) {
      // '50대' 버튼은 레거시 '50대 이상'(기존 데이터)도 함께 — UI 필터와 동일 규칙
      query = ageGroup === '50대'
        ? query.in('age_group', ['50대', '50대 이상'])
        : query.eq('age_group', ageGroup)
    }

    const { data: actors, error, count } = await query

    if (error) {
      console.error('[GET /api/actors] Supabase 오류:', error.message)
      return NextResponse.json({ error: '배우 목록 조회에 실패했습니다.' }, { status: 500 })
    }

    // director/admin만 phone/email 포함, 나머지는 제거
    const result: ActorPublic[] = (actors ?? []).map((actor) => {
      const typedActor = actor as unknown as Actor
      if (canSeeContact) {
        return typedActor
      }
      const { phone: _phone, email: _email, ...safe } = typedActor
      return safe
    })

    return NextResponse.json({
      actors: result,
      total: count ?? 0,
      page,
      limit,
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[GET /api/actors] 예상치 못한 오류:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
