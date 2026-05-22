// 임시 진단: 운영(Vercel)의 R2 설정이 올바른지 확인. 확인 후 삭제 예정.
// 비밀값은 노출하지 않음 — 상태코드/에러코드만 반환.
import { NextResponse } from 'next/server'
import { getVideoSignedUrl, isR2Configured } from '@/lib/r2'

export const runtime = 'nodejs'

export async function GET() {
  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, reason: 'R2 env(계정/키) 미설정' })
  }
  // env 길이만 (값 노출 X)
  const lens = {
    account_id_len: (process.env.R2_ACCOUNT_ID || '').length,
    access_key_len: (process.env.R2_ACCESS_KEY_ID || '').length,
    secret_len: (process.env.R2_SECRET_ACCESS_KEY || '').length, // 정상=64
    bucket: process.env.R2_BUCKET_NAME || '(기본값)',
  }
  try {
    const key = 'migrated/profiles/30대/여/93년생 여 김서영 프로필.pdf'
    const url = await getVideoSignedUrl(key, 120)
    const res = await fetch(url, { headers: { Range: 'bytes=0-99' } })
    let r2error = ''
    if (!res.ok) r2error = (await res.text()).slice(0, 300)
    return NextResponse.json({ ok: res.ok, status: res.status, r2error, lens })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e).slice(0, 300), lens })
  }
}
