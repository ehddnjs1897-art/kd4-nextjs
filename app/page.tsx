"use client";

import '@/app/page-hero.css'
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { KD4_STATS } from "@/lib/stats";
import { DIRECTOR } from "@/lib/classes";

import { analytics } from "@/lib/analytics";
import { STAT_ICONS } from "@/lib/stat-icons";
import DirectorFilmography from "@/components/director/DirectorFilmography";
import { CASTING_PHOTOS } from "@/lib/casting-photos"
import PageJsonLd from '@/components/seo/PageJsonLd'
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
        backgroundImage: 'url(/director.jpg)',
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

// ─── 후기 마퀴 데이터 ────────────────────────────────────────────────────────

const REVIEW_ITEMS = [
  { text: "연기를 다시 즐길 수 있게 되었습니다", author: "조*솔", emoji: "😊" },
  { text: "마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다", author: "김*현", emoji: "😲" },
  { text: "단순한 클래스 이상의 경험, 연기에 대한 마음을 다시 채울 수 있는 소중한 시간", author: "이*정", emoji: "🥹" },
  { text: "형식적으로 흘러가기 쉬운데, KD4는 정말 달랐습니다", author: "박*우", emoji: "😤" },
  { text: "막 시작해서 방향을 찾고 있는 분들께 꼭 추천드리고 싶습니다", author: "최*민", emoji: "😄" },
]

const REVIEW_ITEMS_2 = [
  { text: "긴장 없이 연기를 순수하게 느낄 수 있었고, 그 시간이 저에게 큰 위로가 되었습니다", author: "한*아", emoji: "😌" },
  { text: "한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다", author: "정*석", emoji: "😍" },
  { text: "처음 만난 분들과도 자연스럽게 이야기를 나눌 수 있었고, 서로의 경험을 공유하는 느낌", author: "김*안", emoji: "🤗" },
  { text: "이런 좋은 프로그램을 받을 수 있게 해주셔서 감사드립니다", author: "윤*호", emoji: "😭" },
  { text: "지금 이 순간, 진짜 감정에 솔직하게 느끼는 것. 그게 마이즈너의 핵심이었습니다", author: "서*린", emoji: "🥺" },
]

const PARTNERS = [
  { name: '서울대학교', logo: '/partners/snu-logo.png' },
  { name: '고려대학교', logo: '/partners/ku-logo.png' },
  { name: 'CGV', logo: '/partners/cgv-logo.jpeg' },
  { name: 'Needs.N', logo: '/partners/neezn-logo.jpeg' },
  { name: '컴플렉시온', logo: '/partners/complexion-logo.jpeg' },
  { name: '서우스튜디오', logo: '/partners/seowoo-logo.webp' },
  { name: '리플레이', logo: '/partners/replay-logo.webp' },
]

const reviewCardStyle: React.CSSProperties = {
  flex: "0 0 auto",
  width: "clamp(260px, 80vw, 360px)",
  padding: "24px 28px",
  background: "var(--bg2)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  marginRight: "14px",
}

const reviewEmojiStyle: React.CSSProperties = {
  fontSize: "3rem",
  lineHeight: 1,
  display: "block",
  marginBottom: "14px",
}

const reviewTextStyle: React.CSSProperties = {
  fontSize: "0.88rem",
  color: "var(--white)",
  lineHeight: 1.7,
  marginBottom: "14px",
}

const reviewAuthorStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "var(--gray)",
  letterSpacing: "0.02em",
}

