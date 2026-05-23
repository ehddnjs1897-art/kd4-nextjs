import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SeowooCarousel from '@/components/seowoo/SeowooCarousel'

export const metadata: Metadata = {
  title: '서우스튜디오 프로필 촬영 제휴 | KD4 액팅 스튜디오',
  description:
    'KD4 액팅 스튜디오 × 서우스튜디오 공식 제휴 — 배우 프로필·포트레이트 촬영. KD4 멤버 전용 할인(헤어·메이크업 포함 15%, 미포함 10%) 및 이용 절차 안내.',
  alternates: { canonical: 'https://kd4.club/benefits/seowoo-studio' },
}

const INSTAGRAM_URL = 'https://www.instagram.com/seowoo_studio'
const INSTAGRAM_HANDLE = '@seowoo_studio'

const DISCOUNTS = [
  { label: '헤어 · 메이크업 포함', rate: '15', note: '할인' },
  { label: '헤어 · 메이크업 미포함', rate: '10', note: '할인' },
]

const GUIDE = [
  {
    label: '서우스튜디오',
    desc: '있는 그대로의 당신을, 자연스럽고 편안하게 담는 프로필 · 포트레이트 촬영 스튜디오입니다.',
  },
  { label: '위치', desc: '서울 서초구 신반포로45길 50-2 1동 지하1층 (신사역 · 논현역 인근)' },
  { label: '대상', desc: 'KD4 액팅 스튜디오 멤버' },
  { label: '이용 방법', desc: '예약 시 KD4 멤버임을 알려주세요 (확인 필요)' },
]

const STEPS: ReactNode[] = [
  <>
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
    >
      서우스튜디오 인스타그램
    </a>{' '}
    DM으로 예약 · 문의하세요.
  </>,
  '"KD4 액팅 스튜디오 멤버예요"라고 알려주세요. (멤버 확인)',
  '촬영 날짜와 옵션(헤어 · 메이크업 포함 / 미포함)을 정하세요.',
  '촬영 진행 — KD4 멤버 할인이 적용됩니다.',
]

function SeowooLogo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const px = size === 'lg' ? 176 : 120
  return (
    <Image
      src="/partners/seowoo-logo.webp"
      alt="seowoo studio"
      width={px}
      height={px}
      style={{ borderRadius: 8, display: 'block' }}
    />
  )
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: '36px', textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--font-display), Oswald, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.25em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 700,
          color: 'var(--white)',
          marginBottom: desc ? '12px' : 0,
          lineHeight: 1.35,
        }}
      >
        {title}
      </h2>
      {desc && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.92rem',
            color: 'var(--secondary)',
            lineHeight: 1.8,
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          {desc}
        </p>
      )}
    </div>
  )
}

