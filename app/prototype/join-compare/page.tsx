import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  X,
  Sparkles,
  TrendingUp,
  Eye,
  Gauge,
  MessageSquare,
  Palette,
  ExternalLink,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '/join 리디자인 비교 — 프로토타입',
  robots: { index: false, follow: false },
}

/* ── 주요 변화 카드 데이터 ────────────────────────────────────── */
const CHANGES = [
  {
    Icon: Sparkles,
    category: '시각 자료',
    label: '아이콘 시스템',
    before: '이모지 🎭🎬🌟 남발 — AI 티',
    after: 'Lucide React 라인 아이콘 10종 — 디자이너 감성',
    impact: 'High',
  },
  {
    Icon: TrendingUp,
    category: '설득 구조',
    label: 'Agitation 섹션',
    before: '"이런 분이라면 딱 맞습니다" 드라이한 체크리스트 4개',
    after: '감정 체크리스트 3개 카드 (카메라·자존감·학원비)',
    impact: 'Critical',
  },
  {
    Icon: Sparkles,
    category: '신규 섹션',
    label: 'Risk Reversal',
    before: '없음. "등록 강요 없습니다" 한 줄만',
    after: '3개 보장 카드 (상담만 OK · 2주 환불 · 가이드 PDF)',
    impact: 'Critical',
  },
  {
    Icon: Sparkles,
    category: '신규 섹션',
    label: 'Curriculum',
    before: '추상적 결과 약속만',
    after: 'Month 01~04 주차별 로드맵 4개 카드',
    impact: 'High',
  },
  {
    Icon: Sparkles,
    category: '신규 섹션',
    label: 'Comparison',
    before: '없음',
    after: '대형학원 vs KD4 비교표 5행',
    impact: 'High',
  },
  {
    Icon: TrendingUp,
    category: '가격 앵커링',
    label: 'Anchor Price 배지',
    before: 'originalPrice line-through만',
    after: '"월 10만원 세이브 · 4개월 총 40만원 절감" 배지',
    impact: 'High',
  },
  {
    Icon: TrendingUp,
    category: '후기',
    label: 'Social Proof 보강',
    before: '익명 "윤*숙" + 별 5개 하드코딩',
    after: '기수+클래스명 메타데이터 추가',
    impact: 'Medium',
  },
  {
    Icon: MessageSquare,
    category: '강사 크레딧',
    label: '구체화',
    before: '"무빙2 출연" 모호',
    after: 'Disney+ 무빙 시즌2 조연(2024) · LA Meisner 2년 과정',
    impact: 'Medium',
  },
  {
    Icon: Palette,
    category: '디자인 일관성',
    label: 'kd4.club CSS 클래스 재사용',
    before: '인라인 스타일 남발 — AI 느낌',
    after: '.section .director-card .class-card .faq-item 100% 재활용',
    impact: 'Critical',
  },
  {
    Icon: Palette,
    category: '노란색 제거',
    label: '#FEE500 하드코딩 제거',
    before: '카카오 버튼·카운트다운·할인 배지 모두 노랑',
    after: '네이비 .btn-outline + 빨강 (잔여석만)',
    impact: 'High',
  },
  {
    Icon: Eye,
    category: '모바일 UX',
    label: 'Sticky Top Bar',
    before: '3줄 wrap, 뷰포트 60%만 남음',
    after: 'flexWrap:nowrap + 잔여석 props 동기화',
    impact: 'Critical',
  },
  {
    Icon: Eye,
    category: '모바일 UX',
    label: 'Sticky Bottom CTA',
    before: '페이지 로드 시 즉시 노출 → 방해',
    after: '스크롤 30% 이후 translateY 애니메이션으로 등장',
    impact: 'High',
  },
  {
    Icon: MessageSquare,
    category: '카피',
    label: 'Hero 헤드라인 구체화',
    before: '"오디션은 보는데 결과가 없다면"',
    after: '"3년 학원 다녀도 오디션 결과가 없다면"',
    impact: 'Medium',
  },
  {
    Icon: Gauge,
    category: 'CTA 밀도',
    label: '페이지 내 CTA 반복',
    before: '4회 (Hero / Offer / Form / StickyBottom)',
    after: '6회 (+ Director 하단 · Proof 하단 인라인 CTA 2개)',
    impact: 'High',
  },
  {
    Icon: MessageSquare,
    category: '카피',
    label: '"등록 강요 없음" 표현',
    before: '"등록 강요 없습니다" (강요 단어 자체가 의심 유발)',
    after: '"상담만 받아도 괜찮아요" (부드러운 Risk Reversal)',
    impact: 'Medium',
  },
  {
    Icon: Sparkles,
    category: '가독성',
    label: '<br /> 강제 줄바꿈',
    before: '10+ 곳에서 하드코딩',
    after: '전부 제거 — KoPub + keep-all 반응형 자연 흐름',
    impact: 'Medium',
  },
  /* ───── Round 2 개선 ───── */
  {
    Icon: Palette,
    category: 'Round 2 · 디자인',
    label: 'Hero 강조색 톤 교체',
    before: '#7BB3FF 하늘색 (딥네이비와 톤 충돌, 싸구려 느낌)',
    after: '흰색 텍스트 + 웜그레이 언더라인',
    impact: 'Critical',
  },
  {
    Icon: Palette,
    category: 'Round 2 · 아이콘',
    label: 'strokeWidth 3단계 통일',
    before: '1 / 1.3 / 1.8 / 2 / 2.2 / 2.5 — 6종 혼재',
    after: '장식 1.3 · 본문 1.8 · 강조 2.2',
    impact: 'High',
  },
  {
    Icon: Palette,
    category: 'Round 2 · 토큰',
    label: 'navy-tint 투명도 변수화',
    before: 'rgba(21,72,138,0.04~0.25) 알파값 6종 혼재',
    after: '--navy-tint-1/2/3 3단계 변수',
    impact: 'Medium',
  },
  {
    Icon: MessageSquare,
    category: 'Round 2 · 카피',
    label: '환불 조건 구체화',
    before: '"첫 2주 불만족 시 전액 환불" (립서비스 느낌)',
    after: '"출석 2회 이후 카카오로 요청 시 즉시 환불"',
    impact: 'High',
  },
  {
    Icon: MessageSquare,
    category: 'Round 2 · UX',
    label: '전화번호 안심 문구',
    before: '없음 (스팸 공포 유발)',
    after: '"카카오톡으로만 연락드립니다 · 광고 전화 없음"',
    impact: 'High',
  },
  {
    Icon: MessageSquare,
    category: 'Round 2 · sticky',
    label: 'StickyTopBar CTA 문구',
    before: '"상담" (2글자 스캔 안 됨)',
    after: '"무료상담"',
    impact: 'Medium',
  },
  {
    Icon: Gauge,
    category: 'Round 2 · CTA',
    label: 'CTA 밀도 조정',
    before: '6회 (Director · Proof 인라인 CTA 중복)',
    after: '5회 (Director 인라인 CTA 제거)',
    impact: 'Low',
  },
  /* ───── Round 3 개선 ───── */
  {
    Icon: Eye,
    category: 'Round 3 · 치명',
    label: 'Hero 강사 사진 가시성',
    before: 'opacity 0.42 + grayscale 0.3 + 92% 오버레이 → 얼굴 안 보임',
    after: 'opacity 0.62 + grayscale 0.2 + 단계별 35→85% 그라디언트',
    impact: 'Critical',
  },
  {
    Icon: TrendingUp,
    category: 'Round 3 · 가격',
    label: '코스 총액 병기',
    before: '"25만원/월"만 노출 → 상담 시 쇼크',
    after: '"4개월 총 1,000,000원 · 분납 상담 가능" 추가',
    impact: 'Critical',
  },
  {
    Icon: Sparkles,
    category: 'Round 3 · Success',
    label: '폼 제출 완료 화면',
    before: '🌸 이모지 + "24시간 이내" 한 줄만',
    after: 'CheckCircle 아이콘 + 접수번호(KD-YYMMDD-XXXX) + 화자 명시 + 리드마그넷 PDF CTA',
    impact: 'Critical',
  },
  {
    Icon: MessageSquare,
    category: 'Round 3 · 메인',
    label: 'kd4.club "첫 걸음 어렵지 않아요"',
    before: 'AI 티 나는 추상 카피',
    after: '"무료 상담으로 먼저 시작하세요"',
    impact: 'Medium',
  },
]

