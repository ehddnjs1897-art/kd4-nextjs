"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { CLASSES } from "@/lib/classes";

import { pixel } from "@/lib/meta-pixel";
import { CASTING_PHOTOS } from "@/lib/casting-photos"
import { Users, Award, TrendingUp } from "lucide-react"
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import("@/components/hero/HeroScene"), {
  ssr: false,
});

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

// ─── 클래스 카드 (전체 상세) ────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: (typeof CLASSES)[0] }) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1.5px solid var(--navy)",
      borderRadius: "var(--radius)", overflow: "hidden",
      display: "flex", flexDirection: "column", position: "relative",
    }}>
      {cls.remainingSeats != null && (
        <span style={{
          position: "absolute", top: "12px", right: "12px",
          padding: "6px 14px", background: "var(--accent-red)", color: "#ffffff",
          fontSize: "0.85rem", fontWeight: 800, borderRadius: "6px",
          letterSpacing: "0.04em", zIndex: 1,
        }}>잔여 {cls.remainingSeats}석</span>
      )}

      <div style={{ padding: "28px 24px 24px", flex: 1 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-block", padding: "3px 10px",
            background: "rgba(21,72,138,0.08)", border: "1px solid rgba(21,72,138,0.35)",
            borderRadius: "2px", fontSize: "0.7rem", letterSpacing: "0.1em",
            color: "var(--navy)", fontWeight: 700,
          }}>{cls.step}</span>
          {cls.isHobby && (
            <span style={{
              display: "inline-block", padding: "2px 8px",
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
              borderRadius: "2px", fontSize: "0.68rem", color: "var(--gray)",
            }}>취미반</span>
          )}
        </div>

        <p style={{ color: "var(--gold)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "12px", fontStyle: "italic" }}>
          &ldquo;{cls.quote}&rdquo;
        </p>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--white)", marginBottom: "4px" }}>
          {cls.nameKo}
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--gray)", letterSpacing: "0.08em", marginBottom: cls.subtitle || cls.note ? "12px" : "16px" }}>
          {cls.nameEn}
        </p>
        {cls.subtitle && (
          <p style={{ fontSize: "0.8rem", color: "var(--gray-light)", marginBottom: cls.note ? "8px" : "16px" }}>{cls.subtitle}</p>
        )}
        {cls.note && (
          <p style={{
            fontSize: "0.78rem", color: "var(--gold)", marginBottom: "16px",
            padding: "6px 10px", background: "rgba(21,72,138,0.08)",
            borderRadius: "2px", borderLeft: "2px solid var(--gold)",
          }}>{cls.note}</p>
        )}
        <ul style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          {cls.bullets.map((b, i) => (
            <li key={i} style={{ fontSize: "0.82rem", color: "var(--gray-light)", lineHeight: 1.5, paddingLeft: "14px", position: "relative" }}>
              <span style={{ position: "absolute", left: 0, top: "0.45em", width: "5px", height: "1px", background: "var(--gold)", display: "inline-block" }} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "일정", value: cls.schedule },
            { label: "시간", value: cls.duration },
            { label: "정원", value: cls.capacity },
            ...(cls.course ? [{ label: "코스", value: cls.course }] : []),
          ].map(info => (
            <div key={info.label}>
              <span style={{ fontSize: "0.68rem", color: "var(--gray)", display: "block" }}>{info.label}</span>
              <span style={{ fontSize: "0.82rem", color: "var(--gray-light)" }}>{info.value}</span>
            </div>
          ))}
        </div>

        <div>
          <span style={{ fontSize: "0.65rem", color: "var(--gray)", letterSpacing: "0.06em" }}>월 수강료</span>
          {cls.originalPrice && (
            <p style={{ margin: "4px 0 0", lineHeight: 1 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--gray)", textDecoration: "line-through" }}>₩{cls.originalPrice}</span>
              <span style={{ marginLeft: "8px", fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-red)", padding: "2px 6px", background: "rgba(199,62,62,0.12)", borderRadius: "3px" }}>
                -10만원
              </span>
            </p>
          )}
          <p style={{ display: "flex", alignItems: "baseline", gap: "2px", marginTop: "2px" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
              fontWeight: 900, color: cls.originalPrice ? "var(--navy)" : "var(--white)",
              lineHeight: 1, letterSpacing: "-0.02em",
            }}>₩{cls.price}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--gray)", marginLeft: "2px" }}>/월</span>
          </p>
          {cls.promoLabel && (
            <p style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 600, marginTop: "4px" }}>{cls.promoLabel}</p>
          )}
        </div>

        <Link
          href="/join#offer"
          className="class-card-cta"
          style={{
            display: "block", textAlign: "center", padding: "12px 0",
            background: "var(--gold)", color: "#ffffff", fontWeight: 700,
            fontSize: "0.88rem", fontFamily: "var(--font-display)", letterSpacing: "0.06em",
            borderRadius: "var(--radius)", textDecoration: "none",
            transition: "opacity 0.2s", boxShadow: "0 4px 16px rgba(21,72,138,0.25)",
          }}
        >
          자세히 보기 →
        </Link>
      </div>
    </div>
  )
}

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const heroTitleRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const [step2Open, setStep2Open] = useState(false)
  const [step3Open, setStep3Open] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)

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

    /* === 클래스 카드 배치 스태거 (빠른 등장) === */
    ScrollTrigger.batch('.classes-grid > div', {
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 20, opacity: 0,
          stagger: 0.05, duration: 0.35, ease: "power2.out",
        })
      },
      start: 'top 98%',
    })

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
        {/* Three.js 배경 */}
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
            href="/join"
            onClick={() => pixel.contact()}
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

      {/* ── 2. STATS ─────────────────────────────────────────────────────────── */}
      <section
        id="stats"
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "clamp(28px, 5vw, 60px) 0",
        }}
      >
        <div
          className="container stats-grid"
        >
          {[
            { num: "300+", label: "배우 코칭", Icon: Users },
            { num: "3년+", label: "스튜디오 운영", Icon: Award },
            { num: "70명+", label: "현재 수강배우", Icon: TrendingUp },
          ].map(({ num, label, Icon }) => (
            <div key={label} className="stats-card">
              <div className="stats-icon-wrap">
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} />
              </div>
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
                {num}
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
                {label}
              </p>
            </div>
          ))}
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
              sizes="300px"
              style={{
                width: '300px',
                height: '420px',
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
                  width={200}
                  height={356}
                  loading="lazy"
                  sizes="200px"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
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
            href="/about#meisner"
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
      <section id="classes" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p className="section-eyebrow">CURRICULUM</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, letterSpacing: "0.2em", color: "var(--white)" }}>
              CLASSES
            </h2>
          </div>

          {/* STEP 1 */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "32px", gap: "10px", padding: "28px 32px", border: "1px solid rgba(21,72,138,0.35)", borderRadius: "12px", background: "rgba(21,72,138,0.04)" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.25em", color: "var(--navy)", fontFamily: "var(--font-display)", margin: 0 }}>STEP 1</p>
              <h3 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#111111", letterSpacing: "-0.01em", lineHeight: 1.1, fontFamily: "var(--font-serif)", margin: 0 }}>A 코스</h3>
              <p style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)", color: "var(--navy)", fontWeight: 600, margin: 0, letterSpacing: "0.04em" }}>신규 멤버 신청 가능</p>
            </div>
            <div className="classes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "16px" }}>
              {CLASSES.filter(c => c.isNewMemberOpen).map((cls, i) => <ClassCard key={i} cls={cls} />)}
            </div>
          </div>

          {[
            { label: "STEP 2", title: "B 코스", desc: "STEP 1 수료 후 참여할 수 있는 클래스입니다.", open: step2Open, setOpen: setStep2Open, filter: "step2" },
            { label: "STEP 3", title: "C 코스", desc: "STEP 2 수료 후 참여할 수 있는 클래스입니다.", open: step3Open, setOpen: setStep3Open, filter: "step3" },
            { label: "EXTRA",  title: "별도 코스", desc: "별도로 운영되는 클래스입니다.", open: extraOpen, setOpen: setExtraOpen, filter: "extra" },
          ].map(({ label, title, desc, open, setOpen, filter }) => (
            <div key={filter} style={{ marginBottom: "16px" }}>
              <button
                onClick={() => setOpen((o: boolean) => !o)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", width: "100%",
                  background: open ? "rgba(255,255,255,0.03)" : "none",
                  border: "1px solid var(--border)", borderRadius: "12px",
                  cursor: "pointer", padding: "24px 32px", marginBottom: open ? "20px" : "0",
                  textAlign: "center", gap: "8px", transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.25em", color: "var(--navy)", fontFamily: "var(--font-display)", margin: 0 }}>{label}</p>
                <h3 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "var(--gray-light)", letterSpacing: "-0.01em", lineHeight: 1.1, fontFamily: "var(--font-serif)", margin: 0 }}>{title}</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--gray)", margin: 0 }}>{desc}</p>
                <span style={{ fontSize: "0.85rem", color: "var(--gray)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s", display: "inline-block", marginTop: "4px" }}>▼</span>
              </button>
              {open && (
                <div className="classes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "12px", opacity: 0.75 }}>
                  {CLASSES.filter(c => c.category === filter).map((cls, i) => <ClassCard key={i} cls={cls} />)}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: "48px", padding: "40px 32px", background: "linear-gradient(135deg, rgba(21,72,138,0.06) 0%, rgba(0,0,0,0) 100%)", border: "1px solid var(--border)", borderRadius: "12px", textAlign: "center" }}>
            <p className="section-eyebrow">START YOUR JOURNEY</p>
            <h3 style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 700, color: "var(--white)", marginBottom: "8px" }}>
              어떤 클래스가 맞는지 모르겠다면?
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--gray)", marginBottom: "28px", lineHeight: 1.6 }}>
              무료 상담을 통해 나에게 맞는 클래스를 안내받으세요.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/join" onClick={() => pixel.contact()} className="btn-primary"
                style={{ background: "var(--navy)", color: "#ffffff", textDecoration: "none", boxShadow: "0 4px 20px rgba(21,72,138,0.3)" }}>
                무료 상담 신청 →
              </Link>
              <a href="https://pf.kakao.com/_ximxdqn" target="_blank" rel="noopener noreferrer" onClick={() => pixel.contact()}
                style={{ display: "inline-block", padding: "14px 40px", border: "1px solid rgba(17,17,17,0.35)", color: "#111111", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.06em", borderRadius: "var(--radius)" }}>
                카카오 상담
              </a>
            </div>
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
              href="/join"
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
