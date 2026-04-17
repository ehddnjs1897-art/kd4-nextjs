import type { Metadata } from 'next'
import {
  Users,
  Calendar,
  UserCheck,
  Repeat,
  Zap,
  FileText,
  Film,
  Check,
  X,
  ArrowRight,
  Quote,
  Star,
  MessageCircle,
  Clock,
} from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import { FAQ_ITEMS } from '@/lib/faq-items'
import JoinForm from '@/components/contact/JoinForm'
import CountdownTimer from '@/components/ui/CountdownTimer'
import StickyTopBar from '@/components/join/StickyTopBar'
import StickyBottomCTA from '@/components/join/StickyBottomCTA'
import FaqAccordion from '@/components/join/FaqAccordion'

export const metadata: Metadata = {
  title: '무료 상담 신청 | KD4 액팅 스튜디오',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 봄맞이 첫 달 10만원 할인. 서울 신촌.',
  robots: { index: false, follow: false },
}

/* ── 상수 (CLAUDE.md에 명시된 이미지 링크 재사용) ───────────────── */
const INSTRUCTOR_IMG =
  'https://drive.google.com/uc?export=view&id=1WfyN6x21sRLNzzNNYB-dBschGRzdEzUP'
const STUDIO_IMG =
  'https://drive.google.com/uc?export=view&id=1by0ZDO3J5yS-44McKbmAPixjPtI3xWNr'
const DEADLINE = '2026-04-30T23:59:59'

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.highlight)
const TOTAL_SEATS = OPEN_CLASSES.reduce((s, c) => s + (c.remainingSeats ?? 0), 0)
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* ── 커리큘럼 4개월 로드맵 (Lucide 아이콘) ──────────────────────── */
const CURRICULUM = [
  {
    Icon: Repeat,
    month: 'MONTH 01',
    title: 'Repetition',
    subtitle: '레피티션 훈련',
    desc: '상대방의 말·표정·행동을 그대로 관찰하고 즉각 반응하는 훈련. 정답 연기를 버립니다.',
  },
  {
    Icon: Zap,
    month: 'MONTH 02',
    title: 'Activity & Doorknock',
    subtitle: '7단계 실습',
    desc: '마이즈너 테크닉의 핵심 7단계를 차근차근 내 몸에 체화시키는 단계.',
  },
  {
    Icon: FileText,
    month: 'MONTH 03',
    title: 'Text Analysis',
    subtitle: '텍스트 분석 · 메모라이징',
    desc: '대본을 "외우는" 게 아니라 "해석"하는 방법. 인물의 진짜 욕구를 찾아냅니다.',
  },
  {
    Icon: Film,
    month: 'MONTH 04',
    title: 'Final Portfolio',
    subtitle: '출연영상 촬영',
    desc: '전문 영화팀과 함께하는 최종 장면 촬영. 오디션 제출용 포트폴리오 완성.',
  },
]

/* ── 비교표 ──────────────────────────────────────────────────────── */
const COMPARISON_ROWS: {
  label: string
  normal: string | 'X'
  kd4: string | 'O'
}[] = [
  { label: '정원', normal: '20~30명', kd4: '6~8명 프라이빗' },
  { label: '강사', normal: '조교·보조 강사', kd4: '현역 배우 직강' },
  { label: '포트폴리오 제작', normal: '선택 · 추가 비용', kd4: '정규 과정 포함' },
  { label: '캐스팅 연계', normal: 'X', kd4: 'O' },
  { label: '월 수강료', normal: '20~35만원', kd4: '25만원' },
]

/* ── 후기 ──────────────────────────────────────────────────────── */
const REVIEWS = [
  {
    text: '정답인 연기를 요구하지 않고, 저 자체로 보여줄 수 있는 연기를 할 수 있었어요',
    author: '윤*숙',
    role: 'KD4 수료 배우',
  },
  {
    text: '마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다',
    author: '김*현',
    role: 'KD4 수료 배우',
  },
  {
    text: '한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다',
    author: '정*석',
    role: 'KD4 수료 배우',
  },
]

/* ══════════════════════════════════════════════════════════════════ */

