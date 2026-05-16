import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Train, Clock, Users } from 'lucide-react'
import { DIRECTOR } from '@/lib/classes'
import { SINCHON_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/sinchon-acting-academy`

export const metadata: Metadata = {
  title: '신촌 연기학원 — 서대문·이대·아현 마이즈너 테크닉 액팅 스튜디오',
  description:
    '서대문구 대현동, 이대역 도보 3분. KD4 액팅 스튜디오는 마이즈너 테크닉 정규반과 출연영상 클래스를 운영합니다.',
  keywords: [
    '신촌 연기학원',
    '서대문 연기학원',
    '이대 연기학원',
    '아현 연기학원',
    '충정로 연기학원',
    'KD4 액팅 스튜디오',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '신촌 연기학원 — KD4 액팅 스튜디오',
    description: '이대역 도보 3분, 마이즈너 테크닉 정규 클래스 운영.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '신촌 연기학원 — KD4 액팅 스튜디오',
    description: '이대역 도보 3분, 마이즈너 테크닉 정규 클래스 운영.',
    images: ['/og-image.jpg'],
  },
}

const ACCESS_ITEMS = [
  { Icon: Train, title: '지하철 2호선 이대역', desc: '5번 출구 도보 3분. 신촌역 10분.' },
  { Icon: Train, title: '5호선 충정로역', desc: '도보 12분. 강북·종로 방면 접근 용이.' },
  { Icon: MapPin, title: '주소', desc: '서울시 서대문구 대현동 90-7 아리움3차 1층 101호' },
  { Icon: Clock, title: '운영시간', desc: '월~토 10:00–22:00 / 일요일 휴무' },
]

export default function SinchonPage() {
  return (
    <main style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '신촌 연기학원', url: PAGE_URL },
          ]),
          buildFaqPage(SINCHON_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            NEIGHBORHOOD · 신촌 / 서대문 / 이대
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            이대역 도보 3분,<br />신촌 마이즈너 테크닉 연기학원
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px', wordBreak: 'keep-all' }}>
            서대문구 대현동, 권동원 대표 직강. 마이즈너 테크닉 정규반과 출연영상 클래스를 운영합니다.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="sinchon-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="sinchon-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* LOCATION & ACCESS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — LOCATION & ACCESS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>찾아오시는 길</h2>
            <p className="section-desc">
              이대역 5번 출구 도보 3분. 신촌·아현·충정로 권역에서 접근이 편리하며, 이대 상권 안이라 수업 전후 시간을 보내기 좋습니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '960px', margin: '0 auto' }}>
            {ACCESS_ITEMS.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--navy-tint-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon size={18} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{title}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.65, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASS LINEUP */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — CLASSES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>신촌 스튜디오에서 운영하는 클래스</h2>
            <p className="section-desc">9개 클래스 중 신규 등록 가능한 핵심 두 가지.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '880px', margin: '0 auto 24px' }}>
            {[
              { href: '/meisner-technique-class', title: '마이즈너 테크닉 정규 클래스', desc: '4개월 코스 · 정원 8명 · 회당 4시간', tag: 'STEP 1' },
              { href: '/reel-production-class', title: '출연영상 클래스', desc: '3개월 코스 · 정원 6명 · 전문 영화팀 촬영', tag: 'STEP 1' },
            ].map(({ href, title, desc, tag }) => (
              <Link key={href} href={href} style={{ display: 'block', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', textDecoration: 'none', color: '#111111' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--navy)', background: 'var(--navy-tint-1)', border: '1px solid var(--navy-tint-3)', borderRadius: '4px', padding: '3px 8px' }}>
                  {tag}
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, marginTop: '12px', marginBottom: '6px' }}>{title}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', marginBottom: '12px' }}>{desc}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600 }}>상세 페이지 보기 →</span>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'underline' }}>
              전체 클래스 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* DIRECTOR MINI */}
      <section style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p className="section-eyebrow">03 — DIRECTOR</p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>{DIRECTOR.name} 대표 · 현역 배우</h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, marginBottom: '16px', wordBreak: 'keep-all' }}>
            Disney+ 무빙2 · Netflix 중증외상센터 출연 중. LA Meisner Workshop 수료.
          </p>
          <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'underline' }}>
            강사 프로필 자세히 보기 →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>위치·교통 자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={SINCHON_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                30초만에 신청 완료
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>
    </main>
  )
}
