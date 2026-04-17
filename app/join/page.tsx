import type { Metadata } from 'next'
import JoinForm from '@/components/contact/JoinForm'

export const metadata: Metadata = {
  title: '무료 상담 신청 | KD4 액팅 스튜디오',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 봄맞이 첫 달 10만원 할인. 서울 신촌.',
  robots: { index: false, follow: false }, // 광고 전용 — SEO 노출 제외
}

/* ─── 섹션 스타일 상수 ─────────────────────────────────────────── */
const container: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '0 20px',
}

export default function JoinPage() {
  return (
    <div style={{ background: '#F0F0E8', minHeight: '100svh', fontFamily: 'var(--font-sans)' }}>

      {/* ── 영역 1: 히어로 ─────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(48px, 10vw, 80px) 20px clamp(40px, 8vw, 60px)',
          textAlign: 'center',
          background: '#F0F0E8',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          {/* 로고 */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: '#15488A',
              textTransform: 'uppercase',
              marginBottom: '28px',
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
              background: 'rgba(21,72,138,0.08)',
              border: '1px solid rgba(21,72,138,0.25)',
              borderRadius: '999px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🌸</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15488A', letterSpacing: '0.03em' }}>
              봄맞이 스페셜 · 첫 달 10만원 할인
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#C73E3E',
                background: 'rgba(199,62,62,0.1)',
                borderRadius: '4px',
                padding: '2px 7px',
              }}
            >
              잔여석 5석
            </span>
          </div>

          {/* 메인 헤드라인 */}
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.7rem, 6vw, 2.6rem)',
              fontWeight: 700,
              color: '#111111',
              lineHeight: 1.25,
              marginBottom: '16px',
              letterSpacing: '-0.01em',
            }}
          >
            오디션은 보는데<br />결과가 없다면,<br />
            <span style={{ color: '#15488A' }}>방법의 문제입니다</span>
          </h1>

          {/* 서브 */}
          <p
            style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
              color: '#4A4A4A',
              lineHeight: 1.7,
              marginBottom: '0',
            }}
          >
            소수정예 마이즈너 클래스 · 서울 신촌 · 6~8명 프라이빗 스튜디오
          </p>
        </div>
      </section>

      {/* ── 영역 1.5: 마이즈너 1줄 설명 ───────────────────────────── */}
      <section
        style={{
          background: '#15488A',
          padding: '18px 20px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            fontSize: 'clamp(0.82rem, 2.5vw, 0.92rem)',
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: '#ffffff' }}>마이즈너 테크닉이란?</strong>
          {' '}— 혼자 감정을 만드는 게 아니라, 상대에게 집중해 순간 반응하는 연기 훈련법
        </p>
      </section>

      {/* ── 영역 2: 핵심 포인트 3개 ───────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(36px, 7vw, 52px) 20px',
          background: '#E8E8DF',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {[
              { icon: '🎭', text: '소수정예 6~8명 · 프라이빗 스튜디오' },
              { icon: '🎬', text: '마이즈너 정규반 + 출연영상 포트폴리오 포함' },
              { icon: '🌸', text: '부담 없는 30분 방문 상담 — 등록 강요 없음' },
            ].map((item) => (
              <div
                key={item.icon}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: '#F0F0E8',
                  border: '1px solid #D2D2C8',
                  borderRadius: '12px',
                  padding: '16px 18px',
                }}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</span>
                <p style={{ fontSize: '0.95rem', color: '#111111', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 영역 3: 실제 후기 ─────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(36px, 7vw, 52px) 20px',
          background: '#F0F0E8',
          borderBottom: '1px solid #D2D2C8',
        }}
      >
        <div style={container}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              color: '#15488A',
              textTransform: 'uppercase',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            KD4 배우 이야기
          </p>

          <div
            style={{
              background: '#E8E8DF',
              border: '1px solid #D2D2C8',
              borderRadius: '16px',
              padding: '28px 24px',
              position: 'relative',
            }}
          >
            {/* 따옴표 장식 */}
            <span
              style={{
                position: 'absolute',
                top: '12px',
                left: '20px',
                fontFamily: 'var(--font-serif)',
                fontSize: '3.5rem',
                color: 'rgba(21,72,138,0.15)',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              &ldquo;
            </span>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 2.8vw, 1.05rem)',
                color: '#111111',
                lineHeight: 1.75,
                marginBottom: '18px',
                paddingTop: '16px',
                fontWeight: 500,
              }}
            >
              정답인 연기를 요구하지 않고,<br />저 자체로 보여줄 수 있는 연기를 할 수 있었어요
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(21,72,138,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                🎭
              </div>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111111', margin: 0 }}>윤*숙</p>
                <p style={{ fontSize: '0.75rem', color: '#6B6660', margin: 0 }}>KD4 수료 배우</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 영역 4: 신청 폼 ───────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(40px, 8vw, 60px) 20px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.07) 0%, #E8E8DF 65%)',
          borderBottom: '1px solid #D2D2C8',
        }}
        id="form"
      >
        <div style={container}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              color: '#15488A',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '10px',
            }}
          >
            START HERE
          </p>
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

      {/* ── 영역 5: 안심 문구 ─────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(28px, 6vw, 40px) 20px',
          background: '#F0F0E8',
          textAlign: 'center',
        }}
      >
        <div style={container}>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#4A4A4A',
              lineHeight: 1.8,
              marginBottom: '12px',
            }}
          >
            부담 없는 30분 상담이에요.{' '}
            <strong style={{ color: '#111111' }}>등록 강요 없습니다.</strong>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6B6660', lineHeight: 1.7 }}>
            개인정보는 상담 연락 외에 사용되지 않습니다.
          </p>

          {/* 카카오 바로가기 */}
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

          {/* 브랜드 푸터 */}
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
    </div>
  )
}
