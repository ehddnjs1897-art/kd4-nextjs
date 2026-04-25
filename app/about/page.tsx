import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '스튜디오 소개 | KD4 액팅 스튜디오',
  description:
    '마이즈너 테크닉과 연기하지 않는 연기를 중심으로, 현장에서 통하는 배우를 키웁니다. 삶의 변화, 좋은 연기, 커리어의 성장.',
}

const PARTNERS = [
  'CGV 신촌아트레온 아트하우스',
  '액터길드 (Actor Guild)',
  '리플레이',
  '방진원 캐스팅 디렉터',
  '이상원 캐스팅 디렉터',
  '박안드레 조감독',
  'spectrum8 스튜디오',
  'neez.n 프로덕션',
]

const STEPS = [
  {
    num: '01',
    title: '마이즈너 테크닉 / 이바나 처벅 테크닉 훈련',
    sub: '연기력 확장 · 카메라 연기 최적화',
    desc: '마이즈너의 Repetition 훈련과 이바나 처벅 테크닉을 결합하여, 억지로 짜내는 감정 없이 상대방의 반응에 진정성 있게 살아있는 연기를 만듭니다.',
  },
  {
    num: '02',
    title: '포트폴리오 제작',
    sub: '전문 영화팀과 출연영상 제작 시스템',
    desc: '배우의 개성을 살린 맞춤형 시나리오로 영화 퀄리티 출연영상을 제작합니다. KD4가 가장 잘 하는 것.',
  },
  {
    num: '03',
    title: '캐스팅 연계',
    sub: '협업 캐스팅 디렉터 · 정기 오디션',
    desc: '협업 캐스팅 디렉터, 인물 조감독과 정기 오디션 및 캐스팅을 연계합니다. 디즈니+ · 넷플릭스 · tvN · 상업영화.',
  },
]

const WHO_NEEDS = [
  '연기의 본질을 제대로 배우고 싶은 분',
  '활동의 한계에 부딪힌 배우',
  '열심히 하지만 달라지는 게 없는 배우',
  '억지로 짜내는 연기에서 벗어나고 싶은 배우',
  '출연영상이 없어서 캐스팅 기회를 놓치는 배우',
]