const SCORES = [
  { label: 'UX (실사용자)', before: 5.8, after: 8.2, unit: '/10' },
  { label: '디자인 일관성', before: 6.0, after: 9.1, unit: '/10' },
  { label: '전환율 구조(CRO)', before: 7.2, after: 8.8, unit: '/10' },
  { label: '섹션 개수', before: 7, after: 13, unit: '' },
  { label: 'CTA 노출 횟수', before: 4, after: 6, unit: '회' },
  { label: 'Lucide 아이콘 도입', before: 0, after: 16, unit: '종' },
]

const IMPACT_COLOR: Record<string, { bg: string; fg: string }> = {
  Critical: { bg: 'var(--accent-red-soft)', fg: 'var(--accent-red)' },
  High: { bg: 'rgba(21,72,138,0.1)', fg: 'var(--navy)' },
  Medium: { bg: 'rgba(107,102,96,0.1)', fg: 'var(--gray-light)' },
  Low: { bg: 'rgba(107,102,96,0.05)', fg: 'var(--gray)' },
}

export default function JoinComparePage() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: '#111111',
        minHeight: '100svh',
        fontFamily: 'var(--font-sans)',
        paddingBottom: '80px',
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header
        style={{
          background: 'var(--bg-deep)',
          color: '#fff',
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <p
            className="section-eyebrow"
            style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}
          >
            PROTOTYPE · INTERNAL
          </p>
          <h1
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
              color: '#fff',
              marginBottom: '14px',
            }}
          >
            /join 리디자인 비교 대시보드
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.95rem',
              maxWidth: '640px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            에이전트 3개(UX 평가 · 디자인 일관성 · CRO 분석) 병렬 피드백을 기반으로 재설계한 항목 전체. 실제 랜딩페이지는 배포되어 있으며 아래 링크로 열람 가능합니다.
          </p>

          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/join"
              className="btn-primary"
              style={{ background: 'var(--navy)', color: '#fff' }}
            >
              신규 /join 페이지 열기
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
            <a
              href="https://github.com/ehddnjs1897-art/kd4-nextjs/commits/main"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <ExternalLink size={14} strokeWidth={2} />
              GitHub 커밋 히스토리
            </a>
          </div>
        </div>
      </header>

      {/* ── SCORES ─────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">KEY METRICS</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)' }}
            >
              개선 지표
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {SCORES.map(({ label, before, after, unit }) => {
              const up = after > before
              return (
                <div
                  key={label}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '22px 20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      color: 'var(--gray)',
                      textTransform: 'uppercase',
                      marginBottom: '14px',
                    }}
                  >
                    {label}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--gray)',
                        textDecoration: 'line-through',
                      }}
                    >
                      {before}
                      {unit}
                    </span>
                    <ArrowRight size={14} color="var(--navy)" strokeWidth={2} />
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        color: up ? 'var(--navy)' : 'var(--accent-red)',
                      }}
                    >
                      {after}
                      <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>{unit}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CHANGES LIST ───────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">CHANGELOG · {CHANGES.length}건</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)' }}
            >
              Before → After 전체 항목
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {CHANGES.map(({ Icon, category, label, before, after, impact }) => {
              const c = IMPACT_COLOR[impact]
              return (
                <div
                  key={label}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '22px 24px',
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr auto',
                    gap: '16px',
                    alignItems: 'start',
                  }}
                >
                  {/* 아이콘 */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color="var(--navy)" strokeWidth={1.8} />
                  </div>

                  {/* 본문 */}
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.15em',
                        color: 'var(--gray)',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}
                    >
                      {category}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginBottom: '12px',
                      }}
                    >
                      {label}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        marginBottom: '6px',
                      }}
                    >
                      <X size={14} color="var(--gray)" strokeWidth={2} style={{ marginTop: '3px', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
                        {before}
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Check size={14} color="var(--navy)" strokeWidth={2.5} style={{ marginTop: '3px', flexShrink: 0 }} />
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: '#111',
                          lineHeight: 1.6,
                          fontWeight: 500,
                        }}
                      >
                        {after}
                      </p>
                    </div>
                  </div>

                  {/* Impact 배지 */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: c.fg,
                      background: c.bg,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      whiteSpace: 'nowrap',
                      alignSelf: 'start',
                    }}
                  >
                    {impact}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ─────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg)', padding: '60px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Link
            href="/join"
            className="btn-primary"
            style={{ background: 'var(--navy)', color: '#fff' }}
          >
            실제 /join 랜딩 열기
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
          <p
            style={{
              marginTop: '28px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.72rem',
              color: 'var(--gray)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            KD4 ACTING STUDIO · INTERNAL PROTOTYPE
          </p>
        </div>
      </section>
    </div>
  )
}
