/**
 * 배우 캐스팅 태그 자동 분류 — Gemini 2.0 Flash
 *
 * 입력: 배우의 성별·연령대·필모그래피·스킬·자기소개
 * 출력: { tags: string[], summary: string }
 *
 * tags — 캐스팅 디렉터가 검색에 쓰는 이미지 타입 키워드
 * summary — 한 줄 캐스팅 추천 요약
 *
 * 환경변수: GEMINI_KEY (서버 전용)
 */

// GEMINI_KEY는 서버 전용. NEXT_PUBLIC_* 접두사 사용 금지 — 브라우저 번들 노출 위험.
const GEMINI_KEY = process.env.GEMINI_KEY

/** 허용 태그 화이트리스트 — 캐스팅 디렉터가 흔히 쓰는 카테고리 */
export const CASTING_TAG_OPTIONS = [
  // 직업/배경
  '회사원', '학생', '주부', '의사', '변호사', '경찰',
  // 캐릭터 톤
  '형사', '악역', '코믹', '진지', '카리스마', '순수',
  // 가족 역할
  '엄마', '아빠', '딸', '아들',
  // 연기 스타일
  '생활연기', '감정연기', '액션', '로맨스',
] as const

export interface ActorClassifyInput {
  name: string
  gender: '남' | '여' | null
  age_group: string | null
  height: number | null
  skills: string[] | null
  /** 필모그래피 row 배열 */
  filmography: { title: string; role?: string | null; year?: number | null; production?: string | null }[]
}

export interface ActorClassifyResult {
  tags: string[]
  summary: string
}

/**
 * Gemini 호출 — 배우 데이터 → 캐스팅 태그 + 요약
 *
 * 실패 시 빈 결과 반환 (silent fallback). 호출자는 last_classified_at 업데이트
 * 시점만 기록.
 */
export async function classifyActor(input: ActorClassifyInput): Promise<ActorClassifyResult> {
  if (!GEMINI_KEY) {
    console.warn('[actor-tags] GEMINI_KEY 미설정 — 분류 스킵')
    return { tags: [], summary: '' }
  }

  const filmoStr = input.filmography
    .slice(0, 15)
    .map((f) => `${f.title}${f.role ? ` (${f.role})` : ''}${f.year ? ` ${f.year}` : ''}`)
    .join('; ') || '미상'

  const skillsStr = input.skills?.length ? input.skills.join(', ') : '미상'

  const prompt = `당신은 캐스팅 디렉터입니다. 아래 배우의 정보를 보고 캐스팅 매칭에 사용할 태그와 한 줄 요약을 생성하세요.

배우 정보:
- 이름: ${input.name}
- 성별: ${input.gender ?? '미상'}
- 연령대: ${input.age_group ?? '미상'}
- 키: ${input.height ? `${input.height}cm` : '미상'}
- 스킬: ${skillsStr}
- 필모그래피: ${filmoStr}

작업:
1. 아래 화이트리스트에서 이 배우에게 가장 적합한 태그를 2~4개 선택하세요.
   화이트리스트: ${CASTING_TAG_OPTIONS.join(', ')}
2. 한 줄 캐스팅 요약을 30자 이내로 작성하세요.
   예시: "생활감 있는 30대 회사원·형사 역할에 적합"

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만:
{"tags": ["태그1", "태그2"], "summary": "한 줄 요약"}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            // 한글 토큰 ≈ 2~3 토큰/자, 화이트리스트+요약 안전 여유 (256 → 512 상향)
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!res.ok) {
      console.warn(`[actor-tags] Gemini ${res.status} — ${input.name}`)
      return { tags: [], summary: '' }
    }

    const data = await res.json()
    const candidate = data?.candidates?.[0]
    const finishReason = candidate?.finishReason
    if (finishReason === 'MAX_TOKENS') {
      console.warn(`[actor-tags] ⚠️ MAX_TOKENS — ${input.name} 응답 잘림 (불완전 JSON 가능)`)
    }
    const text = candidate?.content?.parts?.[0]?.text ?? ''

    // JSON 추출 (responseMimeType=json 이지만 안전망)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { tags: [], summary: '' }

    const parsed = JSON.parse(jsonMatch[0]) as { tags?: unknown; summary?: unknown }

    // 검증·정제
    const validTags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === 'string')
          .filter((t) => (CASTING_TAG_OPTIONS as readonly string[]).includes(t))
          .slice(0, 4)
      : []

    const summary =
      typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 60) : ''

    return { tags: validTags, summary }
  } catch (err) {
    console.warn(`[actor-tags] 분류 실패 — ${input.name}:`, err instanceof Error ? err.message : err)
    return { tags: [], summary: '' }
  }
}
