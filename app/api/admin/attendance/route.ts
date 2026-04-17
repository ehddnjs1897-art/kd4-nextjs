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
  const scheduleId = searchParams.get('schedule_id')
  const classId = searchParams.get('class_id')

  let query = supabaseAdmin
    .from('attendance')
    .select('*, enrollments(enrollee_name, enrollee_phone), class_schedules(starts_at, title)')
    .order('checked_at', { ascending: false })

  if (scheduleId) query = query.eq('schedule_id', scheduleId)
  if (classId) query = query.eq('class_id', classId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .upsert({ ...body, checked_by: user!.id, checked_at: new Date().toISOString() }, {
      onConflict: 'schedule_id,enrollment_id'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
