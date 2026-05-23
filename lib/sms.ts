import { SolapiMessageService } from 'solapi'

const FROM_NUMBER = process.env.SOLAPI_FROM_NUMBER ?? ''

function getService(): SolapiMessageService | null {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!apiKey || !apiSecret) return null
  return new SolapiMessageService(apiKey, apiSecret)
}

const SMS_TIMEOUT_MS = 10_000

export async function sendSMS(to: string, text: string): Promise<boolean> {
  const service = getService()
  if (!service || !FROM_NUMBER) return false

  const safeText = text.slice(0, 2000)

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SMS timeout')), SMS_TIMEOUT_MS)
    )
    await Promise.race([service.sendOne({ to, from: FROM_NUMBER, text: safeText }), timeout])
    return true
  } catch (err) {
    console.error('[SMS] 발송 실패:', err)
    return false
  }
}
