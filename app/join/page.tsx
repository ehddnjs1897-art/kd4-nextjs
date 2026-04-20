import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Users,
  Award,
  TrendingUp,
  Flame,
  Repeat,
  Zap,
  FileText,
  Film,
  Handshake,
  Check,
  X,
  ArrowRight,
  MessageCircle,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Camera,
  Moon,
  HelpCircle,
} from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { FAQ_ITEMS } from '@/lib/faq-items'
import JoinForm from '@/components/contact/JoinForm'
import CountdownTimer from '@/components/ui/CountdownTimer'
import StickyTopBar from '@/components/join/StickyTopBar'
import StickyBottomCTA from '@/components/join/StickyBottomCTA'
import FaqAccordion from '@/components/join/FaqAccordion'
import JoinCTALink from '@/components/join/JoinCTALink'
import ScrollDepth from '@/components/analytics/ScrollDepth'
import JoinPageView from '@/components/analytics/JoinPageView'
import ReviewGrid from '@/components/join/ReviewGrid'
import type { ReviewItem } from '@/components/join/ReviewLightbox'

export const metadata: Metadata = {
  title: '무료 상담 신청 | KD4 액팅 스튜디오',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 봄맞이 첫 달 10만원 할인. 서울 신촌.',
  robots: { index: false, follow: false },
}

/* ── 상수 ────────────────────────────────────────────────────────── */
/* Hero 배경 이미지 — KD4 text logo (브랜드 아이덴티티) */
const HERO_IMG = '/text-logo.png'
/* 강사 사진은 DIRECTOR.photo 참조 (/director.jpg) — Director 섹션용 */
const STUDIO_IMG =
  'https://drive.google.com/uc?export=view&id=1by0ZDO3J5yS-44McKbmAPixjPtI3xWNr'
const DEADLINE = '2026-04-23T23:59:59'  // 3일 남음

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.highlight)
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* Sticky 상단 모집 중 반 (기수 정보 포함) */
const OPEN_COHORTS = [
  { name: '마이즈너 정규', cohort: '3기', seats: MAIN_CLASS.remainingSeats ?? 0 },
  { name: '출연영상', cohort: '19기', seats: FILM_CLASS.remainingSeats ?? 0 },
]

/* 첫 달 할인액 (Anchor Price 시각화) */
const FIRST_MONTH_DISCOUNT = 100000

/* ── Agitation 관찰형 체크리스트 3개 ────────────────────────── */
const PAIN_POINTS = [
  {
    Icon: Camera,
    title: '연습실과 현장은 다르다',
    desc: '준비한 연기가 카메라 앞에선 무너집니다.',
  },
  {
    Icon: Moon,
    title: '어렵게 잡은 오디션, 무소식',
    desc: '매번 어렵게 받은 기회, 돌아오는 답은 없습니다.',
  },
  {
    Icon: HelpCircle,
    title: '내 연기의 문제를 모른다',
    desc: '찍어놓고 봐도 뭐가 어색한지 감이 안 옵니다.',
  },
]

