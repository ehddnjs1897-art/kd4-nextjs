import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_KEY // NEXT_PUBLIC_ 접두사 제거 — 서버 전용
  if (!apiKey) {
    return NextResponse.json({ error: 'AI 기능이 설정되지 않았습니다.' }, { status: 500 })
  }

  try {
    const { scriptText, characterName } = await request.json()

    if (!scriptText?.trim() || !characterName?.trim()) {
      return NextResponse.json({ error: '대본과 캐릭터 이름을 입력해주세요.' }, { status: 400 })
    }

    const prompt = `
당신은 전문 연기 코치입니다. 아래 대본을 "${characterName}" 캐릭터의 관점에서 5가지 연기 메소드로 분석해주세요.

대본:
${scriptText}

다음 JSON 형식으로 응답하세요:
{
  "utaHagen": {
    "title": "Uta Hagen 분석",
    "items": [
      { "label": "Who am I?", "content": "..." },
      { "label": "What are the circumstances?", "content": "..." },
      { "label": "What are my relationships?", "content": "..." },
      { "label": "What do I want?", "content": "..." },
      { "label": "What is in my way?", "content": "..." },
      { "label": "What do I do?", "content": "..." }
    ]
  },
  "ivanaChubbuck": {
    "title": "Ivana Chubbuck 분석",
    "items": [
      { "label": "Overriding goal", "content": "..." },
      { "label": "Scene objective", "content": "..." },
      { "label": "Obstacles", "content": "..." },
      { "label": "Substitution", "content": "..." },
      { "label": "Actions/tools", "content": "..." }
    ]
  },
  "meisner": {
    "title": "Meisner 테크닉 분석",
    "items": [
      { "label": "주의의 초점 (Living truthfully)", "content": "..." },
      { "label": "감정적 준비", "content": "..." },
      { "label": "상대배우와의 반응", "content": "..." },
      { "label": "충동과 본능", "content": "..." }
    ]
  },
  "lineByLine": {
    "title": "대사별 노트",
    "lines": [
      { "line": "대사 텍스트", "note": "..." }
    ]
  },
  "onSetSummary": {
    "title": "현장 요약시트",
    "content": "..."
  }
}
`

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const msg =
        (errData as { error?: { message?: string } })?.error?.message ||
        `Gemini API 오류 (${res.status})`
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
