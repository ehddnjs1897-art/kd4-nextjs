import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sendSMS } from '@/lib/sms'

function sha256(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  // 한국 번호: 010xxxx → 82010xxxx (국가코드 추가, 앞 0 제거)
  if (digits.startsWith('0')) return '82' + digits.slice(1)
  return digits
}

async function sendMetaCAPI(record: { name?: string; phone?: string; email?: string }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return

  const userData: Record<string, string[]> = {}
  if (record.phone) userData.ph = [sha256(normalizePhone(record.phone))]
  if (record.email) userData.em = [sha256(record.email)]
  if (record.name) userData.fn = [sha256(record.name)]

  await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: 'https://kd4.club/join',
        action_source: 'website',
        user_data: userData,
      }],
      access_token: token,
    }),
  }).catch(console.error)
}

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

    if (data?.record) {
      sendMetaCAPI(data.record).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
