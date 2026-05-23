/**
 * GET /api/actors
 *
 * 배우 목록 조회 (is_public=true 기준)
 *
 * Query Parameters:
 *   gender    — 남 | 여  (선택)
 *   ageGroup  — 10대 | 20대 | 30대 | 40대 | 50대 이상  (선택)
 *   page      — 페이지 번호 (기본값: 1)
 *   limit     — 페이지당 결과 수 (기본값: 20, 최대: 100)
 *
 * 보안: 비로그인 시 phone, email 컬럼 제외 (API 레벨 처리, RLS 미적용 기간 대응)
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
    const ipActor = request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? null
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
    const ALLOWED_AGE_GROUPS = new Set(['10대', '20대', '30대', '40대', '50대이상'])
    const rawGender = searchParams.get('gender')
    const rawAgeGroup = searchParams.get('ageGroup')
    const gender = rawGender && ALLOWED_GENDERS.has(rawGender) ? rawGender : null
    const ageGroup = rawAgeGroup && ALLOWED_AGE_GROUPS.has(rawAgeGroup) ? rawAgeGroup : null
    // parseInt → NaN 방어: Math.max/min(NaN) = NaN → .range(NaN,NaN) → DB 500 방지
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
    const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1)
    const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20))
    const offset = (page - 1) * limit

    // 로그인 여부 + 역할 확인 (director/admin만 연락처 열람 가능)
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

    // 항상 '*'로 조회 후 JS 레벨에서 민감 컬럼 제거
    // (동적 columns 문자열은 Supabase SDK 타입 추론 오류 유발)
    let query = supabaseAdmin
      .from('actors')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (!includeNonPublic) query = query.eq('is_public', true)

    if (gender) {
      query = query.eq('gender', gender)
    }
    if (ageGroup) {
      query = query.eq('age_group', ageGroup)
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