/* ── 커리큘럼 6단계 로드맵 ─────────────────────────────────── */
const CURRICULUM = [
  {
    Icon: Flame,
    step: 'STEP 01',
    title: 'Emotional Release',
    subtitle: '감정 해방 · 충동·본능 회복',
    desc: '막혀있던 감정의 둑을 터뜨리는 첫 단계. 충동과 본능을 회복합니다.',
  },
  {
    Icon: Repeat,
    step: 'STEP 02',
    title: 'Repetition',
    subtitle: '레피티션 훈련',
    desc: '상대방의 말·표정·행동을 그대로 관찰하고 즉각 반응하는 훈련. 정답 연기를 버립니다.',
  },
  {
    Icon: Zap,
    step: 'STEP 03',
    title: 'Independent Activity',
    subtitle: '인디펜던트 액티비티',
    desc: '다양한 관계 상황을 설계해 연기의 본질을 경험하고, 어떤 현장에도 반응하는 연기 스펙트럼을 넓힙니다.',
  },
  {
    Icon: FileText,
    step: 'STEP 04',
    title: 'Text Analysis',
    subtitle: '텍스트 분석 · 메모라이징',
    desc: '이바나 처벅 테크닉을 접목해 심리학적 근거로 분석하고, 살아있는 연기·존재하는 연기로 향합니다.',
  },
  {
    Icon: Film,
    step: 'STEP 05',
    title: 'Final Portfolio',
    subtitle: '출연영상 촬영',
    desc: '전문 영화팀과 함께하는 포트폴리오(출연영상) 촬영. 요즘 캐스팅은 전부 출연영상으로 진행됩니다.',
  },
  {
    Icon: Handshake,
    step: 'AFTER COURSE',
    title: 'Casting',
    subtitle: '실전 캐스팅 연계',
    desc: '인물조감독·캐스팅디렉터 오디션에 직접 연결. 수료 후에도 이어지는 지원입니다.',
  },
]

/* ── 비교표 ────────────────────────────────────────────────── */
const COMPARISON_ROWS: { label: string; normal: string; kd4: string }[] = [
  { label: '1인 피드백 시간', normal: '회당 5~10분', kd4: '회당 30분+' },
  { label: '정원', normal: '15~25명', kd4: '6~8명' },
  { label: '수업 길이', normal: '1.5~2시간', kd4: '4시간' },
  { label: '강사', normal: '전임 강사 중심', kd4: '현역 배우 직강' },
  { label: '포트폴리오 제작', normal: '별도 과정 · 유료', kd4: '정규 과정 포함' },
  { label: '캐스팅 수수료', normal: '10~30%', kd4: '수수료 없음 · 직접 연결' },
  { label: '월 수강료', normal: '월 45~55만원', kd4: '월 32~37만원 · 최대 약 30%↓' },
]

