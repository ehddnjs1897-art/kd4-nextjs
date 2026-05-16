import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Eye, Film, Check, X } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import { REEL_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/reel-production-class`

const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

export const metadata: Metadata = {
  title: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4',
  description:
    '전문 영화팀과 함께 만드는 출연영상 포트폴리오. 마이즈너 테크닉 + 맞춤 시나리오 + 현장 촬영. 현직 배우 100명+ 참여한 시그니처 클래스.',
  keywords: [
    '출연영상 제작',
    '배우 포트폴리오',
    '연기 포트폴리오',
    '배우 프로필 영상',
    '오디션 영상',
    'KD4 출연영상 클래스',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4',
    description: '전문 영화팀과 함께 만드는 캐스팅용 출연영상 포트폴리오.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '출연영상 클래스 — KD4',
    description: '전문 영화팀과 함께 만드는 배우 포트폴리오.',
    images: ['/og-image.jpg'],
  },
}

const WHY_REEL = [
  {
    Icon: Eye,
    title: '캐스팅 디렉터의 시선',
    desc: '프로필 사진으로는 연기력이 보이지 않습니다. 캐스팅 디렉터는 영상으로 배우의 연기·표정·호흡을 한 번에 확인합니다.',
  },
  {
    Icon: Film,
    title: '실제 영화 현장의 퀄리티',
    desc: '핸드폰이나 학원 자체 영상이 아닌 실제 영화팀(촬영감독·조명·사운드) 셋업으로 제작. 그대로 오디션 제출 가능.',
  },
]

const PROCESS = [
  { num: '01', title: '레퍼런스 취합', desc: '본인 톤·매력에 맞는 영상 레퍼런스를 함께 큐레이션.' },
  { num: '02', title: '시나리오 작성', desc: '레퍼런스 기반 본인 전용 시나리오. 단순 독백이 아닌 임팩트 장면.' },
  { num: '03', title: '전문 영화팀 촬영', desc: '영화 현장의 카메라·조명·사운드 셋업. 마이즈너 훈련 병행.' },
  { num: '04', title: '편집·납품', desc: '컬러 그레이딩·사운드 디자인 완료. 오디션 제출에 바로 사용.' },
]

const INCLUDES = [
  { yes: true, text: '시나리오 작성 (본인 톤 맞춤)' },
  { yes: true, text: '전문 영화팀 촬영 (카메라·조명·사운드)' },
  { yes: true, text: '편집·컬러 그레이딩·사운드 디자인' },
  { yes: true, text: '캐스팅·오디션 제출용 영상 납품' },
  { yes: false, text: '추가 촬영 회차 (별도 견적)' },
  { yes: false, text: '상업적 재판매·타 학원 홍보 사용' },
]

const PORTFOLIO_VIDEOS = [
  { id: '7Q62XeyVLbc', title: '출연영상 샘플 1' },
  { id: 'IWL6hlOrU-w', title: '출연영상 샘플 2' },
  { id: 'PUlrhjOkvjA', title: '출연영상 샘플 3' },
]

export default function ReelPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '출연영상 클래스', url: PAGE_URL },
          ]),
          buildCourseFromClass(FILM_CLASS, { url: PAGE_URL }),
          buildFaqPage(REEL_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            STEP 01 · REEL PRODUCTION
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            출연영상 클래스
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '8px', maxWidth: '600px', margin: '0 auto 8px', wordBreak: 'keep-all', fontStyle: 'italic' }}>
            &ldquo;{FILM_CLASS.quote}&rdquo;
          </p>
          <p style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,255,255,0.55)', marginBottom: '32px', letterSpacing: '0.03em' }}>
            3개월 코스 · 정원 6명 · 전문 영화팀 촬영
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="reel-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="reel-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* WHY REEL */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — WHY REEL</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>왜 출연영상이 필요한가</h2>
            <p className="section-desc">
              현직 배우 100명 이상이 거쳐간 KD4 시그니처 클래스. 한 편의 영상이 캐스팅으로 이어지는 자산이 됩니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
            {WHY_REEL.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{title}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — PORTFOLIO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>결과물 샘플</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {PORTFOLIO_VIDEOS.map((v) => (
              <div key={v.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <YouTubeFacade videoId={v.id} title={v.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — PROCESS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>제작 4단계</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {PROCESS.map(({ num, title, desc }) => (
              <div key={num} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy-tint-3)', lineHeight: 1, display: 'block', marginBottom: '12px', letterSpacing: '0.02em' }}>
                  {num}
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>{title}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.65, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASS DETAILS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow">04 — DETAILS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>클래스 정보</h2>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg)', border: '1.5px solid var(--navy)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{FILM_CLASS.nameKo}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>{FILM_CLASS.nameEn}</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {FILM_CLASS.bullets.map((b, i) => (
                <li key={i} style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.55em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { label: '일정', value: FILM_CLASS.schedule },
                { label: '시간', value: FILM_CLASS.duration },
                { label: '정원', value: FILM_CLASS.capacity },
                { label: '코스', value: FILM_CLASS.course ?? '3개월' },
                { label: '월 수강료', value: `₩${FILM_CLASS.price}` },
              ].map((info) => (
                <div key={info.label}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray)', display: 'block' }}>{info.label}</span>
                  <span style={{ fontSize: '0.92rem', color: '#111', fontWeight: 600 }}>{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INCLUDES */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — INCLUDES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>포함 사항</h2>
            <p className="section-desc">
              영상 소유권은 KD4가 보유하되 멤버는 캐스팅 활동에 자유롭게 사용 가능합니다.
            </p>
          </div>
          <ul style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INCLUDES.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                {item.yes ? <Check size={18} color="var(--navy)" strokeWidth={2.2} /> : <X size={18} color="var(--gray)" strokeWidth={2.2} />}
                <span style={{ fontSize: '0.92rem', color: item.yes ? '#111' : 'var(--gray)', fontWeight: item.yes ? 600 : 400 }}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={REEL_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                출연영상 클래스 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* CROSS-LINK */}
      <section style={{ padding: '24px', background: 'var(--bg)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          ← 마이즈너 정규 클래스
        </Link>
        <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>
          전체 클래스 보기 →
        </Link>
      </section>
    </div>
  )
}
