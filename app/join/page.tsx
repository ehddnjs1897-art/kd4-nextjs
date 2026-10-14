import type { Metadata } from 'next'
import { Fragment } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  Users,
  FileText,
  Film,
  Handshake,
  ArrowRight,
  MessageCircle,
  HeartHandshake,
} from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import DirectorFilmography from '@/components/director/DirectorFilmography'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import StickyTopBar from '@/components/join/StickyTopBar'
import JoinCTALink from '@/components/join/JoinCTALink'
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

/* ── 후기 마퀴 (2행 교차) ── */
const REVIEW_MARQUEE_ROW1 = [
  { text: '내 의지로 만들어진 연기가 아니라 의식 깊은 곳에서 건드려진 감정이 자연스럽게 뱉어지는 경험을 했습니다.', author: '강*경' },
  { text: '카메라 앞에서든 무대 위에서든 진짜로 숨쉴 수 있는 방법의 물꼬를 터준 수업.', author: '김*일' },
  { text: '안 보이던 업계의 길이 보였습니다. 현역 배우가 현실적으로 설명해주는 곳.', author: '한*윤' },
]

/* ── Risk Reversal 보장 (2026-08-30 대표 확정: 전액 환불 항목 삭제) ── */
const GUARANTEES = [
  {
    Icon: HeartHandshake,
    title: '상담 후 바로 가셔도 돼요',
    desc: '30분 부담 없는 대화. 본인에게 맞는지 확인만 하고 가세요.',
  },
  {
    Icon: FileText,
    title: '상담만 받아도 영업기밀 공개',
    desc: '프로필·출연영상·캐스팅디렉터·에이전시 자료 전부 제공.',
  },
]

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
      <section
        aria-label="KD4 고유 자산 — 캐스팅 연계 시스템"
        style={{
          padding: 'clamp(64px, 12vw, 100px) 0',
          background: 'var(--bg2)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">01 — KD4 ONLY</span></p>
            {/* 섹션 번호(2026-10-15 줄이기 후): 01 KD4 ONLY · 02 METHOD · 03 LEADER · 04 PORTFOLIO · 05 REVIEWS · 06 PROMISE · 07 CONTACT */}
            <h2
              className="section-title-serif"
              style={{
                fontSize: 'clamp(1.4rem, 3.6vw, 2.2rem)',
                lineHeight: 1.45,
                marginBottom: '14px',
                wordBreak: 'keep-all',
              }}
            >
              KD4를 선택해야 하는 이유
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
              3년간 만들어온 KD4만의 캐스팅 연계 시스템
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {([
              {
                Icon: Handshake,
                title: '캐스팅 디렉터 공식 협업',
                desc: '방진원·이상원 캐스팅 디렉터와 정기 오디션·캐스팅 연계.',
              },
              {
                Icon: Film,
                title: '전문 영화팀 출연영상',
                desc: '현직 배우들이 거쳐간 시그니처 클래스. 완성된 출연영상 한 편이 실제 캐스팅으로 연결됩니다.',
              },
              {
                Icon: Users,
                title: '배우 DB 시스템',
                desc: 'kd4.club 배우 데이터베이스. 수료 후 자동 등록되며 캐스팅팀이 실제로 조회합니다.',
              },
            ] as const).map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '26px 22px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(21,72,138,0.08)',
                    border: '1px solid rgba(21,72,138,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} color="var(--navy)" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              style={{ margin: '0 auto 28px', textAlign: 'center', maxWidth: '520px' }}
            >
              감정을 만드는 것이 아니라, 상대에게 반응하는 훈련법입니다. <br />
              머리로 짜낸 연기가 아닌, 충동에서 시작되는 살아있는 연기.
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
      <section aria-label="강사 권동원 소개" className="section" style={{ background: 'var(--bg)', padding: 'clamp(56px, 10vw, 88px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">03 — THE LEADER</span></p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)', marginBottom: '10px' }}
            >
              배우의 성장을 가이드합니다
            </h2>
            <p
              style={{
                fontSize: 'clamp(0.82rem, 2.2vw, 0.95rem)',
                color: 'var(--gray-light)',
                lineHeight: 1.6,
                margin: 0,
                wordBreak: 'keep-all',
              }}
            >
              건명원(建明苑) 창의인재 출신 배우
            </p>
          </div>

          <div className="director-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="director-photo" style={{ position: 'relative' }}>
              <Image
                src={DIRECTOR.photo}
                alt={`${DIRECTOR.name} 대표`}
                fill
                sizes="(max-width: 768px) 100vw, 260px"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="director-name">{DIRECTOR.name}</div>
              <div className="director-role">{DIRECTOR.title}</div>

              {/* PROFILE — 풀 이력 9개 */}
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  color: 'var(--navy)',
                  marginTop: '20px',
                  marginBottom: '12px',
                  fontWeight: 700,
                }}
              >
                <span lang="en">PROFILE</span>
              </p>
              {/* role="list": listStyle:none 시 Safari VoiceOver가 리스트 의미 제거하는 버그 방지 (WCAG 1.3.1) */}
              <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px', listStyle: 'none', padding: 0 }}>
                {DIRECTOR.profileFlat.map((item) => (
                  <li
                    key={item}
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--gray-light)',
                      paddingLeft: '14px',
                      position: 'relative',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '0.6em',
                        width: '6px',
                        height: '1px',
                        background: 'var(--navy)',
                        display: 'inline-block',
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>

              {/* FILMOGRAPHY — DirectorFilmography 공용 컴포넌트 (스펙 2-F) */}
              <DirectorFilmography labelColor="var(--navy)" />
            </div>
          </div>
        </div>
      </section>

      {/* ⑦ PORTFOLIO — 출연영상 결과물 */}
      <section aria-label="출연영상 포트폴리오" className="section" style={{ background: 'var(--bg2)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 48px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">04 — PORTFOLIO</span></p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', marginBottom: '14px' }}
            >
              KD4 멤버들의{' '}
              <span style={{ color: 'var(--gold)' }}>실제 출연영상</span>
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--gray-light)',
                lineHeight: 1.7,
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              전문 영화팀과 함께 제작한 포트폴리오입니다.
              <br />
              이 영상으로 캐스팅이 연결됩니다.
            </p>
          </div>

          {/* 2-column video grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: 'clamp(16px, 3vw, 28px)',
              maxWidth: '980px',
              margin: '0 auto',
            }}
          >
            {([
              /* 2026-10-15 대표 줄이기: 신규가 들을 수 있는 출연영상 클래스 결과물 2편만 (심화·1달 영상은 각 클래스 페이지에) */
              { youtubeId: 'IWL6hlOrU-w', genre: '드라마', subtitle: '「메소드 연기」', cohort: '출연영상 17기' },
              { youtubeId: 'PUlrhjOkvjA', genre: '드라마', subtitle: '단편 「외사랑」', cohort: '출연영상 16기' },
            ] as const).map(({ youtubeId, genre, subtitle, cohort }) => (
              <div key={youtubeId}>
                {/* 장르 뱃지 */}
                <div style={{ marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--navy)',
                      background: 'rgba(21,72,138,0.08)',
                      border: '1px solid rgba(21,72,138,0.2)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                    }}
                  >
                    <Film aria-hidden={true} size={11} strokeWidth={2} />
                    {genre}
                  </span>
                </div>

                {/* 영상 임베드 — 클릭 시 로드 */}
                <YouTubeFacade
                  videoId={youtubeId}
                  title={`${genre} — ${subtitle}`}
                  containerStyle={{
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 32px rgba(21,72,138,0.14)',
                    border: '1px solid var(--border)',
                    background: '#0a0a0a',
                    marginBottom: '14px',
                  }}
                />

                {/* 캡션 */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: '#111111',
                  }}
                >
                  {subtitle}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-light)' }}>
                  {cohort}
                </p>
              </div>
            ))}
          </div>

          {/* «포트폴리오 전체 보기» 링크 — 2026-10-15 대표 «포트폴리오 보기도 빼»로 제거 (유튜브 재생목록으로 나가는 길) */}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑥ PROOF — 후기 (광고 압축: 마퀴 1행 + 더보기 링크)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section aria-label="멤버 후기" className="section" style={{ background: 'var(--bg2)', padding: 'clamp(56px, 10vw, 88px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 28px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">05 — REAL REVIEWS</span></p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)', marginBottom: 0 }}
            >
              배우들의 솔직한 후기
            </h2>
          </div>

          {/* 마퀴 1행만 (압축) — 애니메이션 요소이므로 AT에서 숨김 */}
          <div className="review-marquee" aria-hidden="true">
            <div className="review-marquee-track">
              {[...REVIEW_MARQUEE_ROW1, ...REVIEW_MARQUEE_ROW1].map((r, i) => (
                <div key={`${r.author}-${i}`} style={{ flex: '0 0 auto', width: 'clamp(240px, 78vw, 320px)', padding: '20px 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', marginRight: '14px' }}>
                  <p style={{ fontSize: '0.86rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: '10px' }}>&ldquo;{r.text}&rdquo;</p>
                  <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>— {r.author}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 스크린리더 전용 후기 목록 (마퀴는 aria-hidden이므로 텍스트 대안 제공) */}
          <ul role="list" className="sr-only">
            {REVIEW_MARQUEE_ROW1.map((r) => (
              <li key={r.author}>&ldquo;{r.text}&rdquo; — {r.author}</li>
            ))}
          </ul>

          {/* 인라인 CTA */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <JoinCTALink
              href="#form-hero"
              location="inline_proof"
              label="나도 진짜 배우로 · 무료 상담 신청"
              fireLead
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--navy)',
                borderBottom: '1px solid var(--navy)',
                padding: '4px 0',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              나도 진짜 배우로 · 무료 상담 신청
              <ArrowRight aria-hidden={true} size={14} strokeWidth={2.2} />
            </JoinCTALink>
          </div>
        </div>
      </section>
      {/* FAQ — 2026-10-15 제거 (답이 상담 폼 카드·문의 안내에 있음, /join은 검색 비노출). 질문 모음은 /faq */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑪ RISK REVERSAL — 신규 (Form 직전 리스크 제거)            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section aria-label="KD4 약속" className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">06 — OUR PROMISE</span></p>
            <h2
              className="section-title-serif"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: 0 }}
            >
              상담만 받아도 괜찮아요
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              /* 모바일 1열 (세로) · 태블릿 이상 3열 — 카드는 컴팩트 */
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '12px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            {GUARANTEES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(21,72,138,0.08)',
                    border: '1px solid rgba(21,72,138,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color="var(--navy)" strokeWidth={1.8} aria-hidden={true} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(0.88rem, 2.3vw, 1rem)',
                    fontWeight: 700,
                    marginBottom: '4px',
                    lineHeight: 1.35,
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: 'clamp(0.68rem, 1.85vw, 0.85rem)',
                    color: 'var(--gray-light)',
                    lineHeight: 1.6,
                  }}
                >
                  {desc}
                </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <p className="section-eyebrow"><span lang="en">07 — CONTACT</span></p>
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

      {/* 맨 아래 탈출구 — CLEAN_ROUTE라 네비 없음. 2026-10-15 대표 줄이기: «클래스 자세히 보기» 1개만 남김 (스튜디오 소개 링크 제거) */}
      <nav aria-label="추가 탐색" style={{ textAlign: 'center', padding: '24px 24px 48px', borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--gray)', fontSize: '0.78rem', marginBottom: '14px', letterSpacing: '0.03em' }}>
          더 알아보고 싶다면
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/classes" style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--gray)', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
            클래스 자세히 보기
          </a>
        </div>
      </nav>

      <StickyBottomCTA />
      </div>
    </>
  )
}
