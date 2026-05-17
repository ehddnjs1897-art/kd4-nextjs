import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_ORIGINS = new Set([
  'https://kd4.club',
  'http://localhost:3000',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://kd4.club'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}

function withCors(res: NextResponse, origin: string | null) {
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const { data: profile, error: profileErr } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profileErr || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return { userId: user.id }
}

// PATCH /api/insights/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('origin')
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return withCors(auth, origin)

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return withCors(NextResponse.json({ error: '잘못된 요청' }, { status: 400 }), origin)
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_favorite === 'boolean') updates.is_favorite = body.is_favorite
  if (typeof body.memo === 'string') updates.memo = body.memo
  if (typeof body.category === 'string') updates.category = body.category

  const { data, error } = await supabaseAdmin
    .from('insights')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return withCors(NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 }), origin)

  return withCors(NextResponse.json(data), origin)
}

// DELETE /api/insights/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('origin')
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return withCors(auth, origin)

  const { id } = await params

  const { error } = await supabaseAdmin.from('insights').delete().eq('id', id)

  if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }), origin)

  return withCors(NextResponse.json({ ok: true }), origin)
}
