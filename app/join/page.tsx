import type { Metadata } from 'next'
import { Fragment } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, MessageCircle } from 'lucide-react'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import JoinHeader from '@/components/join/JoinHeader'
import JoinCTALink from '@/components/join/JoinCTALink'
import ClassPicker from '@/components/join/ClassPicker'
import ConsultSheet from '@/components/join/ConsultSheet'
import { WhyKD4Section, DirectorSection, ReviewsSection, PromiseSection } from '@/components/join/JoinTrustSections'
import { SITE_URL } from '@/lib/constants'
import { REEL_PORTFOLIO_VIDEOS, REEL_INCLUDES } from '@/lib/class-landing-content'
import { buildInstantClasses } from '@/lib/join-instant'

/* 폴드 아래 / 비즈니스 크리티컬하지 않은 컴포넌트 — 지연 로딩 */
const JoinPageView = dynamic(() => import('@/components/analytics/JoinPageView'))
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

/* ── 출연영상 상세소개(상담창)용 자료 ──
 *    2026-11-19 대표 «출연영상 포트폴리오 베스트는 삭제해도 될 거 같고» → 페이지의 「출연영상 클래스 + 포트폴리오 베스트」 구간을 통째로 뺌.
 *    영상 4편과 «수강료에 포함»은 출연영상 타일 → 상담창 → 「상세소개 보기」 안에만 남는다 (눌렀을 때만 불러옴).
 *    영상 4편 = 대표가 10/19 출연영상 광고 랜딩에 고른 4편(AD_REEL_PICKS) 순서 그대로. */
const REEL_DETAIL_IDS = ['AMcMn4UgJp4', '4Cc3L2IGRu8', 'RV1yvKguTy4', 'IWL6hlOrU-w']
/* 데이터 제목이 «출연영상 샘플 N»인 영상은 유튜브 실제 제목으로 표시 */
const REEL_TITLE_FIX: Record<string, string> = { 'IWL6hlOrU-w': '메소드 연기' }
const REEL_TOP = REEL_DETAIL_IDS.flatMap((id) => REEL_PORTFOLIO_VIDEOS.filter((v) => v.id === id)).map((v) => ({ ...v, title: REEL_TITLE_FIX[v.id] ?? v.title }))
/* 수강료에 무엇이 들어 있는지 — 정본 REEL_INCLUDES(출연영상 클래스 페이지와 같은 목록)에서 괄호 설명만 뺀 것.
   2026-11-16 대표 «이 문구를 빼고»: 「캐스팅·오디션 제출용 영상 납품」 제외 (출연영상 클래스 페이지의 목록은 그대로). */
const REEL_INCLUDED_HIDE = ['캐스팅·오디션 제출용 영상 납품']
const REEL_INCLUDED_ITEMS = REEL_INCLUDES.filter((i) => i.yes && !REEL_INCLUDED_HIDE.includes(i.text)).map((i) => i.text.replace(/\s*\(.*\)$/, ''))

/* ── 후기 마퀴 (2행 교차) ── */


/* ══════════════════════════════════════════════════════════════════ */

