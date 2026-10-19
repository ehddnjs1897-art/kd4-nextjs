import type { Metadata } from 'next'
import { Fragment } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import StickyTopBar from '@/components/join/StickyTopBar'
import JoinCTALink from '@/components/join/JoinCTALink'
import { WhyKD4Section, DirectorSection, ReviewsSection, PromiseSection } from '@/components/join/JoinTrustSections'
import { SITE_URL } from '@/lib/constants'

/* 폴드 아래 / 비즈니스 크리티컬하지 않은 컴포넌트 — 지연 로딩 */
const JoinPageView = dynamic(() => import('@/components/analytics/JoinPageView'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const StickyBottomCTA = dynamic(() => import('@/components/join/StickyBottomCTA'))
const ScrollDepth = dynamic(() => import('@/components/analytics/ScrollDepth'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

export const metadata: Metadata = {
  title: '무료 상담 신청',
  description: '소수정예 마이즈너 테크닉 연기 클래스. 무료 상담 신청. 서울 신촌. KD4 액팅 스튜디오.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/join` },
  // 광고 랜딩페이지: 명시적 OG 이미지 — root layout 변경에도 영향 없도록
  openGraph: {
    title: '무료 상담 신청 | KD4 액팅 스튜디오',
    description: '소수정예 마이즈너 테크닉 연기 클래스. 무료 상담 신청. 서울 신촌. KD4 액팅 스튜디오.',
    url: `${SITE_URL}/join`,
    siteName: 'KD4 액팅 스튜디오',
    locale: 'ko_KR',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '무료 상담 신청 | KD4 액팅 스튜디오',
    description: '소수정예 마이즈너 테크닉 연기 클래스. 무료 상담 신청. 서울 신촌.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

export const revalidate = 3600

/* ── 상수 ────────────────────────────────────────────────────────── */
/* 강사 사진은 DIRECTOR.photo 참조 (/director.jpg) — Director 섹션용 */
/* 2026-05-30: 봄맞이 프로모션 종료 — 카운트다운/마감 카피 전부 제거.
   다음 프로모션 시 CountdownTimer + DEADLINE + lib/classes.ts promoLabel/originalPrice 부활. */

/* ── lib/classes.ts 데이터 재사용 ─────────────────────────────────── */
const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!
const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

/* Sticky 상단 모집 중 반 (기수 정보 포함) */
const OPEN_COHORTS = [
  { name: '마이즈너', cohort: '3기', seats: MAIN_CLASS.remainingSeats ?? 0, price: parseInt(MAIN_CLASS.price.replace(/,/g, ''), 10) },
  { name: '출연영상', cohort: '19기', seats: FILM_CLASS.remainingSeats ?? 0, price: parseInt(FILM_CLASS.price.replace(/,/g, ''), 10) },
]

/* ── 더 알아보기 링크 (2026-10-19 대표: 스튜디오 소개 + 클래스·각 페이지 링크) — 이름·한 줄·가격은 lib/classes.ts 그대로 ── */
const MORE_LINKS = [
  { nameKo: '베이직 클래스', href: '/basic-acting-class', tag: '취미 · 입문' },
  { nameKo: '마이즈너 테크닉 정규 클래스', href: '/meisner-technique-class', tag: '정규 클래스' },
  { nameKo: '출연영상 클래스', href: '/reel-production-class', tag: '정규 · 포트폴리오' },
  { nameKo: '오디션 테크닉 클래스', href: '/audition-technique-class', tag: '정규 · 오디션 준비' },
  { nameKo: '개인 레슨', href: '/acting-coaches', tag: '1:1 · 맞춤 지도' },
].map((l) => ({ ...l, cls: CLASSES.find((c) => c.nameKo === l.nameKo)! }))

/* ── 후기 마퀴 (2행 교차) ── */


/* ══════════════════════════════════════════════════════════════════ */

export default function JoinPage() {
  return (
    <>
      <div
        className="uplift-page"
        style={{
          background: 'var(--bg)',
          color: '#111111',
          paddingBottom: '90px',
        }}
      >
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '무료 상담 신청', url: `${SITE_URL}/join` },
        ]),
        buildWebPage({
          type: 'WebPage',
          idPath: '/join#webpage',
          url: `${SITE_URL}/join`,
          name: '무료 상담 신청 — KD4 액팅 스튜디오',
          description: '마이즈너 테크닉 연기 훈련 무료 상담 신청. KD4 액팅 스튜디오 클래스 안내.',
          dateModified: LAST_UPDATED.join,
          speakableCssSelectors: ['h1'],
        }),
      ]} />

      <StickyTopBar cohorts={OPEN_COHORTS} />

      {/* 분석: 랜딩 ViewContent + 스크롤 깊이 추적 (GA4 + Meta Pixel) */}
      <JoinPageView />
      <ScrollDepth />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ① HERO — 강사 사진 + 세리프 헤드라인                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        aria-label="히어로 — 권동원 대표 소개"
        style={{
          position: 'relative',
          minHeight: '560px',
          overflow: 'hidden',
          background: 'var(--navy)',
        }}
      >
        {/* B. Hero 시네마틱 배경 (Preview) — director.jpg overlay + 그라데이션 */}
        <div className="hero-bg-image" aria-hidden />
        <div className="hero-cinematic-overlay" aria-hidden />

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: 'clamp(72px, 14vw, 120px) 24px clamp(60px, 10vw, 90px)',
            textAlign: 'center',
          }}
        >
          <p
            className="section-eyebrow"
            style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '20px', wordBreak: 'keep-all' }}
          >
            캐스팅 디렉터 · 인물 조감독 공식 협업 아카데미
          </p>

          <h1
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.55rem, 4.2vw, 2.8rem)',
              color: '#ffffff',
              lineHeight: 1.4,
              marginBottom: '28px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            수업이 끝이 아닙니다.
            <br />
            <span
              style={{
                color: '#ffffff',
                borderBottom: '2px solid var(--navy-accent)',
                paddingBottom: '2px',
              }}
            >
              캐스팅까지 연결합니다.
            </span>
          </h1>

          {/* 숫자 임팩트 — 첫 화면 후킹 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(20px, 6vw, 44px)',
              marginBottom: '28px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { num: '150명', label: '현직 배우 수료' },
              { num: '3년', label: '캐스팅 연계 운영' },
              { num: '8명', label: '소수정예 정원' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1,
                    letterSpacing: '0.01em',
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(0.68rem, 1.8vw, 0.78rem)',
                    color: 'rgba(255,255,255,0.75)',
                    marginTop: '6px',
                    letterSpacing: '0.03em',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <JoinCTALink
              href="#form-hero"
              location="hero"
              label="지금 무료 상담 신청"
              fireLead
              className="btn-primary uplift-cta-pulse"
              style={{ background: 'var(--navy)', color: '#ffffff' }}
            >
              지금 무료 상담 신청
              <ArrowRight aria-hidden={true} size={16} strokeWidth={2.2} />
            </JoinCTALink>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="hero"
              label="카카오로 문의하기"
              fireLead
              className="btn-outline"
              style={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <MessageCircle aria-hidden={true} size={14} strokeWidth={2.2} />
              카카오로 문의하기
            </JoinCTALink>
          </div>

          <p
            style={{
              fontSize: 'clamp(0.78rem, 2vw, 0.85rem)',
              color: 'rgba(255,255,255,0.7)',
              marginTop: '18px',
              letterSpacing: '0.02em',
            }}
          >
            연기 경험 없어도 OK
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⓪ FORM-HERO — Hero 직후 즉시 신청 (스크롤 거리 0)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="form-hero"
        aria-label="즉시 무료 상담 신청"
        className="section"
        style={{
          scrollMarginTop: '80px', // sticky 상단바 가림 보정 (모양 불변)
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
          padding: 'clamp(48px, 9vw, 80px) 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 · 3단계 간편 신청</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '10px' }}
              >
                배우의 여정, 여기서 시작
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                클래스를 고르고 연락처만 남기면 끝 — 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* WHO NEEDS 섹션 — 광고 압축으로 제거 (5/6) */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ② KD4 고유 자산 — 3년이 만든 캐스팅 연계 시스템           */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <WhyKD4Section />

      {/* COMPARE 섹션 — 광고 압축으로 제거 (5/6) */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ③ SOLUTION — 마이즈너 테크닉 (광고 압축: 영상 + 1줄 + 링크) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section aria-label="마이즈너 테크닉 소개" className="section" style={{ background: 'var(--bg)', padding: 'clamp(56px, 10vw, 88px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">02 — THE METHOD</span></p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)', marginBottom: '12px' }}
            >
              <span style={{ color: 'var(--navy)' }}>마이즈너 테크닉</span>
            </h2>
            <p
              className="section-desc"
              style={{ margin: '0 auto 28px', textAlign: 'center', maxWidth: '600px' }}
            >
              {/* 2026-10-15 대표 원문 — 두 번째 문장은 한 문장(PC 한 줄, 폭 520→600). 휴대폰은 구절 단위로 줄바꿈 */}
              감정을 만드는 것이 아니라, <span style={{ whiteSpace: 'nowrap' }}>상대에게 반응하는 훈련법입니다.</span> <br />
              머리로 짜낸 연기가 아닌, 충동에서 시작되는 <span style={{ whiteSpace: 'nowrap' }}>살아있는 연기를 위한</span> 보편적인 테크닉입니다.
            </p>

            <YouTubeFacade
              videoId="6crvxRnBerk"
              title="마이즈너 테크닉 — KD4 액팅 스튜디오"
              containerStyle={{
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 28px rgba(21,72,138,0.12)',
                border: '1px solid var(--border)',
                background: 'var(--bg2)',
              }}
            />
          </div>
        </div>
      </section>

      {/* ④ 숫자 4칸 · ⑦ 훈련 3단계 · ⑨ 시그니처 클래스·할인 — 2026-10-15 대표 «반드시 있어야 할 것만»으로 제거.
          가격·일정은 상담 폼 클래스 카드(누르면 펼침)에, 상세는 /classes·/benefits·각 클래스 페이지에 그대로 있음.
          마이즈너 소개(③)는 같은 날 대표 «마이즈너 테크닉 소개는 넣어»로 되살림 */}

      {/* ⑥ DIRECTOR — 강사 크레딧 (광고 압축: highlights 3개 + 링크) */}
      <DirectorSection />

      {/* 출연영상 포트폴리오 — 2026-10-15 대표 «배우들의 실제출연영상 항목 빼라니까»로 구간 전체 제거 (영상은 /reel-production-class 등에 그대로) */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑥ PROOF — 후기 (광고 압축: 마퀴 1행 + 더보기 링크)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ReviewsSection ctaHref="#form-hero" />
      {/* FAQ — 2026-10-15 제거 (답이 상담 폼 카드·문의 안내에 있음, /join은 검색 비노출). 질문 모음은 /faq */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑪ RISK REVERSAL — 신규 (Form 직전 리스크 제거)            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <PromiseSection />

      {/* 아래쪽 상담 폼 — 2026-10-15 한때 뺐다가 같은 날 대표 «하단에 상담 신청 하나 더 넣어»로 되살림 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑫ FORM — 신청 폼                                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="form"
        aria-label="무료 상담 신청"
        className="section"
        style={{
          scrollMarginTop: '80px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
          padding: 'clamp(64px, 12vw, 100px) 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p className="section-eyebrow"><span lang="en">06 — CONTACT</span></p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: '10px' }}
              >
                무료 상담 신청
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                연락처부터 확인까지 3단계 — 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑫-2 MORE — 더 알아보기 (2026-10-19 대표 «스튜디오 소개 + 클래스 소개·각 페이지 링크», 폼 아래라 신청 흐름 방해 없음) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section aria-label="더 알아보기" className="section join-more">
        <div className="container">
          <div className="join-more-head">
            <p className="section-eyebrow"><span lang="en">MORE ABOUT KD4</span></p>
            <h2 className="section-title-serif join-more-title">KD4를 더 알아보고 싶다면</h2>
            <p className="join-more-sub">스튜디오 이야기와 클래스별 커리큘럼·일정을 자세히 볼 수 있어요.</p>
          </div>

          <a href="/about" className="join-more-studio">
            <span className="join-more-studio-label" lang="en">STUDIO</span>
            <span className="join-more-studio-title">스튜디오 소개</span>
            <span className="join-more-studio-desc">마이즈너 테크닉과 연기하지 않는 연기를 중심으로, 배우의 성장을 운영합니다.</span>
            <span className="join-more-studio-go" aria-hidden="true">
              자세히 보기 <ArrowRight size={15} strokeWidth={2.2} />
            </span>
          </a>

          <ul className="join-more-grid" role="list">
            {MORE_LINKS.map(({ nameKo, href, tag, cls }) => (
              <li key={nameKo}>
                <a href={href} className="join-more-card">
                  <span className="join-more-tag">{tag}</span>
                  <span className="join-more-name">{nameKo}</span>
                  <span className="join-more-quote">{cls.quote}</span>
                  <span className="join-more-foot">
                    <span className="join-more-price">월 {cls.price}원</span>
                    <ArrowRight aria-hidden={true} size={16} strokeWidth={2.2} className="join-more-arrow" />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <p className="join-more-all">
            <a href="/classes">클래스 전체 한눈에 보기 <ArrowRight aria-hidden={true} size={14} strokeWidth={2.2} /></a>
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑬ FOOTER 안심 문구                                         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section aria-label="문의 안내" className="section" style={{ background: 'var(--bg)', padding: '60px 0 40px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="footer"
              label="카카오로 문의하기"
              fireLead
              className="btn-outline"
              style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
            >
              <MessageCircle aria-hidden={true} size={14} strokeWidth={2.2} />
              카카오로 문의하기
            </JoinCTALink>
          </div>
          {/* 채널 유입 링크 — 관심 있는 유저 리텐션 (폼 도달 후 하단이라 주의 분산 리스크 낮음) */}
          <div
            style={{
              marginTop: '40px',
              paddingTop: '28px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                fontSize: 'clamp(0.78rem, 2.4vw, 0.88rem)',
              }}
            >
              {[
                { label: '인스타그램', href: 'https://www.instagram.com/kd4actingstudio' },
                { label: '유튜브', href: 'https://www.youtube.com/@kd4actingstudio' },
                { label: '블로그', href: 'https://blog.naver.com/kd4actingstudio' },
                { label: '카카오 채널', href: 'https://pf.kakao.com/_ximxdqn' },
              ].map((c, i, arr) => (
                <span
                  key={c.label}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                >
                  <a
                    href={c.href}
                    target="_blank" rel="noopener noreferrer"
                    aria-label={`${c.label} (새 탭에서 열림)`}
                    style={{
                      color: 'var(--navy)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      padding: '12px 4px',
                      minHeight: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {c.label}
                  </a>
                  {i < arr.length - 1 && (
                    <span style={{ color: 'var(--border)' }}>·</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* 주소 — 2줄 분리로 모바일 안정 */}
          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                color: 'var(--gray)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              <span lang="en">KD4 ACTING STUDIO</span>
            </p>
            <p
              style={{
                fontSize: '0.74rem',
                color: 'var(--gray-light)',
                letterSpacing: '0.01em',
              }}
            >
              서울시 서대문구 이화여대1안길 12 아리움3차 1F
            </p>
          </div>
        </div>
      </section>

      {/* 맨 아래 «클래스 자세히 보기» 줄 — 2026-10-19 «더 알아보기» 구간으로 합침 */}

      <StickyBottomCTA />
      </div>
    </>
  )
}
