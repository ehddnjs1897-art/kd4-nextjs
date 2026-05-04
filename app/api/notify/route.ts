import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/sms'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const record = data?.record ?? data

    // 1. Supabase에 무조건 먼저 기록 — webhook·SMS 실패와 무관하게 데이터 보존
    let savedId: string | null = null
    try {
      const { data: inserted, error } = await getSupabaseAdmin()
        .from('consultations')
        .insert({
          name: record?.name ?? null,
          phone: record?.phone ?? null,
          email: record?.email ?? null,
          class_name: record?.class_name ?? null,
          source: record?.source ?? null,
          inquiry_type: record?.inquiry_type ?? null,
          motivation: record?.motivation ?? null,
          status: record?.status ?? '대기',
          raw_payload: record,
        })
        .select('id')
        .single()

      if (error) throw error
      savedId = inserted?.id ?? null
    } catch (dbError) {
      console.error('[notify] Supabase insert 실패:', dbError, record)
    }

    // 2. Make webhook 발송 (실패해도 데이터는 이미 Supabase에 보존됨)
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch((err) => console.error('[notify] Make webhook 실패:', err))
    }

    // 3. 관리자 SMS 발송 (실패해도 데이터는 이미 Supabase에 보존됨)
    const adminPhone = process.env.ADMIN_PHONE_NUMBER
    if (adminPhone && record) {
      const { name, phone, class_name } = record
      const msg = `[KD4 신규상담] ${name} / ${phone}${class_name ? ` / ${class_name}` : ''}`
      sendSMS(adminPhone, msg).catch((err) =>
        console.error('[notify] 관리자 SMS 실패:', err)
      )
    }

    return NextResponse.json({ ok: true, id: savedId })
  } catch (err) {
    console.error('[notify] route 처리 실패:', err)
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
