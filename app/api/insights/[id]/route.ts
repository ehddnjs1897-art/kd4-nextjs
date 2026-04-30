import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function withCors(res: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

// PATCH /api/insights/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return withCors(NextResponse.json({ error: '잘못된 요청' }, { status: 400 }))
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_favorite === 'boolean') updates.is_favorite = body.is_favorite
  if (typeof body.memo === 'string') updates.memo = body.memo
  if (typeof body.category === 'string') updates.category = body.category

  if (Object.keys(updates).length === 0) {
    return withCors(NextResponse.json({ error: '변경할 필드가 없습니다.' }, { status: 400 }))
  }

  const { data, error } = await supabaseAdmin
    .from('insights')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return withCors(NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 }))
  return withCors(NextResponse.json(data))
}

// DELETE /api/insights/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabaseAdmin.from('insights').delete().eq('id', id)
  if (error) return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
  return withCors(NextResponse.json({ ok: true }))
}
