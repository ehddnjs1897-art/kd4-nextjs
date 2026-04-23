import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import type { InsightSourceType, InsightCategory } from '@/lib/types'

const DATA_PATH = join(process.cwd(), 'data', 'insights.json')
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'insights')

function readAll(): Record<string, unknown>[] {
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')) } catch { return [] }
}
function writeAll(data: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

export async function POST(request: NextRequest) {
  try {
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const memo = (formData.get('memo') as string | null) ?? ''
    const title = (formData.get('title') as string | null) ?? ''

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return NextResponse.json({ error: 'jpg/png/gif/webp만 지원합니다.' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '10MB 이하 파일만 가능합니다.' }, { status: 400 })

    const filename = `${randomUUID()}${ext}`
    writeFileSync(join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))

    const imageUrl = `/uploads/insights/${filename}`
    const newItem = {
      id: randomUUID(),
      url: imageUrl,
      title: title || file.name.replace(/\.[^.]+$/, ''),
      description: memo || null,
      image_url: imageUrl,
      memo: memo || null,
      category: '디자인' as InsightCategory,
      tags: ['이미지', '레퍼런스'] as string[],
      source_type: 'image' as InsightSourceType,
      is_favorite: false,
      created_at: new Date().toISOString(),
    }

    const all = readAll()
    all.push(newItem)
    writeAll(all)

    return NextResponse.json(newItem, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류'
    return NextResponse.json({ error: `업로드 실패: ${msg}` }, { status: 500 })
  }
}