// STAT_ICONS는 lib/stat-icons.tsx에서 import (join/page.tsx 공용화 — 스펙 2-F)

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────
// (ClassCard 풀 디테일은 /classes 페이지에 있음. 메인은 압축 미니 카드만 노출)

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const heroTitleRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  /* ── 히어로 타이틀: 서브 가로폭을 h1과 일치시킨 후 "한 번만" 등장 ──
       - KoPub·Helvetica 명시 로드 → offsetWidth 실측 → letter-spacing 1차 계산
       - 1차 적용 후 실제 폭 재측정 → 오차(브라우저별 trailing letter-spacing 차이) 보정
       - 등장 이후에는 어떤 재조정도 없음 (리사이즈 리스너 제거)
       - 데스크톱에서 KoPub이 뒤늦게 적용돼서 h1 폭만 커지는 이슈 방지 */
  const [titleReady, setTitleReady] = useState(false)
  const [marqueePaused, setMarqueePaused] = useState(false)
  const [reviewPaused, setReviewPaused] = useState(false)
  useEffect(() => {
    let cancelled = false
    const container = heroTitleRef.current
    if (!container) return
    const h1 = container.querySelector('h1') as HTMLElement | null
    const sub = container.querySelector('.hero-title-wall-sub') as HTMLElement | null
    if (!h1 || !sub) { setTitleReady(true); return }

    const measureAndApply = () => {
      sub.style.letterSpacing = '0'
      // offsetWidth: 레이아웃 실측 (transform/scale 영향 없음)
      const h1W = h1.offsetWidth
      const subW = sub.offsetWidth
      if (subW <= 0 || h1W <= 0) return
      const chars = Math.max(1, (sub.textContent || '').length)
      // 1차 추정 — letter-spacing이 N개 글자에 각각 공간을 추가한다고 가정
      const initialSpacing = (h1W - subW) / chars
      sub.style.letterSpacing = `${Math.max(0, initialSpacing)}px`
      // 2차 보정 — 실제 적용 후 남은 오차를 추가 분배 (trailing letter-spacing 브라우저 차이 대응)
      const actualW = sub.offsetWidth
      const delta = h1W - actualW
      if (Math.abs(delta) > 0.3) {
        const corrected = initialSpacing + delta / chars
        sub.style.letterSpacing = `${Math.max(0, corrected)}px`
      }
    }

    const init = async () => {
      // 폰트 파일을 실제 크기로 명시 로드 — KoPub가 늦게 적용되는 데스크톱 이슈 방지
      try {
        if (document.fonts) {
          const h1Size = parseFloat(getComputedStyle(h1).fontSize) || 48
          const subSize = parseFloat(getComputedStyle(sub).fontSize) || 14
          await Promise.all([
            document.fonts.load(`700 ${h1Size}px KoPubWorldDotum`).catch(() => {}),
            document.fonts.load(`400 ${subSize}px "Helvetica Neue"`).catch(() => {}),
          ])
          if (document.fonts.ready) await document.fonts.ready
        }
      } catch {}
      if (cancelled) return
      // double rAF — 폰트 적용 후 레이아웃 안정화 대기
      requestAnimationFrame(() => {
        if (cancelled) return
        requestAnimationFrame(() => {
          if (cancelled) return
          measureAndApply()
          requestAnimationFrame(() => {
            if (!cancelled) setTitleReady(true)
          })
        })
      })
    }
    init()
    return () => { cancelled = true }
  }, [])

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
        gsap.to('.hero-subtitle', {
          opacity: 1, duration: 0.8, ease: "power2.out", delay: 3.5,
        })
        // 자식(화살표→텍스트)은 3D rotateX + stagger로 앞으로 떠오름
        gsap.from('.hero-subtitle > *', {
          y: 28, rotateX: 35, transformPerspective: 600, opacity: 0,
          duration: 0.9, ease: "power3.out", delay: 3.5, stagger: 0.18,
        })
        gsap.to('.hero-scroll-indicator', {
          opacity: 1, duration: 0.4, delay: 4.0,
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
          gsap.to('.hero-title-wall-pos', {
            yPercent: -45, ease: 'none',
            scrollTrigger: heroScrub(),
          })
          gsap.to('.hero-subtitle', {
            yPercent: -130, ease: 'none',
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

        /* === 후기 마퀴: 스크롤 연동 가속 === */
        document.querySelectorAll('.review-marquee-track').forEach((track, i) => {
          gsap.to(track, {
            x: i % 2 === 0 ? -150 : 150, ease: "none",
            scrollTrigger: {
              trigger: track.parentElement, start: "top bottom", end: "bottom top", scrub: 0.5,
            },
          })
        })

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
      <PageJsonLd schemas={[
        buildBreadcrumb([{ name: '홈', url: SITE_URL }]),
        buildWebPage({ idPath: '#webpage', url: SITE_URL, name: 'KD4 액팅 스튜디오 | 서울 신촌 마이즈너 테크닉 연기학원', description: '서울 신촌 마이즈너 테크닉 기반 연기학원. 연기 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지. 배우를 성장시키는 KD4 액팅 스튜디오.', about: { '@id': `${SITE_URL}#org` }, dateModified: '2026-06-11', speakableCssSelectors: ['h1', 'h2'] }),
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          '@id': `${SITE_URL}#howto`,
          name: 'KD4 액팅 스튜디오로 배우 커리어를 만드는 방법',
          description: '마이즈너 테크닉 훈련부터 출연영상 포트폴리오, 캐스팅 연계까지 — 3단계 배우 액셀러레이팅 시스템.',
          step: [
            { '@type': 'HowToStep', position: 1, name: '아메리칸 액팅 메소드 트레이닝', text: '마이즈너 테크닉 · 이바나 처벅 테크닉 기반의 심층 연기 훈련' },
            { '@type': 'HowToStep', position: 2, name: '포트폴리오 제작', text: '전문 영화팀과 함께 제작하는 출연영상으로 실전 포트폴리오 완성' },
            { '@type': 'HowToStep', position: 3, name: '캐스팅 연계', text: '캐스팅 디렉터·조감독과 직접 연결되는 실전 캐스팅 지원' },
          ],
        },
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

        {/* 오른쪽 하단 에디토리얼 캡션 — Lemaire 3요소 패턴(캡션·선언·DISCOVER 링크)
             벽면 타이틀과 중복되던 'Actor Accelerating System' 제거 (2026-06-12) */}
        <div
          className="hero-subtitle"
          style={{
            position: "absolute",
            right: "clamp(24px, 4vw, 60px)",
            bottom: "clamp(100px, 18vh, 180px)",
            zIndex: 10,
            textAlign: "right",
            opacity: 0,
            // globals.css 레거시 transition(opacity 1s ease 2s)이 GSAP 트윈을 지연시키므로 차단
            transition: "none",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(0.62rem, 1.2vw, 0.72rem)",
              fontWeight: 400,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#111111",
              opacity: 0.6,
              marginBottom: "14px",
            }}
            lang="en"
          >
            Meisner Technique — Sinchon, Seoul
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.05rem, 2.2vw, 1.6rem)",
              fontWeight: 300,
              color: "#111111",
              lineHeight: 1.55,
              letterSpacing: "0.02em",
              // 전경 레이어 — 배경에서 살짝 떠 있는 깊이감
              textShadow: "0 6px 18px rgba(17,17,17,0.14)",
            }}
          >
            상상의 상황 속에서,
            <br />
            진실하게 살아내는 것
          </p>
          <Link
            href="#classes"
            aria-label="클래스 알아보기"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "8px",
              padding: "12px 0",
              fontFamily: "var(--font-display)",
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#111111",
              textDecoration: "none",
            }}
          >
            <span style={{ borderBottom: "1px solid rgba(17,17,17,0.4)", paddingBottom: "3px" }} lang="en">Discover</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* sr-only h1 — JS 렌더 전에도 스크린리더에 즉시 노출 */}
        <h1 className="sr-only">KD4 액팅 스튜디오 — <span lang="en">ACTOR ACCELERATING SYSTEM</span></h1>

        {/* 뒷벽에 박히는 타이틀 — DOM/CSS로 선명하게, 달리줌과 동기화
             측정 완료 전(titleReady=false)에는 비가시 — letter-spacing 적용 후 등장 */}
        <div className={`hero-title-wall-pos ${titleReady ? 'is-ready' : ''}`}>
          <div className="hero-title-wall" ref={heroTitleRef}>
            <h1 aria-hidden="true">KD4 액팅 스튜디오</h1>
            <p className="hero-title-wall-sub"><span lang="en">ACTOR ACCELERATING SYSTEM</span></p>
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
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ── HERO INTRO (카피 + CTA, Stats 직전) ───────────────────────────────── */}
      <section className="hero-intro-section" aria-label="브랜드 소개">
        <p
          className="shimmer-tag"
          style={{
            fontSize: "clamp(0.78rem, 1.6vw, 0.95rem)",
            letterSpacing: "0.3em",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            marginBottom: "32px",
            /* animation 제거됨 */
          }}
        >
          배우들의 아지트
        </p>
        <p style={{ fontSize: "clamp(0.88rem, 1.8vw, 1.05rem)", color: "#111111", letterSpacing: "0.02em", marginBottom: "6px" }}>
          우리는 양산형 배우를 찍어내는 공장식 학원을 거부합니다.
        </p>
        <p style={{ fontSize: "clamp(0.88rem, 1.8vw, 1.05rem)", color: "var(--gold)", fontWeight: 600, letterSpacing: "0.02em", marginBottom: "32px" }}>
          우리는 배우를 성장시키는 KD4 액팅 스튜디오입니다.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "40px" }}>
          <span style={{ display: "block", width: "36px", height: "1px", background: "var(--gold)" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(0.75rem, 1.6vw, 0.85rem)", fontWeight: 400, letterSpacing: "0.32em", color: "var(--gold)", textTransform: "uppercase" }}>
            <span lang="en">OFF THE PLASTIC</span>
          </p>
          <span style={{ display: "block", width: "36px", height: "1px", background: "var(--gold)" }} />
        </div>
        <div className="cta-buttons">
          <Link
            href="#classes"
            className="btn-primary"
            style={{
              background: "var(--navy)",
              color: "#ffffff",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(21,72,138,0.2)",
            }}
          >
            클래스 알아보기 <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/actors"
            style={{
              padding: "14px 32px", border: "1px solid rgba(17,17,17,0.35)", color: "#111111",
              fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.08em",
              borderRadius: "var(--radius)", display: "inline-flex", alignItems: "center",
              minHeight: 44,
              background: "rgba(255,255,255,0.35)", backdropFilter: "blur(4px)", transition: "background var(--transition)",
            }}
          >
            배우 갤러리
          </Link>
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
        aria-label="강사 소개"
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
                    fontSize: "0.7rem",
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
                  desc: "마이즈너 테크닉 · 이바나 처벅 테크닉 기반의 심층 연기 훈련",
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
              minHeight: 44, fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            {marqueePaused ? <><span aria-hidden="true">▶</span> 재생</> : <><span aria-hidden="true">⏸</span> 일시정지</>}
          </button>
        </div>
        {/* 스크린 리더용 배우 목록 — 마퀴는 시각적 전용 */}
        <ul role="list" className="sr-only">
          {CASTING_PHOTOS.map((photo) => (
            <li key={photo.url}>{photo.name}{photo.work ? ` — ${photo.work}` : ''}</li>
          ))}
        </ul>
        <div className="marquee-wrap" aria-hidden="true">
          <div className="marquee-track" style={{ animationPlayState: marqueePaused ? 'paused' : 'running' }}>
            {[...CASTING_PHOTOS, ...CASTING_PHOTOS].map((photo, i) => (
              <div
                key={`${photo.url}-${i}`}
                aria-hidden={i >= CASTING_PHOTOS.length || undefined}
                style={{
                  flexShrink: 0,
                  width: "200px",
                  marginRight: "16px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  position: "relative",
                  aspectRatio: "9 / 16",
                }}
              >
                {/* 이름 fallback — 이미지 로드 실패 시 노출 */}
                <span style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "flex-end", justifyContent: "center",
                  paddingBottom: "14px", fontSize: "0.82rem", color: "var(--text-warm)",
                  zIndex: 0,
                }}>
                  {i < CASTING_PHOTOS.length ? photo.name : ""}
                </span>
                <Image
                  src={photo.url}
                  alt={i < CASTING_PHOTOS.length ? photo.name : ""}
                  fill
                  sizes="200px"
                  loading="lazy"
                  style={{ objectFit: "cover", zIndex: 1 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASTING → /about 핸드오프 ─────────────────────────────────────────── */}
      <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "48px 24px 60px" }}>
        <div className="container" style={{ maxWidth: "720px", textAlign: "center" }}>
          <p style={{ fontSize: "0.82rem", color: "var(--gray)", marginBottom: "20px", lineHeight: 1.7 }}>
            위 캐스팅 결과를 만들어낸 훈련 방식이 궁금하다면
          </p>
          <Link
            href="/about"
            onClick={() => analytics.ctaClick('casting_handoff', '마이즈너 테크닉 알아보기')}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 36px",
              background: "var(--navy)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9rem",
              letterSpacing: "0.06em",
              borderRadius: "var(--radius)",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(21,72,138,0.2)",
              maxWidth: "320px",
              width: "100%",
              boxSizing: "border-box",
            } as React.CSSProperties}
          >
            마이즈너 테크닉 알아보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* ── 6. HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" aria-label="수업 방식" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p
              className="section-eyebrow"
            >
              <span lang="en">PROCESS</span>
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
              <span lang="en">How It Works</span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {[
              {
                num: "01",
                title: "상담 & 수강신청",
                desc: "온라인 폼으로 간편하게 신청하고, 본인에게 맞는 클래스를 안내받으세요.",
              },
              {
                num: "02",
                title: "첫 수업 & 피드백",
                desc: "첫 수업에서 본인의 연기 상태를 진단하고 맞춤 피드백을 받습니다.",
              },
              {
                num: "03",
                title: "성장 & 캐스팅",
                desc: "포트폴리오를 완성하고 캐스팅 디렉터와의 연결을 통해 실전에 나섭니다.",
              },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg3)",
                  padding: "36px 28px",
                  position: "relative",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "3rem",
                    fontWeight: 700,
                    color: "rgba(21,72,138,0.12)",
                    lineHeight: 1,
                    marginBottom: "16px",
                  }}
                >
                  {step.num}
                </p>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "12px",
                    color: "var(--white)",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-warm)",
                    lineHeight: 1.7,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CLASSES — 압축 버전 (전체 보기는 /classes로) ─────────────────── */}
      <section id="classes" aria-label="클래스 소개" className="section" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p className="section-eyebrow"><span lang="en">CURRICULUM</span></p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, color: "var(--white)", lineHeight: 1.35, marginBottom: 12 }}>
              나에게 맞는 클래스 찾기
            </h2>
            <p style={{ fontSize: "0.92rem", color: "var(--gray-light)", lineHeight: 1.8, maxWidth: 540, margin: "0 auto" }}>
              베이직 · 마이즈너 정규 · 출연영상 — 3가지 트랙으로<br />
              입문부터 캐스팅까지 단계별 훈련.
            </p>
          </div>

          {/* 3개 미니 카드 — canonical 카드 패턴 (tag + 클래스명 + 한 줄) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 40 }}>
            {[
              { tag: "BEGINNER", num: "01", title: "베이직 클래스", desc: "취미로 연기를 시작하고 싶은 분", href: "/classes", hot: false },
              { tag: "TRAINING", num: "02", title: "마이즈너 테크닉 정규 클래스", desc: "제대로 배우 훈련을 받고 싶은 분", href: "/meisner-technique-class", hot: true },
              { tag: "PORTFOLIO", num: "03", title: "출연영상 클래스", desc: "캐스팅되는 포트폴리오를 만들고 싶은 분", href: "/reel-production-class", hot: true },
            ].map(({ tag, num, title, desc, href, hot }) => (
              <Link
                key={title}
                href={href}
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  textDecoration: "none",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--gold)"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.transform = "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontFamily: "var(--font-display), Oswald, sans-serif",
                    fontSize: "0.75rem",
                    letterSpacing: "0.15em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    background: "rgba(21,72,138,0.1)",
                    border: "1px solid rgba(21,72,138,0.25)",
                    borderRadius: 3,
                    padding: "3px 9px",
                  }} lang="en">{tag}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hot && (
                      <span style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: "#fff",
                        background: "var(--accent-red)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        letterSpacing: "0.05em",
                      }}><span aria-hidden="true">🔥</span>{' HOT'}</span>
                    )}
                    <span aria-hidden style={{
                      fontFamily: "var(--font-display), Oswald, sans-serif",
                      fontSize: "1.3rem",
                      fontWeight: 300,
                      color: "var(--gray)",
                      letterSpacing: "0.05em",
                      lineHeight: 1,
                    }}>{num}</span>
                  </div>
                </div>
                <h3 style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--white)",
                  letterSpacing: "0.02em",
                  marginTop: 6,
                }}>{title}</h3>
                <p style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.85rem",
                  color: "var(--secondary)",
                  lineHeight: 1.7,
                }}>{desc}</p>
              </Link>
            ))}
          </div>

          {/* CTA — 전체 클래스 + 상담 */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/classes"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                background: "var(--navy)",
                color: "#ffffff",
                fontFamily: "var(--font-sans)",
                fontSize: "0.92rem",
                fontWeight: 700,
                borderRadius: "var(--radius)",
                letterSpacing: "0.05em",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(21,72,138,0.25)",
              }}
            >
              전체 클래스 보러가기 <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/join#form-hero"
              onClick={() => analytics.ctaClick('classes_section', '무료 상담 신청')}
              style={{
                display: "inline-block",
                padding: "14px 32px",
                background: "transparent",
                color: "#111111",
                fontFamily: "var(--font-sans)",
                fontSize: "0.92rem",
                fontWeight: 600,
                border: "1px solid rgba(17,17,17,0.35)",
                borderRadius: "var(--radius)",
                letterSpacing: "0.05em",
                textDecoration: "none",
              }}
            >
              무료 상담 신청
            </Link>
          </div>

          {/* 내부 교차 링크 — SEO: Googlebot 1-hop 연결 */}
          <nav aria-label="주요 클래스 및 정보" style={{ marginTop: 28, textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: 20 }}>
            <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/meisner-technique-class" style={{ fontSize: "0.84rem", color: "var(--secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>마이즈너 테크닉 클래스 <span aria-hidden="true">→</span></Link>
              <Link href="/reel-production-class" style={{ fontSize: "0.84rem", color: "var(--secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>출연영상 클래스 <span aria-hidden="true">→</span></Link>
              <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: "0.84rem", color: "var(--secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>권동원 액팅코치 <span aria-hidden="true">→</span></Link>
              <Link href="/sinchon-acting-academy" style={{ fontSize: "0.84rem", color: "var(--secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>신촌 연기학원 오시는 길 <span aria-hidden="true">→</span></Link>
              <Link href="/benefits" style={{ fontSize: "0.84rem", color: "var(--secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>멤버 혜택 <span aria-hidden="true">→</span></Link>
            </div>
          </nav>
        </div>
      </section>

      {/* ── 8. REVIEWS MARQUEE ─────────────────────────────────────────────── */}
      <section
        id="reviews"
        aria-label="멤버 후기"
        style={{
          padding: "48px 0",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        <p className="section-eyebrow" style={{ textAlign: "center" }}>
          <span lang="en">REAL REVIEWS</span>
        </p>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
            fontWeight: 700,
            marginBottom: "32px",
          }}
        >
          KD4 멤버 이야기
        </h2>

        {/* WCAG 2.2.2: 자동 이동 콘텐츠 일시정지 버튼 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <button
            type="button"
            aria-pressed={reviewPaused}
            aria-label={reviewPaused ? '멤버 이야기 마퀴 재생' : '멤버 이야기 마퀴 일시정지'}
            onClick={() => setReviewPaused(v => !v)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--gray)', borderRadius: 6, padding: '4px 12px',
              minHeight: 44, fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            {reviewPaused ? <><span aria-hidden="true">▶</span> 재생</> : <><span aria-hidden="true">⏸</span> 일시정지</>}
          </button>
        </div>

        {/* 1행: 왼쪽으로 */}
        <div className="review-marquee" aria-hidden="true" style={{ marginBottom: "12px" }}>
          <div className="review-marquee-track" style={{ animationPlayState: reviewPaused ? 'paused' : 'running' }}>
            {[...REVIEW_ITEMS, ...REVIEW_ITEMS].map((r, i) => (
              <div key={`${r.author}-${i}`} aria-hidden={i >= REVIEW_ITEMS.length ? true : undefined} style={reviewCardStyle}>
                <span aria-hidden="true" style={reviewEmojiStyle}>{r.emoji}</span>
                <p style={reviewTextStyle}>&ldquo;{r.text}&rdquo; <span style={reviewAuthorStyle}>— {r.author}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* 2행: 오른쪽으로 */}
        <div className="review-marquee reverse" aria-hidden="true">
          <div className="review-marquee-track" style={{ animationPlayState: reviewPaused ? 'paused' : 'running' }}>
            {[...REVIEW_ITEMS_2, ...REVIEW_ITEMS_2].map((r, i) => (
              <div key={`${r.author}-${i}`} aria-hidden={i >= REVIEW_ITEMS_2.length ? true : undefined} style={reviewCardStyle}>
                <span aria-hidden="true" style={reviewEmojiStyle}>{r.emoji}</span>
                <p style={reviewTextStyle}>&ldquo;{r.text}&rdquo; <span style={reviewAuthorStyle}>— {r.author}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* 스크린리더 전용 후기 목록 */}
        <ul role="list" className="sr-only">
          {[...REVIEW_ITEMS, ...REVIEW_ITEMS_2].map((r, i) => (
            <li key={`${r.author}-${i}`}>&ldquo;{r.text}&rdquo; — {r.author}</li>
          ))}
        </ul>
      </section>

      {/* ── Partners ─────────────────────────────────────────────────────────── */}
      {/* 2026-05-30: 대표님 요청으로 메인페이지에서 숨김 (이전 복원 커밋 7ac0082 무효화) */}
      {/* 복원 시 아래 주석을 풀고 PARTNERS 상수도 유지할 것 */}
      {/*
      <section id="partners" aria-label="함께한 기업" style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
        <h2 className="sr-only">함께한 기업</h2>
        <p style={{ fontFamily: 'var(--font-display), "Noto Sans KR", sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--secondary)', textAlign: 'center', marginBottom: '24px', opacity: 0.6 }}>
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

          <div
            className="cta-buttons"
            style={{ marginBottom: "48px" }}
          >
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
              무료 상담 신청 <span aria-hidden="true">→</span>
            </Link>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank" rel="noopener noreferrer"
              aria-label="카카오로 문의하기 (새 탭에서 열림)"
              onClick={() => analytics.contact('kakao')}
              style={{
                display: "inline-block",
                padding: "18px 52px",
                border: "1px solid rgba(17,17,17,0.35)",
                color: "#111111",
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "0.08em",
                borderRadius: "var(--radius)",
              }}
            >
              카카오로 문의하기
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