export default function JoinPage() {
  /* 클래스 선택 타일·상담창 데이터 — 수강료가 정해진 시각에 바뀌므로(lib/classes.ts) 그릴 때마다 읽는다 */
  const instantClasses = buildInstantClasses({
    reelVideos: REEL_TOP.map(({ id, title }) => ({ id, title })),
    reelIncludes: REEL_INCLUDED_ITEMS,
  })

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

      {/* 얇은 상단 메뉴(고정). 2026-11-18 대표 브리프: 가격은 첫 화면이 아니라 클래스를 누른 직후(연락처 입력 전) 상담창에서 보여준다 → 가격 띠(StickyTopBar) 제거 */}
      <JoinHeader />

      {/* 분석: 랜딩 ViewContent + 스크롤 깊이 추적 (GA4 + Meta Pixel) */}
      <JoinPageView />
      <ScrollDepth />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ① 첫 화면 — 질문 하나 + 클래스 선택지 (2026-11-18 대표 브리프: 리바이저 문의 페이지 방식)
          공통 광고로 들어온 방문자가 클래스를 한 번 누르면 그 클래스 상담창이 바로 열린다.
          옛 구성(네이비 히어로 → 클래스 소개 카드 5장 → 3단계 폼)을 이 한 화면으로 바꿈.
          되돌리려면 이 커밋을 revert (옛 폼 components/contact/JoinForm.tsx 는 그대로 있음). */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ClassPicker id="form-hero" classes={instantClasses} location="top" />

      {/* MORE — 클래스 소개·스튜디오 소개로 가는 길 (2026-10-19 대표 «스튜디오 소개 + 클래스 소개·각 페이지 링크»).
          2026-11-19 대표 «스튜디오 소개가 너무 커서 클래스 소개가 눈에 안 들어와» → 큰 네이비 카드를 없애고
          같은 크기의 작은 카드 2장으로 (클래스 소개가 먼저) */}
      <section aria-label="더 알아보기" className="section join-more">
        <div className="container">
          <div className="join-more-head">
            <p className="section-eyebrow"><span lang="en">MORE ABOUT KD4</span></p>
            <h2 className="section-title-serif join-more-title">KD4를 더 알아보고 싶다면</h2>
          </div>

          <ul className="join-more-links" role="list">
            <li>
              <a href="/classes" className="join-more-link">
                <span>
                  <span className="join-more-link-name">클래스 소개</span>
                  <span className="join-more-link-desc">클래스별 커리큘럼·일정·수강료</span>
                </span>
                <ArrowRight aria-hidden={true} size={18} strokeWidth={2.2} />
              </a>
            </li>
            <li>
              <a href="/about" className="join-more-link">
                <span>
                  <span className="join-more-link-name">스튜디오 소개</span>
                  <span className="join-more-link-desc">마이즈너 테크닉 · 연기하지 않는 연기</span>
                </span>
                <ArrowRight aria-hidden={true} size={18} strokeWidth={2.2} />
              </a>
            </li>
          </ul>
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

      {/* ALL IN ONE SYSTEM — 배우지망생 → 진짜 배우 3단계 (2026-10-19 대표 «이것도 넣고», 홈페이지 같은 구간 그대로) */}
      <section aria-label="배우지망생에서 진짜 배우까지 3단계" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          {/* 헤더 영역은 중앙 정렬 720px 유지 (가독성) */}
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <p
              className="section-eyebrow"
            >
              <span lang="en">ALL IN ONE SYSTEM</span>
            </p>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 700,
                marginBottom: "16px",
                lineHeight: 1.2,
              }}
            >
              배우지망생 <span aria-hidden="true">→</span>{" "}
              <span style={{ color: "var(--gold)" }}>진짜 배우</span>
            </h2>
            <p
              style={{
                color: "var(--gray-light)",
                fontSize: "0.95rem",
                marginBottom: "48px",
                lineHeight: 1.7,
              }}
            >
              연기 훈련부터 캐스팅까지, 배우 액셀러레이팅 시스템
            </p>
          </div>

          {/* 3단계 — 진행 느낌 (컨테이너 전체 폭 사용해서 카드 크게) */}
          <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
            <div className="steps-journey">
              {[
                {
                  num: "01",
                  step: "STEP 01",
                  title: "아메리칸 액팅 메소드\n트레이닝",
                  desc: "마이즈너 테크닉 기반의 심층 연기 훈련",
                  icon: "🎭",
                },
                {
                  num: "02",
                  step: "STEP 02",
                  title: "포트폴리오 제작",
                  desc: "전문 영화팀과 함께 제작하는 출연영상으로 실전 포트폴리오 완성",
                  icon: "🎬",
                },
                {
                  num: "03",
                  step: "STEP 03",
                  title: "캐스팅 연계",
                  desc: "캐스팅 디렉터·조감독과 직접 연결되는 실전 캐스팅 지원",
                  icon: "🌟",
                },
              ].map((s, i) => (
                <Fragment key={s.num}>
                  <div
                    className="step-card"
                    style={{
                      position: "relative",
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "56px 36px 48px",
                      textAlign: "center",
                      overflow: "hidden",
                      transition: "border-color var(--transition)",
                    }}
                  >
                    {/* 대형 배경 숫자 */}
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "24px",
                        fontFamily: "var(--font-display)",
                        fontSize: "5.5rem",
                        fontWeight: 700,
                        color: "rgba(21,72,138,0.07)",
                        lineHeight: 1,
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    >
                      {s.num}
                    </span>

                    {/* STEP 라벨 */}
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.3rem",
                        letterSpacing: "0.2em",
                        fontWeight: 600,
                        color: "var(--gold)",
                        marginBottom: "16px",
                      }}
                    >
                      <span lang="en">{s.step}</span>
                    </p>

                    {/* 이모지 아이콘 */}
                    <div className="step-icon-glow" aria-hidden="true" style={{ margin: "0 auto 20px" }}>
                      <span style={{ position: "relative", zIndex: 1 }}>{s.icon}</span>
                    </div>

                    {/* 제목 */}
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        marginBottom: "12px",
                        lineHeight: 1.4,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {s.title}
                    </h3>

                    {/* 설명 */}
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-warm)",
                        lineHeight: 1.7,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>

                  {/* 화살표 (마지막 제외) */}
                  {i < 2 && (
                    <div key={`arrow-${i}`} className="step-journey-arrow">
                      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10h12M11 5l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ④ 숫자 4칸 · ⑦ 훈련 3단계 · ⑨ 시그니처 클래스·할인 — 2026-10-15 대표 «반드시 있어야 할 것만»으로 제거.
          가격·일정은 상담 폼 클래스 카드(누르면 펼침)에, 상세는 /classes·/benefits·각 클래스 페이지에 그대로 있음.
          마이즈너 소개(③)는 같은 날 대표 «마이즈너 테크닉 소개는 넣어»로 되살림 */}

      {/* 출연영상 클래스 + 포트폴리오 베스트 구간 — 2026-11-19 대표 지시로 삭제 (영상은 출연영상 상담창의 「상세소개 보기」 안에) */}

      {/* ⑥ DIRECTOR — 강사 크레딧 (광고 압축: highlights 3개 + 링크) */}
      {/* 2026-11-16 대표 ⑥: 이 페이지에 150명·100여명·400명+ 세 숫자가 따로 나와 헷갈린다는 지적 → 무엇을 센 숫자인지 한 줄.
          라벨은 정본(lib/stats.ts «누적 코칭 배우»·«현직 배우 수료», lib/classes.ts 출연영상 «현직 배우 100여명 참여») 그대로 */}
      <DirectorSection statNote="※ 숫자 안내: 400명+는 누적 코칭 배우, 150명은 현직 배우 수료, 100여 명은 출연영상 클래스 참여 배우 수입니다." />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑥ PROOF — 후기 (광고 압축: 마퀴 1행 + 더보기 링크)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ReviewsSection ctaHref="#form-hero" />
      {/* FAQ — 2026-10-15 제거 (답이 상담 폼 카드·문의 안내에 있음, /join은 검색 비노출). 질문 모음은 /faq */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ⑪ RISK REVERSAL — 신규 (Form 직전 리스크 제거)            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <PromiseSection />

      {/* 아래쪽 클래스 선택 — 2026-10-15 대표 «하단에 상담 신청 하나 더 넣어» 자리.
          2026-11-18 대표 브리프: 3단계 폼 → 클래스 타일을 누르면 바로 상담창. 맨 위와 같은 선택지 */}
      <ClassPicker id="form" classes={instantClasses} location="bottom" variant="bottom" />

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
                fontSize: '0.75rem',
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
                fontSize: '0.75rem',
                color: 'var(--gray-light)',
                letterSpacing: '0.01em',
              }}
            >
              서울시 서대문구 이화여대1안길 12 아리움3차 1F
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--gray-light)',
                letterSpacing: '0.01em',
                marginTop: '4px',
                wordBreak: 'keep-all',
              }}
            >
              2호선 이대역 5번 출구 도보 약 3분 · 경의중앙선 신촌역 도보 약 5분
            </p>
          </div>
        </div>
      </section>

      {/* 맨 아래 «클래스 자세히 보기» 줄 — 2026-10-19 «더 알아보기» 구간으로 합침 */}

      {/* 「바로 상담」 창 — 클래스 타일이 연다 (한 개만 둔다) */}
      <ConsultSheet classes={instantClasses} />

      <StickyBottomCTA />
      </div>
    </>
  )
}
