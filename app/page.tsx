"use client";

import '@/app/page-hero.css'
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { KD4_STATS } from "@/lib/stats";
import { DIRECTOR } from "@/lib/classes";

import { analytics } from "@/lib/analytics";
import { STAT_ICONS } from "@/lib/stat-icons";
import DirectorFilmography from "@/components/director/DirectorFilmography";
import { CASTING_PHOTOS, castingWork } from "@/lib/casting-photos"
import { buildInstantClasses } from "@/lib/join-instant"
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
const HeroScene = dynamic(() => import("@/components/hero/HeroScene"), {
  ssr: false,
  // 로딩 중 또는 WebGL 미지원 환경: 단색 대신 director.jpg 정지 포스터 (스펙 3-9A)
  // Next.js Image 없이 인라인 style로 — fallback은 very brief, 최적화 필요 없음
  loading: () => (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0,
        background: '#E8E4D8',
        backgroundImage: 'url(/_next/image?url=%2Fdirector.jpg&w=1200&q=75)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 15%',
        filter: 'brightness(0.7) grayscale(0.2)',
      }}
    />
  ),
});

// profileFlat 항목 내 영어 고유명사 lang="en" 처리 (WCAG 3.1.2)
const EN_HOME_PROFILE_TOKENS = ['LA Meisner Workshop', 'YouTube', 'The Chora'] as const
function wrapHomeEnglishToken(text: string): React.ReactNode {
  for (const token of EN_HOME_PROFILE_TOKENS) {
    const idx = text.indexOf(token)
    if (idx !== -1) {
      return <>{text.slice(0, idx)}<span lang="en">{token}</span>{text.slice(idx + token.length)}</>
    }
  }
  return text
}

// ─── 멤버 이야기 (홈) ────────────────────────────────────────────────────────
// 실제 멤버가 쓴 후기 문장 그대로 — 지어내지 않는다. 같은 후기를 두 번 보여주지 않는다.
// 출처: /reviews 공개 후기(클래스 표기 있는 것) · /join 후기 구간. 이름은 성만 남긴다.
const HOME_REVIEWS: { text: string; by: string; cls?: string }[] = [
  { text: "오디션 스터디를 2년 했는데도, 현역으로 활동하시는 배우님의 코멘트는 확실히 오디션에 실질적으로 도움이 됐습니다.", by: "나OO", cls: "오디션 테크닉 클래스" },
  { text: "오디션에 임하는 자세부터 어떤 독백을 준비해야 하는지, 인터뷰, 오디션 마무리까지. 그동안 갈피를 못 잡던 부분들을 경험 많은 배우님을 통해 해결할 수 있었습니다.", by: "배OO", cls: "오디션 테크닉 클래스" },
  { text: "안 보이던 업계의 길이 보였습니다. 현역 배우가 현실적으로 설명해주는 곳.", by: "한OO" },
  { text: "마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다.", by: "김OO" },
  { text: "한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다.", by: "정OO" },
  { text: "내 의지로 만들어진 연기가 아니라 의식 깊은 곳에서 건드려진 감정이 자연스럽게 뱉어지는 경험을 했습니다.", by: "강OO" },
]

const PARTNERS = [
  { name: '서울대학교', logo: '/partners/snu-logo.png' },
  { name: '고려대학교', logo: '/partners/ku-logo.png' },
  { name: 'CGV', logo: '/partners/cgv-logo.jpeg' },
  { name: 'Needs.N', logo: '/partners/neezn-logo.jpeg' },
  { name: '컴플렉시온', logo: '/partners/complexion-logo.jpeg' },
  { name: '서우스튜디오', logo: '/partners/seowoo-logo.webp' },
]

