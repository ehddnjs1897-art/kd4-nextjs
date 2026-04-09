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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const gender = searchParams.get('gender')
    const ageGroup = searchParams.get('ageGroup')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const offset = (page - 1) * limit

    // 로그인 여부 확인
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isAuthenticated = !!user

    // 항상 '*'로 조회 후 JS 레벨에서 민감 컬럼 제거
    // (동적 columns 문자열은 Supabase SDK 타입 추론 오류 유발)
    let query = supabaseAdmin
      .from('actors')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

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

    // 비로그인 시 phone, email 제거
    const result: ActorPublic[] = (actors ?? []).map((actor) => {
      const typedActor = actor as unknown as Actor
      if (isAuthenticated) {
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
    })
  } catch (err) {
    console.error('[GET /api/actors] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
