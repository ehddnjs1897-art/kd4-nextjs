import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: '엠오엠 피티&필라테스 제휴',
  description:
    'KD4 액팅 스튜디오 × 엠오엠 피티&필라테스 신촌 공식 제휴 — KD4 멤버 전용 바디&퍼포먼스 분석 2시간 무료 체험(20만원 → 0원), 정규 수업 등록 시 31% 할인. KD4 멤버 박경수 배우가 운영하는 재활PT 전문 트레이닝 스튜디오.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/benefits/mom-pt-pilates` },
  keywords: ['엠오엠 피티앤필라테스', 'KD4 멤버 혜택', '배우 트레이닝', '신촌 PT', '신촌 필라테스', '재활PT', '바디 퍼포먼스 분석', 'KD4 제휴'],
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/benefits/mom-pt-pilates`,
    title: '엠오엠 피티&필라테스 제휴 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 전용 바디&퍼포먼스 분석 2시간 무료 체험(20만원 → 0원) + 정규 수업 31% 할인',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 × 엠오엠 피티&필라테스' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '엠오엠 피티&필라테스 제휴 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 전용 바디분석 2시간 무료 체험 + 정규 수업 31% 할인',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 × 엠오엠 피티&필라테스' }],
  },
}

const PHONE_DISPLAY = '010-3354-1701'
const PHONE_TEL = 'tel:01033541701'
const NAVER_MAP_URL = 'https://naver.me/x1uAyyMm'

const BENEFITS = [
  { label: '내 몸 알아가기 2시간', note: '바디&퍼포먼스 분석 무료 체험', strike: '20만원', value: '0', unit: '원' },
  { label: '정규 수업 등록 시', note: 'PT · 필라테스 정규 수업 할인', strike: null, value: '31', unit: '%' },
]

const ANALYSIS_ITEMS = [
  { title: '체형 분석', desc: '신체 정렬과 불균형 체크' },
  { title: '체성분 분석', desc: '근육량 · 체지방 · 기초대사량 확인' },
  { title: '보행 분석', desc: '보행 패턴과 밸런스 평가' },
  { title: '움직임 분석', desc: '기능적 움직임 패턴 분석' },
  { title: '통증 · 가동제한범위 체크', desc: '통증 부위 확인 및 가동범위 평가 + 개인별 운동 처방' },
]

const GUIDE = [
  {
    label: '엠오엠 피티&필라테스',
    desc: 'KD4 멤버 박경수 배우가 운영하는 재활PT 전문 트레이닝 스튜디오입니다. 배우에게 필요한 몸과 움직임을 함께 만듭니다.',
  },
  { label: '위치', desc: '서울 서대문구 성산로 527 하늬솔 빌딩 A동 304호 (신촌점)' },
  { label: '대상', desc: 'KD4 액팅 스튜디오 멤버' },
  { label: '이용 방법', desc: '예약 시 "KD4 배우"라고 말씀해주세요 (멤버 확인)' },
]

const STEPS: ReactNode[] = [
  <>
    전화 또는 문자로 예약하세요 —{' '}
    <a
      href={PHONE_TEL}
      style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
    >
      {PHONE_DISPLAY}
    </a>{' '}
    (문자 가능)
  </>,
  '"KD4 배우예요"라고 알려주세요. (멤버 확인)',
  '무료 체험 진행 — 바디&퍼포먼스 분석 2시간 후, PT와 필라테스 중 나에게 필요한 운동을 골라 체험합니다.',
  '정규 수업 등록 시 KD4 멤버 31% 할인이 적용됩니다.',
]

function MomLogo({ size = 'lg', priority = false }: { size?: 'lg' | 'sm'; priority?: boolean }) {
  const px = size === 'lg' ? 176 : 120
  return (
    <Image
      src="/partners/mom-pt-logo.webp"
      alt="엠오엠 피티&필라테스"
      width={px}
      height={px}
      priority={priority}
      style={{ borderRadius: 8, display: 'block', objectFit: 'cover' }}
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
        <span lang="en">{eyebrow}</span>
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

export default function MomPtPartnershipPage() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: 'var(--white)',
        minHeight: '100vh',
        paddingTop: '64px',
      }}
    >
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '멤버 혜택', url: `${SITE_URL}/benefits` },
          { name: '엠오엠 피티&필라테스', url: `${SITE_URL}/benefits/mom-pt-pilates` },
        ]),
        buildWebPage({
          idPath: '/benefits/mom-pt-pilates#webpage',
          url: `${SITE_URL}/benefits/mom-pt-pilates`,
          name: '엠오엠 피티&필라테스 제휴 — KD4 액팅 스튜디오',
          description: 'KD4 멤버 전용 바디&퍼포먼스 분석 2시간 무료 체험(20만원 → 0원), 정규 수업 등록 시 31% 할인.',
          dateModified: '2026-08-12',
          speakableCssSelectors: ['h1', 'h2'],
        }),
      ]} />
      {/* HERO */}
      <section
        aria-label="엠오엠 피티&필라테스 제휴 소개"
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
          <span lang="en">KD4 OFFICIAL PARTNERSHIP</span>
        </p>

        {/* KD4 × 엠오엠 로고 락업 */}
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
              priority
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
              <span lang="en">KD4 ACTING STUDIO</span>
            </span>
          </div>
          <span aria-hidden style={{ fontSize: '1.4rem', color: 'var(--gray)', fontWeight: 300 }}>
            ×
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <MomLogo size="lg" priority />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.62rem',
                letterSpacing: '0.14em',
                color: 'var(--gold)',
                fontWeight: 700,
              }}
            >
              엠오엠 피티&필라테스
            </span>
          </div>
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
          재활PT · 필라테스 제휴
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
          움직임을 이해하면 표현이 달라집니다.<br />
          재활PT 전문가와 함께, 배우에게 필요한 몸을 만드세요.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 멤버 전용 혜택 */}
      <section aria-label="KD4 멤버 전용 혜택" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="MEMBER BENEFITS"
          title="KD4 멤버 전용 혜택"
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
          {BENEFITS.map((b) => (
            <div
              className="kd4-card-hover"
              key={b.label}
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
                {b.label}
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    color: 'var(--secondary)',
                    marginTop: 4,
                  }}
                >
                  {b.note}
                </span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {b.strike && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.95rem',
                      fontWeight: 400,
                      color: 'var(--gray)',
                      textDecoration: 'line-through',
                      marginBottom: 6,
                    }}
                  >
                    {b.strike}
                  </span>
                )}
                <span style={{ fontSize: 'clamp(2.2rem, 7vw, 3rem)' }}>{b.value}</span>
                <span style={{ fontSize: '1.1rem', marginLeft: 2 }}>{b.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 무료 체험 구성 */}
      <section aria-label="무료 체험 구성" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="PROGRAM"
          title="내 몸 알아가기 2시간, 이렇게 진행됩니다"
          desc="내 몸을 알고 액팅하자 — 분석부터 체험까지 한 번에."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          <div
            className="kd4-card-hover"
            style={{
              background: 'var(--bg2)',
              border: '1.5px solid rgba(21,72,138,0.18)',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.68rem',
                letterSpacing: '0.2em',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              <span lang="en">STEP 1</span>
            </p>
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
              }}
            >
              바디&퍼포먼스 분석
            </h3>
            <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ANALYSIS_ITEMS.map((item) => (
                <li key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--white)' }}>
                    {item.title}
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--secondary)', lineHeight: 1.6 }}>
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="kd4-card-hover"
            style={{
              background: 'var(--bg2)',
              border: '1.5px solid rgba(21,72,138,0.18)',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.68rem',
                letterSpacing: '0.2em',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              <span lang="en">STEP 2</span>
            </p>
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
              }}
            >
              나에게 필요한 운동 체험
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--secondary)', lineHeight: 1.8 }}>
              분석 결과를 바탕으로 <strong style={{ color: 'var(--white)' }}>PT와 필라테스 중</strong> 나에게
              필요한 운동을 선택해 직접 체험합니다.
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--secondary)', lineHeight: 1.8 }}>
              나에게 필요한 운동은 무엇일까? — 몸을 아는 만큼 표현이 넓어집니다.
            </p>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 이용 안내 */}
      <section aria-label="이용 안내" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
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
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            color: 'var(--secondary)',
            textAlign: 'center',
            marginTop: '18px',
          }}
        >
          <a
            href={NAVER_MAP_URL}
            target="_blank" rel="noopener noreferrer"
            aria-label="엠오엠 피티&필라테스 신촌점 네이버지도 보기 (새 탭에서 열림)"
            style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            네이버지도에서 위치 보기 →
          </a>
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 이용 절차 */}
      <section aria-label="이용 절차" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="HOW IT WORKS"
          title="이용 절차"
          desc="복잡한 신청서 없이, 전화 또는 문자 한 번이면 됩니다."
        />
        {/* role="list": listStyle:none 시 Safari VoiceOver 리스트 의미 보존 (WCAG 1.3.1) */}
        <ol
          role="list"
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

      {/* 안내 전단 */}
      <section aria-label="제휴 안내 전단" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="GUIDE"
          title="한눈에 보는 제휴 안내"
        />
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Image
            src="/partners/mom-pt-flyer.webp"
            alt="엠오엠 피티&필라테스 × KD4 제휴 안내 전단 — KD4 배우 전용 무료 체험(내 몸 알아가기 2시간, 20만원 → 0원), STEP 1 바디&퍼포먼스 분석, STEP 2 PT·필라테스 체험, 정규 수업 등록 시 31% 할인"
            width={1080}
            height={1517}
            style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
          />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 문의하기 */}
      <section
        aria-label="예약 및 문의"
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: 'clamp(56px, 9vw, 96px) 24px clamp(48px, 7vw, 80px)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <MomLogo size="sm" />
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
          전화 또는 문자로 예약하고, &quot;KD4 배우&quot;라고 말씀해주세요.
        </p>
        <a
          href={PHONE_TEL}
          aria-label={`엠오엠 피티&필라테스에 전화하기 ${PHONE_DISPLAY}`}
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
          {PHONE_DISPLAY} 전화 · 문자 예약
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
          <a
            href={NAVER_MAP_URL}
            target="_blank" rel="noopener noreferrer"
            aria-label="엠오엠 피티&필라테스 신촌점 네이버지도 (새 탭에서 열림)"
            style={{ color: 'var(--gold)', fontWeight: 700, textDecoration: 'none' }}
          >
            네이버지도에서 위치 보기
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
            <span aria-hidden="true">← </span>멤버 혜택으로 돌아가기
          </Link>
        </div>

        {/* 내부 교차 링크 — 주요 SEO 페이지 연결 */}
        <nav aria-label="관련 페이지" style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/meisner-technique-class" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              마이즈너 테크닉 클래스 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/reel-production-class" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              출연영상 클래스 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/about" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              KD4 소개 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/acting-coaches" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              권동원 액팅 코치 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </section>
    </div>
  )
}
