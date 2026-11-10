import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { PRICE_CHANGE_AT } from '@/lib/classes'

export const dynamic = 'force-dynamic'

/**
 * 2027 수강료 전환(lib/classes.ts PRICE_CHANGE_AT) 직후 정적 페이지를 새 가격으로 다시 그리게 한다.
 * 가격 자체는 getter가 읽는 순간 시각으로 고르지만, 빌드 때 만들어 둔 정적 HTML은 누가 다시 그려야 바뀐다.
 * vercel.json crons가 12/31 15:00 UTC(= 1/1 00시 KST, 무료 요금제는 그 1시간 안)에 부른다.
 * 전환 시각 뒤 48시간 안에서만 동작하고, 그 밖의 호출은 아무것도 하지 않는다.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const at = new Date(PRICE_CHANGE_AT).getTime()
  const now = Date.now()
  if (now < at || now > at + 48 * 60 * 60 * 1000) {
    return NextResponse.json({ ok: true, revalidated: false })
  }
  revalidatePath('/', 'layout')
  revalidatePath('/llms.txt')
  return NextResponse.json({ ok: true, revalidated: true })
}
