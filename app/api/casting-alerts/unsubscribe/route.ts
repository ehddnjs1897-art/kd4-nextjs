/**
 * GET /api/casting-alerts/unsubscribe?id={actor.id} — 오디션 정보 SMS 수신거부
 *
 * 인증 불요 — 문자 하단 링크를 클릭하면 바로 처리되는 원클릭 수신거부.
 * actors.casting_alert_optout 을 true로 세팅해 이후 자동발송 대상에서 영구 제외.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function htmlPage(message: string) {
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KD4 액팅 스튜디오</title>
<style>
  body{font-family:-apple-system,'Malgun Gothic',sans-serif;background:#F5F0E8;color:#1f2430;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;}
  .card{background:#fff;border-radius:16px;padding:40px 28px;max-width:360px;box-shadow:0 2px 12px rgba(0,0,0,0.06);}
  h1{font-size:18px;color:#15488A;margin:0 0 12px;}
  p{font-size:14px;color:#5b6472;line-height:1.6;margin:0;}
</style></head>
<body><div class="card"><h1>KD4 액팅 스튜디오</h1><p>${message}</p></div></body></html>`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')?.trim() ?? ''

  if (!UUID_RE.test(id)) {
    return new NextResponse(htmlPage('잘못된 링크입니다. 문자에 있던 링크를 다시 확인해주세요.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from('actors')
      .update({ casting_alert_optout: true })
      .eq('id', id)

    if (error) {
      console.error('[casting-alerts/unsubscribe] update 실패:', error.message)
      return new NextResponse(htmlPage('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return new NextResponse(
      htmlPage('오디션 정보 문자 수신이 해제되었습니다.<br>더 이상 발송되지 않습니다.'),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    console.error('[casting-alerts/unsubscribe] 예외:', err instanceof Error ? err.message : '(unknown)')
    return new NextResponse(htmlPage('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
