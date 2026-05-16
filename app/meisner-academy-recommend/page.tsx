import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Users, Clock, Award, MonitorOff } from 'lucide-react'
import { RECOMMEND_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/meisner-academy-recommend`

export const metadata: Metadata = {
  title: '마이즈너 학원 선택 가이드 — 어떤 기준으로 골라야 할까',
  description:
    '한국에서 마이즈너 테크닉 학원을 선택할 때 확인해야 할 4가지 기준. 강사 자격, 정원 규모, 수업 시간, 현역 배우 강사 여부.',
  keywords: [
    '마이즈너 학원',
    '마이즈너 학원 추천',
    '마이즈너 클래스 선택',
    '연기학원 선택 기준',
    '마이즈너 테크닉 학원',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    url: PAGE_URL,
    title: '마이즈너 학원 선택 가이드 — 어떤 기준으로 골라야 할까',
    description: '한국에서 마이즈너 테크닉 학원을 선택할 때 확인해야 할 기준.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '마이즈너 학원 선택 가이드',
    description: '학원 고를 때 확인해야 할 4가지 기준.',
    images: ['/og-image.jpg'],
  },
}

const CRITERIA = [
  {
    Icon: Award,
    title: '강사의 정통 과정 이수',
    desc: '미국 LA Meisner Workshop 또는 동등한 본토 과정을 직접 수료한 강사인지 확인하세요. 책으로만 배운 강사와 정통 과정 수료자의 지도 깊이는 큰 차이가 있습니다.',
  },
  {
    Icon: Users,
    title: '정원 규모 (8명 이하 권장)',
    desc: '마이즈너 테크닉은 Repetition(반복연습)을 통한 상호 반응 훈련이 핵심입니다. 정원이 많으면 본인이 직접 훈련받는 시간이 줄어들어 효과가 떨어집니다.',
  },
  {
    Icon: Clock,
    title: '회당 수업 시간 (4시간 이상)',
    desc: '1시간 30분~2시간 수업은 마이즈너 훈련에 부족합니다. 한 사람당 30분 이상 피드백이 확보되려면 회당 4시간 이상의 수업이 필요합니다.',
  },
  {
    Icon: MonitorOff,
    title: '오프라인 수업 (온라인 비권장)',
    desc: '마이즈너는 상대방의 미세한 변화에 실시간 반응하는 훈련이라 같은 공간에서 호흡을 나누는 오프라인이 효과적입니다. 온라인 클래스는 효과가 제한적입니다.',
  },
]

export default function RecommendPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '마이즈너 학원 선택 가이드', url: PAGE_URL },
          ]),
          buildFaqPage(RECOMMEND_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            ACADEMY GUIDE
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            마이즈너 학원 선택 가이드
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px', wordBreak: 'keep-all' }}>
            한국에서 마이즈너 테크닉을 정통으로 가르치는 학원은 손에 꼽힙니다. 학원 선택 시 확인해야 할 4가지 기준.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="recommend-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="recommend-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="section-eyebrow">01 — WHY IT MATTERS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>왜 학원 선택이 중요한가</h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.85, wordBreak: 'keep-all' }}>
            마이즈너 테크닉은 잘못 배우면 평생 가는 연기 습관을 만들 수 있습니다. 가짜 감정을 만들어내는 매너리즘을 해체하기는커녕 강화시킬 수도 있습니다. 학원을 선택할 때 단순히 가까운 곳이나 가격이 저렴한 곳이 아니라 강사의 정통 과정 이수 여부와 수업 환경을 꼭 확인해야 합니다.
          </p>
        </div>
      </section>

      {/* 4 CRITERIA */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — 4 CRITERIA</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>학원 선택 4가지 기준</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '960px', margin: '0 auto' }}>
            {CRITERIA.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{title}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KD4 SELF */}
      <section style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p className="section-eyebrow">03 — KD4</p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>KD4는 어떤 기준을 충족하나</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            {[
              '권동원 대표 — LA Meisner Workshop 및 한국 마이즈너테크닉 아카데미 수료',
              '정원 8명 (마이즈너 정규반)',
              '회당 4시간 수업 / 1인 피드백 30분 이상',
              '서울 신촌 오프라인 수업',
            ].map((line) => (
              <li key={line} style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.92rem', color: '#111', position: 'relative', paddingLeft: '36px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--navy)', fontWeight: 700 }}>✓</span>
                {line}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', fontWeight: 600 }}>
              KD4 마이즈너 정규 클래스 →
            </Link>
            <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.9rem', color: 'var(--navy)', fontWeight: 600 }}>
              강사 권동원 프로필 →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={RECOMMEND_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                나에게 맞는지 직접 확인하기
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
