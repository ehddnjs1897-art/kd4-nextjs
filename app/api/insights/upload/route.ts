import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'

const DATA_PATH = join(process.cwd(), 'data', 'insights.json')
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'insights')

function readAll() {
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')) } catch { return [] }
}
function writeAll(data: unknown[]) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const memo = (formData.get('memo') as string) || ''
    const title = (formData.get('title') as string) || ''

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'jpg/png/gif/webp만 지원합니다.' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '10MB 이하 파일만 지원합니다.' }, { status: 400 })
    }

    const ext = extname(file.name) || '.jpg'
    const filename = `${randomUUID()}${ext}`
    const filePath = join(UPLOAD_DIR, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(filePath, buffer)

    const imageUrl = `/uploads/insights/${filename}`

    const newItem = {
      id: randomUUID(),
      url: imageUrl,
      title: title || file.name.replace(/\.[^.]+$/, ''),
      description: memo || null,
      image_url: imageUrl,
      memo: memo || null,
      category: '크리에이티브',
      tags: ['이미지', '레퍼런스'],
      source_type: 'image',
      is_favorite: false,
      created_at: new Date().toISOString(),
    }

    const all = readAll()
    all.push(newItem)
    writeAll(all)

    return NextResponse.json(newItem, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
