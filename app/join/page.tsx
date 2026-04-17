import type { Metadata } from 'next'
import { CLASSES } from '@/lib/classes'
import JoinForm from '@/components/contact/JoinForm'
import CountdownTimer from '@/components/ui/CountdownTimer'
import StickyTopBar from '@/components/join/StickyTopBar'
import StickyBottomCTA from '@/components/join/StickyBottomCTA'

export const metadata: Metadata = {
  title: '무료 상담 신청 | KD4 액팅 스튜디오',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 봄맞이 첫 달 10만원 할인. 서울 신촌.',
  robots: { index: false, follow: false },
}

/* ── 상수 ─────────────────────────────────────────────────────────── */
const INSTRUCTOR_IMG =
  'https://drive.google.com/uc?export=view&id=1WfyN6x21sRLNzzNNYB-dBschGRzdEzUP'
const DEADLINE = '2026-04-30T23:59:59'

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const OPEN_CLASSES = CLASSES.filter((c) => c.isNewMemberOpen && c.highlight)
const TOTAL_SEATS = OPEN_CLASSES.reduce((s, c) => s + (c.remainingSeats ?? 0), 0)
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* ── 실제 후기 (app/page.tsx REVIEW_ITEMS 선별) ─────────────────── */
const REVIEWS = [
  {
    text: '정답인 연기를 요구하지 않고, 저 자체로 보여줄 수 있는 연기를 할 수 있었어요',
    author: '윤*숙',
    emoji: '🎭',
  },
  {
    text: '마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다',
    author: '김*현',
    emoji: '😲',
  },
  {
    text: '한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다',
    author: '정*석',
    emoji: '😍',
  },
]

/* ── 레이아웃 공통 스타일 ─────────────────────────────────────────── */
const container: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '0 20px',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.7rem',
  letterSpacing: '0.28em',
  color: '#15488A',
  textTransform: 'uppercase',
  textAlign: 'center',
  marginBottom: '10px',
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(1.35rem, 4vw, 1.7rem)',
  fontWeight: 700,
  color: '#111111',
  textAlign: 'center',
  marginBottom: '24px',
}

/* ══════════════════════════════════════════════════════════════════ */