const TESTIMONIALS = [
  {
    text: '다시금 연기에 대한 열정과 재미, 행복을 느끼게 해 준 수업이었습니다.',
    name: '조*슬 배우',
  },
  {
    text: '감정해방이란 이런 것이구나, 모든 현장에서 이렇게 교감을 할 수 있다면 모두가 명배우가 될 수 있겠다는 생각이 들었습니다.',
    name: '박*진 배우',
  },
  {
    text: '정답인 연기를 요구하지 않고, 저 자체로 보여줄 수 있는 연기를 할 수 있게 여러 질문을 던져주셨습니다.',
    name: '배우 윤*숙',
  },
]

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--white)', minHeight: '100vh', paddingTop: '64px' }}>

      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(64px, 10vw, 120px) 24px clamp(48px, 7vw, 80px)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display), Oswald, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.3em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          KD4 Acting Studio
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 6vw, 3.6rem)',
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: '28px',
          }}
        >
          뻔한 연기,<br />이제 방법을 바꿀 때
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.9,
            maxWidth: '620px',
            margin: '0 auto 12px',
            letterSpacing: '0.03em',
          }}
        >
          마이즈너 테크닉 훈련 · 출연영상 제작 · 캐스팅 연계
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.8,
            maxWidth: '560px',
            margin: '0 auto 40px',
          }}
        >
          카메라 앞에서 통하는 &lsquo;연기하지 않는 연기&rsquo;를 배웁니다.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display), Oswald, sans-serif',
            fontSize: 'clamp(2.4rem, 7vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#1a3fad',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginTop: '8px',
          }}
        >
          OFF THE PLASTIC
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 철학 ── */}
      <section id="meisner" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
          PHILOSOPHY
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, lineHeight: 1.3, marginBottom: '20px' }}>
          연기하지 않는 연기
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, maxWidth: '680px' }}>
          <strong style={{ color: 'var(--white)' }}>마이즈너 테크닉</strong>은 혼자 감정을 만들어내는 것이 아니라,
          상대방에게 집중하여 순간의 충동에 반응하는 훈련법입니다.
          카메라 연기에 최적화된 &apos;연기하지 않는 연기&apos;의 핵심 기법.
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, marginTop: '16px', maxWidth: '680px' }}>
          플라스틱처럼 굳어버린 연기 패턴에서 벗어나,
          상대방에게 반응하는 살아있는 연기를 훈련합니다.
        </p>

        {/* 마이즈너 핵심 3요소 */}
        <div style={{ marginTop: '36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
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
              label: 'VS OTHER METHODS',
              title: '다른 방법과의 차이',
              desc: '스타니슬랍스키의 감정기억과 달리, 마이즈너는 상대에게 집중합니다. 혼자 짜내는 감정이 아니라 관계 속에서 살아나는 연기입니다.',
            },
          ].map(item => (
            <div
              key={item.label}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '22px 20px',
              }}
            >
              <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
                {item.label}
              </p>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: 1.75 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* YouTube 임베드 — 자동재생, 음소거, 루프 */}
        <div style={{
          marginTop: '48px',
          borderRadius: '4px',
          overflow: 'hidden',
          aspectRatio: '21/9',
          width: '100vw',
          maxWidth: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          background: '#000',
        }}>
          <iframe
            src="https://www.youtube.com/embed/tB7f4VnC6rM?autoplay=1&mute=1&loop=1&playlist=tB7f4VnC6rM&controls=1&rel=0&modestbranding=1"
            title="KD4 연기하지 않는 연기"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 이런 배우에게 ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          WHO NEEDS KD4
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '40px' }}>
          이런 배우에게 필요합니다
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {WHO_NEEDS.map((item, i) => (
            <div
              key={item}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px 20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                color: 'var(--gold)',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginTop: '1px',
                flexShrink: 0,
                minWidth: '20px',
              }}>
                {i + 1}.
              </span>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--white)' }}>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── ALL IN ONE SYSTEM ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          ALL IN ONE SYSTEM
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>
          KD4 성장 시스템
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {STEPS.map(step => (
            <div
              key={step.num}
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '28px 32px',
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '24px',
                alignItems: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase' }}>STEP</p>
                <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '2.4rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{step.num}</p>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '8px' }}>{step.sub}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 대표 소개 ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* 좌측: 텍스트 */}
          <div>
            <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
              ACTOR ACCELERATOR
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '20px' }}>
              권동원 대표
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, marginBottom: '24px' }}>
              상업 영화 · 드라마 100여 편 출연, 연기상 수상 현역 배우가
              직접 지도합니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                '누적 캐스팅 연계 100건+',
                '누적 코칭 배우 400명+',
                '커뮤니티 배우 70명',
                '디즈니+ · 넷플릭스 · tvN · MBC · KBS · 상업영화 100여편 출연',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: '7px' }} />
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 사진 */}
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '3/4',
              border: '1px solid rgba(196,165,90,0.2)',
              boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
            }}
          >
            <Image
              src="/director.jpg"
              alt="권동원 대표"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px 20px 16px',
              background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 100%)',
            }}>
              <p style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: 'rgba(196,165,90,0.8)',
                textTransform: 'uppercase',
              }}>
                KD4 Acting Studio
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 동료 배우 이야기 ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          ACTORS SAY
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '40px' }}>
          동료 배우 이야기
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {TESTIMONIALS.map(t => (
            <div
              key={t.name}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '28px 24px',
              }}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: 1.85, marginBottom: '16px', fontStyle: 'italic' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gold)' }}>— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 협력 파트너 ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          PARTNERSHIP
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '32px' }}>
          협력 파트너
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {PARTNERS.map(p => (
            <span
              key={p}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                padding: '8px 18px',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 위치 ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
              LOCATION
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 700, marginBottom: '16px' }}>
              유익액터스 홀
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: 1.8 }}>
              서울시 서대문구 이화여대1안길 12<br />
              아리움3차 1층 101호<br />
              <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>이대역 도보 2분 · 1층 위치</span>
            </p>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="mailto:uikactors@gmail.com"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span>✉</span> uikactors@gmail.com
              </a>
              <a
                href="tel:01085640244"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span>☎</span> 010-8564-0244
              </a>
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '16/9',
            }}
          >
            <iframe
              src="https://maps.google.com/maps?q=%EC%84%9C%EC%9A%B8%EC%8B%9C+%EC%84%9C%EB%8C%80%EB%AC%B8%EA%B5%AC+%EB%8C%80%ED%98%84%EB%8F%9999-7&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', filter: 'invert(0.85) hue-rotate(180deg)' }}
              loading="lazy"
              title="KD4 액팅 스튜디오 위치"
            />
          </div>
        </div>
      </section>

      {/* ── 헤세 인용구 — 맨 하단 ── */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          padding: 'clamp(32px, 6vw, 56px) 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
            color: '#15488A',
            lineHeight: 1.6,
            letterSpacing: '0.02em',
            fontStyle: 'italic',
          }}
        >
          &ldquo;새는 알에서 나오기 위해 투쟁한다. 알은 새의 세계이다. 누구든지 태어나려고 하는 자는 하나의 세계를 파괴하여야 한다. 새는 신을 향해 날아간다.&rdquo;
          &nbsp;&nbsp;<span style={{ fontStyle: 'normal', color: '#15488A', fontSize: '0.85em' }}>— 헤르만 헤세, 데미안</span>
        </p>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          padding: 'clamp(48px, 8vw, 80px) 24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '16px' }}>
          지금 바로 시작하세요
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', marginBottom: '32px' }}>
          무료 오픈 클래스로 먼저 체험해 보세요.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://forms.gle/68E7yFFFoDiPCRwD9"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'var(--gold)',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.04em',
            }}
          >
            수강신청
          </a>
          <Link
            href="/#classes"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              border: '1px solid rgba(196,165,90,0.4)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.04em',
            }}
          >
            클래스 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