export default function JoinPage() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: '#111111',
        paddingBottom: '90px',
      }}
    >
      <StickyTopBar deadline={DEADLINE} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ① HERO — 강사 사진 + 세리프 헤드라인                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          minHeight: '560px',
          overflow: 'hidden',
          background: 'var(--bg-deep)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={INSTRUCTOR_IMG}
          alt="권동원 대표"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 18%',
            opacity: 0.42,
            filter: 'grayscale(0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(160deg, rgba(15,20,35,0.55) 0%, rgba(15,20,35,0.92) 100%)',
          }}
        />

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(72px, 14vw, 120px) 24px clamp(60px, 10vw, 90px)',
            textAlign: 'center',
          }}
        >
          <p
            className="section-eyebrow"
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}
          >
            KD4 ACTING STUDIO · 무료 상담
          </p>

          <h1
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.9rem, 6.5vw, 3.2rem)',
              color: '#ffffff',
              lineHeight: 1.3,
              marginBottom: '22px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            오디션은 보는데 결과가 없다면, <span style={{ color: '#7BB3FF' }}>방법의 문제입니다</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.9rem, 2.4vw, 1rem)',
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.75,
              marginBottom: '36px',
              maxWidth: '460px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            서울 신촌 · 6~8명 소수정예 마이즈너 테크닉 정규 클래스
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#form"
              className="btn-primary"
              style={{ background: 'var(--navy)', color: '#ffffff' }}
            >
              무료 상담 신청하기
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <MessageCircle size={14} strokeWidth={2} />
              카카오 문의
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ② AGITATION — 스튜디오 사진 배경 + 문제 후비기             */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          padding: '90px 0',
          background: 'var(--bg2)',
          overflow: 'hidden',
        }}
      >
        {/* 스튜디오 사진 저대비 배경 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={STUDIO_IMG}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.08,
            filter: 'grayscale(1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, var(--bg2) 0%, rgba(232,232,223,0.85) 40%, var(--bg2) 100%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — THE PROBLEM</p>

            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.3rem)',
                lineHeight: 1.45,
                marginBottom: '32px',
              }}
            >
              3년째 학원 다녔는데 오디션 결과는 여전히 없으셨죠?
            </h2>

            <div
              style={{
                paddingTop: '28px',
                borderTop: '1px solid var(--border)',
                fontSize: '1rem',
                color: 'var(--gray-light)',
                lineHeight: 1.95,
              }}
            >
              <p style={{ marginBottom: '20px' }}>
                재능이 부족해서가 아닙니다.{' '}
                <strong style={{ color: '#111111' }}>&ldquo;배우는 방법&rdquo;</strong>
                이 틀렸을 뿐이에요.
              </p>
              <p>
                혼자 감정을 만들어내는 훈련, 정답 연기를 요구받는 수업, 20명 넘는 대형 클래스에서 본인 차례는 5분. 그런 환경에서 실력이 안 느는 건 당연합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③ SOLUTION — 마이즈너 테크닉 + Lucide 아이콘 3개           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — THE METHOD</p>

            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '20px' }}
            >
              그래서 KD4는 <span style={{ color: 'var(--navy)' }}>마이즈너 테크닉</span>을 씁니다
            </h2>

            <p
              className="section-desc"
              style={{ margin: '0 auto 48px', textAlign: 'center', maxWidth: '560px' }}
            >
              혼자 감정을 만드는 연기가 아닙니다. 상대에게 집중하고 그 순간 반응하는, 가장 자연스러운 연기 훈련법입니다.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                textAlign: 'left',
              }}
            >
              {[
                {
                  Icon: Users,
                  n: '01',
                  t: '레피티션',
                  d: '상대 관찰 · 즉흥 반응',
                },
                {
                  Icon: Zap,
                  n: '02',
                  t: '액티비티',
                  d: '집중력 · 몰입 훈련',
                },
                {
                  Icon: FileText,
                  n: '03',
                  t: '텍스트 분석',
                  d: '인물의 진짜 욕구 해석',
                },
              ].map(({ Icon, n, t, d }) => (
                <div
                  key={n}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '26px 24px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <Icon size={20} color="var(--navy)" strokeWidth={1.8} />
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      color: 'var(--navy)',
                      marginBottom: '8px',
                    }}
                  >
                    {n}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    {t}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.6 }}>
                    {d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ④ STATS — 숫자 + Lucide 아이콘                             */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="stats-banner">
        <div className="container">
          <div className="stats-grid">
            {[
              { Icon: Users, num: '400+', label: '누적 코칭 배우' },
              { Icon: Calendar, num: '3년+', label: '스튜디오 운영' },
              { Icon: UserCheck, num: '6~8명', label: '소수정예 정원' },
            ].map(({ Icon, num, label }) => (
              <div key={num} className="stats-card">
                <div className="stats-icon-wrap">
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑤ DIRECTOR — 권동원 대표 (기존 .director-card 재사용)      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — THE TEACHER</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              현장에서 일하는 배우가 가르칩니다
            </h2>
          </div>

          <div className="director-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="director-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={INSTRUCTOR_IMG}
                alt="권동원 대표"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="director-name">권동원</div>
              <div className="director-role">KD4 대표 · 현역 배우</div>
              <div className="director-creds">
                <div className="director-cred">LA 마이즈너 테크닉 정식 수료</div>
                <div className="director-cred">TV 드라마 무빙2 · 중증외상센터 출연</div>
                <div className="director-cred">400명 이상 배우 직접 코칭</div>
              </div>
              <p
                style={{
                  marginTop: '22px',
                  paddingLeft: '14px',
                  borderLeft: '2px solid var(--navy)',
                  fontStyle: 'italic',
                  fontSize: '0.92rem',
                  color: 'var(--gray-light)',
                  lineHeight: 1.8,
                }}
              >
                학원 선생님이 아닌, 같이 현장에서 일하는 동료로서 가르칩니다. 이론만이 아니라 지금 촬영장에서 통하는 연기를 공유해요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑥ PROOF — 후기 + Quote + Star 아이콘                       */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">04 — KD4 배우 이야기</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              이미 방법을 바꾼 사람들
            </h2>
          </div>

          <div className="testimonials-grid">
            {REVIEWS.map(({ text, author, role }) => (
              <div key={author} className="testimonial-card">
                {/* 별점 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '2px',
                    marginBottom: '14px',
                  }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      color="#F59E0B"
                      fill="#F59E0B"
                      strokeWidth={1}
                    />
                  ))}
                </div>
                <Quote
                  size={24}
                  color="var(--navy)"
                  strokeWidth={1.3}
                  style={{ opacity: 0.25, marginBottom: '8px' }}
                />
                <p
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.85,
                    color: 'var(--gray-light)',
                    marginBottom: '20px',
                  }}
                >
                  {text}
                </p>
                <div className="testimonial-name">{author}</div>
                <div className="testimonial-class">{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑦ CURRICULUM — 4개월 로드맵 + Lucide 아이콘               */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 48px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — CURRICULUM</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '16px' }}
            >
              4개월 주차별 로드맵
            </h2>
            <p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              추상적인 약속이 아니라, 매달 구체적으로 무엇을 배우는지 공개합니다.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              maxWidth: '1080px',
              margin: '0 auto',
            }}
          >
            {CURRICULUM.map(({ Icon, month, title, subtitle, desc }) => (
              <div
                key={month}
                className="step-card"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '32px 24px',
                }}
              >
                <div
                  className="step-icon-glow"
                  style={{ marginBottom: '20px' }}
                >
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    color: 'var(--navy)',
                    marginBottom: '12px',
                  }}
                >
                  {month}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--navy)',
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  {subtitle}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑧ COMPARISON — 대형학원 vs KD4 (Check/X 아이콘)            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">06 — COMPARE</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              대형 학원 vs KD4
            </h2>
          </div>

          <div className="comparison-wrap" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}></th>
                  <th>대형 학원</th>
                  <th className="kd4-col">KD4</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ color: 'var(--gray)' }}>
                      {row.normal === 'X' ? (
                        <X
                          size={18}
                          color="var(--gray)"
                          strokeWidth={2}
                          style={{ display: 'inline-block', verticalAlign: 'middle' }}
                        />
                      ) : (
                        row.normal
                      )}
                    </td>
                    <td className="kd4-col">
                      {row.kd4 === 'O' ? (
                        <Check
                          size={18}
                          color="var(--navy)"
                          strokeWidth={2.5}
                          style={{ display: 'inline-block', verticalAlign: 'middle' }}
                        />
                      ) : (
                        row.kd4
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑨ OFFER — 가격 + 카운트다운 (기존 .class-card 재사용)     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">07 — SPRING SPECIAL</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              봄맞이 스페셜 혜택
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              전체 <strong style={{ color: 'var(--navy)' }}>{TOTAL_SEATS}석</strong>만 남았습니다 · 마감 후 정가 복귀
            </p>
          </div>

          {/* 카운트다운 */}
          <div
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '28px 20px',
              maxWidth: '520px',
              margin: '0 auto 28px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: '#C73E3E',
                marginBottom: '16px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={13} strokeWidth={2} />
              할인 마감까지
            </p>
            <CountdownTimer deadline={DEADLINE} />
          </div>

          {/* 클래스 카드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            {[MAIN_CLASS, FILM_CLASS].map((cls) => (
              <div key={cls.nameKo} className="class-card">
                <div className="class-card-header">
                  <p className="class-step">{cls.step}</p>
                  <p className="class-name-ko">{cls.nameKo}</p>
                  <p className="class-name-en">{cls.nameEn}</p>
                </div>
                <div className="class-card-body">
                  {cls.quote && <p className="class-quote">{cls.quote}</p>}
                  <div className="class-bullets">
                    {cls.bullets.slice(0, 3).map((b) => (
                      <div key={b} className="class-bullet">
                        {b}
                      </div>
                    ))}
                  </div>
                  {cls.remainingSeats !== undefined && (
                    <p
                      className="class-note"
                      style={{
                        color: '#C73E3E',
                        background: 'rgba(199,62,62,0.06)',
                        borderColor: 'rgba(199,62,62,0.2)',
                      }}
                    >
                      잔여석 {cls.remainingSeats}석
                    </p>
                  )}
                </div>
                <div className="class-card-footer">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '10px',
                      marginBottom: '6px',
                    }}
                  >
                    <span className="class-price">
                      {cls.price}
                      <span>원/월</span>
                    </span>
                    {cls.originalPrice && (
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--gray)',
                          textDecoration: 'line-through',
                        }}
                      >
                        {cls.originalPrice}원
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                    {cls.schedule} · {cls.duration} · 정원 {cls.capacity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <a
              href="#form"
              className="btn-primary"
              style={{ background: 'var(--navy)', color: '#ffffff' }}
            >
              무료 상담 신청하기
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑩ FAQ — 반대 소거 (lib/faq-items.ts 재사용)                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '90px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">08 — FAQ</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
            >
              자주 묻는 질문
            </h2>
          </div>

          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑪ FORM — 신청 폼                                           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="form"
        className="section"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
          padding: '90px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p className="section-eyebrow">09 — START HERE</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: '10px' }}
              >
                무료 상담 신청하기
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                30초면 충분해요. 24시간 이내 카카오로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑫ GUARANTEE — 안심 문구                                    */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '60px 0 40px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--gray-light)',
              lineHeight: 1.9,
              marginBottom: '8px',
              maxWidth: '520px',
              margin: '0 auto 8px',
            }}
          >
            부담 없는 30분 상담입니다.{' '}
            <strong style={{ color: '#111111' }}>등록 강요 없습니다.</strong>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.7 }}>
            개인정보는 상담 연락 외에 사용되지 않습니다.
          </p>

          <div style={{ marginTop: '24px' }}>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
            >
              <MessageCircle size={14} strokeWidth={2} />
              카카오로 바로 문의
            </a>
          </div>

          <p
            style={{
              marginTop: '36px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.72rem',
              color: 'var(--gray)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            KD4 ACTING STUDIO · 서울 서대문구 신촌
          </p>
        </div>
      </section>

      <StickyBottomCTA />
    </div>
  )
}
