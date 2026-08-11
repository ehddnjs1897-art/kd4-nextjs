// 일회성 R2 영상 전수 검사 — 실행 직후 제거 예정 (2026-08-12)
import { NextResponse } from 'next/server'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get('t') !== 'def063d94fc7edacf2ed59f6d569cc19') {
    return new NextResponse('not found', { status: 404 })
  }
  const { data, error } = await supabaseAdmin
    .from('actor_videos').select('id, title, r2_key').not('r2_key', 'is', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID?.trim()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: (process.env.R2_ACCESS_KEY_ID ?? '').trim(),
      secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY ?? '').trim(),
    },
  })
  const bucket = (process.env.R2_BUCKET_NAME ?? '').trim()
  const missing: { title: string | null; key: string }[] = []
  let ok = 0
  const rows = data ?? []
  for (let i = 0; i < rows.length; i += 10) {
    await Promise.all(rows.slice(i, i + 10).map(async (v) => {
      try {
        const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: v.r2_key! }))
        if ((h.ContentLength ?? 0) > 0) ok++
        else missing.push({ title: v.title, key: v.r2_key! + ' (0바이트)' })
      } catch {
        missing.push({ title: v.title, key: v.r2_key! })
      }
    }))
  }
  return NextResponse.json({ total: rows.length, ok, missing })
}