export default function SeowooPartnershipPage() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: 'var(--white)',
        minHeight: '100vh',
        paddingTop: '64px',
      }}
    >
      {/* HERO */}
      <section
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(56px, 9vw, 104px) 24px clamp(40px, 6vw, 64px)',
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
            marginBottom: '28px',
          }}
        >
          KD4 OFFICIAL PARTNERSHIP
        </p>

        {/* KD4 × seowoo 로고 락업 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(16px, 4vw, 32px)',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Image
              src="/heart-logo.png"
              alt="KD4 액팅 스튜디오"
              width={140}
              height={140}
              style={{ display: 'block', objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.58rem',
                letterSpacing: '0.22em',
                color: 'var(--gold)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              KD4 ACTING STUDIO
            </span>
          </div>
          <span aria-hidden style={{ fontSize: '1.4rem', color: 'var(--gray)', fontWeight: 300 }}>
            ×
          </span>
          <SeowooLogo size="lg" />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.9rem, 6vw, 3rem)',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '20px',
            wordBreak: 'keep-all',
          }}
        >
          배우 프로필 촬영 제휴
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.9,
            maxWidth: '520px',
            margin: '0 auto',
            wordBreak: 'keep-all',
          }}
        >
          있는 그대로의 당신을, 자연스럽고 편안하게 담는<br />
          프로필 · 포트레이트 촬영
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 멤버 전용 할인 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="MEMBER DISCOUNT"
          title="KD4 멤버 전용 할인"
          desc="KD4 액팅 스튜디오 멤버라면 누구나 받을 수 있습니다."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            maxWidth: 640,
            margin: '0 auto',
          }}
        >
          {DISCOUNTS.map((d) => (
            <div
              className="kd4-card-hover"
              key={d.label}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '28px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--white)',
                  wordBreak: 'keep-all',
                }}
              >
                {d.label}
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    color: 'var(--secondary)',
                    marginTop: 4,
                  }}
                >
                  {d.note}
                </span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 'clamp(2.2rem, 7vw, 3rem)' }}>{d.rate}</span>
                <span style={{ fontSize: '1.1rem', marginLeft: 2 }}>%</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 이용 안내 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader eyebrow="ABOUT" title="이용 안내" />
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {GUIDE.map((g, i) => (
            <div
              key={g.label}
              style={{
                display: 'flex',
                gap: 'clamp(12px, 3vw, 28px)',
                padding: 'clamp(18px, 3vw, 24px)',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 'clamp(72px, 18vw, 96px)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  paddingTop: 1,
                  wordBreak: 'keep-all',
                }}
              >
                {g.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  color: 'var(--secondary)',
                  lineHeight: 1.7,
                  wordBreak: 'keep-all',
                }}
              >
                {g.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 이용 절차 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="HOW IT WORKS"
          title="이용 절차"
          desc="복잡한 신청서 없이, 인스타그램 DM 한 번이면 됩니다."
        />
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 auto',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {STEPS.map((step, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(21,72,138,0.12)',
                  border: '1px solid rgba(21,72,138,0.3)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  color: 'var(--white)',
                  lineHeight: 1.6,
                  wordBreak: 'keep-all',
                  paddingTop: 3,
                }}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 포트폴리오 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="PORTFOLIO"
          title="포트폴리오"
          desc="서우스튜디오의 실제 촬영 작품을 인스타그램에서 바로 확인하세요."
        />
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block', maxWidth: 480, margin: '0 auto' }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 'clamp(28px, 6vw, 48px) clamp(24px, 5vw, 40px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Image
              src="/partners/seowoo-logo.webp"
              alt="seowoo studio"
              width={64}
              height={64}
              style={{ borderRadius: 8, display: 'block' }}
            />
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#111',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                @seowoo_studio
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: '#777',
                  lineHeight: 1.7,
                  wordBreak: 'keep-all',
                }}
              >
                배우·가수 프로필 전문 작가의 실제 촬영 작품을 인스타그램에서 확인하세요.
              </p>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--gold)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 8,
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              인스타그램에서 포트폴리오 보기 →
            </span>
          </div>
        </a>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 촬영 안내 캐러셀 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="SHOOTING GUIDE"
          title="서우스튜디오 촬영 안내"
          desc="프로필 촬영 A to Z — 처음이라도 걱정 마세요."
        />
        <SeowooCarousel />
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 문의하기 */}
      <section
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: 'clamp(56px, 9vw, 96px) 24px clamp(48px, 7vw, 80px)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SeowooLogo size="sm" />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)',
            fontWeight: 700,
            lineHeight: 1.4,
            margin: '24px 0 12px',
          }}
        >
          예약 · 문의
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            lineHeight: 1.8,
            marginBottom: '28px',
          }}
        >
          서우스튜디오 인스타그램 DM으로 문의해 주세요.
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minHeight: 52,
            padding: '15px 30px',
            background: 'var(--gold)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.98rem',
            fontWeight: 700,
            borderRadius: 'var(--radius)',
            letterSpacing: '0.02em',
            textDecoration: 'none',
          }}
        >
          서우스튜디오 인스타그램으로 문의하기
        </a>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            color: 'var(--secondary)',
            marginTop: '14px',
            letterSpacing: '0.02em',
          }}
        >
          Instagram{' '}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'none' }}
          >
            {INSTAGRAM_HANDLE}
          </a>
        </p>

        <div style={{ marginTop: '40px' }}>
          <Link
            href="/benefits"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.88rem',
              color: 'var(--secondary)',
              textDecoration: 'none',
            }}
          >
            ← 멤버 혜택으로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  )
}
