import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인 필요', status: 401 }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: '권한 없음', status: 403 }
  return { userId: user.id }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get('instructor_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('settlements')
    .select('*, profiles!settlements_instructor_id_fkey(name), classes(name_ko)')
    .order('period_start', { ascending: false })

  if (instructorId) query = query.eq('instructor_id', instructorId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const { instructor_id, class_id, period_start, period_end } = body

  if (!instructor_id || !period_start || !period_end) {
    return NextResponse.json({ error: 'instructor_id, period_start, period_end 필수' }, { status: 400 })
  }

  // compute_settlement DB 함수 호출
  const { data, error } = await supabaseAdmin.rpc('compute_settlement', {
    p_instructor_id: instructor_id,
    p_class_id: class_id ?? null,
    p_period_start: period_start,
    p_period_end: period_end,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settlement_id: data }, { status: 201 })
}
