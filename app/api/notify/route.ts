import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const record = body.record ?? body

    // Make.com 웹훅이 Google Sheets + SMS + Telegram Fallback 모두 처리
    // notify에서 직접 SMS 발송하면 Make와 이중 발송됨 — 제거
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
          signal: controller.signal,
        })
      } catch {
        // 웹훅 타임아웃/실패는 무시 — Supabase에 이미 저장됨
      } finally {
        clearTimeout(timeoutId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