/* ── 카톡 후기 6장 (하이브리드 B안: 썸네일 + 요약 + 라이트박스) ── */
const REVIEWS: ReviewItem[] = [
  {
    id: 'kang-yookyung',
    image: '/reviews/review-01.jpg',
    author: '강유경',
    cohort: '마이즈너 정규반',
    summary: '의식 깊은 곳 감정이 뱉어졌다',
    fullQuote:
      '내 의지로 만들어진 연기가 아니라 의식 깊은 곳에서 건드려진 감정이 자연스럽게 뱉어지는 경험을 했습니다.',
  },
  {
    id: 'kim-gwangil',
    image: '/reviews/review-02.jpg',
    author: '김광일',
    cohort: '마이즈너 정규반',
    summary: "카메라 앞 '진짜로' 숨쉬는 법",
    fullQuote:
      '좀 더 솔직하고 진짜 내가 느끼고 있는 감정을 표현해내고 있었다. 카메라 앞에서든 무대 위에서든 꾸며진 가짜의 환경 속에서 조금이나마 더 진짜로 숨쉴 수 있는 방법의 물꼬를 터준 수업.',
  },
  {
    id: 'han-gayoon',
    image: '/reviews/review-03.jpg',
    author: '한가윤',
    cohort: '마이즈너 정규반',
    summary: '안 보이던 업계의 길이 보였다',
    fullQuote:
      '실제 업계에 있으신 배우 권동원 대표님이 현재 업계가 어떻게 돌아가고 있는지 시스템을 현실적이고 구체적으로 설명해주셔서 안 보이던 길이 보입니다.',
  },
  {
    id: 'heo-geon',
    image: '/reviews/review-04.png',
    author: '허건',
    cohort: '마이즈너 정규반',
    summary: '여러 워크샵 중 가장 의미있었다',
    fullQuote:
      '하나로 정하고 고정하는 연기가 아닌, 자유로운 탐구로 다양한 길을 열어가는 연기를 직접 경험해볼 수 있어서 나름 여러 연기 워크샵을 다녀봤지만 가장 의미있는 시간이었다.',
  },
  {
    id: 'jo-mingun',
    image: '/reviews/review-05.png',
    author: '조민건',
    cohort: '마이즈너 정규반',
    summary: '대사 뱉자 색다른 감정이 휘몰아쳤다',
    fullQuote:
      '오늘은 허심탄회하게 제 마음을 다 드러낸 거 같아요. 그러고나서 다시 대사를 뱉어보니 색다른 감정들이 저를 휘몰아치게 하더라고요.',
  },
  {
    id: 'kim-suji',
    image: '/reviews/review-06.jpg',
    author: '김수지',
    cohort: '마이즈너 정규반',
    summary: '5시간, 6명, 한 명 한 명 케어',
    fullQuote:
      '5시간 여 동안 거의 쉬지 않고 여섯 명을 한 명 한 명 집중해주셨고 프로필도 한 명 한 명 자세하게 봐주셨습니다! 학원에서 배울 수 없는 것들을 얻어간 귀중한 시간이었습니다!',
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
    title: '첫 수업 이후 불만족 시 전액 환불',
    desc: '한 번 수업을 경험해보시고 결정하셔도 됩니다.',
  },
  {
    Icon: FileText,
    title: '상담만 받아도 배우 영업기밀 공개',
    desc: '프로필·출연영상·캐스팅디렉터·에이전시 자료 전부 제공.',
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
      <StickyTopBar deadline={DEADLINE} cohorts={OPEN_COHORTS} />

      {/* 분석: 랜딩 ViewContent + 스크롤 깊이 추적 (GA4 + Meta Pixel) */}
      <JoinPageView />
      <ScrollDepth />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ① HERO — 강사 사진 + 세리프 헤드라인                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          minHeight: '560px',
          overflow: 'hidden',
          background: 'var(--navy)',
        }}
      >

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
            ACTOR ACCELERATING SYSTEM · 무료 상담
          </p>

          <h1
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.8rem, 4.8vw, 2.8rem)',
              color: '#ffffff',
              lineHeight: 1.35,
              marginBottom: '28px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            오디션 결과가 없다면,
            <br />
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
            6~8명 소수정예 · 연기상 수상 배우 직강
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <JoinCTALink
              href="#form"
              location="hero"
              label="무료 상담 신청"
              className="btn-primary"
              style={{ background: 'var(--navy)', color: '#ffffff' }}
            >
              무료 상담 신청
              <ArrowRight size={16} strokeWidth={2.2} />
            </JoinCTALink>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="hero"
              label="카카오로 문의하기"
              className="btn-outline"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <MessageCircle size={14} strokeWidth={2.2} />
              카카오로 문의하기
            </JoinCTALink>
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
              노력은 쌓이는데, 결과가 쌓이지 않습니다
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
              방법이 틀리면 연습은 제자리걸음입니다.
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
      {/* ③ SOLUTION — 마이즈너 테크닉 (영상 임베드)                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — THE METHOD</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              <span style={{ color: 'var(--navy)' }}>마이즈너 테크닉</span>
            </h2>
            <p
              className="section-desc"
              style={{ margin: '0 auto 32px', textAlign: 'center', maxWidth: '520px' }}
            >
              감정을 만드는 것이 아니라, 상대에게 반응하는 훈련법입니다.
            </p>

            {/* Sanford Meisner 인용 블록 — 책 인용 + 사진 */}
            <figure
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 'clamp(28px, 5vw, 44px) clamp(24px, 4vw, 40px)',
                marginBottom: '40px',
                position: 'relative',
              }}
            >
              {/* 사진 — Group Theatre 1938 단체 사진 (공개 도메인) */}
              <div
                style={{
                  position: 'relative',
                  width: 'clamp(240px, 50vw, 420px)',
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                  filter: 'grayscale(0.1)',
                  boxShadow: '0 6px 24px rgba(21,72,138,0.12)',
                }}
              >
                <Image
                  src="/images/meisner-group-theatre-1938.jpg"
                  alt="Sanford Meisner with the Group Theatre, 1938"
                  fill
                  sizes="(max-width: 768px) 80vw, 420px"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
              </div>

              {/* 인용구 */}
              <blockquote
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(0.95rem, 2.4vw, 1.3rem)',
                  lineHeight: 1.55,
                  color: 'var(--navy)',
                  maxWidth: '720px',
                  textAlign: 'center',
                  margin: 0,
                  letterSpacing: '0.01em',
                  wordBreak: 'keep-all',
                }}
              >
                <span style={{ opacity: 0.35, fontSize: '1.4em', verticalAlign: '-0.15em', marginRight: '4px' }}>“</span>
                Acting is living truthfully under imaginary circumstances.
                <span style={{ opacity: 0.35, fontSize: '1.4em', verticalAlign: '-0.15em', marginLeft: '4px' }}>”</span>
              </blockquote>

              {/* 출처 */}
              <figcaption
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  color: 'var(--gray)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  lineHeight: 1.8,
                }}
              >
                — Sanford Meisner
                <span style={{ display: 'block', fontSize: '0.68rem', opacity: 0.7, marginTop: '2px', textTransform: 'none', letterSpacing: '0.02em', fontStyle: 'italic' }}>
                  Sanford Meisner on Acting (1987)
                </span>
              </figcaption>
            </figure>

            {/* YouTube 영상 임베드 — 16:9 반응형 */}
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 28px rgba(21,72,138,0.12)',
                border: '1px solid var(--border)',
                background: 'var(--bg2)',
              }}
            >
              <iframe
                src="https://www.youtube.com/embed/6crvxRnBerk"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="마이즈너 테크닉 — KD4 액팅 스튜디오"
                loading="lazy"
              />
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
              { Icon: Users, num: '300+', label: '배우 코칭' },
              { Icon: Award, num: '3년+', label: '스튜디오 운영' },
              { Icon: TrendingUp, num: '80명+', label: '현재 수강배우' },
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
            <div className="director-photo" style={{ position: 'relative' }}>
              <Image
                src={DIRECTOR.photo}
                alt={`${DIRECTOR.name} 대표`}
                fill
                sizes="(max-width: 768px) 100vw, 260px"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="director-name">{DIRECTOR.name}</div>
              <div className="director-role">{DIRECTOR.title}</div>
              <div className="director-creds">
                {DIRECTOR.highlights.map((line) => (
                  <div key={line} className="director-cred">
                    {line}
                  </div>
                ))}
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
                {DIRECTOR.quote}
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
            <p className="section-eyebrow">04 — REAL REVIEWS</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              KD4 배우 이야기
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--gray-light)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              KD4를 거친 배우들의 솔직한 후기
            </p>
          </div>

          <ReviewGrid reviews={REVIEWS} />

          {/* 인라인 CTA */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <JoinCTALink
              href="#form"
              location="inline_proof"
              label="나도 진짜 배우로 · 무료 상담 신청"
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
              나도 진짜 배우로 · 무료 상담 신청
              <ArrowRight size={14} strokeWidth={2.2} />
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑦ CURRICULUM — 6단계 훈련 과정 (감정 해방 → 캐스팅 연계) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: '100px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 48px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — CURRICULUM</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '10px' }}
            >
              배우지망생 → <span style={{ color: 'var(--gold)' }}>진짜 배우</span>
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.78rem',
                letterSpacing: '0.18em',
                color: 'var(--navy)',
                marginBottom: '14px',
                textTransform: 'uppercase',
              }}
            >
              단계별 훈련 과정
            </p>
            <p className="section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              클래스마다 세부 구성은 다르며, 아래는 대표적인 훈련 흐름입니다.
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
            {CURRICULUM.map(({ Icon, step, title, subtitle, desc }) => (
              <div
                key={step}
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
                  {step}
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
              style={{
                fontSize: 'clamp(1.7rem, 4vw, 2.5rem)',
                marginBottom: '14px',
                wordBreak: 'keep-all',
                whiteSpace: 'nowrap',
              }}
            >
              공장식 학원 vs <span style={{ color: 'var(--navy)' }}>KD4</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              같은 연기 수업이 아닙니다. 배우를 대하는 방식부터 다릅니다.
            </p>
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
              🌸 봄맞이 스페셜
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--accent-red)' }}>첫 달 10만원 할인</strong>
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.7, marginTop: '6px' }}>
              2개월 차부터 정상가 적용
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
                    잔여 {cls.remainingSeats}석
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
                    const lumpSumDiscount = 50000
                    const lumpSumPrice = total - lumpSumDiscount
                    return (
                      <>
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-light)', marginBottom: '6px' }}>
                          {cls.course} 총{' '}
                          <strong style={{ color: 'var(--navy)' }}>
                            {total.toLocaleString()}원
                          </strong>
                          {' '}· 기본 월납 (할부 가능)
                        </p>
                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--accent-red)',
                            marginBottom: '6px',
                            fontWeight: 600,
                          }}
                        >
                          한번에 결제 시 5만원 추가 할인 →{' '}
                          <strong>{lumpSumPrice.toLocaleString()}원</strong>
                        </p>
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
            <JoinCTALink
              href="#form"
              location="offer_bottom"
              label="무료 상담 신청"
              className="btn-primary"
              style={{ background: 'var(--navy)', color: '#ffffff' }}
            >
              무료 상담 신청
              <ArrowRight size={16} strokeWidth={2.2} />
            </JoinCTALink>
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
              <p className="section-eyebrow">10 — CONTACT</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: '10px' }}
              >
                무료 상담 신청
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                어떤 클래스가 맞는지 모르겠다면 — 부담 없이 문의하세요. 24시간 이내 카카오로 연락드립니다.
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
            개인정보는 상담 연락과 뉴스레터 발송에만 사용됩니다.
          </p>
          <div style={{ marginTop: '24px' }}>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="footer"
              label="카카오로 문의하기"
              className="btn-outline"
              style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
            >
              <MessageCircle size={14} strokeWidth={2.2} />
              카카오로 문의하기
            </JoinCTALink>
          </div>
          {/* 채널 유입 링크 — 관심 있는 유저 리텐션 (폼 도달 후 하단이라 주의 분산 리스크 낮음) */}
          <div
            style={{
              marginTop: '40px',
              paddingTop: '28px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.68rem',
                color: 'var(--gray-light)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              관심이 더 있다면
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                fontSize: 'clamp(0.78rem, 2.4vw, 0.88rem)',
              }}
            >
              {[
                { label: '인스타그램', href: 'https://www.instagram.com/kd4actingstudio' },
                { label: '유튜브', href: 'https://www.youtube.com/@kd4actingstudio' },
                { label: '블로그', href: 'https://blog.naver.com/kd4actingstudio' },
                { label: '카카오 채널', href: 'https://pf.kakao.com/_ximxdqn' },
              ].map((c, i, arr) => (
                <span
                  key={c.label}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                >
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--navy)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      padding: '2px 4px',
                    }}
                  >
                    {c.label}
                  </a>
                  {i < arr.length - 1 && (
                    <span style={{ color: 'var(--border)' }}>·</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* 주소 — 2줄 분리로 모바일 안정 */}
          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                color: 'var(--gray)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              KD4 ACTING STUDIO
            </p>
            <p
              style={{
                fontSize: '0.74rem',
                color: 'var(--gray-light)',
                letterSpacing: '0.01em',
              }}
            >
              서울시 서대문구 대현동 90-7 아리움3차 1F
            </p>
          </div>
        </div>
      </section>

      <StickyBottomCTA />
    </div>
  )
}
