import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'

export const metadata: Metadata = {
  title: '멤버 혜택',
  description:
    'KD4 멤버가 누리는 혜택과 커뮤니티 — 보강제도, 출연영상·프로필 편집 서비스(편집 5만원·프로필 3만원), 레피티션 스터디, 굿무비 굿액팅, 크리스쳔 액터스 커뮤니티, 다양한 할인 혜택.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/benefits` },
  keywords: ['KD4 멤버 혜택', '연기학원 혜택', '배우 프로필 편집', '출연영상 제작', '레피티션 스터디', '신촌 연기 커뮤니티', 'KD4 커뮤니티'],
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/benefits`,
    title: '멤버 혜택 | KD4 액팅 스튜디오',
    description: 'KD4 멤버가 누리는 혜택과 커뮤니티 — 보강제도, 출연영상·프로필 편집 서비스, 레피티션 스터디, 굿무비 굿액팅, 크리스쳔 액터스.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '멤버 혜택 | KD4 액팅 스튜디오',
    description: 'KD4 멤버가 누리는 혜택과 커뮤니티 — 보강제도, 출연영상·프로필 편집 서비스, 레피티션 스터디.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 멤버 혜택' }],
  },
}

/* ───────────── 데이터 ───────────── */

const RESCHEDULE_STEPS = [
  '부득이하게 결석하시는 경우, 보강을 받으실 수 있습니다.',
  '스케줄표에 있는 다른 수업 클래스에서 보강이 가능합니다.',
  '보강은 수업 3일 전까지 미리 신청해 주세요.',
  '보강 신청은 아래 카카오채널로 접수해 주세요.',
]

const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_ximxdqn'

const CAREER_SERVICES = [
  {
    title: '출연영상 편집 서비스',
    desc: '촬영한 출연영상을 캐스팅 디렉터에게 보낼 수 있도록, 업계 문법에 맞게 편집해 드립니다.',
    price: '50,000원',
  },
  {
    title: '프로필 편집 서비스',
    desc: '오디션 또는 캐스팅 디렉터 제출 시 바로 사용할 수 있도록, 업계 문법에 맞게 제작해 드립니다.',
    price: '30,000원',
  },
]

interface CommunityItem {
  emoji: string
  title: string
  leader: string
  desc: string
  pricing?: { label: string; price: string; note?: string }[]
}

const COMMUNITIES: CommunityItem[] = [
  {
    emoji: '🎭',
    title: '레피티션 스터디',
    leader: '홍수민 리더',
    desc: '자율적으로 모여 마이즈너 테크닉 레피티션을 훈련합니다. KD4 멤버가 아니어도 누구나 참여 가능',
    pricing: [
      { label: '대표 직강 수강 중', price: '무료', note: '출연영상 클래스·마이즈너 정규·출연영상 1달·출연영상 심화·리더 클래스' },
      { label: '강사 수업 수강 중', price: '50,000원', note: '오디션 테크닉·베이직 클래스 (50% 할인)' },
      { label: '일반', price: '100,000원' },
    ],
  },
  {
    emoji: '🎥',
    title: '굿무비 굿액팅',
    leader: '박우진 리더',
    desc: '함께 영화를 보고 토론하는 모임. 연기와 영화를 보는 눈을 함께 키우는 시간',
  },
  {
    emoji: '✝️',
    title: '크리스쳔 액터스',
    leader: '권동원 리더',
    desc: '신앙을 가진 배우들이 작품·삶·진로를 함께 나누는 커뮤니티',
  },
]

const DISCOUNTS = [
  { tag: '컴백 할인', title: '첫 달 5만원 할인', desc: '6개월 이상 휴면 후 복귀 시 적용' },
  { tag: '포트폴리오 할인', title: '출연영상 1달 완성 클래스 신청 시 30% 할인', desc: '출연영상 2회 이상 수료한 KD4 멤버' },
  { tag: '앰배서더 할인', title: '지인 소개로 등록 시 두 분 모두 각 3만원 할인', desc: '지인 소개로 등록 시, 소개한 분과 등록한 분 모두 각 3만원씩 할인' },
  { tag: '재수강 할인', title: '2번째 수강부터 월 3만원 할인', desc: '같은 클래스를 재수강하는 경우, 두 번째 수강하는 달부터 매월 3만원 할인' },
  { tag: 'KD4 매니아 할인', title: '같은 달 2개 이상 수강 시 추가 클래스 15% 할인', desc: '같은 달에 두 개 이상의 클래스를 함께 수강하면, 추가하는 클래스 수강료를 15% 할인해 드립니다.' },
]

/* ───────────── 섹션 헤더 ───────────── */

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

/* ───────────── 페이지 ───────────── */

export default function BenefitsPage() {
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
        ]),
        buildWebPage({
          idPath: '/benefits#webpage',
          url: `${SITE_URL}/benefits`,
          name: '멤버 혜택 — KD4 액팅 스튜디오',
          description: 'KD4 멤버가 누리는 혜택과 커뮤니티 — 보강제도, 출연영상·프로필 편집 서비스, 레피티션 스터디.',
          about: { '@id': `${SITE_URL}#org` },
          dateModified: '2026-06-11',
          speakableCssSelectors: ['h1', 'h2'],
        }),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${SITE_URL}/benefits#career-services`,
          name: 'KD4 커리어 지원 서비스',
          itemListElement: CAREER_SERVICES.map((svc, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Service',
              name: svc.title,
              description: svc.desc,
              provider: { '@id': `${SITE_URL}#org` },
              offers: {
                '@type': 'Offer',
                price: Number(svc.price.replace(/,/g, '').replace('원', '')),
                priceCurrency: 'KRW',
                url: `${SITE_URL}/benefits`,
              },
            },
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          '@id': `${SITE_URL}/benefits#howto`,
          name: 'KD4 연기 클래스 보강 신청하는 방법',
          description: '결석 시 KD4의 보강제도를 통해 다른 클래스에서 보강 받는 4단계 방법.',
          step: RESCHEDULE_STEPS.map((text, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: ['보강 자격 확인', '보강 클래스 선택', '3일 전 사전 신청', '카카오채널 접수'][i],
            text,
          })),
        },
      ]} />
      {/* HERO */}
      <section
        aria-label="멤버 혜택 소개"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(64px, 10vw, 120px) 24px clamp(40px, 6vw, 64px)',
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
          <span lang="en">MEMBER BENEFITS</span>
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 6vw, 3.4rem)',
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: '24px',
          }}
        >
          KD4는<br />혼자 성장하지 않습니다
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.9,
            maxWidth: '560px',
            margin: '0 auto',
            letterSpacing: '0.02em',
          }}
        >
          수업 시간 외에도 훈련을 이어갈 수 있도록,<br />
          KD4가 운영하는 학습 보강 · 커리어 지원 · 멤버 커뮤니티 · 할인 혜택을 모두 모았습니다.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 학습 보강 */}
      <section aria-label="학습 보강 제도" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="LEARNING SUPPORT"
          title="KD4의 보강제도"
          desc="훈련의 흐름이 끊기지 않도록 KD4가 끝까지 함께합니다."
        />
        <div
          className="kd4-card-hover"
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 'clamp(24px, 4vw, 32px)',
            maxWidth: 640,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <h3 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--white)',
            letterSpacing: '0.02em',
          }}>보강제도 안내</h3>

          <ol role="list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RESCHEDULE_STEPS.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(21,72,138,0.12)',
                  border: '1px solid rgba(21,72,138,0.3)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>{i + 1}</span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  color: 'var(--secondary)',
                  lineHeight: 1.6,
                  wordBreak: 'keep-all',
                  paddingTop: 2,
                }}>{step}</span>
              </li>
            ))}
          </ol>

          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank" rel="noopener noreferrer"
            aria-label="카카오채널로 보강 신청하기 (새 탭에서 열림)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 48,
              padding: '14px 20px',
              background: '#FEE500',
              color: '#3C1E1E',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            카카오채널로 보강 신청하기
          </a>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 커리어 지원 */}
      <section aria-label="커리어 지원 서비스" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="CAREER SERVICES"
          title="커리어 지원 서비스"
          desc="훈련만큼 중요한 건 보여주는 방식입니다. KD4가 직접 손봐 드립니다."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {CAREER_SERVICES.map((item) => (
            <div
              className="kd4-card-hover"
              key={item.title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  background: 'rgba(21,72,138,0.1)',
                  border: '1px solid rgba(21,72,138,0.25)',
                  borderRadius: 3,
                  padding: '3px 9px',
                }}>편집 서비스</span>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}>{item.price}</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                marginTop: 6,
              }}>{item.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* 신청 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
          <Link
            href="/enroll?type=퍼스널 브랜딩 서비스"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              background: 'var(--navy)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.03em',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(21,72,138,0.18)',
            }}
          >
            편집 서비스 신청하기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 공식 제휴 */}
      <section aria-label="공식 제휴 파트너" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="OFFICIAL PARTNERSHIP"
          title="공식 제휴"
          desc="KD4 멤버에게 특별한 혜택을 제공하는 공식 파트너사입니다."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640, margin: '0 auto' }}>

          {/* 서우스튜디오 */}
          <Link
            href="/benefits/seowoo-studio"
            aria-label="서우스튜디오 배우 프로필 촬영 제휴 혜택 자세히 보기"
            className="kd4-card-hover"
            style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 4vw, 24px)', background: '#ffffff', border: '1.5px solid rgba(21,72,138,0.18)', borderRadius: 12, padding: 'clamp(18px, 3vw, 24px)', textDecoration: 'none', position: 'relative', overflow: 'hidden', flexWrap: 'wrap' }}
          >
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: 'var(--gold)' }} />
            <Image src="/partners/seowoo-logo.webp" alt="서우스튜디오 로고" width={72} height={72} style={{ borderRadius: 6, flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 160, flex: 1 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>배우 프로필 촬영 제휴</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--gold)' }}>KD4 멤버 최대 15% 할인</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--secondary)' }}>서우스튜디오 · 프로필 · 포트레이트 촬영</span>
            </span>
            <span aria-hidden style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>자세히 보기 →</span>
          </Link>

          {/* CGV 신촌아트레온 아트하우스 */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 4vw, 24px)', background: '#ffffff', border: '1.5px solid rgba(21,72,138,0.18)', borderRadius: 12, padding: 'clamp(18px, 3vw, 24px)', position: 'relative', overflow: 'hidden', flexWrap: 'wrap' }}
          >
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: 'rgba(21,72,138,0.3)' }} />
            <Image src="/partners/cgv-logo.jpeg" alt="CGV 아트하우스" width={72} height={72} style={{ objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 160, flex: 1 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>신촌 아트레온 CGV 아트하우스</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--gold)' }}>신촌 아트레온 아트하우스 광고 체결</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--secondary)' }}>CGV 아트하우스 상영관 내 KD4 공식 광고 운영 중</span>
            </span>
          </div>

        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 멤버 커뮤니티 */}
      <section aria-label="멤버 커뮤니티" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="COMMUNITY"
          title="멤버 커뮤니티"
          desc="KD4 멤버는 혼자 크지 않습니다. 같은 길을 가는 멤버들과 함께 성장합니다."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {COMMUNITIES.map((item) => (
            <div
              className="kd4-card-hover"
              key={item.title}
              style={{
                background: 'var(--bg2)',
                border: '1.5px solid rgba(21,72,138,0.18)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* 상단 액센트 바 — 커뮤니티만 강조 */}
              <span aria-hidden style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 3,
                background: 'var(--gold)',
              }} />

              {/* 큰 이모지 + leader (top row) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span aria-hidden style={{
                  fontSize: '2rem',
                  lineHeight: 1,
                }}>{item.emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--white)',
                  letterSpacing: '0.02em',
                  background: 'rgba(21,72,138,0.06)',
                  border: '1px solid rgba(21,72,138,0.18)',
                  borderRadius: 3,
                  padding: '4px 10px',
                }}>{item.leader}</span>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                marginTop: 8,
              }}>{item.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{item.desc}</p>

              {item.pricing && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0 4px' }} />
                  <p style={{
                    fontFamily: 'var(--font-display), Oswald, sans-serif',
                    fontSize: '0.68rem',
                    letterSpacing: '0.2em',
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    fontWeight: 700,
                  }}>참여비 (월 기준)</p>
                  <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {item.pricing.map((p) => (
                      <li key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.83rem', color: 'var(--secondary)' }}>{p.label}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap' }}>{p.price}</span>
                        </div>
                        {p.note && (
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.73rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.45 }}>{p.note}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 할인 혜택 */}
      <section aria-label="할인 혜택" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="DISCOUNTS"
          title="할인 혜택"
          desc="신규/복귀/지인 동반/재수강까지 — 누가 와도 부담을 덜 수 있게."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {DISCOUNTS.map((d, i) => (
            <div
              className="kd4-card-hover"
              key={d.title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--white)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                  margin: 0,
                  wordBreak: 'keep-all',
                }}>{d.tag}</h3>
                <span aria-hidden style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: 300,
                  color: 'var(--gray)',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--gold)',
                lineHeight: 1.5,
                marginTop: 4,
                wordBreak: 'keep-all',
              }}>{d.title}</p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{d.desc}</p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.82rem',
            color: 'var(--secondary)',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          ※ 모든 할인은 중복 적용되지 않으며, 가장 큰 혜택 하나만 적용됩니다.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.82rem',
            color: 'var(--secondary)',
            textAlign: 'center',
            marginTop: '8px',
          }}
        >
          ※ 자세한 클래스별 가격과 할인 적용은{' '}
          <Link href="/join" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
            상담 신청 페이지
          </Link>
          에서 확인하실 수 있습니다.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* CTA */}
      <section
        aria-label="수강 신청 안내"
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: 'clamp(56px, 9vw, 96px) 24px clamp(72px, 10vw, 120px)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)',
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: '16px',
          }}
        >
          이 모든 혜택은<br />KD4 멤버에게 제공됩니다
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            lineHeight: 1.85,
            marginBottom: '32px',
          }}
        >
          무료 상담 받아보세요.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/join"
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
            무료 상담 신청
          </Link>
          <Link
            href="/classes"
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
            클래스 살펴보기
          </Link>
        </div>
        {/* 내부 교차 링크 — 주요 SEO 페이지 연결 */}
        <nav aria-label="관련 페이지" style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/about" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              KD4 소개 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              권동원 액팅 코치 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/meisner-technique-class" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              마이즈너 테크닉 클래스 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/sinchon-acting-academy" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              신촌 연기학원 오시는 길 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </section>
    </div>
  )
}
