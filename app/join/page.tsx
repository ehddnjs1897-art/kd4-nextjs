import type { Metadata } from 'next'
import { Fragment } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  Users,
  Award,
  TrendingUp,
  Flame,
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
} from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { FAQ_ITEMS } from '@/lib/faq-items'
import StickyTopBar from '@/components/join/StickyTopBar'
import JoinCTALink from '@/components/join/JoinCTALink'

/* 폴드 아래 / 비즈니스 크리티컬하지 않은 컴포넌트 — 지연 로딩 */
const JoinPageView = dynamic(() => import('@/components/analytics/JoinPageView'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const StickyBottomCTA = dynamic(() => import('@/components/join/StickyBottomCTA'))
const ScrollDepth = dynamic(() => import('@/components/analytics/ScrollDepth'))
const CountdownTimer = dynamic(() => import('@/components/ui/CountdownTimer'))
const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

export const metadata: Metadata = {
  title: '무료 상담 신청 | KD4 액팅 스튜디오',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 봄맞이 첫 달 10만원 할인. 서울 신촌.',
  robots: { index: false, follow: false },
}

/* ── 상수 ────────────────────────────────────────────────────────── */
/* 강사 사진은 DIRECTOR.photo 참조 (/director.jpg) — Director 섹션용 */
const DEADLINE = '2026-05-20T23:59:59'  // 5월 모집 마감 (날짜 확정 시 업데이트)

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.highlight)
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* Sticky 상단 모집 중 반 (기수 정보 포함) */
const OPEN_COHORTS = [
  { name: '마이즈너', cohort: '3기', seats: MAIN_CLASS.remainingSeats ?? 0, price: parseInt(MAIN_CLASS.price.replace(/,/g, '')) },
  { name: '출연영상', cohort: '19기', seats: FILM_CLASS.remainingSeats ?? 0, price: parseInt(FILM_CLASS.price.replace(/,/g, '')) },
]

/* 첫 달 할인액 (Anchor Price 시각화) */
const FIRST_MONTH_DISCOUNT = 100000

/* ── 할인 혜택 목록 ─────────────────────────────────────────── */
const DISCOUNTS = [
  {
    tag: '신규 멤버 웰컴',
    title: '첫 달 10만원 할인',
    desc: '또는 무료 오픈클래스 중 택1 · 신규 등록 시 적용',
    isNew: false,
  },
  {
    tag: '휴면 멤버 웰컴백',
    title: '첫 달 5만원 할인',
    desc: '6개월 이상 휴면 후 복귀 시 적용',
    isNew: false,
  },
  {
    tag: '출연영상·심화 클래스 할인',
    title: '출연영상 · 심화 클래스 30% 할인',
    desc: '출연영상 2회 이상 수강 배우 적용',
    isNew: false,
  },
  {
    tag: '지인 동반 할인',
    title: '함께 등록 시 1+1 · 두 분 모두 3만원 할인',
    desc: '지인과 동반 등록 시 두 분 각각 3만원씩 할인',
    isNew: true,
  },
  {
    tag: '출연영상 재수강 할인',
    title: '2회차부터 각 3만원 할인',
    desc: '회차당 40만원 → 37만원 · 3개월 간 (총 9만원 할인)',
    isNew: true,
  },
]

/* ── 커리큘럼 6단계 로드맵 ─────────────────────────────────── */
const CURRICULUM = [
  {
    Icon: Flame,
    num: '01',
    step: 'STEP 01',
    title: '아메리칸 액팅 메소드\n트레이닝',
    desc: '마이즈너 테크닉 · 이바나 처벅 테크닉 기반의 심층 연기 훈련',
  },
  {
    Icon: Film,
    num: '02',
    step: 'STEP 02',
    title: '포트폴리오 제작',
    desc: '전문 영화팀과 함께하는 실전 출연영상 포트폴리오',
  },
  {
    Icon: Handshake,
    num: '03',
    step: 'STEP 03',
    title: '캐스팅 연계',
    desc: '캐스팅 디렉터 · 인물 조감독과 직접 연결되는 실전 캐스팅 지원',
  },
]

/* ── 비교표 ────────────────────────────────────────────────── */
const COMPARISON_ROWS: { label: string; normal: string; kd4: string }[] = [
  { label: '1인 피드백 시간', normal: '회당 5~10분', kd4: '회당 30분+' },
  { label: '정원', normal: '15~25명', kd4: '6~8명' },
  { label: '수업 길이', normal: '1.5~2시간', kd4: '4시간' },
  { label: '강사', normal: '전임 강사 중심', kd4: '전문 액팅코치' },
  { label: '포트폴리오 제작', normal: '별도 과정 · 유료', kd4: '정규 과정 포함' },
  { label: '캐스팅 수수료', normal: '10~30%', kd4: '수수료 없음 · 직접 연결' },
  { label: '월 수강료', normal: '월 45~55만원', kd4: '월 32~37만원 · 최대 약 30%↓' },
]

/* ── 후기 마퀴 (2행 교차) ── */
const REVIEW_MARQUEE_ROW1 = [
  { text: '내 의지로 만들어진 연기가 아니라 의식 깊은 곳에서 건드려진 감정이 자연스럽게 뱉어지는 경험을 했습니다.', author: '강*경' },
  { text: '카메라 앞에서든 무대 위에서든 진짜로 숨쉴 수 있는 방법의 물꼬를 터준 수업.', author: '김*일' },
  { text: '안 보이던 업계의 길이 보였습니다. 현역 배우가 현실적으로 설명해주는 곳.', author: '한*윤' },
]
const REVIEW_MARQUEE_ROW2 = [
  { text: '여러 연기 워크샵을 다녀봤지만 가장 의미있는 시간이었다.', author: '허*' },
  { text: '다시 대사를 뱉어보니 색다른 감정들이 저를 휘몰아치게 하더라고요.', author: '조*건' },
  { text: '5시간 동안 여섯 명을 한 명 한 명 집중해주셨어요. 학원에서 배울 수 없는 것들을 얻어간 귀중한 시간.', author: '김*지' },
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
    title: '상담만 받아도 영업기밀 공개',
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
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', wordBreak: 'keep-all' }}
          >
            캐스팅 디렉터 · 인물 조감독 공식 협업 아카데미
          </p>

          <h1
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.55rem, 4.2vw, 2.8rem)',
              color: '#ffffff',
              lineHeight: 1.4,
              marginBottom: '28px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            수업이 끝이 아닙니다.
            <br />
            <span
              style={{
                color: '#ffffff',
                borderBottom: '2px solid var(--navy-accent)',
                paddingBottom: '2px',
              }}
            >
              캐스팅까지 연결합니다.
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)',
              color: 'rgba(255,255,255,0.86)',
              lineHeight: 1.65,
              marginBottom: '10px',
              maxWidth: '520px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            현직 배우 100명이 수료한 인증된 시그니처 클래스
            <br />
            권동원 대표 직강 (연기상 수상)
          </p>
          <p
            style={{
              fontSize: 'clamp(0.8rem, 2vw, 0.88rem)',
              color: 'rgba(255,255,255,0.50)',
              lineHeight: 1.75,
              marginBottom: '6px',
              maxWidth: '460px',
              marginLeft: 'auto',
              marginRight: 'auto',
              letterSpacing: '0.03em',
            }}
          >
            6~8명 소수정예 · 연기 경험 없어도 OK
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
              fireLead
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
              fireLead
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
          <p
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.62)',
              marginTop: '14px',
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            마이즈너 정규 클래스 35만원 → 첫 달 <strong style={{ color: '#fff' }}>25만원</strong> · 잔여 3석
          </p>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.35)',
              marginTop: '6px',
              textAlign: 'center',
            }}
          >
            * 첫 달 10만원 할인 or 무료 오픈클래스 — 둘 중 하나 선택
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ① WHO NEEDS — 자기인식 페르소나 (Hero 직후 게이트)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(64px, 12vw, 100px) 0',
          background: 'var(--bg)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">WHO NEEDS KD4</p>
            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.4rem, 3.6vw, 2.2rem)',
                lineHeight: 1.45,
                marginBottom: '12px',
                wordBreak: 'keep-all',
              }}
            >
              이런 배우에게 필요합니다
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              하나라도 해당된다면, KD4가 답이 될 수 있습니다
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {[
              '연기의 본질을 제대로 배우고 싶은 분',
              '활동의 한계에 부딪힌 배우',
              '열심히 하지만 달라지는 게 없는 배우',
              '억지로 짜내는 연기에서 벗어나고 싶은 배우',
              '출연영상이 없어서 캐스팅 기회를 놓치는 배우',
            ].map((item, i) => (
              <div
                key={item}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '20px 22px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(21,72,138,0.1)',
                    border: '1px solid rgba(21,72,138,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  <Check size={14} color="var(--navy)" strokeWidth={2.6} />
                </span>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.55, wordBreak: 'keep-all' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ② KD4 고유 자산 — 3년이 만든 캐스팅 연계 시스템           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(64px, 12vw, 100px) 0',
          background: 'var(--bg2)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — KD4 ONLY</p>
            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.4rem, 3.6vw, 2.2rem)',
                lineHeight: 1.45,
                marginBottom: '14px',
                wordBreak: 'keep-all',
              }}
            >
              KD4를 선택해야 하는 이유
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              3년간 만들어온 KD4만의 캐스팅 연계 시스템
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
            {([
              {
                Icon: Handshake,
                title: '캐스팅 디렉터 공식 협업',
                desc: '방진원·이상원 캐스팅 디렉터와 정기 오디션·캐스팅 연계.',
              },
              {
                Icon: Film,
                title: '전문 영화팀 출연영상',
                desc: '현직 배우 100여 명이 거쳐간 시그니처 클래스. 완성된 출연영상 한 편이 실제 캐스팅으로 연결됩니다.',
              },
              {
                Icon: Users,
                title: '배우 DB 시스템',
                desc: 'kd4.club 배우 데이터베이스. 수료 후 자동 등록되며 캐스팅팀이 실제로 조회합니다.',
              },
            ] as const).map(({ Icon, title, desc }) => (
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
                    background: 'rgba(21,72,138,0.08)',
                    border: '1px solid rgba(21,72,138,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} color="var(--navy)" strokeWidth={1.8} />
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
      {/* ② COMPARE — 공장식 학원 vs KD4                           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — COMPARE</p>
            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                marginBottom: '14px',
                wordBreak: 'keep-all',
              }}
            >
              공장식 학원 vs <span style={{ color: 'var(--navy)' }}>KD4</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              같은 연기 수업이 아닙니다. 배우를 대하는 방식부터 다릅니다.
            </p>
          </div>

          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '6px 16px',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              color: 'var(--gray)', textAlign: 'center',
            }}>
              <span />
              <span>대형 학원</span>
              <span style={{ color: 'var(--navy)' }}>KD4</span>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                alignItems: 'center',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '14px 16px',
              }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>{row.label}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--gray)', textAlign: 'center' }}>
                  {row.normal === 'X'
                    ? <X size={16} color="var(--gray)" strokeWidth={2.2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                    : row.normal}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 700, textAlign: 'center' }}>
                  {row.kd4 === 'O'
                    ? <Check size={16} color="var(--navy)" strokeWidth={2.2} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                    : row.kd4}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③ SOLUTION — 마이즈너 테크닉 (영상 임베드)                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — THE METHOD</p>
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

            {/* 마이즈너 핵심 3요소 — REPETITION / CAMERA / VS OTHER METHODS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '40px',
                textAlign: 'left',
              }}
            >
              {[
                {
                  label: 'REPETITION',
                  title: 'Repetition 훈련',
                  desc: '두 배우가 상대를 관찰하며 말과 행동을 반복·반응하는 핵심 훈련. 감정을 혼자 만들지 않고, 상대에게서 촉발된 충동에 반응합니다.',
                },
                {
                  label: 'CAMERA',
                  title: '카메라 연기에 최적화',
                  desc: '마이즈너 테크닉은 과장 없이 미세한 반응으로 진실을 담는 방식입니다. 무대 연기와 달리 클로즈업 카메라 앞에서 오히려 더 강력합니다.',
                },
                {
                  label: 'INSTINCT',
                  title: '연기하지 않는 연기',
                  desc: '머리로 짜낸 틀에 박힌 연기가 아닙니다. 자신의 충동에서 시작되는 살아있는 연기 — 연기하지 않는 연기를 만듭니다.',
                },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '24px 22px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.2em',
                      color: 'var(--navy)',
                      textTransform: 'uppercase',
                      marginBottom: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </p>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.02rem',
                      fontWeight: 700,
                      color: 'var(--navy)',
                      marginBottom: '10px',
                      lineHeight: 1.4,
                      wordBreak: 'keep-all',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--gray-light)',
                      lineHeight: 1.7,
                      wordBreak: 'keep-all',
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* YouTube 영상 임베드 — 16:9 반응형 (클릭 시 로드) */}
            <YouTubeFacade
              videoId="6crvxRnBerk"
              title="마이즈너 테크닉 — KD4 액팅 스튜디오"
              containerStyle={{
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 28px rgba(21,72,138,0.12)',
                border: '1px solid var(--border)',
                background: 'var(--bg2)',
              }}
            />
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
              { Icon: Award, num: '50건+', label: '캐스팅 연계', sub: undefined },
              { Icon: Users, num: '400명+', label: '누적 코칭', sub: undefined },
              { Icon: TrendingUp, num: '100편+', label: '디즈니·넷플릭스·tvN', sub: '출연 작품' },
            ].map(({ Icon, num, label, sub }) => (
              <div key={num} className="stats-card">
                <div className="stats-icon-wrap">
                  <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <div className="stat-num">{num}</div>
                <div className="stat-label">{label}</div>
                {sub && (
                  <div style={{ fontSize: '0.62rem', color: 'var(--gray)', marginTop: '2px' }}>
                    {sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑦ CURRICULUM — 6단계 훈련 과정 (감정 해방 → 캐스팅 연계) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 48px', textAlign: 'center' }}>
            <p className="section-eyebrow">04 — CURRICULUM</p>
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
          </div>

          {/* 3단계 도식 — 메인 페이지 ALL IN ONE SYSTEM과 일관 */}
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <div className="steps-journey">
              {CURRICULUM.map((s, i) => (
                <Fragment key={s.num}>
                  <div
                    className="step-card"
                    style={{
                      position: 'relative',
                      background: 'var(--bg2)',
                      border: s.num === '03' ? '1px solid var(--navy)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: 'clamp(40px, 6vw, 56px) clamp(20px, 4vw, 36px) clamp(36px, 5vw, 48px)',
                      textAlign: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 대형 배경 숫자 */}
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '20px',
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                        fontWeight: 700,
                        color: 'rgba(21,72,138,0.08)',
                        lineHeight: 1,
                        userSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      {s.num}
                    </span>

                    {/* STEP 라벨 */}
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
                        letterSpacing: '0.2em',
                        fontWeight: 700,
                        color: 'var(--navy)',
                        marginBottom: '14px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.step}
                    </p>

                    {/* 아이콘 */}
                    <div
                      className="step-icon-glow"
                      style={{ margin: '0 auto 18px' }}
                    >
                      <s.Icon size={26} color="var(--navy)" strokeWidth={1.6} />
                    </div>

                    {/* 제목 */}
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(1rem, 2.3vw, 1.2rem)',
                        fontWeight: 700,
                        marginBottom: '12px',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-line',
                        wordBreak: 'keep-all',
                      }}
                    >
                      {s.title}
                    </h3>

                    {/* 설명 */}
                    <p
                      style={{
                        fontSize: 'clamp(0.78rem, 1.7vw, 0.88rem)',
                        color: 'var(--gray-light)',
                        lineHeight: 1.7,
                        wordBreak: 'keep-all',
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>

                  {/* 화살표 (마지막 제외) */}
                  {i < CURRICULUM.length - 1 && (
                    <div className="step-journey-arrow" aria-hidden>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10h12M11 5l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑨ OFFER — 가격 + 카운트다운 + Anchor Price 배지           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — SPRING SPECIAL</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              🌸 봄맞이 스페셜
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--accent-red)' }}>첫 달 10만원 할인</strong>
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

                  {/* 코스 총액 (첫달 할인 반영) */}
                  {cls.course && (() => {
                    const months = parseInt(cls.course.match(/\d+/)?.[0] ?? '1')
                    const first = parseInt(cls.price.replace(/,/g, ''))
                    const regular = cls.originalPrice
                      ? parseInt(cls.originalPrice.replace(/,/g, ''))
                      : first
                    const total = first + regular * (months - 1)
                    const lumpSumDiscount = cls.lumpSumDiscount ?? 50000
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

          {/* 할인 혜택 목록 */}
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto 36px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            {DISCOUNTS.map(({ tag, title, desc, isNew }, i) => (
              <div
                key={tag}
                style={{
                  padding: '18px 20px',
                  borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                }}
              >
                <div style={{ marginBottom: '6px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isNew ? '#ffffff' : 'var(--navy)',
                      background: isNew ? 'var(--accent-red)' : 'rgba(21,72,138,0.1)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                    }}
                  >
                    {tag}
                    {isNew && ' · NEW'}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                    fontWeight: 700,
                    marginBottom: '3px',
                    lineHeight: 1.3,
                    wordBreak: 'keep-all',
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-light)', lineHeight: 1.5 }}>
                  {desc}
                </p>
              </div>
            ))}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <JoinCTALink
                href="#form"
                location="offer_discount"
                label="지금 신청하기"
                fireLead
                className="btn-primary"
                style={{ background: 'var(--navy)', color: '#ffffff', width: '100%', justifyContent: 'center' }}
              >
                지금 신청하기
                <ArrowRight size={15} strokeWidth={2.2} />
              </JoinCTALink>
              <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '8px' }}>
                * 5월까지 · 선착순 마감 시 조기 종료
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <JoinCTALink
              href="#form"
              location="offer_bottom"
              label="무료 상담 신청"
              fireLead
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
      {/* ⑦.5 PORTFOLIO — 출연영상 결과물                            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg2)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 48px', textAlign: 'center' }}>
            <p className="section-eyebrow">06 — PORTFOLIO</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              KD4 배우들의{' '}
              <span style={{ color: 'var(--gold)' }}>실제 출연영상</span>
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--gray-light)',
                lineHeight: 1.7,
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              전문 영화팀과 함께 제작한 포트폴리오입니다.
              <br />
              이 영상으로 캐스팅이 연결됩니다.
            </p>
          </div>

          {/* 2-column video grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: 'clamp(16px, 3vw, 28px)',
              maxWidth: '980px',
              margin: '0 auto',
            }}
          >
            {([
              { youtubeId: '7Q62XeyVLbc', genre: '드라마', subtitle: '단편 「여배우들」', cohort: '심화 1기' },
              { youtubeId: '4XTm59jydSA', genre: '스릴러', subtitle: '단편 「싸이코패스」', cohort: '출연영상 3기' },
              { youtubeId: 'Cr4-qwVDkBc', genre: '드라마', subtitle: '단편 「각자의 이유」', cohort: '심화 1기' },
            ] as const).map(({ youtubeId, genre, subtitle, cohort }) => (
              <div key={youtubeId}>
                {/* 장르 뱃지 */}
                <div style={{ marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--navy)',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.2)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                    }}
                  >
                    <Film size={11} strokeWidth={2} />
                    {genre}
                  </span>
                </div>

                {/* 영상 임베드 — 클릭 시 로드 */}
                <YouTubeFacade
                  videoId={youtubeId}
                  title={`${genre} — ${subtitle}`}
                  containerStyle={{
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 32px rgba(21,72,138,0.14)',
                    border: '1px solid var(--border)',
                    background: '#0a0a0a',
                    marginBottom: '14px',
                  }}
                />

                {/* 캡션 */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: '#111111',
                  }}
                >
                  {subtitle}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-light)' }}>
                  {cohort}
                </p>
              </div>
            ))}
          </div>

          {/* 플레이리스트 링크 */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <a
              href="https://youtube.com/playlist?list=PLMbZlnkLfP7iaE41p_g9dzGKp5eU9VZk2"
              target="_blank"
              rel="noopener noreferrer"
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
              출연영상 포트폴리오 전체 보기
              <ArrowRight size={14} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑤ DIRECTOR — 강사 크레딧 구체화 + 인라인 CTA              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">07 — THE LEADER</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '12px' }}
            >
              배우의 성장을 가이드합니다
            </h2>
            <p
              style={{
                fontSize: 'clamp(0.82rem, 2.2vw, 0.98rem)',
                color: 'var(--gray-light)',
                lineHeight: 1.6,
                margin: 0,
                wordBreak: 'keep-all',
                whiteSpace: 'nowrap',
              }}
            >
              전문 액팅코치가 배우의 성장을 촉진시킵니다.
            </p>
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
      <section className="section" style={{ background: 'var(--bg2)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">08 — REAL REVIEWS</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: 0 }}
            >
              배우들의 솔직한 후기
            </h2>
          </div>

          {/* 마퀴 1행: 왼쪽으로 */}
          <div className="review-marquee" style={{ marginBottom: '12px' }}>
            <div className="review-marquee-track">
              {[...REVIEW_MARQUEE_ROW1, ...REVIEW_MARQUEE_ROW1].map((r, i) => (
                <div key={i} style={{ flex: '0 0 auto', width: '320px', padding: '20px 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', marginRight: '14px' }}>
                  <p style={{ fontSize: '0.86rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: '10px' }}>&ldquo;{r.text}&rdquo;</p>
                  <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>— {r.author}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 마퀴 2행: 오른쪽으로 */}
          <div className="review-marquee reverse">
            <div className="review-marquee-track">
              {[...REVIEW_MARQUEE_ROW2, ...REVIEW_MARQUEE_ROW2].map((r, i) => (
                <div key={i} style={{ flex: '0 0 auto', width: '320px', padding: '20px 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', marginRight: '14px' }}>
                  <p style={{ fontSize: '0.86rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: '10px' }}>&ldquo;{r.text}&rdquo;</p>
                  <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>— {r.author}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 인라인 CTA */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <JoinCTALink
              href="#form"
              location="inline_proof"
              label="나도 진짜 배우로 · 무료 상담 신청"
              fireLead
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
      <section className="section" style={{ background: 'var(--bg2)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">09 — FAQ</p>
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
      <section className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">10 — OUR PROMISE</p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: 0 }}
            >
              상담만 받아도 괜찮아요
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              /* 모바일 1열 (세로) · 태블릿 이상 3열 — 카드는 컴팩트 */
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '12px',
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
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(21,72,138,0.08)',
                    border: '1px solid rgba(21,72,138,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(0.88rem, 2.3vw, 1rem)',
                    fontWeight: 700,
                    marginBottom: '4px',
                    lineHeight: 1.35,
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: 'clamp(0.68rem, 1.85vw, 0.85rem)',
                    color: 'var(--gray-light)',
                    lineHeight: 1.6,
                  }}
                >
                  {desc}
                </p>
                </div>
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
          padding: 'clamp(64px, 12vw, 100px) 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p className="section-eyebrow">11 — CONTACT</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: '10px' }}
              >
                무료 상담 신청
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                24시간 이내 카카오 채널을 통해 연락드립니다.
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
              fireLead
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
