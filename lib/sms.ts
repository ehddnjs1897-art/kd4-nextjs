import { SolapiMessageService } from 'solapi'

const FROM_NUMBER = process.env.SOLAPI_FROM_NUMBER ?? ''

function getService(): SolapiMessageService | null {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!apiKey || !apiSecret) return null
  return new SolapiMessageService(apiKey, apiSecret)
}

export async function sendSMS(to: string, text: string): Promise<boolean> {
  const service = getService()
  if (!service || !FROM_NUMBER) return false

  try {
    await service.sendOne({ to, from: FROM_NUMBER, text })
    return true
  } catch (err) {
    console.error('[SMS] 발송 실패:', err)
    return false
  }
}
