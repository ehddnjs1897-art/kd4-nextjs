import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// PATCH /api/insights/[id]  — 즐겨찾기 토글 또는 메모 수정
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const allowed: Record<string, unknown> = {}
  if (typeof body.is_favorite === 'boolean') allowed.is_favorite = body.is_favorite
  if (typeof body.memo === 'string') allowed.memo = body.memo
  if (typeof body.category === 'string') allowed.category = body.category

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: '변경할 필드가 없습니다.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('insights')
    .update(allowed)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// DELETE /api/insights/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabaseAdmin.from('insights').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
