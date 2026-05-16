import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { REVIEW_ITEMS } from '@/lib/reviews'
import { REVIEWS_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/reviews`

export const metadata: Metadata = {
  title: 'KD4 멤버 이야기 — 마이즈너 테크닉 후기 | KD4 액팅 스튜디오',
  description:
    'KD4 액팅 스튜디오 멤버들이 직접 남긴 후기. 마이즈너 테크닉 정규반과 출연영상 클래스를 수료한 멤버들의 진솔한 경험.',
  keywords: [
    'KD4 후기',
    '마이즈너 학원 후기',
    '연기학원 후기',
    'KD4 액팅 스튜디오 후기',
    '신촌 연기학원 후기',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'KD4 멤버 이야기 — 마이즈너 테크닉 후기',
    description: 'KD4 액팅 스튜디오 멤버들의 진솔한 후기.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KD4 멤버 이야기',
    description: 'KD4 액팅 스튜디오 멤버들의 진솔한 후기.',
    images: ['/og-image.jpg'],
  },
}

export default function ReviewsPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '멤버 이야기', url: PAGE_URL },
          ]),
          buildFaqPage(REVIEWS_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            MEMBER STORIES
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            KD4 멤버 이야기
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px', wordBreak: 'keep-all' }}>
            실제 KD4 멤버들이 직접 남긴 후기.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="reviews-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="reviews-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* REVIEWS GRID */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — REAL VOICES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>실제 멤버들의 목소리</h2>
            <p className="section-desc">
              개인정보 보호를 위해 가명 처리됐습니다 (예: 김*현).
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '1080px', margin: '0 auto' }}>
            {REVIEW_ITEMS.map((r, i) => (
              <figure key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', margin: 0 }}>
                {r.emoji && (
                  <div style={{ fontSize: '2rem', lineHeight: 1, marginBottom: '12px' }}>{r.emoji}</div>
                )}
                <blockquote style={{ fontSize: '0.95rem', color: '#111', lineHeight: 1.7, margin: '0 0 12px', wordBreak: 'keep-all' }}>
                  &ldquo;{r.text}&rdquo;
                </blockquote>
                <figcaption style={{ fontSize: '0.78rem', color: 'var(--gray)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
                  — {r.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CROSS-LINK */}
      <section style={{ padding: 'clamp(48px, 8vw, 64px) 0', background: 'var(--bg2)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p className="section-eyebrow">CLASS</p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>후기를 만든 클래스</h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', fontWeight: 600, padding: '8px 16px', border: '1px solid var(--navy-tint-3)', borderRadius: '4px', textDecoration: 'none' }}>
              마이즈너 정규 클래스 →
            </Link>
            <Link href="/reel-production-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', fontWeight: 600, padding: '8px 16px', border: '1px solid var(--navy-tint-3)', borderRadius: '4px', textDecoration: 'none' }}>
              출연영상 클래스 →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={REVIEWS_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                나도 KD4 멤버가 되고 싶다면
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
