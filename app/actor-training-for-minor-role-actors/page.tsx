import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Target, Clock, Layers, Handshake } from 'lucide-react'
import { MINOR_ROLE_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/actor-training-for-minor-role-actors`

export const metadata: Metadata = {
  title: '진짜 배우를 위한 연기 훈련 — KD4 액팅 스튜디오',
  description:
    '현장에서 통하는 진짜 배우를 만드는 KD4 정규 연기 훈련. 마이즈너 테크닉 기반 6~8명 소수정예 클래스 + 캐스팅 연계.',
  keywords: [
    '진짜 배우 훈련',
    '정규 연기 훈련',
    '배우 연기 클래스',
    '마이즈너 정규 훈련',
    '현역 배우 클래스',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '진짜 배우를 위한 연기 훈련 — KD4 액팅 스튜디오',
    description: '현장에서 통하는 진짜 배우를 만드는 KD4 정규 연기 훈련.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '진짜 배우를 위한 연기 훈련 — KD4',
    description: '현장에서 통하는 진짜 배우 정규 훈련.',
    images: ['/og-image.jpg'],
  },
}

const REASONS = [
  {
    Icon: Target,
    title: '단 한 컷의 정확도',
    desc: '단 한 컷의 호흡·표정·반응이 다음 캐스팅을 좌우합니다. 정확도가 결정적입니다.',
  },
  {
    Icon: Clock,
    title: '바쁜 일정과 병행 가능',
    desc: '주 1회 월 4회 수업으로 촬영 일정과 조율 가능합니다. 부득이 결석 시 보강 제도(스케줄표 내 다른 클래스)가 운영됩니다.',
  },
  {
    Icon: Layers,
    title: '단계적 성장 경로',
    desc: 'STEP 1 마이즈너 정규반 → STEP 2 출연영상·심화 → STEP 3 액터스 리더로 이어지는 로드맵이 설계되어 있습니다.',
  },
  {
    Icon: Handshake,
    title: '캐스팅 디렉터와 직접 연결',
    desc: 'KD4는 방진원·이상원 캐스팅 디렉터와 정기 협업합니다. 수료 후 배우 DB 등록을 통해 캐스팅 검토 대상에 자동 포함됩니다.',
  },
]

export default function MinorRolePage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '진짜 배우 훈련', url: PAGE_URL },
          ]),
          buildFaqPage(MINOR_ROLE_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            REAL ACTOR TRAINING
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            진짜 배우를 위한 연기 훈련
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px', wordBreak: 'keep-all' }}>
            현장에서 통하는 진짜 배우를 만드는 마이즈너 정규 훈련.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="minor-role-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="minor-role-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* 4 REASONS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — WHY KD4</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>진짜 배우에게 KD4가 필요한 이유</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '960px', margin: '0 auto' }}>
            {REASONS.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{title}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROWTH PATH */}
      <section style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p className="section-eyebrow">02 — GROWTH PATH</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>KD4 배우 성장 로드맵</h2>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { step: 'STEP 1', name: '마이즈너 정규 클래스', desc: '연기 기본기 회복. 가짜 감정 습관 해체.', href: '/meisner-technique-class' },
              { step: 'STEP 2', name: '출연영상 클래스', desc: '캐스팅 직제출용 포트폴리오 영상 제작.', href: '/reel-production-class' },
              { step: 'STEP 3', name: '액터스 리더 클래스', desc: '캐스팅 디렉터·조감독 비공식 오디션 참여.', href: '/classes' },
            ].map(({ step, name, desc, href }) => (
              <li key={step} style={{ padding: '20px 24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--navy)', fontWeight: 700, flexShrink: 0, paddingTop: '4px' }}>
                  {step}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{name}</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', marginBottom: '6px' }}>{desc}</p>
                  <Link href={href} style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600 }}>
                    자세히 보기 →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={MINOR_ROLE_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                진짜 배우 훈련 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>
    </div>
  )
}