// STAT_ICONS는 lib/stat-icons.tsx에서 import (join/page.tsx 공용화 — 스펙 2-F)

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────
// (ClassCard 풀 디테일은 /classes 페이지에 있음. 메인은 압축 미니 카드만 노출)

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  const [marqueePaused, setMarqueePaused] = useState(false)
  // 처음 오는 분이 고를 수 있는 클래스 5개 — 이름·수강료·횟수는 lib/classes.ts 정본 그대로 (/join 타일과 같은 목록)
  const homeClasses = useMemo(() => buildInstantClasses().filter((c) => c.key !== 'recommend'), [])
  /* ── Lenis + GSAP 애니메이션 (동적 import — 초기 번들 ~200KB 분리) ── */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let g: any = null                              // gsap 인스턴스 (동적 로드 후 설정)
    let gsapCtx: { revert: () => void } | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lenis: any = null
    let lenisTicker: ((time: number) => void) | null = null
    let offScroll: (() => void) | null = null

    const init = async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      g = gsap
      gsap.registerPlugin(ScrollTrigger)

      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (isTouchDevice || prefersReduced) {
        // 모바일: 네이티브 스크롤 + ScrollTrigger passive 연결
        const onScroll = () => ScrollTrigger.update()
        window.addEventListener('scroll', onScroll, { passive: true })
        offScroll = () => window.removeEventListener('scroll', onScroll)
      } else {
        // 데스크톱: Lenis를 GSAP ticker에 통합 (raf 이중 실행 방지)
        import('lenis').then((mod) => {
          if (!g) return
          const Lenis = mod.default
          lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            syncTouch: false,
          })
          lenis.on('scroll', ScrollTrigger.update)
          lenisTicker = (time: number) => lenis.raf(time * 1000)
          g.ticker.add(lenisTicker)
          g.ticker.lagSmoothing(0)
        }).catch(() => { /* Lenis 청크 로드 실패 시 기본 스크롤 유지 */ })
      }

      if (prefersReduced) return

      /* === GSAP 애니메이션 — gsap.context로 언마운트 시 자동 정리 === */
      gsapCtx = gsap.context(() => {
        /* === HERO 요소 입장 (달리줌 중반에 맞춰 등장) ===
           인라인 opacity:0 가드가 있으므로 from(opacity:0)이 아닌 to(opacity:1)로 페이드인
           (from은 시작=끝=0이 되어 영영 안 보이는 GSAP footgun) */
        // 문장·라벨·버튼(.hero-a)은 처음부터 보인다 — 등장은 page-hero.css 의 짧은 CSS 페이드(heroARise)뿐
        // (2026-11-16 A안: 예전엔 KD4 타이틀 → 문장으로 바뀌는 데 약 11초)
        gsap.to('.hero-scroll-indicator', {
          opacity: 1, duration: 0.4, delay: 1.2,
        })

        /* === HERO 패럴랙스 — 배경/타이틀/서브타이틀 레이어별 스크롤 속도 분리 ===
           배경 씬은 느리게 내려가며 살짝 확대(깊이 유지), 타이틀은 빠르게 위로,
           서브타이틀(전경)은 가장 빠르게 — z축 레이어가 분리된 공간감.
           터치 디바이스는 스킵 (스크롤 중 transform 비용 + 효과 체감 낮음) */
        if (!isTouchDevice) {
          const heroScrub = () => ({
            trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
          })
          gsap.to('.hero-scene-layer', {
            yPercent: 12, scale: 1.06, transformOrigin: 'center bottom', ease: 'none',
            scrollTrigger: heroScrub(),
          })
          gsap.to('.hero-a', {
            yPercent: -45, ease: 'none',
            scrollTrigger: heroScrub(),
          })
        }

        /* === MARQUEE: CSS animation 단독 처리 (GSAP 충돌 방지) === */

        /* === 스크롤 인디케이터 반복 === */
        gsap.to('.hero-scroll-indicator', {
          y: 8, repeat: -1, yoyo: true, duration: 1, ease: "power1.inOut",
        })

        /* === HERO INTRO 섹션 등장 === */
        gsap.from('.hero-intro-section', {
          y: 60, opacity: 0, duration: 0.8, ease: "power2.out",
          scrollTrigger: {
            trigger: '.hero-intro-section', start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        })

        /* === 전체 섹션 ScrollTrigger 등장 (#classes 제외 — 즉시 표시) === */
        gsap.utils.toArray<HTMLElement>('section[id]:not(#hero):not(#classes)').forEach((section) => {
          gsap.from(section, {
            y: 50, opacity: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: {
              trigger: section, start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          })
        })

        /* === 클래스 카드: ScrollTrigger.batch 제거 ===
           이전엔 onEnter에서 gsap.from(opacity:0) 적용 → 앵커 점프나 레이아웃 변경으로
           카드가 이미 viewport 안에 있으면 onEnter 미발화 → opacity:0인 채 잔존하는 버그.
           카드는 처음부터 보이는 게 안전. (레이아웃 변경마다 깨지는 구조적 결함 제거) */

        /* === 캐스팅 마퀴: 스크롤 연동 가속 === */
        document.querySelectorAll('.marquee-track').forEach((track) => {
          gsap.to(track, {
            x: -200, ease: "none",
            scrollTrigger: {
              trigger: track.parentElement, start: "top bottom", end: "bottom top", scrub: 0.5,
            },
          })
        })
      })
    }

    init().catch((err) => console.error('[page] 애니메이션 초기화 오류:', err instanceof Error ? err.message : String(err)))

    return () => {
      gsapCtx?.revert()
      if (g && lenisTicker) g.ticker.remove(lenisTicker)
      if (lenis) lenis.destroy()
      offScroll?.()
    }
  }, [])

  /* ── 기존 섹션 리빌: GSAP ScrollTrigger가 동일한 section[id]:not(#hero):not(#classes)를
     opacity/y 애니메이션으로 처리하므로 IO + CSS transition 중복 실행 제거.
     (GSAP 인라인 스타일 vs CSS transition 충돌 방지, will-change 이중 등록 해소) */

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/_next/image?url=%2Fdirector.jpg&w=1200&q=75"
        fetchPriority="high"
      />
      <PageJsonLd schemas={[
        buildBreadcrumb([{ name: '홈', url: SITE_URL }]),
        buildWebPage({ idPath: '#webpage', url: SITE_URL, name: '신촌 연기학원 KD4 액팅 스튜디오 — 마이즈너·출연영상', description: '서울 신촌 마이즈너 테크닉 기반 연기학원. 연기 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지. 배우를 성장시키는 KD4 액팅 스튜디오.', about: { '@id': `${SITE_URL}#org` }, dateModified: LAST_UPDATED.home, speakableCssSelectors: ['h1', 'h2'] }),
      ]} />
      {/* ── 1. HERO (Dennis Snellenberg style) ───────────────────────────────── */}
      <section
        id="hero"
        aria-label="히어로"
        ref={heroRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100svh",
          minHeight: "600px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Hero 배경: Three.js 3D scene (모바일도 동일 — 모바일에서는 더 가볍게 렌더)
             .hero-scene-layer: 패럴랙스 배경 레이어 — 스크롤 시 타이틀보다 느리게 이동 */}
        <div className="hero-scene-layer" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <HeroScene />
        </div>

        {/* 필름 그레인 오버레이 — 시네마틱 질감 (모바일/reduced-motion은 정지) */}
        <div className="hero-grain" aria-hidden="true" />

        {/* 상단 페이드 — 네비바 영역이 3D 천장/스포트라이트와 겹치지 않도록 자연스럽게 마스킹
             네비바 뒤로 beige 톤이 은은하게 내려와서 공간감을 유지하면서 어두운 오브젝트 가려줌 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "140px",
            background:
              "linear-gradient(to bottom, var(--bg) 0%, rgba(240,240,232,0.85) 38%, rgba(240,240,232,0.35) 72%, transparent 100%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* sr-only h1 — JS 렌더 전에도 스크린리더에 즉시 노출 */}
        <h1 className="sr-only">KD4 액팅 스튜디오 — <span lang="en">ACTOR ACCELERATING SYSTEM</span></h1>

        {/* 첫 화면 A안 (2026-11-16 대표 «A안으로 가고») — 처음부터 문장을 크게, 진한 네이비로.
             작은 라벨(스튜디오 이름) · 문장 · 밑줄 한 줄 버튼. 휴대폰 = 왼쪽 정렬 두 줄, 768px 이상 = 가운데 한 줄.
             글꼴(KoPub 바탕)·색(크림+네이비)·배경(연습실 3D)·문장은 그대로. 예전 «KD4 타이틀 → 약 11초 뒤 문장» 연출은 제거.
             등장은 CSS만(스크롤 트리거 없음) — JS가 늦거나 꺼져도 문장은 보인다 */}
        <div className="hero-a-pos">
          <div className="hero-a">
            <p className="hero-a-label" lang="en">KD4 Acting Studio · Sinchon, Seoul</p>
            <p className="hero-a-line">상상의 상황 속에서,{' '}<br className="hero-a-br" />진실하게 살아내는 것</p>
            {/* 2026-11-19 대표 «Acting is living truthfully under imaginary circumstances 안넣어도돼?» — 위 한국어 문장의 원문(샌포드 마이즈너의 연기 정의)을 작은 글씨 출처로만 붙인다. 문장 하나 원칙은 유지 */}
            <p className="hero-a-quote" lang="en">“Acting is living truthfully under imaginary circumstances.” <span className="hero-a-quote-by">Sanford Meisner</span></p>
            <Link
              href="/join#form-hero"
              className="hero-a-cta"
              onClick={() => analytics.ctaClick('hero_first', '상담 신청')}
            >
              상담 신청
            </Link>
          </div>
        </div>

        {/* 스크롤 인디케이터 — The Row 슬라이딩 라인 */}
        <div
          className="hero-scroll-indicator"
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: 0,
          }}
        >
          <span className="hero-scroll-label" lang="en">Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ── 둘째 화면 — 한 문장 + 서명 (2026-11-19 피드백 시안: 문장 4개·버튼 3개 → 문장 1개) ── */}
      <section className="hero-intro-section" aria-label="브랜드 소개">
        <p className="home-statement">
          우리는 양산형 배우를 찍어내는{' '}<br className="home-statement-br" />공장식 학원을 거부합니다.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <span style={{ display: "block", width: "36px", height: "1px", background: "var(--gold)" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(0.75rem, 1.6vw, 0.85rem)", fontWeight: 400, letterSpacing: "0.32em", color: "var(--gold)", textTransform: "uppercase" }}>
            <span lang="en">OFF THE PLASTIC</span>
          </p>
          <span style={{ display: "block", width: "36px", height: "1px", background: "var(--gold)" }} />
        </div>
      </section>

      {/* ── CLASSES — 처음 오는 분이 고를 수 있는 5개를 한 표로 (누구에게 · 기간과 횟수 · 수강료) ──
           예전: 3개 카드(가격·기간 없음), 화면 한참 아래. 지금: 둘째 화면 바로 다음.
           #classes 는 스크롤 등장 연출에서 빠져 있어 처음부터 보인다 */}
      <section id="classes" aria-label="클래스 소개" className="home-classes">
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="home-classes-intro">
            <p className="section-eyebrow"><span lang="en">CURRICULUM</span></p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, color: "var(--white)", lineHeight: 1.35, marginBottom: 12 }}>
              나에게 맞는 클래스 찾기
            </h2>
            <p style={{ fontSize: "0.92rem", color: "var(--gray-light)", lineHeight: 1.8, wordBreak: "keep-all" }}>
              처음 오는 분이 고를 수 있는 클래스는 다섯 가지입니다. 누구에게 맞는지, 기간과 수강료를 견주어 보세요.
            </p>
          </div>

          <div className="home-class-head" aria-hidden="true">
            <span>클래스</span>
            <span>이런 분께</span>
            <span>기간과 횟수</span>
            <span className="home-class-head-price">수강료</span>
          </div>
          <ul role="list" className="home-class-list">
            {homeClasses.map((c) => (
              <li key={c.key}>
                <Link
                  href={c.href}
                  className="home-class-row"
                  onClick={() => analytics.ctaClick('home_class_row', c.className)}
                >
                  <h3 className="home-class-name">{c.nameKo}</h3>
                  <p className="home-class-who">
                    {c.sub}
                    {c.note && <span className="home-class-note">{c.note}</span>}
                  </p>
                  <p className="home-class-facts">
                    {[c.course, ...(c.facts ?? [])].filter(Boolean).join(' · ')}
                  </p>
                  <p className="home-class-price">월 {c.price}원</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="home-classes-foot">개강 일정과 수업 요일은 상담에서 안내해 드려요.</p>

          <div className="home-classes-actions" data-floating-cta-hide="">
            <Link
              href="/join#form-hero"
              onClick={() => analytics.ctaClick('classes_section', '무료 상담 신청')}
              className="btn-primary"
              style={{ background: "var(--navy)", color: "#ffffff", textDecoration: "none" }}
            >
              무료 상담 신청
            </Link>
            <Link href="/classes" className="home-textlink">클래스 자세히 보기</Link>
          </div>
        </div>
      </section>

      {/* ── 2. STATS — KD4 by the Numbers (훈련→영상→DB→캐스팅 발자국) ──────── */}
      {/* 숫자 데이터: lib/stats.ts (단일 소스) / 아이콘 4개는 인덱스로 매칭 */}
      <section
        id="stats"
        aria-label="KD4 주요 통계"
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "clamp(36px, 6vw, 72px) 0",
        }}
      >
        <div className="container stats-grid">
          {KD4_STATS.map((stat, i) => {
            return (
              <div key={stat.label} className="stats-card" role="group" aria-label={`${stat.label}: ${stat.value}`}>
                <div className="stats-icon-wrap">{STAT_ICONS[i]}</div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.4rem, 6vw, 2.8rem)",
                    fontWeight: 700,
                    color: "var(--gold)",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontSize: "clamp(0.75rem, 2vw, 0.8rem)",
                    color: "var(--gray)",
                    letterSpacing: "0.04em",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 3. DIRECTOR ──────────────────────────────────────────────────────── */}
      <section
        id="director"
        aria-label="액팅 코치 소개"
        className="section"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)" }}
      >
        <div className="container">
          <div
            style={{
              gap: "48px",
              alignItems: "start",
            }}
            className="director-grid"
          >
            {/* 텍스트 영역 */}
            <div>
            <p className="section-eyebrow"><span lang="en">LEADER</span></p>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                fontWeight: 700,
                marginBottom: "36px",
                letterSpacing: "0.02em",
              }}
            >
              권동원
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "40px",
              }}
            >
              {/* 약력 */}
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    letterSpacing: "0.15em",
                    color: "var(--gold)",
                    marginBottom: "16px",
                  }}
                >
                  <span lang="en">PROFILE</span>
                </p>
                <ul role="list" aria-label="권동원 주요 경력" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {DIRECTOR.profileFlat.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--gray-light)",
                        paddingLeft: "16px",
                        position: "relative",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "0.6em",
                          width: "6px",
                          height: "1px",
                          background: "var(--gold)",
                          display: "inline-block",
                        }}
                      />
                      {wrapHomeEnglishToken(item)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 필모 — DirectorFilmography 공용 컴포넌트 (스펙 2-F) */}
              <div>
                <DirectorFilmography labelColor="var(--gold)" />
              </div>
            </div>
            </div>{/* end 텍스트 영역 */}

            {/* 대표 사진 */}
            <Image
              src="/director.jpg"
              alt="대표 권동원"
              width={300}
              height={420}
              sizes="(max-width: 768px) 200px, 300px"
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                flexShrink: 0,
                alignSelf: 'stretch',
              }}
            />

          </div>{/* end director-grid */}
        </div>
      </section>

      {/* ── 4. ABOUT ─────────────────────────────────────────────────────────── */}
      <section id="about" aria-label="KD4 소개" className="section" style={{ background: "var(--bg)" }}>
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
                <React.Fragment key={s.num}>
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
                </React.Fragment>
              ))}
            </div>

            {/* 시작하는 방법 — 옛 «How It Works» 3단계(상담 → 첫 수업 → 성장·캐스팅) 구간을 여기로 합침 (2026-11-10).
                세 번째 단계(포트폴리오·캐스팅 연결)는 위 STEP 02·03과 같은 내용이라 한 번만 말한다. */}
            <p
              style={{
                marginTop: "32px",
                textAlign: "center",
                fontSize: "0.9rem",
                color: "var(--text-warm)",
                lineHeight: 1.8,
                wordBreak: "keep-all",
              }}
            >
              <strong style={{ display: "block", color: "var(--navy)", fontWeight: 700, marginBottom: "4px" }}>
                시작하는 방법
              </strong>
              온라인 상담 신청 <span aria-hidden="true">→</span> 맞는 클래스 안내{" "}
              <span aria-hidden="true">→</span> 첫 수업에서 진단·맞춤 피드백
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. CASTING ───────────────────────────────────────────────────────── */}
      <section
        id="casting"
        aria-label="캐스팅 연계"
        className="section"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", paddingBottom: "80px" }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              className="section-eyebrow"
            >
              <span lang="en">CASTING RESULTS</span>
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
              KD4 캐스팅현황
            </h2>
            <p style={{ color: "var(--gray)", fontSize: "0.9rem", marginTop: "12px" }}>
              KD4 멤버들의 실제 캐스팅 결과입니다
            </p>
          </div>
        </div>

        {/* 마퀴 — 컨테이너 밖으로 full-width */}
        {/* WCAG 2.2.2: 자동 이동 콘텐츠 일시정지 버튼 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <button
            type="button"
            aria-pressed={marqueePaused}
            aria-label={marqueePaused ? '캐스팅 마퀴 재생' : '캐스팅 마퀴 일시정지'}
            onClick={() => setMarqueePaused(v => !v)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--gray)', borderRadius: 6, padding: '4px 12px',
              minHeight: 44, fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            {marqueePaused ? <><span aria-hidden="true">▶</span> 재생</> : <><span aria-hidden="true">⏸</span> 일시정지</>}
          </button>
        </div>
        {/* 스크린 리더용 목록 — 마퀴는 시각적 전용 */}
        <ul role="list" className="sr-only">
          {CASTING_PHOTOS.map((photo) => (
            <li key={photo.url}>{photo.name}{castingWork(photo) ? ` — ${castingWork(photo)}` : ''}</li>
          ))}
        </ul>
        <div className="marquee-wrap" aria-hidden="true">
          <div className="marquee-track" style={{ animationPlayState: marqueePaused ? 'paused' : 'running' }}>
            {[...CASTING_PHOTOS, ...CASTING_PHOTOS].map((photo, i) => (
              <div key={`${photo.url}-${i}`} className="home-cast-item">
                <div
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    position: "relative",
                    aspectRatio: "9 / 16",
                  }}
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    sizes="200px"
                    loading="lazy"
                    style={{ objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
                {/* 카드 안 작은 글씨는 이 크기에서 안 읽힌다 → 이름·작품을 카드 아래에 글자로 */}
                <p className="home-cast-name">{photo.name}</p>
                <p className="home-cast-work">{castingWork(photo)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASTING → /about 핸드오프 (글자 링크) ─────────────────────────────── */}
      <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "28px 24px 44px" }}>
        <div className="container" style={{ maxWidth: "720px", textAlign: "center" }}>
          <p style={{ fontSize: "0.86rem", color: "var(--gray)", marginBottom: "4px", lineHeight: 1.7 }}>
            위 캐스팅 결과를 만들어낸 훈련 방식이 궁금하다면
          </p>
          <Link
            href="/about"
            onClick={() => analytics.ctaClick('casting_handoff', '마이즈너 테크닉 알아보기')}
            className="home-textlink"
          >
            훈련 방식 알아보기
          </Link>
        </div>
      </div>

      {/* ── 8. REVIEWS — 한 번씩만 (흐르는 띠·이모지·일시정지 버튼 없음) ─────────── */}
      <section
        id="reviews"
        aria-label="멤버 후기"
        style={{
          padding: "64px 0 56px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <div className="container" style={{ maxWidth: 980 }}>
          <p className="section-eyebrow" style={{ textAlign: "center" }}>
            <span lang="en">REAL REVIEWS</span>
          </p>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
              fontWeight: 700,
              marginBottom: "28px",
            }}
          >
            KD4 멤버 이야기
          </h2>

          <ul role="list" className="home-reviews">
            {HOME_REVIEWS.map((r) => (
              <li key={r.by + r.text.slice(0, 8)} className="home-review">
                <figure style={{ margin: 0 }}>
                  <blockquote className="home-review-text">{r.text}</blockquote>
                  <figcaption className="home-review-by">
                    {r.by}{r.cls ? ` · ${r.cls}` : ''}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>

          <p style={{ textAlign: "center", marginTop: 18 }}>
            <Link href="/reviews" className="home-textlink">멤버 이야기 더 보기</Link>
          </p>
        </div>
      </section>

      {/* ── Partners ─────────────────────────────────────────────────────────── */}
      {/* 2026-05-30: 대표님 요청으로 메인페이지에서 숨김 (이전 복원 커밋 7ac0082 무효화) */}
      {/* 복원 시 아래 주석을 풀고 PARTNERS 상수도 유지할 것 */}
      {/*
      <section id="partners" aria-label="함께한 기업" style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
        <h2 className="sr-only">함께한 기업</h2>
        <p style={{ fontFamily: 'var(--font-display), "Noto Sans KR", sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--secondary)', textAlign: 'center', marginBottom: '24px', opacity: 0.6 }}>
          함께한 기업
        </p>
        <ul role="list" className="sr-only">
          {PARTNERS.map((p) => {
            const isLatin = /^[\x20-\x7E]+$/.test(p.name)
            return <li key={p.name}>{isLatin ? <span lang="en">{p.name}</span> : p.name}</li>
          })}
        </ul>
        <div className="partner-marquee" aria-hidden="true">
          <div className="partner-marquee-track">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div key={`${p.name}-${i}`} className="partner-marquee-item">
                <Image src={p.logo} alt="" width={80} height={40} style={{ objectFit: 'contain' }} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* ── 9. CTA ──────────────────────────────────────────────────────────── */}
      <section
        id="cta"
        aria-label="무료 상담 신청"
        style={{
          padding: "120px 24px",
          background:
            "radial-gradient(ellipse at center, rgba(21,72,138,0.08) 0%, var(--bg) 70%)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p className="section-eyebrow"><span lang="en">START NOW</span></p>
          <h2
            className="shimmer-text"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              marginBottom: "20px",
              lineHeight: 1.15,
            }}
          >
            지금 시작하세요
          </h2>
          <p
            style={{
              color: "var(--gray-light)",
              fontSize: "0.95rem",
              marginBottom: "48px",
              lineHeight: 1.7,
            }}
          >
            배우지망생 <span aria-hidden="true">→</span> 진짜 배우
            <br />
            연기 훈련부터 캐스팅까지
          </p>

          <div style={{ marginBottom: "14px" }} data-floating-cta-hide="">
            <Link
              href="/join#form"
              onClick={() => analytics.ctaClick('homepage_final_cta', '무료 상담 신청')}
              className="btn-primary"
              style={{
                background: "var(--navy)",
                color: "#ffffff",
                textDecoration: "none",
                boxShadow: "0 6px 18px rgba(21,72,138,0.2)",
              }}
            >
              무료 상담 신청
            </Link>
          </div>
          <p style={{ marginBottom: "44px" }}>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank" rel="noopener noreferrer"
              aria-label="카카오로 문의하기 (새 탭에서 열림)"
              onClick={() => analytics.contact('kakao')}
              className="home-textlink"
            >
              카카오로 문의하기
            </a>
          </p>

          {/* 독백 아카이브 내부 링크 — "독백 대본" 키워드 앵커 텍스트 (SEO) */}
          <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
            오디션 준비 중이라면 — 남자독백·여자독백 무료{' '}
            <Link
              href="/monologues"
              style={{ color: 'var(--navy)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}
            >
              독백 대본 아카이브
            </Link>
          </p>

          {/* 나머지 길 — 버튼이 아니라 조용한 글자 링크 한 줄 (검색 로봇용 1-hop 연결도 겸한다) */}
          <nav aria-label="더 둘러보기" className="home-quiet-links">
            <Link href="/acting-coaches">권동원 액팅 코치</Link>
            <Link href="/sinchon-acting-academy">신촌 연기학원 오시는 길</Link>
            <Link href="/benefits">멤버 혜택</Link>
            <Link href="/actors">배우 갤러리</Link>
          </nav>
        </div>
      </section>
    </>
  );
}
