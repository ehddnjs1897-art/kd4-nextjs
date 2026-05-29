import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `posts/${user.id}_${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabaseAdmin.storage
    .from('casting')
    .upload(fileName, bytes, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: '업로드 실패: ' + error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('casting').getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl })
}
