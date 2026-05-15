import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Train, Clock, Users, Award } from 'lucide-react'
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
    '서울 서대문구 대현동, 이대역 도보 3분. KD4 액팅 스튜디오는 신촌·서대문권 연기학원으로 마이즈너 테크닉 정규 클래스와 출연영상 제작을 운영합니다.',
  keywords: [
    '신촌 연기학원',
    '서대문 연기학원',
    '이대 연기학원',
    '아현 연기학원',
    '충정로 연기학원',
    '신촌 마이즈너',
    'KD4 액팅 스튜디오',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '신촌 연기학원 — 서대문·이대·아현 마이즈너 테크닉 액팅 스튜디오',
    description:
      '이대역 도보 3분, 서울 서대문구 KD4 액팅 스튜디오. 마이즈너 테크닉 정규 클래스와 출연영상 제작 운영.',
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
  {
    Icon: Train,
    title: '지하철 2호선 이대역',
    desc: '5번 출구에서 도보 3분. 신촌역에서 도보 10분.',
  },
  {
    Icon: Train,
    title: '지하철 5호선 충정로역',
    desc: '도보 12분. 강북·종로 방면에서 접근 용이.',
  },
  {
    Icon: MapPin,
    title: '주소',
    desc: '서울시 서대문구 대현동 90-7 아리움3차 1층 101호 (이화여대1안길 12)',
  },
  {
    Icon: Clock,
    title: '운영시간',
    desc: '월~토 10:00–22:00 (일요일 휴무). 평일 저녁·주말 클래스 집중 운영.',
  },
]

