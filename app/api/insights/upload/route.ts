import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import type { InsightSourceType, InsightCategory } from '@/lib/types'

const BUCKET = 'insights'

// 업로드 레이트 리밋: 5분 내 20회 초과 차단 (스토리지 쿼터 보호)
const insightsUploadMap = new Map<string, number[]>()
const INSIGHTS_UPLOAD_WINDOW_MS = 5 * 60_000
const INSIGHTS_UPLOAD_MAX = 20

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profileErr || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return { userId: user.id }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  // 레이트 리밋: 5분 내 20회 초과 차단
  const nowU = Date.now()
  const uploadTimes = (insightsUploadMap.get(auth.userId) ?? []).filter(t => nowU - t < INSIGHTS_UPLOAD_WINDOW_MS)
  if (uploadTimes.length >= INSIGHTS_UPLOAD_MAX) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  // content-length 선검사 — rate-limit 슬롯 소진 전 (과도한 요청으로 쿼터 낭비 방지)
  const clUpload = parseInt(request.headers.get('content-length') ?? '0', 10) || 0
  if (clUpload > 11 * 1024 * 1024) {
    return NextResponse.json({ error: '요청 크기가 너무 큽니다.' }, { status: 413 })
  }

  insightsUploadMap.set(auth.userId, [...uploadTimes, nowU])
  if (insightsUploadMap.size > 2000) {
    for (const [k, v] of insightsUploadMap) {
      if (v.every(t => nowU - t > INSIGHTS_UPLOAD_WINDOW_MS)) insightsUploadMap.delete(k)
    }
  }

  try {

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const memo = ((formData.get('memo') as string | null) ?? '').slice(0, 2000)
    const title = ((formData.get('title') as string | null) ?? '').slice(0, 500)

    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return NextResponse.json({ error: 'jpg/png/gif/webp만 지원합니다.' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '10MB 이하 파일만 가능합니다.' }, { status: 400 })

    const filename = `${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // 매직 바이트 검증 — MIME 스푸핑 방지 (upload/route.ts와 동일 패턴)
    const sig = buffer.slice(0, 12)
    const isJpeg = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff
    const isPng  = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47
    const isGif  = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46
    const isWebp = sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50
    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 })
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[insights/upload] Storage 업로드 실패:', uploadError.message)
      return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)

    const newItem = {
      id: randomUUID(),
      url: publicUrl,
      title: (title || file.name.replace(/\.[^.]+$/, '')).replace(/[\x00-\x1f]/g, '').slice(0, 500),
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
      .select('id, url, title, description, image_url, memo, category, tags, source_type, is_favorite, created_at')
      .maybeSingle()

    if (dbError) {
      console.error('[insights/upload] DB 저장 실패:', dbError.message)
      await supabaseAdmin.storage.from(BUCKET).remove([filename])
      return NextResponse.json({ error: 'DB 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    console.error('[insights/upload] 예상치 못한 오류:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: '업로드 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
