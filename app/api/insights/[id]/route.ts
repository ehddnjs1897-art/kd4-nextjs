import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_PATH = join(process.cwd(), 'data', 'insights.json')

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

function readAll(): Record<string, unknown>[] {
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')) } catch { return [] }
}
function writeAll(data: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
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

  const all = readAll()
  const idx = all.findIndex(i => i.id === id)
  if (idx === -1) return withCors(NextResponse.json({ error: '없는 항목' }, { status: 404 }))

  if (typeof body.is_favorite === 'boolean') all[idx].is_favorite = body.is_favorite
  if (typeof body.memo === 'string') all[idx].memo = body.memo
  if (typeof body.category === 'string') all[idx].category = body.category

  writeAll(all)
  return withCors(NextResponse.json(all[idx]))
}

// DELETE /api/insights/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const all = readAll()
  const filtered = all.filter(i => i.id !== id)
  if (filtered.length === all.length) {
    return withCors(NextResponse.json({ error: '없는 항목' }, { status: 404 }))
  }

  writeAll(filtered)
  return withCors(NextResponse.json({ ok: true }))
}