export default function JoinPage() {
  return (
    <div
      style={{
        background: '#F0F0E8',
        minHeight: '100svh',
        fontFamily: 'var(--font-sans)',
        paddingBottom: '80px',
      }}
    >

      {/* ① Sticky 상단 바 — 항상 노출 */}
      <StickyTopBar deadline={DEADLINE} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ② 히어로 — MasterClass 스타일 (강사 사진 + 강한 카피)      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '520px',
          background: '#0d1520',
        }}
      >
        {/* 강사 사진 (배경) */}
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
            objectPosition: 'center 15%',
            opacity: 0.45,
          }}
        />
        {/* 그라디언트 오버레이 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(160deg, rgba(5,10,20,0.5) 0%, rgba(5,10,35,0.88) 100%)',
          }}
        />

        {/* 콘텐츠 */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(64px, 12vw, 100px) 20px clamp(52px, 10vw, 80px)',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          {/* 브랜드 */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.35em',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            KD4 ACTING STUDIO
          </p>

          {/* 할인 배지 */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(254,229,0,0.12)',
              border: '1px solid rgba(254,229,0,0.35)',
              borderRadius: '999px',
              marginBottom: '22px',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>🌸</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FEE500', letterSpacing: '0.03em' }}>
              봄맞이 스페셜 · 첫 달 10만원 할인
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#ef4444',
                background: 'rgba(239,68,68,0.15)',
                borderRadius: '4px',
                padding: '2px 7px',
              }}
            >
              잔여석 {TOTAL_SEATS}석
            </span>
          </div>

          {/* 메인 헤드라인 */}
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.9rem, 7vw, 3rem)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.22,
              marginBottom: '18px',
              letterSpacing: '-0.01em',
            }}
          >
            오디션은 보는데<br />결과가 없다면,<br />
            <span style={{ color: '#7BB3FF' }}>방법의 문제입니다</span>
          </h1>

          {/* 서브카피 */}
          <p
            style={{
              fontSize: 'clamp(0.9rem, 2.8vw, 1.05rem)',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.65,
              marginBottom: '32px',
            }}
          >
            소수정예 마이즈너 클래스 · 서울 신촌 · 6~8명 프라이빗 스튜디오
          </p>

          {/* 숫자 배지 3개 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '36px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { num: '400+', label: '배우 코칭' },
              { num: '3년+', label: '스튜디오 운영' },
              { num: '6~8명', label: '소수정예 정원' },
            ].map(({ num, label }) => (
              <div
                key={num}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  {num}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#form"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#15488A',
                color: '#ffffff',
                padding: '16px 28px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                letterSpacing: '0.03em',
              }}
            >
              무료 상담 신청하기 →
            </a>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FEE500',
                color: '#111111',
                padding: '16px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              💬 카카오 문의
            </a>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③ 마이즈너 테크닉 한 줄 설명 — 네이비 바                   */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ background: '#15488A', padding: '18px 20px', textAlign: 'center' }}>
        <p
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            fontSize: 'clamp(0.82rem, 2.5vw, 0.95rem)',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: '#ffffff' }}>마이즈너 테크닉이란?</strong>
          {' '}— 혼자 감정을 만드는 게 아니라, 상대에게 집중해{' '}
          <em>순간 반응하는</em> 연기 훈련법
        </p>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ④ 이런 분들께 — Class101 스타일 체크리스트                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: '#F0F0E8',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p style={sectionLabel}>FOR YOU</p>
          <h2 style={sectionTitle}>이런 분이라면, KD4가 딱 맞습니다</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              '오디션은 보는데 합격이 안 된다',
              '학원 다니는데 실력이 안 느는 것 같다',
              '카메라 앞에서 어색하고 뻣뻣해진다',
              '진짜 배우가 되고 싶은데 방향을 모르겠다',
            ].map((text) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#ffffff',
                  border: '1px solid #D2D2C8',
                  borderRadius: '12px',
                  padding: '16px 18px',
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#15488A',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <p style={{ fontSize: '0.95rem', color: '#111111', fontWeight: 500, margin: 0 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑤ 배우면 이렇게 됩니다 — Coloso 결과물 섹션               */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: '#E8E8DF',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p style={sectionLabel}>RESULTS</p>
          <h2 style={sectionTitle}>KD4에서 3개월 후 달라지는 것</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                icon: '🎭',
                title: '마이즈너 테크닉 체화',
                desc: '감정을 억지로 만들지 않아도 상대 반응에 자연스럽게 몰입되는 연기가 나옵니다.',
              },
              {
                icon: '🎬',
                title: '출연영상 포트폴리오 완성',
                desc: '전문 영화팀과 함께 촬영한 포트폴리오. 오디션에 바로 제출 가능한 퀄리티입니다.',
              },
              {
                icon: '🌟',
                title: '캐스팅 연계 기회',
                desc: '실제 드라마·영화 캐스팅 디렉터에게 프로필을 직접 전달합니다.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  gap: '16px',
                  background: '#F0F0E8',
                  border: '1px solid #D2D2C8',
                  borderRadius: '16px',
                  padding: '20px',
                }}
              >
                <span style={{ fontSize: '1.8rem', flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111111', margin: 0 }}>
                    {title}
                  </p>
                  <p style={{ fontSize: '0.88rem', color: '#4A4A4A', lineHeight: 1.65, margin: '6px 0 0' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑥ 강사 소개 — MasterClass 스타일                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: '#F0F0E8',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p style={sectionLabel}>YOUR INSTRUCTOR</p>
          <div
            style={{
              background: '#E8E8DF',
              border: '1px solid #D2D2C8',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            {/* 강사 사진 */}
            <div
              style={{
                position: 'relative',
                paddingTop: '56%',
                background: '#0d1520',
                overflow: 'hidden',
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
                  objectPosition: 'center 15%',
                }}
              />
            </div>

            {/* 텍스트 */}
            <div style={{ padding: '24px 22px' }}>
              <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111111', marginBottom: '3px' }}>
                권동원
              </p>
              <p style={{ fontSize: '0.82rem', color: '#15488A', fontWeight: 600, marginBottom: '16px' }}>
                현역 배우 · KD4 액팅 스튜디오 대표
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {[
                  'LA 마이즈너 테크닉 정식 수료',
                  'TV 드라마 무빙2 · 중증외상센터 출연',
                  '400명+ 배우 직접 코칭',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#15488A', flexShrink: 0, fontWeight: 700 }}>·</span>
                    <p style={{ fontSize: '0.9rem', color: '#333333', margin: 0, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderLeft: '3px solid #15488A',
                  paddingLeft: '14px',
                  fontStyle: 'italic',
                  fontSize: '0.92rem',
                  color: '#4A4A4A',
                  lineHeight: 1.7,
                }}
              >
                &ldquo;직접 현장에서 일하는 배우가<br />
                학원 선생님이 아닌 동료로서 가르칩니다&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑦ KD4 배우 이야기 — 3개 후기 카드                        */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: '#E8E8DF',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p style={sectionLabel}>KD4 배우 이야기</p>
          <h2 style={{ ...sectionTitle, marginBottom: '20px' }}>실제 수강 후기</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {REVIEWS.map(({ text, author, emoji }) => (
              <div
                key={author}
                style={{
                  background: '#F0F0E8',
                  border: '1px solid #D2D2C8',
                  borderRadius: '14px',
                  padding: '20px 20px 18px',
                  position: 'relative',
                }}
              >
                {/* 별점 */}
                <div style={{ fontSize: '0.9rem', color: '#F59E0B', marginBottom: '10px' }}>★★★★★</div>
                {/* 따옴표 장식 */}
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '16px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2.8rem',
                    color: 'rgba(21,72,138,0.1)',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  &rdquo;
                </span>

                <p
                  style={{
                    fontSize: '0.93rem',
                    color: '#111111',
                    lineHeight: 1.72,
                    marginBottom: '14px',
                    fontWeight: 500,
                  }}
                >
                  {text}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(21,72,138,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111111', margin: 0 }}>{author}</p>
                    <p style={{ fontSize: '0.72rem', color: '#6B6660', margin: 0 }}>KD4 수료 배우</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑧ 가격 공개 + 카운트다운 — Coloso 스타일                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.1) 0%, #F0F0E8 70%)',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p style={sectionLabel}>SPRING SPECIAL</p>
          <h2 style={{ ...sectionTitle, marginBottom: '6px' }}>봄맞이 스페셜 혜택</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B6660', textAlign: 'center', marginBottom: '24px' }}>
            {TOTAL_SEATS}석만 남았습니다. 마감 후 정가 복귀.
          </p>

          {/* 클래스 카드 2개 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {[MAIN_CLASS, FILM_CLASS].map((cls) => (
              <div
                key={cls.nameKo}
                style={{
                  background: '#ffffff',
                  border: cls.highlight ? '2px solid #15488A' : '1px solid #D2D2C8',
                  borderRadius: '16px',
                  padding: '20px 20px 18px',
                }}
              >
                {/* 클래스명 */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15488A', marginBottom: '4px' }}>
                  {cls.step} · {cls.nameKo}
                </p>
                {/* 할인가 */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                      color: '#111111',
                    }}
                  >
                    {cls.price}원<span style={{ fontSize: '0.9rem', color: '#6B6660', fontWeight: 400 }}>/월</span>
                  </span>
                  {cls.originalPrice && (
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                      {cls.originalPrice}원
                    </span>
                  )}
                  {cls.promoLabel && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#C73E3E',
                        background: 'rgba(199,62,62,0.1)',
                        borderRadius: '4px',
                        padding: '2px 7px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      10만원 할인
                    </span>
                  )}
                </div>
                {/* 잔여석 */}
                {cls.remainingSeats !== undefined && (
                  <p style={{ fontSize: '0.78rem', color: '#C73E3E', fontWeight: 600, margin: 0 }}>
                    ⚠️ 잔여석 {cls.remainingSeats}석
                  </p>
                )}
                {/* 포함 내용 */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cls.bullets.slice(0, 2).map((b) => (
                    <span
                      key={b}
                      style={{
                        fontSize: '0.72rem',
                        color: '#4A4A4A',
                        background: '#F0F0E8',
                        borderRadius: '6px',
                        padding: '3px 8px',
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 카운트다운 타이머 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #D2D2C8',
              borderRadius: '14px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <p style={{ fontSize: '0.8rem', color: '#C73E3E', fontWeight: 600, marginBottom: '14px' }}>
              ⏰ 봄맞이 할인 마감까지
            </p>
            <CountdownTimer deadline={DEADLINE} />
          </div>

          {/* CTA */}
          <a
            href="#form"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#15488A',
              color: '#ffffff',
              padding: '18px 24px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1.05rem',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            무료 상담 신청하기 — 부담 없는 30분
          </a>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑨ 신청 폼                                                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="form"
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, #E8E8DF 65%)',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p style={sectionLabel}>START HERE</p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
              fontWeight: 700,
              color: '#111111',
              textAlign: 'center',
              marginBottom: '6px',
            }}
          >
            무료 상담 신청하기
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#6B6660',
              textAlign: 'center',
              marginBottom: '28px',
              lineHeight: 1.6,
            }}
          >
            30초면 충분해요. 24시간 이내 카카오로 연락드립니다.
          </p>
          <JoinForm />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑩ 안심 문구 + 카카오 바로가기                              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          padding: 'clamp(28px, 6vw, 40px) 20px',
          background: '#F0F0E8',
          textAlign: 'center',
        }}
      >
        <div style={container}>
          <p style={{ fontSize: '0.88rem', color: '#4A4A4A', lineHeight: 1.8, marginBottom: '8px' }}>
            부담 없는 30분 상담이에요.{' '}
            <strong style={{ color: '#111111' }}>등록 강요 없습니다.</strong>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6B6660', lineHeight: 1.7 }}>
            개인정보는 상담 연락 외에 사용되지 않습니다.
          </p>

          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              padding: '10px 20px',
              background: '#FEE500',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#111111',
              textDecoration: 'none',
            }}
          >
            <span>💬</span> 카카오로 바로 문의하기
          </a>

          <p
            style={{
              marginTop: '32px',
              fontSize: '0.72rem',
              color: '#B8B8AC',
              letterSpacing: '0.1em',
            }}
          >
            KD4 ACTING STUDIO · 서울 서대문구 신촌
          </p>
        </div>
      </section>

      {/* ⑪ Sticky 하단 CTA (폼 도달 시 자동 숨김) */}
      <StickyBottomCTA />

    </div>
  )
}
