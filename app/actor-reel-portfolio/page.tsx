import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PORTFOLIO_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/actor-reel-portfolio`

export const metadata: Metadata = {
  title: '배우 출연영상 포트폴리오 사례 — KD4 액팅 스튜디오',
  description:
    'KD4 출연영상 클래스 멤버들이 제작한 실제 배우 포트폴리오. 마이즈너 테크닉 기반 연기와 전문 영화팀 촬영으로 만든 캐스팅용 영상.',
  keywords: [
    '배우 출연영상',
    '배우 포트폴리오',
    '출연영상 사례',
    '연기 포트폴리오 영상',
    '배우 프로필 영상',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '배우 출연영상 포트폴리오 사례 — KD4',
    description: 'KD4 출연영상 클래스 멤버들이 제작한 실제 배우 포트폴리오.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '배우 출연영상 포트폴리오 — KD4',
    description: 'KD4 멤버들이 제작한 실제 배우 포트폴리오.',
    images: ['/og-image.jpg'],
  },
}

const VIDEOS = [
  { id: '7Q62XeyVLbc', title: 'KD4 출연영상 — 메소드 연기' },
  { id: 'IWL6hlOrU-w', title: 'KD4 출연영상 — 장면연기 1' },
  { id: 'PUlrhjOkvjA', title: 'KD4 출연영상 — 장면연기 2' },
]

export default function PortfolioPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '출연영상 사례', url: PAGE_URL },
          ]),
          buildFaqPage(PORTFOLIO_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            REEL PORTFOLIO
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            배우 출연영상 포트폴리오 사례
          </h1>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
            <JoinCTALink href="#form" location="portfolio-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="portfolio-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* PORTFOLIO GRID */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — REAL OUTPUT</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>실제 멤버들의 작품</h2>
            <p className="section-desc">
              전문 영화팀(촬영감독·조명·사운드)이 참여한 현장 셋업에서 제작된 캐스팅 직제출용 퀄리티.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', maxWidth: '1040px', margin: '0 auto' }}>
            {VIDEOS.map((v) => (
              <div key={v.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <YouTubeFacade videoId={v.id} title={v.title} />
                <p style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--gray-light)', margin: 0 }}>
                  {v.title}
                </p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--gray)' }}>
            매월 신규 영상이 추가됩니다.
          </p>
        </div>
      </section>

      {/* CROSS-LINK */}
      <section style={{ padding: 'clamp(32px, 6vw, 48px) 0', background: 'var(--bg2)', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, margin: 0 }}>
            이런 영상은 출연영상 클래스 3개월 코스에서 만들어집니다.{' '}
            <Link href="/reel-production-class" style={{ color: 'var(--navy)', fontWeight: 600 }}>
              자세히 보기 →
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={PORTFOLIO_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                내 포트폴리오 영상도 만들고 싶다면
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
