import { SolapiMessageService } from 'solapi'

const FROM_NUMBER = process.env.SOLAPI_FROM_NUMBER ?? ''

function getService() {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  if (!apiKey || !apiSecret) return null
  return new SolapiMessageService(apiKey, apiSecret)
}
