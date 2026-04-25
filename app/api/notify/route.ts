import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl) {
      // Make 시나리오 필터가 루트 레벨 필드({{1.name}}, {{1.phone}})를 사용하므로 record 언래핑
      const payload = data?.record ?? data
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    const adminPhone = process.env.ADMIN_PHONE_NUMBER
    if (adminPhone && data?.record) {
      const { name, phone, class_name } = data.record
      const msg = `[KD4 신규상담] ${name} / ${phone}${class_name ? ` / ${class_name}` : ''}`
      sendSMS(adminPhone, msg).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
