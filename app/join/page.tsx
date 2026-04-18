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
  ShieldCheck,
  HeartHandshake,
  Camera,
  Moon,
  Wallet,
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

/* ── 상수 ────────────────────────────────────────────────────────── */
const INSTRUCTOR_IMG =
  'https://drive.google.com/uc?export=view&id=1WfyN6x21sRLNzzNNYB-dBschGRzdEzUP'
const STUDIO_IMG =
  'https://drive.google.com/uc?export=view&id=1by0ZDO3J5yS-44McKbmAPixjPtI3xWNr'
const DEADLINE = '2026-04-19T23:59:59'  // 하루 남음

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.highlight)
const TOTAL_SEATS = OPEN_CLASSES.reduce((s, c) => s + (c.remainingSeats ?? 0), 0)
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* 첫 달 할인액 (Anchor Price 시각화) */
const FIRST_MONTH_DISCOUNT = 100000

/* ── Agitation 감정 체크리스트 3개 ────────────────────────────── */
const PAIN_POINTS = [
  {
    Icon: Camera,
    title: '카메라 앞에서 머리가 하얘진 경험',
    desc: '대사를 외웠는데 막상 슛 들어가면 표정이 얼어붙고 숨이 가빠집니다.',
  },
  {
    Icon: Moon,
    title: '오디션 떨어지고 자존감 무너진 밤',
    desc: '노력은 하는데 결과는 없고, 내가 재능이 없는 건가 매일 자문합니다.',
  },
  {
    Icon: Wallet,
    title: '월 학원비 본전 생각에 잠 못 이룬 새벽',
    desc: '20명 넘는 대형 클래스에서 내 차례는 5분. 이게 과연 효과 있을까 의심됩니다.',
  },
]

/* ── 커리큘럼 4개월 로드맵 ──────────────────────────────────── */
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
    desc: '마이즈너 테크닉의 핵심 7단계를 차근차근 내 몸에 체화시키는 단계입니다.',
  },
  {
    Icon: FileText,
    month: 'MONTH 03',
    title: 'Text Analysis',
    subtitle: '텍스트 분석 · 메모라이징',
    desc: '대본을 외우는 게 아니라 해석하는 방법. 인물의 진짜 욕구를 찾아냅니다.',
  },
  {
    Icon: Film,
    month: 'MONTH 04',
    title: 'Final Portfolio',
    subtitle: '출연영상 촬영',
    desc: '전문 영화팀과 함께하는 최종 장면 촬영. 오디션 제출용 포트폴리오 완성.',
  },
]

/* ── 비교표 ────────────────────────────────────────────────── */
const COMPARISON_ROWS: { label: string; normal: string; kd4: string }[] = [
  { label: '정원', normal: '20~30명', kd4: '6~8명 프라이빗' },
  { label: '강사', normal: '조교·보조 강사', kd4: '현역 배우 직강' },
  { label: '포트폴리오 제작', normal: '선택 · 추가 비용', kd4: '정규 과정 포함' },
  { label: '캐스팅 연계', normal: 'X', kd4: 'O' },
  { label: '월 수강료', normal: '20~35만원', kd4: '25만원' },
]

/* ── 후기 (신뢰도 보강 — 기수/나이대 추가) ────────────────── */
const REVIEWS = [
  {
    text: '정답인 연기를 요구하지 않고, 저 자체로 보여줄 수 있는 연기를 할 수 있었어요',
    author: '윤*숙',
    meta: '2025 봄 기수 · 마이즈너 정규반',
  },
  {
    text: '마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다',
    author: '김*현',
    meta: '2024 가을 기수 · 출연영상반',
  },
  {
    text: '한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다',
    author: '정*석',
    meta: '2025 봄 기수 · 마이즈너 정규반',
  },
]

