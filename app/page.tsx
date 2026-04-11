"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CLASSES } from "@/lib/classes";
import { CASTING_PHOTOS } from "@/lib/casting-photos"
import ContactForm from "@/components/contact/ContactForm";

const HeroScene = dynamic(() => import("@/components/hero/HeroScene"), {
  ssr: false,
});

// ─── FAQ 아코디언 ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "연기 경험이 없어도 참여할 수 있나요?",
    a: "네, 물론이죠. 방문 상담을 신청해주세요. 상세한 상담을 통해 반을 배정해드립니다.",
  },
  {
    q: "어떤 클래스부터 시작하면 좋을까요?",
    a: "베이직 클래스는 취미 클래스이고, 연기를 진지하게 배우고 싶은 분이라면 마이즈너 테크닉 정규 클래스부터 시작하시길 추천드립니다.",
  },
  {
    q: "수업은 얼마나 자주 있나요?",
    a: "특별한 경우가 아니라면 주 1회 진행됩니다.",
  },
  {
    q: "위치가 어디인가요?",
    a: "서울시 서대문구 대현동 90-7 아리움3차 1층 101호 (신촌 대로)에 위치합니다.",
  },
  {
    q: "수강료 납부 방식은 어떻게 되나요?",
    a: "계좌이체 / 카드결제 가능합니다.",
  },
  {
    q: "상담 가능한가요?",
    a: "카카오 채널 및 수강신청 폼을 통해 미리 예약 후 방문 상담 가능합니다.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{
              width: "100%",
              padding: "20px 24px",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              color: "var(--white)",
              fontSize: "0.95rem",
              fontWeight: 500,
              background: "none",
              cursor: "pointer",
              transition: "color var(--transition)",
            }}
          >
            <span>{item.q}</span>
            <span
              style={{
                color: "var(--gold)",
                fontSize: "1.2rem",
                lineHeight: 1,
                flexShrink: 0,
                transition: "transform var(--transition)",
                transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              +
            </span>
          </button>
          {openIndex === i && (
            <div
              style={{
                padding: "0 24px 20px",
                color: "var(--gray-light)",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                borderTop: "1px solid var(--border)",
                paddingTop: "16px",
              }}
            >
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 클래스 카드 ───────────────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: (typeof CLASSES)[0] }) {
  return (
    <div
      style={{
        background: "var(--bg2)",
        border: cls.highlight
          ? "1px solid var(--gold)"
          : "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* 상단 골드 선 (highlight 카드) */}
      {cls.highlight && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "var(--gold)",
          }}
        />
      )}

      {/* 잔여석 뱃지 */}
      {cls.remainingSeats != null && (
        <span
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "4px 10px",
            background: "#e74c3c",
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 700,
            borderRadius: "4px",
            letterSpacing: "0.03em",
            animation: "subtlePulse 2s ease-in-out infinite",
            zIndex: 1,
          }}
        >
          잔여 {cls.remainingSeats}석
        </span>
      )}

      <div style={{ padding: "28px 24px 24px", flex: 1 }}>
        {/* step 뱃지 */}
        <span
          style={{
            display: "inline-block",
            padding: "3px 10px",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            color: "var(--gray)",
            marginBottom: "16px",
          }}
        >
          {cls.step}
        </span>

        {/* 인용구 */}
        <p
          style={{
            color: "var(--gold)",
            fontSize: "0.85rem",
            lineHeight: 1.5,
            marginBottom: "12px",
            fontStyle: "italic",
          }}
        >
          &ldquo;{cls.quote}&rdquo;
        </p>

        {/* 클래스명 */}
        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--white)",
            marginBottom: "4px",
          }}
        >
          {cls.nameKo}
        </h3>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--gray)",
            letterSpacing: "0.08em",
            marginBottom: cls.subtitle || cls.note ? "12px" : "16px",
          }}
        >
          {cls.nameEn}
        </p>

        {/* subtitle */}
        {cls.subtitle && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--gray-light)",
              marginBottom: cls.note ? "8px" : "16px",
            }}
          >
            {cls.subtitle}
          </p>
        )}

        {/* note (골드 강조) */}
        {cls.note && (
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--gold)",
              marginBottom: "16px",
              padding: "6px 10px",
              background: "rgba(0,87,255,0.08)",
              borderRadius: "2px",
              borderLeft: "2px solid var(--gold)",
            }}
          >
            {cls.note}
          </p>
        )}

        {/* bullets */}
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          {cls.bullets.map((b, i) => (
            <li
              key={i}
              style={{
                fontSize: "0.82rem",
                color: "var(--gray-light)",
                lineHeight: 1.5,
                paddingLeft: "14px",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "0.45em",
                  width: "5px",
                  height: "1px",
                  background: "var(--gold)",
                  display: "inline-block",
                }}
              />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 정보 */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* 스케줄 / 시간 / 정원 */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "일정", value: cls.schedule },
            { label: "시간", value: cls.duration },
            { label: "정원", value: cls.capacity },
            ...(cls.course ? [{ label: "코스", value: cls.course }] : []),
          ].map((info) => (
            <div key={info.label}>
              <span
                style={{ fontSize: "0.68rem", color: "var(--gray)", display: "block" }}
              >
                {info.label}
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--gray-light)" }}>
                {info.value}
              </span>
            </div>
          ))}
        </div>

        {/* 가격 + 강사 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <span style={{ fontSize: "0.65rem", color: "var(--gray)", letterSpacing: "0.06em" }}>월 수강료</span>

            {/* 할인 전 원가 (취소선) */}
            {cls.originalPrice && (
              <p style={{ margin: "4px 0 0", lineHeight: 1 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--gray)", textDecoration: "line-through" }}>
                  ₩{cls.originalPrice}
                </span>
                <span style={{
                  marginLeft: "8px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#e74c3c",
                  padding: "2px 6px",
                  background: "rgba(231,76,60,0.12)",
                  borderRadius: "3px",
                }}>
                  -10만원
                </span>
              </p>
            )}

            <p style={{ display: "flex", alignItems: "baseline", gap: "2px", marginTop: cls.originalPrice ? "2px" : "2px" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
                  fontWeight: 900,
                  color: cls.originalPrice ? "#4ade80" : "var(--white)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                ₩{cls.price}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--gray)", marginLeft: "2px" }}>/월</span>
            </p>

            {/* 프로모션 라벨 */}
            {cls.promoLabel && (
              <p style={{
                fontSize: "0.7rem",
                color: "#e74c3c",
                fontWeight: 600,
                marginTop: "4px",
              }}>
                {cls.promoLabel}
              </p>
            )}
          </div>
          {cls.instructor && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--gray)",
                textAlign: "right",
              }}
            >
              {cls.instructor}
            </span>
          )}
        </div>

        {/* CTA 버튼 */}
        <a
          href="https://pf.kakao.com/_ximxdqn"
          target="_blank"
          rel="noopener noreferrer"
          className="class-card-cta"
          style={{
            display: "block",
            textAlign: "center",
            padding: "12px 0",
            marginTop: "14px",
            background: "var(--gold)",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: "0.88rem",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.06em",
            borderRadius: "var(--radius)",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
        >
          상담받기
        </a>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function HomePage() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('section[id]:not(#hero)')
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

  // FAQ → FAQPage JSON-LD
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          minHeight: "600px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Three.js 배경 */}
        <HeroScene />

        {/* 우상단 인증 뱃지 */}
        <div
          className="hero-badge-wrap"
          style={{
            position: "absolute",
            top: "88px",
            right: "64px",
            zIndex: 20,
            animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
            animationDelay: "0.5s",
          }}
        >
          <div
            className="badge-inner"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "10px 16px 12px",
              background: "rgba(10,10,10,0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "12px",
              boxShadow: "0 0 20px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className="badge-emoji" style={{ fontSize: "1.4rem", lineHeight: 1 }}>🏆</span>
            <span
              className="badge-title"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
              }}
            >
              신촌 대표 액팅 스쿨
            </span>
            <span
              className="badge-sub"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.6rem",
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              KD4 Acting Studio
            </span>
          </div>
        </div>

        {/* 오버레이 텍스트 */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* 중앙 텍스트 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            {/* eyebrow */}
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)",
                fontWeight: 400,
                letterSpacing: "0.38em",
                color: "var(--gold)",
                textTransform: "uppercase",
                marginBottom: "20px",
                textShadow: "0 0 30px rgba(0,87,255,0.8)",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "0.2s",
              }}
            >
              KD4 ACTING STUDIO
            </p>

            {/* H1 */}
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(2.8rem, 9vw, 7.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "var(--white)",
                lineHeight: 1,
                marginBottom: "24px",
                textShadow: "0 4px 60px rgba(0,0,0,0.9)",
                animation: "heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "0.45s",
              }}
            >
              KD4 액팅 스튜디오
            </h1>

            {/* 배우들의 아지트 */}
            <p
              className="shimmer-tag"
              style={{
                fontSize: "clamp(0.78rem, 1.6vw, 0.95rem)",
                letterSpacing: "0.3em",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                marginBottom: "32px",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.7s both, shimmerTag 6s 1.5s linear infinite",
              }}
            >
              배우들의 아지트
            </p>

            {/* 카피 라인 1 */}
            <p
              style={{
                fontSize: "clamp(0.82rem, 1.8vw, 1rem)",
                color: "#ffffff",
                letterSpacing: "0.02em",
                marginBottom: "6px",
                textShadow: "0 2px 20px rgba(0,0,0,0.9)",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "0.9s",
              }}
            >
              우리는 양산형 배우를 찍어내는 공장식 학원을 거부합니다.
            </p>

            {/* 카피 라인 2 */}
            <p
              style={{
                fontSize: "clamp(0.82rem, 1.8vw, 1rem)",
                color: "var(--gold)",
                fontWeight: 600,
                letterSpacing: "0.02em",
                marginBottom: "32px",
                textShadow: "0 2px 20px rgba(0,0,0,0.9)",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "1.05s",
              }}
            >
              우리는 배우를 성장시키는 KD4 액팅 스튜디오입니다.
            </p>

            {/* OFF THE PLASTIC 데코 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "40px",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "1.15s",
              }}
            >
              <span style={{ display: "block", width: "36px", height: "1px", background: "var(--gold)" }} />
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(0.65rem, 1.6vw, 0.85rem)",
                  fontWeight: 400,
                  letterSpacing: "0.32em",
                  color: "var(--gold)",
                  textTransform: "uppercase",
                }}
              >
                OFF THE PLASTIC
              </p>
              <span style={{ display: "block", width: "36px", height: "1px", background: "var(--gold)" }} />
            </div>

            {/* 할인 뱃지 */}
            <p
              style={{
                display: "inline-block",
                padding: "6px 16px",
                background: "rgba(231,76,60,0.12)",
                border: "1px solid rgba(231,76,60,0.3)",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#ff6b6b",
                marginBottom: "20px",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "1.25s",
              }}
            >
              ~ 5월까지 10만원 할인 중
            </p>

            {/* CTA 버튼 */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
                animation: "heroFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: "1.35s",
              }}
            >
              <a
                href="#classes"
                style={{
                  padding: "14px 32px",
                  background: "var(--gold)",
                  color: "#0a0a0a",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  borderRadius: "var(--radius)",
                  display: "inline-block",
                  transition: "opacity var(--transition)",
                }}
              >
                클래스 둘러보기
              </a>
              <Link
                href="/actors"
                style={{
                  padding: "14px 32px",
                  border: "1px solid var(--gold)",
                  color: "var(--gold)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  borderRadius: "var(--radius)",
                  display: "inline-block",
                  background: "rgba(0,0,0,0.4)",
                  backdropFilter: "blur(4px)",
                  transition: "background var(--transition)",
                }}
              >
                배우 DB
              </Link>
            </div>
          </div>

          {/* 하단 골드 바 + 스크롤 화살표 */}
          <div
            style={{
              width: "100%",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "center",
              borderTop: "1px solid rgba(0,87,255,0.25)",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)",
            }}
          >
            <a
              href="#stats"
              style={{
                color: "var(--gold)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                opacity: 0.7,
              }}
            >
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em" }}>SCROLL</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 3v10M3 9l5 5 5-5" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. STATS ─────────────────────────────────────────────────────────── */}
      <section
        id="stats"
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "60px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {[
            { num: "300+", label: "배우 코칭", icon: "🎭" },
            { num: "3년+", label: "스튜디오 운영", icon: "⭐" },
            { num: "70명+", label: "현재 수강배우", icon: "📈" },
          ].map((stat) => (
            <div key={stat.label} className="stats-card">
              <div className="stats-icon-wrap">
                <span style={{ position: "relative", zIndex: 1 }}>{stat.icon}</span>
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
                {stat.num}
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
          ))}
        </div>
      </section>

      {/* ── 5. CLASSES ───────────────────────────────────────────────────────── */}
      <section id="classes" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "12px",
              }}
            >
              CURRICULUM
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700 }}>
              클래스
            </h2>
          </div>

          {/* 마감 임박 + 할인 배너 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "14px 24px",
              marginBottom: "28px",
              background: "rgba(231,76,60,0.08)",
              border: "1px solid rgba(231,76,60,0.25)",
              borderRadius: "var(--radius)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🔥</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ff6b6b" }}>
              5월 한정 즉시 수강 10만원 할인
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--gray)" }}>·</span>
            <span style={{ fontSize: "0.82rem", color: "var(--gold)", fontWeight: 600 }}>
              잔여 3자리
            </span>
          </div>

          {/* 반응형 그리드: 모바일 1열 / 태블릿 2열 / PC 3열 */}
          <div
            className="classes-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: "16px",
            }}
          >
            {CLASSES.map((cls, i) => (
              <ClassCard key={i} cls={cls} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <a
              href="https://forms.gle/68E7yFFFoDiPCRwD9"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "16px 48px",
                background: "var(--gold)",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: "0.9rem",
                letterSpacing: "0.08em",
                borderRadius: "var(--radius)",
              }}
            >
              수강신청 하기
            </a>
          </div>
        </div>
      </section>


      {/* ── 3. ABOUT ─────────────────────────────────────────────────────────── */}
      <section id="about" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "16px",
              }}
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


            {/* 3단계 — 진행 느낌 */}
            <div className="steps-journey">
              {[
                {
                  num: "01",
                  step: "STEP 01",
                  title: "연기 메소드 훈련",
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
                <div key={s.num} style={{ display: 'contents' }}>
                  <div
                    className="step-card"
                    style={{
                      position: "relative",
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "56px 36px 48px",
                      textAlign: "left",
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
                        color: "rgba(0,87,255,0.07)",
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
                        fontSize: "1rem",
                        letterSpacing: "0.2em",
                        fontWeight: 600,
                        color: "var(--gold)",
                        marginBottom: "16px",
                      }}
                    >
                      {s.step}
                    </p>

                    {/* 이모지 아이콘 */}
                    <div className="step-icon-glow">
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
                </div>
              ))}
            </div>
          </div>
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
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.7rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "8px",
              }}
            >
              LEADER
            </p>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/director.jpg"
              alt="대표 권동원"
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

      {/* ── 6. COMPARISON ────────────────────────────────────────────────────── */}
      <section
        id="comparison"
        className="section"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)" }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "12px",
              }}
            >
              WHY KD4
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
              KD4 vs 일반 학원
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "480px",
              }}
            >
              <thead>
                <tr>
                  {["항목", "KD4 액팅 스튜디오", "일반 학원"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        textAlign: i === 0 ? "left" : "center",
                        fontSize: "0.75rem",
                        letterSpacing: "0.08em",
                        color: i === 1 ? "var(--gold)" : "var(--gray)",
                        borderBottom: "1px solid var(--border)",
                        fontWeight: i === 1 ? 700 : 400,
                        background:
                          i === 1 ? "rgba(196,165,90,0.06)" : "transparent",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    item: "훈련 방식",
                    kd4: "마이즈너·이바나처벅 테크닉",
                    other: "입시식 주입 훈련",
                  },
                  {
                    item: "클래스 규모",
                    kd4: "소수정예 (6~10명)",
                    other: "대형 클래스",
                  },
                  {
                    item: "포트폴리오",
                    kd4: "전문 영화팀 출연영상 제작",
                    other: "없음 / 자체 촬영",
                  },
                  {
                    item: "캐스팅 연계",
                    kd4: "직접 캐스팅 연계",
                    other: "이미지 단역 / 단역 연결",
                  },
                  {
                    item: "커뮤니티",
                    kd4: "배우 성장 네트워크",
                    other: "없음",
                  },
                ].map((row, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "0.82rem",
                        color: "var(--gray)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {row.item}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "0.85rem",
                        color: "var(--white)",
                        fontWeight: 500,
                        textAlign: "center",
                        borderBottom: "1px solid var(--border)",
                        background: "rgba(196,165,90,0.04)",
                      }}
                    >
                      {row.kd4}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: "0.82rem",
                        color: "var(--gray)",
                        textAlign: "center",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {row.other}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 7. HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "12px",
              }}
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
                    color: "rgba(196,165,90,0.12)",
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

      {/* ── 8. CASTING ───────────────────────────────────────────────────────── */}
      <section
        id="casting"
        className="section"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", paddingBottom: "80px" }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "12px",
              }}
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
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.name}
                  style={{
                    width: "100%",
                    aspectRatio: "9 / 16",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ color: "var(--white)", fontSize: "0.82rem", fontWeight: 600 }}>
                    {photo.name}
                  </p>
                  {photo.work && (
                    <p style={{ color: "var(--gold)", fontSize: "0.72rem", marginTop: "2px" }}>
                      {photo.work}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ──────────────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="section"
        style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)" }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                letterSpacing: "0.3em",
                color: "var(--gold)",
                marginBottom: "12px",
              }}
            >
              FAQ
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700 }}>
              자주 묻는 질문
            </h2>
          </div>

          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ── 11. CONTACT ─────────────────────────────────────────────────────── */}
      <section
        id="contact"
        style={{
          padding: "100px 24px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg2)",
        }}
      >
        <div className="container" style={{ maxWidth: "680px" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", letterSpacing: "0.3em", color: "var(--gold)", marginBottom: "12px", textAlign: "center" }}>
            CONTACT
          </p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, textAlign: "center", marginBottom: "12px" }}>
            상담 접수
          </h2>
          <p style={{ color: "var(--gray-light)", fontSize: "0.9rem", textAlign: "center", marginBottom: "48px", lineHeight: 1.7 }}>
            궁금한 점을 남겨주시면 빠르게 연락드리겠습니다.
          </p>
          <ContactForm />
        </div>
      </section>

      {/* ── 12. CTA ──────────────────────────────────────────────────────────── */}
      <section
        id="cta"
        style={{
          padding: "120px 24px",
          background:
            "radial-gradient(ellipse at center, rgba(0,87,255,0.08) 0%, var(--bg) 70%)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              letterSpacing: "0.3em",
              color: "var(--gold)",
              marginBottom: "16px",
            }}
          >
            START NOW
          </p>
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
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "48px",
            }}
          >
            <a
              href="https://forms.gle/68E7yFFFoDiPCRwD9"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "18px 52px",
                background: "var(--gold)",
                color: "#0a0a0a",
fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "0.08em",
                borderRadius: "var(--radius)",
              }}
            >
              수강신청 하기
            </a>
            <a
              href="https://pf.kakao.com/_ximxdqn"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "18px 52px",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "0.08em",
                borderRadius: "var(--radius)",
              }}
            >
              카카오로 문의하기
            </a>
          </div>

          {/* 연락처 */}
          <div
            style={{
              display: "flex",
              gap: "16px 24px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "전화", text: "010-8564-0244", href: "tel:010-8564-0244" },
              { label: "이메일", text: "uikactors@gmail.com", href: "mailto:uikactors@gmail.com" },
              { label: "인스타", text: "@kd4actingstudio", href: "https://www.instagram.com/kd4actingstudio" },
              { label: "카카오", text: "KD4 채널", href: "https://pf.kakao.com/_ximxdqn" },
              { label: "블로그", text: "네이버 블로그", href: "https://blog.naver.com/kd4actingstudio" },
              { label: "유튜브", text: "YouTube", href: "https://www.youtube.com/@kd4actingstudio" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  fontSize: "0.82rem",
                  color: "var(--gray)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--gray)")}
              >
                <span style={{ color: "var(--gold)", fontSize: "0.72rem", letterSpacing: "0.05em" }}>{item.label}</span>
                {item.text}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
