'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface AnalysisItem {
  label: string
  content: string
}

interface LineNote {
  line: string
  note: string
}

interface AnalysisResult {
  utaHagen: {
    title: string
    items: AnalysisItem[]
  }
  ivanaChubbuck: {
    title: string
    items: AnalysisItem[]
  }
  meisner: {
    title: string
    items: AnalysisItem[]
  }
  lineByLine: {
    title: string
    lines: LineNote[]
  }
  onSetSummary: {
    title: string
    content: string
  }
}

type TabKey = 'utaHagen' | 'ivanaChubbuck' | 'meisner' | 'lineByLine' | 'onSetSummary'

const TAB_LABELS: Record<TabKey, string> = {
  utaHagen: 'Uta Hagen',
  ivanaChubbuck: 'Ivana Chubbuck',
  meisner: 'Meisner',
  lineByLine: '대사별 노트',
  onSetSummary: '현장 요약',
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function AIToolsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [scriptText, setScriptText] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [rawText, setRawText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('utaHagen')

  // 비로그인 → 로그인 페이지
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/login?next=/ai-tools')
      else setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) return null

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY

  async function handleAnalyze() {
    if (!scriptText.trim()) {
      setError('대본을 입력해주세요.')
      return
    }
    if (!characterName.trim()) {
      setError('캐릭터 이름을 입력해주세요.')
      return
    }

    setError(null)
    setResult(null)
    setRawText(null)
    setLoading(true)

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

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

      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg =
          (errData as { error?: { message?: string } })?.error?.message ||
          `API 오류 (상태 코드: ${res.status})`
        throw new Error(msg)
      }

      const data = await res.json()
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

      try {
        const parsed: AnalysisResult = JSON.parse(text)
        setResult(parsed)
        setActiveTab('utaHagen')
      } catch {
        setRawText(text)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(`분석 중 오류가 발생했습니다: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setRawText(null)
    setError(null)
    setScriptText('')
    setCharacterName('')
  }

  // API KEY 미설정
  if (!apiKey) {
    return (
      <div style={s.page}>
        <div className="container">
          <div style={s.header}>
            <p style={s.eyebrow}>AI TOOLS</p>
            <h1 style={s.pageTitle}>AI 대본 분석</h1>
          </div>
          <div style={s.noKeyBox}>
            <div style={s.noKeyIcon}>⚠</div>
            <h2 style={s.noKeyTitle}>API 키가 설정되지 않았습니다</h2>
            <p style={s.noKeyDesc}>
              이 기능을 사용하려면 Gemini API 키를 환경변수에 설정해야 합니다.
            </p>
            <div style={s.codeBlock}>
              <code>NEXT_PUBLIC_GEMINI_KEY=your_gemini_api_key</code>
            </div>
            <p style={s.noKeySubDesc}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={s.link}
              >
                Google AI Studio
              </a>
              에서 무료로 발급받을 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div className="container">
        {/* 헤더 */}
        <div style={s.header}>
          <p style={s.eyebrow}>AI TOOLS</p>
          <h1 style={s.pageTitle}>AI 대본 분석</h1>
          <p style={s.pageDesc}>
            대본을 붙여넣으면 Uta Hagen, Ivana Chubbuck, Meisner 등 5가지 연기 메소드로 분석합니다.
          </p>
        </div>

        {/* 입력 섹션 */}
        {!result && !rawText && (
          <div style={s.inputSection}>
            <div style={s.card}>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="characterName">
                  캐릭터 이름
                </label>
                <input
                  id="characterName"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="분석할 캐릭터 이름 (예: 홍길동)"
                  style={s.input}
                  disabled={loading}
                />
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="scriptText">
                  대본
                </label>
                <textarea
                  id="scriptText"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="분석할 대본을 여기에 붙여넣으세요..."
                  style={s.textarea}
                  disabled={loading}
                />
              </div>

              {error && (
                <div style={s.errorBox}>
                  <span style={s.errorIcon}>!</span>
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={loading ? { ...s.btnPrimary, ...s.btnDisabled } : s.btnPrimary}
              >
                {loading ? '분석 중...' : '분석하기'}
              </button>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <p style={s.loadingText}>AI가 분석 중입니다...</p>
            <p style={s.loadingSubText}>최대 30초 정도 소요될 수 있습니다.</p>
          </div>
        )}

        {/* 결과 섹션 */}
        {(result || rawText) && !loading && (
          <div style={s.resultSection}>
            {/* 결과 헤더 */}
            <div style={s.resultHeader}>
              <div>
                <p style={s.resultEyebrow}>분석 완료</p>
                <h2 style={s.resultTitle}>
                  &ldquo;{characterName}&rdquo; 캐릭터 분석 결과
                </h2>
              </div>
              <button onClick={handleReset} style={s.btnReset}>
                분석 초기화
              </button>
            </div>

            {/* rawText 폴백 */}
            {rawText && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>분석 결과 (원문)</h3>
                <pre style={s.pre}>{rawText}</pre>
              </div>
            )}

            {/* 탭 + 내용 */}
            {result && (
              <>
                <div style={s.tabBar}>
                  {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      style={activeTab === key ? { ...s.tab, ...s.tabActive } : s.tab}
                    >
                      {TAB_LABELS[key]}
                    </button>
                  ))}
                </div>

                <div style={s.tabContent}>
                  {/* Uta Hagen */}
                  {activeTab === 'utaHagen' && (
                    <TabPanel title={result.utaHagen.title}>
                      {result.utaHagen.items.map((item, i) => (
                        <ItemCard key={i} label={item.label} content={item.content} />
                      ))}
                    </TabPanel>
                  )}

                  {/* Ivana Chubbuck */}
                  {activeTab === 'ivanaChubbuck' && (
                    <TabPanel title={result.ivanaChubbuck.title}>
                      {result.ivanaChubbuck.items.map((item, i) => (
                        <ItemCard key={i} label={item.label} content={item.content} />
                      ))}
                    </TabPanel>
                  )}

                  {/* Meisner */}
                  {activeTab === 'meisner' && (
                    <TabPanel title={result.meisner.title}>
                      {result.meisner.items.map((item, i) => (
                        <ItemCard key={i} label={item.label} content={item.content} />
                      ))}
                    </TabPanel>
                  )}

                  {/* 대사별 노트 */}
                  {activeTab === 'lineByLine' && (
                    <TabPanel title={result.lineByLine.title}>
                      {result.lineByLine.lines.map((ln, i) => (
                        <div key={i} style={s.lineCard}>
                          <p style={s.lineText}>&ldquo;{ln.line}&rdquo;</p>
                          <p style={s.lineNote}>{ln.note}</p>
                        </div>
                      ))}
                    </TabPanel>
                  )}

                  {/* 현장 요약 */}
                  {activeTab === 'onSetSummary' && (
                    <TabPanel title={result.onSetSummary.title}>
                      <div style={s.summaryBox}>
                        <p style={s.summaryText}>{result.onSetSummary.content}</p>
                      </div>
                    </TabPanel>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{spinnerCss}</style>
    </div>
  )
}

// ─── 서브 컴포넌트 ───────────────────────────────────────────────────────────

function TabPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={s.card}>
      <h3 style={s.cardTitle}>{title}</h3>
      <div style={s.itemGrid}>{children}</div>
    </div>
  )
}

function ItemCard({ label, content }: { label: string; content: string }) {
  return (
    <div style={s.itemCard}>
      <p style={s.itemLabel}>{label}</p>
      <p style={s.itemContent}>{content}</p>
    </div>
  )
}

// ─── 스피너 CSS ──────────────────────────────────────────────────────────────

const spinnerCss = `
@keyframes kd4spin {
  to { transform: rotate(360deg); }
}
.kd4-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(196,165,90,0.2);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: kd4spin 0.8s linear infinite;
}
`

// ─── 인라인 스타일 ───────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingTop: 88,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 40,
  },
  eyebrow: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '0.7rem',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: 'var(--gold)',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
    fontWeight: 700,
    color: 'var(--white)',
    marginBottom: 12,
  },
  pageDesc: {
    fontSize: '0.9rem',
    color: 'var(--gray)',
    lineHeight: 1.7,
    maxWidth: 600,
  },
  inputSection: {
    maxWidth: 760,
  },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  cardTitle: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--white)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    paddingBottom: 14,
    borderBottom: '1px solid var(--border)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--gray)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
  },
  input: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '11px 14px',
    fontSize: '0.9rem',
    color: 'var(--white)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '12px 14px',
    fontSize: '0.9rem',
    color: 'var(--white)',
    outline: 'none',
    width: '100%',
    minHeight: 200,
    resize: 'vertical' as const,
    lineHeight: 1.7,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    background: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '13px 28px',
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: 'var(--font-oswald, var(--font-display))',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    alignSelf: 'flex-start' as const,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  btnReset: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '10px 20px',
    fontSize: '0.82rem',
    color: 'var(--gray)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(220,53,69,0.08)',
    border: '1px solid rgba(220,53,69,0.3)',
    borderRadius: 6,
    padding: '12px 16px',
    fontSize: '0.85rem',
    color: '#ff6b6b',
  },
  errorIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '1.5px solid #ff6b6b',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 240,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(196,165,90,0.2)',
    borderTopColor: 'var(--gold)',
    borderRadius: '50%',
    animation: 'kd4spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '1rem',
    color: 'var(--white)',
    fontWeight: 600,
  },
  loadingSubText: {
    fontSize: '0.8rem',
    color: 'var(--gray)',
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  resultEyebrow: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: '0.68rem',
    fontWeight: 300,
    letterSpacing: '0.3em',
    color: 'var(--gold)',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  resultTitle: {
    fontFamily: 'var(--font-oswald, var(--font-display))',
    fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
    fontWeight: 700,
    color: 'var(--white)',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid var(--border)',
    overflowX: 'auto' as const,
  },
  tab: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '10px 18px',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--gray)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    letterSpacing: '0.05em',
    transition: 'color 0.2s, border-color 0.2s',
    marginBottom: -1,
  },
  tabActive: {
    color: 'var(--gold)',
    borderBottomColor: 'var(--gold)',
  },
  tabContent: {},
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  itemCard: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '16px 18px',
  },
  itemLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  itemContent: {
    fontSize: '0.88rem',
    color: 'var(--white)',
    lineHeight: 1.7,
  },
  lineCard: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  lineText: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    fontStyle: 'italic',
    lineHeight: 1.6,
    borderLeft: '2px solid var(--gold)',
    paddingLeft: 12,
  },
  lineNote: {
    fontSize: '0.84rem',
    color: 'var(--gray)',
    lineHeight: 1.6,
  },
  summaryBox: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '20px 22px',
  },
  summaryText: {
    fontSize: '0.9rem',
    color: 'var(--white)',
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap' as const,
  },
  pre: {
    fontSize: '0.82rem',
    color: 'var(--gray)',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    lineHeight: 1.6,
  },
  // API KEY 없음 화면
  noKeyBox: {
    maxWidth: 540,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
    textAlign: 'center' as const,
  },
  noKeyIcon: {
    fontSize: '2rem',
    color: '#f0ad4e',
    marginBottom: 4,
  },
  noKeyTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--white)',
  },
  noKeyDesc: {
    fontSize: '0.88rem',
    color: 'var(--gray)',
    lineHeight: 1.6,
  },
  codeBlock: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '12px 20px',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: 'var(--gold)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  noKeySubDesc: {
    fontSize: '0.82rem',
    color: 'var(--gray)',
  },
  link: {
    color: 'var(--gold)',
    textDecoration: 'underline',
  },
}
