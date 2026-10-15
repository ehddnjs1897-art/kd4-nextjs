/**
 * 독백 상세 «이 독백, 이렇게 연습하세요» 3단계 (2026-10-16 대표 «1만 적용해볼까» — 독백페이지 개선안 1번).
 * - 대본을 «읽기»에서 «연습하기»로 넘기는 자리(StageAgent 연기 팁 탭 구조 차용). 상담 안내는 기존 그대로 둔다.
 * - 1,131편 전부 배역·감정선 칸으로 자동 생성 → 서버 렌더라 페이지마다 고유한 글이 검색에 잡힌다.
 * - 문구는 KD4 연기 언어(상대·목표·행동)만. «감정을 만든다/끌어올린다/표현한다» 류 금지어 쓰지 말 것.
 */

/** 마지막 글자 받침 유무 — 한글이 아니면 영문 읽기(엘·엠·엔·알)로 판단, 그 외는 받침 없음 */
function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1)
  if (!last) return false
  const code = last.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0
  return /[lmnrLMNR]/.test(last)
}

/** 이/가 */
function subj(word: string): string {
  return `${word}${hasBatchim(word) ? '이' : '가'}`
}

/** (으)로 — 받침 없거나 ㄹ받침이면 «로» */
function toward(word: string): string {
  const last = word.trim().slice(-1)
  const code = last.charCodeAt(0)
  const isHangul = code >= 0xac00 && code <= 0xd7a3
  const jong = isHangul ? (code - 0xac00) % 28 : 0
  return jong === 0 || jong === 8 ? '로' : '으로'
}

export default function PracticeSteps({ role, emotion }: { role: string; emotion: string }) {
  const name = role.trim()
  const flow = (emotion ?? '').split('→').map((s) => s.trim()).filter(Boolean)
  const turns = flow.length - 1

  const steps: { title: string; body: string }[] = [
    {
      title: '누구에게 말하나',
      body: `${subj(name)} 이 말을 건네는 상대 한 명을 정하세요. 혼잣말이어도 듣는 사람을 정합니다. 허공이 아니라 눈앞의 한 사람에게 말합니다.`,
    },
    {
      title: '무엇을 얻어내려 하나',
      body: `${subj(name)} 상대에게서 얻어내려는 것을 한 문장으로 적으세요. «상대가 ○○하게 만들고 싶다»처럼, 상대가 바뀌어야 끝나는 목표로 잡습니다.`,
    },
    turns === 1
      ? {
          title: '어디서 바뀌나',
          body: `«${flow[0]}»에서 «${flow[1]}»${toward(flow[1])} 넘어가는 문장을 찾아 표시하세요. 그 문장에서 상대를 대하는 방법이 바뀝니다.`,
        }
      : turns > 1
      ? {
          title: '어디서 바뀌나',
          body: `감정선 «${flow.join(' → ')}». 다음 단계로 넘어가는 문장 ${turns}곳에 표시하세요. 그 문장마다 상대를 대하는 방법이 바뀝니다.`,
        }
      : {
          title: '어디서 바뀌나',
          body: `상대가 꿈쩍하지 않을 때마다 방법을 바꿉니다. 감정선 «${flow[0] ?? emotion}» 안에서 말하는 방법이 바뀌는 문장을 찾아 표시하세요.`,
        },
  ]

  return (
    <section
      aria-label="이 독백 연습 방법"
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 'clamp(20px, 4vw, 28px)',
        marginBottom: 40,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--black)',
          margin: '0 0 14px',
          wordBreak: 'keep-all',
        }}
      >
        이 독백, 이렇게 연습하세요
      </h2>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {steps.map((s, i) => (
          <li key={s.title} style={{ marginTop: i === 0 ? 0 : 14 }}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--navy)',
                margin: '0 0 4px',
              }}
            >
              {'①②③'[i]} {s.title}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                lineHeight: 1.75,
                color: 'var(--gray)',
                margin: 0,
                wordBreak: 'keep-all',
              }}
            >
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
