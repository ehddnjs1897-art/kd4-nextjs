import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET /api/game/scores?period=weekly&limit=10
export async function GET(request: NextRequest) {
  try {
    // 리더보드는 회원 전용
    const supabaseClient = await createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly'
    const rawLimit = parseInt(searchParams.get('limit') ?? '10', 10)
    const limit = Math.min(50, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 10))

    let query = supabaseAdmin
      .from('game_scores')
      .select('id, score, stage, items_collected, duration_ms, created_at, profiles(name)')
      .order('score', { ascending: false })
      .limit(limit)

    if (period === 'weekly') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/game/scores] error:', error)
      return NextResponse.json({ error: '리더보드 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/game/scores]', err)
    return NextResponse.json({ error: '리더보드 조회 실패' }, { status: 500 })
  }
}

// POST /api/game/scores
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { score?: number; duration_ms?: number; stage?: number; items_collected?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const { score, duration_ms, stage = 1, items_collected = 0 } = body

  // Infinity / NaN 차단 — typeof 'number' 통과하지만 DB insert 시 500 유발
  if (typeof score !== 'number' || !Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 99999) {
    return NextResponse.json({ error: '유효하지 않은 점수입니다.' }, { status: 400 })
  }
  if (typeof duration_ms !== 'number' || !Number.isFinite(duration_ms) || duration_ms <= 0 || duration_ms > 3_600_000) {
    return NextResponse.json({ error: '유효하지 않은 게임 시간입니다.' }, { status: 400 })
  }

  // Basic anti-cheat: max ~50 points per second
  const maxPossibleScore = (duration_ms / 1000) * 50
  if (score > maxPossibleScore) {
    return NextResponse.json({ error: '점수가 비정상적으로 높습니다.' }, { status: 400 })
  }

  // stage / items_collected 검증
  if (!Number.isInteger(stage) || stage < 1 || stage > 100) {
    return NextResponse.json({ error: '유효하지 않은 스테이지입니다.' }, { status: 400 })
  }
  if (!Number.isInteger(items_collected) || items_collected < 0 || items_collected > 9999) {
    return NextResponse.json({ error: '유효하지 않은 아이템 수입니다.' }, { status: 400 })
  }

  // 시간당 점수 제출 횟수 제한 (리더보드 오염 방지)
  const MAX_SCORES_PER_HOUR = 20
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: recentScoreCount } = await supabaseAdmin
    .from('game_scores')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', hourAgo)
  if ((recentScoreCount ?? 0) >= MAX_SCORES_PER_HOUR) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const { data, error } = await supabaseAdmin
    .from('game_scores')
    .insert({
      user_id: user.id,
      score,
      duration_ms,
      stage,
      items_collected,
    })
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('[POST /api/game/scores] insert error:', error)
    return NextResponse.json({ error: '점수 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
