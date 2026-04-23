import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_PATH = join(process.cwd(), 'data', 'insights.json')

function readAll() {
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')) } catch { return [] }
}
function writeAll(data: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// PATCH /api/insights/[id]  — 즐겨찾기 토글 또는 메모 수정
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  const all = readAll()
  const idx = all.findIndex((i: { id: string }) => i.id === id)
  if (idx === -1) return NextResponse.json({ error: '없는 항목' }, { status: 404 })

  if (typeof body.is_favorite === 'boolean') all[idx].is_favorite = body.is_favorite
  if (typeof body.memo === 'string') all[idx].memo = body.memo
  if (typeof body.category === 'string') all[idx].category = body.category

  writeAll(all)
  return NextResponse.json(all[idx])
}

// DELETE /api/insights/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const all = readAll()
  const filtered = all.filter((i: { id: string }) => i.id !== id)
  if (filtered.length === all.length) return NextResponse.json({ error: '없는 항목' }, { status: 404 })

  writeAll(filtered)
  return NextResponse.json({ ok: true })
}
