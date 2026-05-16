"use client";

import '@/app/page-hero.css'
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { KD4_STATS } from "@/lib/stats";

import { pixel } from "@/lib/meta-pixel";
import { CASTING_PHOTOS } from "@/lib/casting-photos"
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import("@/components/hero/HeroScene"), {
  ssr: false,
});

// ─── 후기 마퀴 데이터 ────────────────────────────────────────────────────────

const REVIEW_ITEMS = [
  { text: "연기를 다시 즐길 수 있게 되었습니다", author: "조솔", emoji: "😊" },
  { text: "마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다", author: "김현", emoji: "😲" },
  { text: "단순한 클래스 이상의 경험, 연기에 대한 마음을 다시 채울 수 있는 소중한 시간", author: "이정", emoji: "🥹" },
  { text: "형식적으로 흘러가기 쉬운데, KD4는 정말 달랐습니다", author: "박우", emoji: "😤" },
  { text: "막 시작해서 방향을 찾고 있는 분들께 꼭 추천드리고 싶습니다", author: "최민", emoji: "😄" },
]

const REVIEW_ITEMS_2 = [
  { text: "긴장 없이 연기를 순수하게 느낄 수 있었고, 그 시간이 저에게 큰 위로가 되었습니다", author: "한아", emoji: "😌" },
  { text: "한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다", author: "정석", emoji: "😍" },
  { text: "처음 만난 분들과도 자연스럽게 이야기를 나눌 수 있었고, 서로의 경험을 공유하는 느낌", author: "김안", emoji: "🤗" },
  { text: "이런 좋은 프로그램을 받을 수 있게 해주셔서 감사드립니다", author: "윤호", emoji: "😭" },
  { text: "지금 이 순간, 진짜 감정에 솔직하게 느끼는 것. 그게 마이즈너의 핵심이었습니다", author: "서린", emoji: "🥺" },
]

