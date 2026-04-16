import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 인증 확인 — 로그인한 사용자만 알림 전송 가능
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const webhookUrl = process.env.MAKE_WEBHOOK_URL // NEXT_PUBLIC_ 접두사 제거
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: user.id }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
