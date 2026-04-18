import { NextRequest, NextResponse } from 'next/server'
import { sendConsultationConfirm, sendAdminAlert } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const record = body.record ?? body

    const { name, phone, inquiry_type, class_name } = record

    // Make.com 웹훅 (구글시트 연동 등 기존 자동화)
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
    }

    // Solapi SMS — 신청자 확인 + 관리자 알림 (병렬)
    if (name && phone) {
      await Promise.all([
        sendConsultationConfirm(phone, name),
        sendAdminAlert(name, phone, inquiry_type, class_name),
      ])
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
