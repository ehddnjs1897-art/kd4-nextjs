import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import { compressImageBuffer } from '@/lib/compress-image'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

// MIME → 확장자 맵 (파일명 기반 확장자 사용 금지 — MIME 스푸핑 방지)
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

// 레이트 리밋: 사용자당 5분 내 10회 초과 차단
const postsUploadMap = new Map<string, number[]>()
const UPLOAD_WINDOW_MS = 5 * 60_000
const UPLOAD_MAX = 10

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  // content-length 선검사 — 본문 읽기 전 크기 확인
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_SIZE + 1024) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 413 })
  }

  // 레이트 리밋
  const now = Date.now()
  const times = (postsUploadMap.get(user.id) ?? []).filter(t => now - t < UPLOAD_WINDOW_MS)
  if (times.length >= UPLOAD_MAX) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  postsUploadMap.set(user.id, [...times, now])
  // 맵 정리 (메모리 누수 방지)
  if (postsUploadMap.size > 2000) {
    for (const [uid, ts] of postsUploadMap) {
      if (!ts.some(t => now - t < UPLOAD_WINDOW_MS)) postsUploadMap.delete(uid)
    }
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())

  // 매직 바이트 검증 — MIME 스푸핑 방지 (JPEG/PNG/GIF/WebP 시그니처)
  const sig = bytes.slice(0, 12)
  const isJpeg = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff
  const isPng  = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47
  const isGif  = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46
  const isWebp = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46
              && sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50
  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 })
  }

  // 자동 압축 (2026-07-23 대표 지시) — GIF는 애니메이션 보존 위해 제외, 실패 시 원본 유지
  const compressed = !isGif ? await compressImageBuffer(bytes) : null
  const outBytes = compressed ? compressed.buffer : bytes
  const outType = compressed ? compressed.contentType : file.type
  const outExt = compressed ? 'jpg' : ext

  const fileName = `posts/${user.id}_${randomUUID()}.${outExt}`

  const { error } = await supabaseAdmin.storage
    .from('casting')
    .upload(fileName, outBytes, { contentType: outType, upsert: false })

  if (error) return NextResponse.json({ error: '업로드 실패: ' + error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('casting').getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl })
}
