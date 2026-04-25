import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import type { InsightSourceType, InsightCategory } from '@/lib/types'

const BUCKET = 'insights'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const memo = (formData.get('memo') as string | null) ?? ''
    const title = (formData.get('title') as string | null) ?? ''

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return NextResponse.json({ error: 'jpg/png/gif/webp만 지원합니다.' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '10MB 이하 파일만 가능합니다.' }, { status: 400 })

    const filename = `${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (uploadError) return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 })

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)

    const newItem = {
      id: randomUUID(),
      url: publicUrl,
      title: title || file.name.replace(/\.[^.]+$/, ''),
      description: memo || null,
      image_url: publicUrl,
      memo: memo || null,
      category: '디자인' as InsightCategory,
      tags: ['이미지', '레퍼런스'] as string[],
      source_type: 'image' as InsightSourceType,
      is_favorite: false,
      created_at: new Date().toISOString(),
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('insights')
      .insert(newItem)
      .select()
      .single()

    if (dbError) {
      await supabaseAdmin.storage.from(BUCKET).remove([filename])
      return NextResponse.json({ error: `DB 저장 실패: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류'
    return NextResponse.json({ error: `업로드 실패: ${msg}` }, { status: 500 })
  }
}