const reviewCardStyle: React.CSSProperties = {
  flex: "0 0 auto",
  width: "360px",
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

  /* ── Lenis 부드러운 스크롤 (데스크톱 전용) ── */
  useEffect(() => {
    // 터치 기기(모바일)에서는 iOS 네이티브 관성 스크롤이 훨씬 부드럽고
    // Lenis가 JS로 가로채면 버퍼링·밀림이 생겨서 비활성화
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isTouchDevice || prefersReduced) {
      // 모바일: 네이티브 스크롤 + ScrollTrigger passive 연결
      const onScroll = () => ScrollTrigger.update()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    // 데스크톱: Lenis를 GSAP ticker에 통합 (raf 이중 실행 방지)
    let lenis: any
    import('lenis').then((mod) => {
      const Lenis = mod.default
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
      })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time) => lenis.raf(time * 1000))
      gsap.ticker.lagSmoothing(0)
    })
    return () => {
      if (lenis) lenis.destroy()
    }
  }, [])

  /* ── GSAP 애니메이션 ── */
  useGSAP(() => {
    const ease = "cubic-bezier(.7, 0, .3, 1)" as any

    /* === HERO 요소 입장 (달리줌 중반에 맞춰 등장) === */
    gsap.from('.hero-subtitle', {
      y: 30, opacity: 0, duration: 0.8, ease: "power2.out", delay: 3.5,
    })
    gsap.from('.hero-scroll-indicator', {
      opacity: 0, duration: 0.4, delay: 4.0,
    })

    /* === MARQUEE: CSS animation 단독 처리 (GSAP 충돌 방지) === */

    /* === 스크롤 인디케이터 반복 === */
    gsap.to('.hero-scroll-indicator', {
      y: 8, repeat: -1, yoyo: true, duration: 1, ease: "power1.inOut",
    })

    /* === HERO INTRO 섹션 등장 === */
    gsap.from('.hero-intro-section', {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: '.hero-intro-section',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    })

    /* === 전체 섹션 ScrollTrigger 등장 (#classes 제외 — 즉시 표시) === */
    gsap.utils.toArray<HTMLElement>('section[id]:not(#hero):not(#classes)').forEach((section) => {
      gsap.from(section, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
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
        x: i % 2 === 0 ? -150 : 150,
        ease: "none",
        scrollTrigger: {
          trigger: track.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      })
    })

    /* === 캐스팅 마퀴: 스크롤 연동 가속 === */
    document.querySelectorAll('.marquee-track').forEach((track) => {
      gsap.to(track, {
        x: -200,
        ease: "none",
        scrollTrigger: {
          trigger: track.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      })
    })
  })

  /* ── 기존 섹션 리빌 (IntersectionObserver) ── */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('section[id]:not(#hero):not(#classes)')
    els.forEach((el) => el.classList.add('reveal-section'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ── 1. HERO (Dennis Snellenberg style) ───────────────────────────────── */}
      <section
        id="hero"
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
        {/* Hero 배경: Three.js 3D scene (모바일도 동일 — 모바일에서는 더 가볍게 렌더) */}
        <HeroScene />

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

        {/* 오른쪽 하단 서브타이틀 */}
        <div
          className="hero-subtitle"
          style={{
            position: "absolute",
            right: "clamp(24px, 4vw, 60px)",
            bottom: "clamp(100px, 18vh, 180px)",
            zIndex: 10,
            textAlign: "right",
            opacity: 0,
          }}
        >
          <div className="hero-arrow" style={{ marginBottom: "16px", textAlign: "right" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(17,17,17,0.45)" strokeWidth="1">
              <path d="M7 7l10 10M17 7v10H7" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              fontWeight: 300,
              color: "#111111",
              lineHeight: 1.5,
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ display: "block", color: "#111111", fontSize: "0.85em", opacity: 0.75 }}>Actor Accelerating System</span>
            연기하지 않는 연기
          </p>
        </div>

        {/* 뒷벽에 박히는 타이틀 — DOM/CSS로 선명하게, 달리줌과 동기화
             측정 완료 전(titleReady=false)에는 비가시 — letter-spacing 적용 후 등장 */}
        <div className={`hero-title-wall-pos ${titleReady ? 'is-ready' : ''}`}>
          <div className="hero-title-wall" ref={heroTitleRef}>
            <h1>KD4 액팅 스튜디오</h1>
            <p className="hero-title-wall-sub">ACTOR ACCELERATING SYSTEM</p>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div
          className="hero-scroll-indicator"
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            opacity: 0,
          }}
        >
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(17,17,17,0.5)" }}>SCROLL</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(17,17,17,0.5)" strokeWidth="1.5">
            <path d="M8 3v10M3 9l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ── HERO INTRO (카피 + CTA, Stats 직전) ───────────────────────────────── */}
      <section className="hero-intro-section">
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
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(0.65rem, 1.6vw, 0.85rem)", fontWeight: 400, letterSpacing: "0.32em", color: "var(--gold)", textTransform: "uppercase" }}>
            OFF THE PLASTIC
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
            클래스 알아보기 →
          </Link>
          <Link
            href="/actors"
            style={{
              padding: "14px 32px", border: "1px solid rgba(17,17,17,0.35)", color: "#111111",
              fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.08em",
              borderRadius: "var(--radius)", display: "inline-block",
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
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "clamp(36px, 6vw, 72px) 0",
        }}
      >
        <div className="container stats-grid">
          {KD4_STATS.map((stat, i) => {
            const icons = [
              // 0: 누적 코칭 배우 — 사람 그룹
              <svg key="people" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>,
              // 1: 출연영상 제작 — 카메라/영상
              <svg key="video" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>,
              // 2: 배우 DB — 데이터베이스
              <svg key="db" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
              </svg>,
              // 3: 캐스팅 — 차트 우상향
              <svg key="chart" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>,
            ]
            return (
              <div key={stat.label} className="stats-card">
                <div className="stats-icon-wrap">{icons[i]}</div>
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
                    fontSize: "clamp(0.65rem, 2vw, 0.8rem)",
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

      {/* ── 4. DIRECTOR ──────────────────────────────────────────────────────── */}
      <section
        id="director"
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
            <p className="section-eyebrow">LEADER</p>
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
                  PROFILE
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "프로 배우 400명+ 액팅 코칭",
                    "유익액터스 대표",
"경계선 제작·주연",
                    "K-웹드라마 어워드 연기상 수상",
                    "LG 크리에이터 특별상",
                    "Youtube 2000만뷰+",
                    "건명원 / The Chora 졸업",
                    "LA Meisner Workshop 수료",
                    "한국 마이즈너테크닉 아카데미 수료",
                  ].map((item, i) => (
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
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 필모 */}
              <div>
                <p
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    color: "var(--gold)",
                    marginBottom: "16px",
                  }}
                >
                  FILMOGRAPHY
                </p>
                {[
                  {
                    cat: "드라마",
                    items: [
                      "무빙2 (2026)",
                      "나의 유죄 인간 (2026)",
                      "금쪽같은 내 스타 (2025)",
                      "중증외상센터 (2025)",
                      "세작 (2024)",
                    ],
                  },
                  {
                    cat: "영화",
                    items: ["경계선 (2025, 제작·주연)", "강철비2 (2021)"],
                  },
                  {
                    cat: "CF",
                    items: ["MSD 제약 키트루다 (2025)", "현대 인증중고차 (2024)"],
                  },
                ].map((group) => (
                  <div key={group.cat} style={{ marginBottom: "20px" }}>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--gray)",
                        marginBottom: "8px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {group.cat}
                    </p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {group.items.map((item, i) => (
                        <li
                          key={i}
                          style={{ fontSize: "0.82rem", color: "var(--gray-light)" }}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            </div>{/* end 텍스트 영역 */}

            {/* 대표 사진 */}
            <Image
              src="/director.jpg"
              alt="대표 권동원"
              width={300}
              height={420}
              priority
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

      {/* ── 3. ABOUT ─────────────────────────────────────────────────────────── */}
      <section id="about" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          {/* 헤더 영역은 중앙 정렬 720px 유지 (가독성) */}
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <p
              className="section-eyebrow"
            >
              ALL IN ONE SYSTEM
            </p>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 700,
                marginBottom: "16px",
                lineHeight: 1.2,
              }}
            >
              배우지망생 →{" "}
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
                <>
                  <div
                    key={s.num}
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
                      {s.step}
                    </p>

                    {/* 이모지 아이콘 */}
                    <div className="step-icon-glow" style={{ margin: "0 auto 20px" }}>
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
                        color: "var(--gray)",
                        lineHeight: 1.7,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>

                  {/* 화살표 (마지막 제외) */}
                  {i < 2 && (
                    <div key={`arrow-${i}`} className="step-journey-arrow">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
                </>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. CASTING ───────────────────────────────────────────────────────── */}
      <section
        id="casting"
        className="section"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", paddingBottom: "80px" }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              className="section-eyebrow"
            >
              CASTING RESULTS
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
              KD4 캐스팅현황
            </h2>
            <p style={{ color: "var(--gray)", fontSize: "0.9rem", marginTop: "12px" }}>
              KD4 배우들의 실제 캐스팅 결과입니다
            </p>
          </div>
        </div>

        {/* 마퀴 — 컨테이너 밖으로 full-width */}
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...CASTING_PHOTOS, ...CASTING_PHOTOS].map((photo, i) => (
              <div
                key={i}
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
                  paddingBottom: "14px", fontSize: "0.82rem", color: "var(--gray)",
                  zIndex: 0,
                }}>
                  {i < CASTING_PHOTOS.length ? photo.name : ""}
                </span>
                <Image
                  src={photo.url}
                  alt={i < CASTING_PHOTOS.length ? photo.name : ""}
                  fill
                  sizes="200px"
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
            onClick={() => pixel.contact()}
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
            마이즈너 테크닉 알아보기 →
          </Link>
        </div>
      </div>

      {/* ── 7. HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p
              className="section-eyebrow"
            >
              PROCESS
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
              How It Works
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
                    color: "var(--gray)",
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

      {/* ── 5. CLASSES ───────────────────────────────────────────────────────── */}
      {/* ── 8. CLASSES — 압축 버전 (전체 보기는 /classes로) ─────────────────── */}
      <section id="classes" className="section" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p className="section-eyebrow">CURRICULUM</p>
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
              { tag: "BEGINNER", num: "01", title: "베이직 클래스", desc: "취미로 연기를 시작하고 싶은 분" },
              { tag: "TRAINING", num: "02", title: "마이즈너 정규 클래스", desc: "제대로 배우 훈련을 받고 싶은 분" },
              { tag: "PORTFOLIO", num: "03", title: "출연영상 클래스", desc: "캐스팅되는 포트폴리오를 만들고 싶은 분" },
            ].map(({ tag, num, title, desc }) => (
              <Link
                key={title}
                href="/classes"
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
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    background: "rgba(21,72,138,0.1)",
                    border: "1px solid rgba(21,72,138,0.25)",
                    borderRadius: 3,
                    padding: "3px 9px",
                  }}>{tag}</span>
                  <span aria-hidden style={{
                    fontFamily: "var(--font-display), Oswald, sans-serif",
                    fontSize: "1.3rem",
                    fontWeight: 300,
                    color: "var(--gray)",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}>{num}</span>
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
              전체 클래스 보러가기 →
            </Link>
            <Link
              href="/join#form-hero"
              onClick={() => pixel.contact()}
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
        </div>
      </section>

      {/* ── 8.5 REVIEWS MARQUEE ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "48px 0",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        <p className="section-eyebrow" style={{ textAlign: "center" }}>
          REAL REVIEWS
        </p>
        <h2
          style={{
            textAlign: "center",
            fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
            fontWeight: 700,
            marginBottom: "32px",
          }}
        >
          KD4 배우 이야기
        </h2>

        {/* 1행: 왼쪽으로 */}
        <div className="review-marquee" style={{ marginBottom: "12px" }}>
          <div className="review-marquee-track">
            {[...REVIEW_ITEMS, ...REVIEW_ITEMS].map((r, i) => (
              <div key={i} style={reviewCardStyle}>
                <span style={reviewEmojiStyle}>{r.emoji}</span>
                <p style={reviewTextStyle}>&ldquo;{r.text}&rdquo; <span style={reviewAuthorStyle}>— {r.author}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* 2행: 오른쪽으로 */}
        <div className="review-marquee reverse">
          <div className="review-marquee-track">
            {[...REVIEW_ITEMS_2, ...REVIEW_ITEMS_2].map((r, i) => (
              <div key={i} style={reviewCardStyle}>
                <span style={reviewEmojiStyle}>{r.emoji}</span>
                <p style={reviewTextStyle}>&ldquo;{r.text}&rdquo; <span style={reviewAuthorStyle}>— {r.author}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. CTA ──────────────────────────────────────────────────────────── */}
      <section
        id="cta"
        style={{
          padding: "120px 24px",
          background:
            "radial-gradient(ellipse at center, rgba(21,72,138,0.08) 0%, var(--bg) 70%)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p className="section-eyebrow">START NOW</p>
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
            배우지망생 → 진짜 배우
            <br />
            연기 훈련부터 캐스팅까지
          </p>

          <div
            className="cta-buttons"
            style={{ marginBottom: "48px" }}
          >
            <Link
              href="/join#form"
              onClick={() => pixel.contact()}
              className="btn-primary"
              style={{
                background: "var(--navy)",
                color: "#ffffff",
                textDecoration: "none",
                boxShadow: "0 6px 18px rgba(21,72,138,0.2)",
              }}
            >
              무료 상담 신청 →
            </Link>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pixel.contact()}
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