/* ── Risk Reversal 3가지 보장 ─────────────────────────────── */
const GUARANTEES = [
  {
    Icon: HeartHandshake,
    title: '상담 후 바로 가셔도 돼요',
    desc: '30분 부담 없는 대화. 본인에게 맞는지 확인만 하고 가세요.',
  },
  {
    Icon: ShieldCheck,
    title: '첫 2주 불만족 시 전액 환불',
    desc: '출석 2회 이후 카카오로 요청하시면 즉시 환불 처리됩니다.',
  },
  {
    Icon: FileText,
    title: '상담만 받아도 가이드 PDF',
    desc: '권동원 대표가 정리한 오디션 합격 가이드 무료로 드립니다.',
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
      <StickyTopBar deadline={DEADLINE} seats={TOTAL_SEATS} />

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
          alt="권동원 대표 — KD4 액팅 스튜디오"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 15%',
            opacity: 0.62,
            filter: 'grayscale(0.2)',
          }}
        />
        {/* 상단은 가볍게, 하단은 진하게 — 얼굴이 보이면서 텍스트도 읽히도록 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,20,35,0.35) 0%, rgba(15,20,35,0.55) 45%, rgba(15,20,35,0.85) 100%)',
          }}
          aria-hidden="true"
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
              fontSize: 'clamp(1.8rem, 4.8vw, 2.8rem)',
              color: '#ffffff',
              lineHeight: 1.35,
              marginBottom: '22px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            3년 학원 다녀도 오디션 결과가 없다면,{' '}
            <span
              style={{
                color: '#ffffff',
                borderBottom: '2px solid var(--navy-accent)',
                paddingBottom: '2px',
              }}
            >
              방법의 문제입니다
            </span>
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
              <MessageCircle size={14} strokeWidth={2.2} />
              카카오 문의
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ② AGITATION — 감정 체크리스트 3개 카드 (Round 1 반영)     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0',
          background: 'var(--bg2)',
          overflow: 'hidden',
        }}
      >
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
            opacity: 0.07,
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
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — THE PROBLEM</p>
            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
                lineHeight: 1.45,
                marginBottom: '18px',
              }}
            >
              혹시 이런 경험, 있지 않으세요?
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--gray-light)',
                lineHeight: 1.8,
                maxWidth: '540px',
                margin: '0 auto',
              }}
            >
              재능이 부족해서가 아닙니다. 배우는 방법이 틀렸을 뿐이에요.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {PAIN_POINTS.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '26px 22px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--accent-red-soft)',
                    border: '1px solid rgba(199,62,62,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} color="var(--accent-red)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③ SOLUTION — 마이즈너 테크닉                              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
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
                { Icon: Users, n: '01', t: '레피티션', d: '상대 관찰 · 즉흥 반응' },
                { Icon: Zap, n: '02', t: '액티비티', d: '집중력 · 몰입 훈련' },
                { Icon: FileText, n: '03', t: '텍스트 분석', d: '인물의 진짜 욕구 해석' },
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
      {/* ④ STATS                                                    */}
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
      {/* ⑤ DIRECTOR — 강사 크레딧 구체화 + 인라인 CTA              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
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
                <div className="director-cred">
                  LA Meisner Technique Studio 정식 2년 과정 수료
                </div>
                <div className="director-cred">Disney+ 무빙 시즌2 조연 출연 (2024)</div>
                <div className="director-cred">SBS 중증외상센터 조연 출연 (2024)</div>
                <div className="director-cred">2022~2026 400명 이상 배우 직접 코칭</div>
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
      {/* ⑥ PROOF — 후기 (신뢰도 보강) + 인라인 CTA                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '100px 0' }}>
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
            {REVIEWS.map(({ text, author, meta }) => (
              <div key={author} className="testimonial-card">
                <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      color="#F59E0B"
                      fill="#F59E0B"
                      strokeWidth={1.3}
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
                <div className="testimonial-class">{meta}</div>
              </div>
            ))}
          </div>

          {/* 인라인 CTA */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <a
              href="#form"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--navy)',
                borderBottom: '1px solid var(--navy)',
                padding: '4px 0',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              나도 이 방법으로 바꿔보기
              <ArrowRight size={14} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑦ CURRICULUM — 4개월 로드맵                               */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
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
                <div className="step-icon-glow" style={{ marginBottom: '20px' }}>
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
      {/* ⑧ COMPARISON                                                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '100px 0' }}>
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
                        <X size={18} color="var(--gray)" strokeWidth={2.2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        row.normal
                      )}
                    </td>
                    <td className="kd4-col">
                      {row.kd4 === 'O' ? (
                        <Check size={18} color="var(--navy)" strokeWidth={2.2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
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
      {/* ⑨ OFFER — 가격 + 카운트다운 + Anchor Price 배지           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
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
              잔여 <strong style={{ color: 'var(--navy)' }}>{TOTAL_SEATS}석</strong> · <strong style={{ color: 'var(--accent-red)' }}>첫 달만</strong> 10만원 할인 (2개월 차부터 정상가)
            </p>
          </div>

          {/* 할인 배지 (첫 달만 할인) */}
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto 24px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: 'var(--accent-red-soft)',
                border: '1px solid rgba(199,62,62,0.25)',
                borderRadius: 'var(--radius)',
                padding: '10px 20px',
                fontSize: '0.88rem',
                color: 'var(--accent-red)',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              첫 달 {FIRST_MONTH_DISCOUNT.toLocaleString()}원 할인
            </div>
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
                color: 'var(--accent-red)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={13} strokeWidth={1.8} />
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
              <div key={cls.nameKo} className="class-card" style={{ position: 'relative' }}>
                {/* 잔여석 뱃지 — 우측 상단 */}
                {cls.remainingSeats !== undefined && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--accent-red)',
                      background: 'var(--accent-red-soft)',
                      border: '1px solid rgba(199,62,62,0.25)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: 'var(--accent-red)',
                        display: 'inline-block',
                      }}
                    />
                    잔여석 {cls.remainingSeats}석
                  </span>
                )}

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
                </div>
                <div className="class-card-footer">
                  {/* 첫 달 할인가 (강조) */}
                  <div style={{ marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.68rem',
                        letterSpacing: '0.12em',
                        color: 'var(--accent-red)',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      첫 달
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span className="class-price">
                        {cls.price}<span>원</span>
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
                  </div>

                  {/* 2개월 차부터 정상가 */}
                  {cls.originalPrice && (() => {
                    const months = parseInt(cls.course?.match(/\d+/)?.[0] ?? '1')
                    if (months <= 1) return null
                    return (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--gray-light)',
                          marginBottom: '10px',
                          paddingTop: '8px',
                          borderTop: '1px dashed var(--border)',
                        }}
                      >
                        2~{months}개월 차 {cls.originalPrice}원/월 (정상가)
                      </p>
                    )
                  })()}

                  {/* 코스 총액 (첫달 할인 반영) */}
                  {cls.course && (() => {
                    const months = parseInt(cls.course.match(/\d+/)?.[0] ?? '1')
                    const first = parseInt(cls.price.replace(/,/g, ''))
                    const regular = cls.originalPrice
                      ? parseInt(cls.originalPrice.replace(/,/g, ''))
                      : first
                    const total = first + regular * (months - 1)
                    const isFourMonths = months === 4
                    const lumpSumDiscount = 50000
                    const lumpSumPrice = total - lumpSumDiscount
                    return (
                      <>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-light)', marginBottom: '6px' }}>
                          {cls.course} 총{' '}
                          <strong style={{ color: 'var(--navy)' }}>
                            {total.toLocaleString()}원
                          </strong>
                          {' '}· 기본 월납
                        </p>
                        {isFourMonths && (
                          <p
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--accent-red)',
                              marginBottom: '6px',
                              fontWeight: 600,
                            }}
                          >
                            일시불 결제 시 5만원 추가 할인 →{' '}
                            <strong>{lumpSumPrice.toLocaleString()}원</strong>
                          </p>
                        )}
                      </>
                    )
                  })()}
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                    {cls.schedule} · {cls.duration} · 정원 {cls.capacity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <a href="#form" className="btn-primary" style={{ background: 'var(--navy)', color: '#ffffff' }}>
              무료 상담 신청하기
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑩ FAQ                                                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: '100px 0' }}>
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
      {/* ⑪ RISK REVERSAL — 신규 (Form 직전 리스크 제거)            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">09 — OUR PROMISE</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: '16px' }}
            >
              상담만 받아도 괜찮아요
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              부담 없는 30분 대화. 본인에게 맞는지 확인만 하고 가셔도 됩니다.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {GUARANTEES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(21,72,138,0.08)',
                    border: '1px solid rgba(21,72,138,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑫ FORM — 신청 폼                                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="form"
        className="section"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
          padding: '100px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p className="section-eyebrow">10 — START HERE</p>
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
      {/* ⑬ FOOTER 안심 문구                                         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '60px 0 40px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
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
              <MessageCircle size={14} strokeWidth={2.2} />
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
