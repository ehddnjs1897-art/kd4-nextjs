import { SolapiMessageService } from 'solapi'

const FROM_NUMBER = process.env.SOLAPI_FROM_NUMBER ?? ''

function getService() {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!apiKey || !apiSecret) return null
  return new SolapiMessageService(apiKey, apiSecret)
}

/** 상담 접수 확인 SMS — 신청자에게 발송 */
export async function sendConsultationConfirm(phone: string, name: string) {
  const service = getService()
  if (!service || !FROM_NUMBER) {
    console.warn('[sms] SOLAPI 환경변수 미설정 — SMS 생략')
    return
  }

  const text = `[KD4 액팅 스튜디오]\n${name}님, 상담 신청이 접수되었습니다.\n24시간 이내 카카오톡으로 연락드릴게요. 감사합니다 🎬`

  try {
    await service.sendOne({
      to: phone.replace(/-/g, ''),
      from: FROM_NUMBER,
      text,
    })
  } catch (err) {
    console.error('[sms] 발송 실패:', err)
  }
}

/** 신규 상담 신청 — 관리자(대표)에게 알림 SMS */
export async function sendAdminAlert(name: string, phone: string, inquiryType?: string, className?: string) {
  const service = getService()
  const adminPhone = process.env.ADMIN_PHONE_NUMBER
  if (!service || !FROM_NUMBER || !adminPhone) {
    console.warn('[sms] ADMIN_PHONE_NUMBER 또는 SOLAPI 미설정 — 관리자 SMS 생략')
    return
  }

  const parts = [`[KD4 신규 상담 신청]\n이름: ${name}\n연락처: ${phone}`]
  if (inquiryType) parts.push(`유형: ${inquiryType}`)
  if (className) parts.push(`클래스: ${className}`)

  try {
    await service.sendOne({
      to: adminPhone,
      from: FROM_NUMBER,
      text: parts.join('\n'),
    })
  } catch (err) {
    console.error('[sms] 관리자 알림 발송 실패:', err)
  }
}
