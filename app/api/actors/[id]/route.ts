/**
 * GET /api/actors/[id]
 *
 * 배우 단건 상세 조회
 * actor_photos, actor_videos, actor_filmography JOIN 포함
 *
 * 보안: 비로그인 시 phone, email 컬럼 제외 (API 레벨 처리, RLS 미적용 기간 대응)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Actor, ActorDetail } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: '배우 ID가 필요합니다.' }, { status: 400 })
    }

    // 로그인 여부 확인
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isAuthenticated = !!user

    // 항상 '*' 로 조회 후 JS 레벨에서 민감 컬럼 제거
    const { data: actor, error } = await supabaseAdmin
      .from('actors')
      .select('*, actor_photos(*), actor_videos(*), actor_filmography(*)')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // no rows returned
        return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
      }
      console.error('[GET /api/actors/[id]] Supabase 오류:', error.message)
      return NextResponse.json({ error: '배우 조회에 실패했습니다.' }, { status: 500 })
    }

    if (!actor) {
      return NextResponse.json({ error: '배우를 찾을 수 없습니다.' }, { status: 404 })
    }

    const typedActor = actor as unknown as ActorDetail

    // 비로그인 시 민감 컬럼 제거
    if (!isAuthenticated) {
      const { phone: _phone, email: _email, ...safe } = typedActor as Actor & ActorDetail
      return NextResponse.json({ actor: safe as ActorDetail })
    }

    return NextResponse.json({ actor: typedActor })
  } catch (err) {
    console.error('[GET /api/actors/[id]] 예상치 못한 오류:', err)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 })
  }
}
