import Link from 'next/link'

const FEATURES = [
  { icon: '📌', title: '수업 공지', desc: '클래스 일정과 변경 사항이 여기 먼저 올라옵니다.' },
  { icon: '🎬', title: '장면발표 / 촬영 일정', desc: '월간 장면발표와 출연영상 촬영 라인업.' },
  { icon: '📣', title: '캐스팅 정보 공유', desc: '협업 캐스팅 디렉터와 조감독의 오디션 공고.' },
  { icon: '💬', title: '멤버 간 대화', desc: '훈련 후기 · 작품 추천 · 진로 고민 · 자유 게시판.' },
  { icon: '📚', title: '수업 자료실', desc: '레피티션 가이드 · 장면 분석 자료 · 추천 영화/책.' },
  { icon: '🎓', title: '멤버 합류 사례', desc: '실제 캐스팅·작품 합류 이야기와 멤버 인터뷰.' },
]

export default function PublicLanding() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {/* HERO */}
        <section style={{ padding: 'clamp(56px, 9vw, 96px) 0 clamp(32px, 5vw, 48px)', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-display), Oswald, sans-serif',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            KD4 Community
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 700,
              color: 'var(--white)',
              lineHeight: 1.3,
              marginBottom: 18,
            }}
          >
            KD4 멤버 전용<br />커뮤니티
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              color: 'var(--secondary)',
              lineHeight: 1.85,
              maxWidth: 540,
              margin: '0 auto',
            }}
          >
            수업 공지, 장면발표 일정, 캐스팅 정보, 수업 자료까지.<br />
            KD4가 아니면 볼 수 없는 정보가 이곳에 모입니다.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 clamp(36px, 6vw, 56px)' }} />

        {/* FEATURES */}
        <section>
          <p
            style={{
              fontFamily: 'var(--font-display), Oswald, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            What's Inside
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)',
              fontWeight: 700,
              color: 'var(--white)',
              textAlign: 'center',
              marginBottom: 36,
            }}
          >
            커뮤니티 안에는 무엇이 있나요?
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{f.icon}</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--white)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                    color: 'var(--secondary)',
                    lineHeight: 1.75,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* MEMBERS-ONLY 안내 */}
        <section
          style={{
            margin: 'clamp(48px, 7vw, 72px) 0 clamp(32px, 5vw, 48px)',
            padding: '28px 24px',
            background: 'rgba(196,165,90,0.06)',
            border: '1px solid rgba(196,165,90,0.25)',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              color: 'var(--white)',
              fontWeight: 600,
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}
          >
            👥 KD4 멤버만 들어오실 수 있어요
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.86rem',
              color: 'var(--secondary)',
              lineHeight: 1.75,
            }}
          >
            로그인 후 이용 가능합니다. 아직 KD4 멤버가 아니라면 무료 상담부터 시작하세요.
          </p>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', paddingBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/auth/login?next=/board"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'var(--gold)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              로그인
            </Link>
            <Link
              href="/join"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'transparent',
                color: 'var(--white)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              무료 상담
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