const WHY_KD4 = [
  {
    Icon: Award,
    title: '이대권 정통 마이즈너 코스',
    desc: 'KD4는 신촌·이대 권역에서 마이즈너 테크닉을 정통으로 가르치는 몇 안 되는 학원입니다. 미국 LA Meisner Workshop을 직접 수료한 권동원 대표가 4개월 정규 코스로 체계적인 훈련을 진행합니다. 한국적 맥락에 맞춰 재해석된 커리큘럼으로 진짜 배우 훈련을 받으실 수 있습니다.',
  },
  {
    Icon: Users,
    title: '6~8명 소수정예',
    desc: '대규모 강의가 아닌 정원 6~8명의 소수정예 클래스입니다. 회당 4시간 수업에서 1인당 30분 이상의 피드백이 확보됩니다. 일반 연기학원의 회당 5~10분 피드백과 큰 차이를 만들어냅니다.',
  },
  {
    Icon: Award,
    title: '현역 배우 강사 직강',
    desc: '대표 권동원은 Disney+ 무빙2, Netflix 중증외상센터 등에 출연 중인 현역 배우입니다. 이론만 가르치는 학원이 아니라 지금 촬영 현장에서 통하는 연기와 캐스팅 흐름을 실시간으로 공유합니다.',
  },
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
      <section
        style={{
          position: 'relative',
          padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)',
          background: 'var(--navy)',
          color: '#fff',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p
            className="section-eyebrow"
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '18px' }}
          >
            NEIGHBORHOOD · 신촌 / 서대문 / 이대
          </p>
          <h1
            className="section-title-serif"
            style={{
              color: '#fff',
              fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)',
              lineHeight: 1.35,
              marginBottom: '20px',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            이대역 도보 3분,
            <br />
            신촌 마이즈너 테크닉 연기학원
          </h1>
          <p
            style={{
              fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)',
              color: 'rgba(255,255,255,0.86)',
              lineHeight: 1.7,
              marginBottom: '32px',
              maxWidth: '560px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            서대문구 대현동 아리움3차 1층. 이화여대·아현·충정로 권역에서 가장 가까운 KD4 액팅 스튜디오에서 마이즈너 테크닉 정규 클래스와 출연영상 포트폴리오를 만나보세요.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink
              href="#form"
              location="sinchon-hero"
              label="무료 상담 신청"
              className="btn-primary"
              style={{ background: '#fff', color: 'var(--navy)' }}
            >
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="sinchon-hero"
              label="카카오 채널 문의"
              className="btn-outline"
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}
            >
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* LOCATION & ACCESS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — LOCATION & ACCESS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              찾아오시는 길
            </h2>
            <p className="section-desc">
              지하철 2호선 이대역 5번 출구에서 도보 3분. 서울 서대문구의 신촌·이대·아현·충정로 권역
              어디서든 접근이 편리합니다. 인근에 이화여자대학교, 신촌세브란스병원, 카페·식당 상권이
              밀집해 있어 수업 전후 시간을 활용하기 좋습니다.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {ACCESS_ITEMS.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px 22px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--navy-tint-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <Icon size={18} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.65,
                    wordBreak: 'keep-all',
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY KD4 IN SINCHON */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — WHY KD4 IN SINCHON</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              신촌권 연기학원 중 KD4를 선택하는 이유
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {WHY_KD4.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '26px 24px',
                }}
              >
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.75,
                    wordBreak: 'keep-all',
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASS LINEUP — 간단히 2장만 */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — CLASSES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              신촌 스튜디오에서 운영하는 클래스
            </h2>
            <p className="section-desc">
              KD4는 마이즈너 테크닉 정규 클래스를 중심으로 출연영상·오디션·움직임·개인 레슨까지 9개
              클래스를 운영합니다. 신촌 스튜디오에서 모든 수업이 진행됩니다.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto 24px',
            }}
          >
            {[
              {
                href: '/meisner-technique-class',
                title: '마이즈너 테크닉 정규 클래스',
                desc: '4개월 코스 · 정원 8명 · 회당 4시간',
                tag: 'STEP 1',
              },
              {
                href: '/reel-production-class',
                title: '출연영상 클래스',
                desc: '3개월 코스 · 정원 6명 · 전문 영화팀 촬영',
                tag: 'STEP 1',
              },
            ].map(({ href, title, desc, tag }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '26px 24px',
                  textDecoration: 'none',
                  color: '#111111',
                  transition: 'border-color 0.2s',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    color: 'var(--navy)',
                    background: 'var(--navy-tint-1)',
                    border: '1px solid var(--navy-tint-3)',
                    borderRadius: '3px',
                    padding: '3px 9px',
                  }}
                >
                  {tag}
                </span>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginTop: '14px',
                    marginBottom: '6px',
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', marginBottom: '14px' }}>
                  {desc}
                </p>
                <span style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600 }}>
                  상세 페이지 보기 →
                </span>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link
              href="/classes"
              style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'underline' }}
            >
              전체 클래스 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* DIRECTOR MINI */}
      <section style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div
          className="container"
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p className="section-eyebrow">04 — DIRECTOR</p>
          <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
            {DIRECTOR.name} 대표 · 현역 배우
          </h2>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--gray-light)',
              lineHeight: 1.75,
              marginBottom: '20px',
              wordBreak: 'keep-all',
            }}
          >
            Disney+ 무빙2, Netflix 중증외상센터 등에 출연 중인 현역 배우.
            <br />
            LA Meisner Workshop 수료, 프로 배우 400명 이상 지도.
          </p>
          <Link
            href="/acting-coach-dongwon-kwon"
            style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'underline' }}
          >
            강사 프로필 자세히 보기 →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              위치·교통·시설 자주 묻는 질문
            </h2>
          </div>
          <FaqAccordion items={SINCHON_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section
        id="form"
        style={{
          padding: 'clamp(56px, 9vw, 80px) 0',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '10px' }}
              >
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

      {/* FOOTER NOTE */}
      <section style={{ padding: '48px 24px', background: 'var(--bg-deep)', color: '#fff', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
          KD4 액팅 스튜디오 · 서울시 서대문구 대현동 90-7 아리움3차 1층 101호
        </p>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
          운영시간 월~토 10:00–22:00 · 일요일 휴무
        </p>
      </section>
    </main>
  )
}
