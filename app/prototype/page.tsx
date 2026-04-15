'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

/* ── 클래스 데이터 ── */
const CLASSES = [
  { step: 'STEP 1', name: '베이직 클래스', quote: '막혀있던 감정의 둑을 터뜨리는 수업', price: '250,000' },
  { step: 'STEP 1', name: '마이즈너 테크닉 정규', quote: '진짜 배우로 다시 태어나는 시간', price: '250,000', highlight: true },
  { step: 'STEP 2', name: '출연영상 클래스', quote: '실제 영화 현장의 퀄리티로', price: '300,000', highlight: true },
  { step: 'STEP 2', name: '출연영상 심화', quote: '수료자만 선택할 수 있는 트랙', price: '450,000' },
  { step: 'STEP 3', name: '액터스 리더', quote: 'KD4가 엄선한 정예 멤버 10명', price: '200,000' },
  { step: '별도', name: '오디션 클래스', quote: '캐스팅 디렉터의 시선을 멈추게', price: '250,000' },
]

const REVIEWS = [
  { emoji: '🥹', text: '첫 수업에서 울었어요. 꽁꽁 닫아뒀던 감정이 터진 느낌.', author: '김서연' },
  { emoji: '🔥', text: '마이즈너 테크닉 덕분에 자연스러운 연기가 뭔지 처음 알았습니다.', author: '이준혁' },
  { emoji: '😭', text: '출연영상 촬영하면서 진짜 배우가 된 기분이었어요.', author: '박지은' },
  { emoji: '✨', text: '권동원 대표님 수업은 진짜 다릅니다.', author: '정민수' },
]

export default function PrototypePage() {
  const mainRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const marqueeInnerRef = useRef<HTMLDivElement>(null)

  /* ── Lenis 부드러운 스크롤 ── */
  useEffect(() => {
    let lenis: any
    let rafId: number
    import('lenis').then((mod) => {
      const Lenis = mod.default
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      lenis.on('scroll', ScrollTrigger.update)
      function raf(time: number) {
        lenis.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    })
    return () => {
      if (lenis) lenis.destroy()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  /* ── GSAP 애니메이션 ── */
  useGSAP(() => {
    /* ===== PRELOADER: 인사말 순환 + 커튼 업 ===== */
    const greetings = document.querySelectorAll('.greeting-word')
    const preloader = document.querySelector('.preloader') as HTMLElement
    const tl = gsap.timeline()

    // 인사말 하나씩 보여주기
    greetings.forEach((word, i) => {
      tl.to(word, { opacity: 1, duration: 0.3, delay: i === 0 ? 0.2 : 0 })
        .to(word, { opacity: 0, duration: 0.2, delay: 0.25 })
    })

    // 프리로더 위로 슬라이드
    tl.to(preloader, {
      yPercent: -100,
      duration: 0.8,
      ease: 'power3.inOut',
      delay: 0.1,
    })

    // 히어로 요소들 등장
    tl.from('.hero-subtitle', { y: 40, opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3')
    tl.from('.hero-badge', { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.4')
    tl.from('.hero-arrow', { y: -20, opacity: 0, duration: 0.5 }, '-=0.3')

    // 스크롤 인디케이터 반복
    gsap.to('.hero-arrow', {
      y: 8, repeat: -1, yoyo: true, duration: 1, ease: 'power1.inOut',
    })

    /* ===== MARQUEE: 스크롤 연동 가로 이동 ===== */
    if (marqueeInnerRef.current) {
      gsap.to(marqueeInnerRef.current, {
        xPercent: -15,
        ease: 'none',
        scrollTrigger: {
          trigger: marqueeRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      })
    }

    /* ===== STORY: 줄 단위 리빌 ===== */
    gsap.utils.toArray<HTMLElement>('.story-line').forEach((line, i) => {
      gsap.from(line, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: line,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    })

    /* ===== GOLD LINE 확장 ===== */
    gsap.utils.toArray<HTMLElement>('.gold-line').forEach((line) => {
      gsap.from(line, {
        scaleX: 0,
        duration: 1,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: line, start: 'top 85%' },
      })
    })

    /* ===== CLASS CARDS: 배치 스태거 ===== */
    ScrollTrigger.batch('.class-card', {
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 60, opacity: 0, scale: 0.95,
          stagger: 0.15, duration: 0.7, ease: 'power2.out',
        })
      },
      start: 'top 88%',
    })

    /* ===== REVIEW CARDS ===== */
    ScrollTrigger.batch('.review-card', {
      onEnter: (batch) => {
        gsap.from(batch, {
          x: -40, opacity: 0,
          stagger: 0.12, duration: 0.6, ease: 'power2.out',
        })
      },
      start: 'top 88%',
    })

    /* ===== CTA: 스크럽 등장 ===== */
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top bottom',
        end: 'top 20%',
        scrub: 1,
      },
    })
    ctaTl.from('.cta-text', { y: 100, opacity: 0, scale: 0.8, duration: 1 })
    ctaTl.from('.cta-btn', { y: 40, opacity: 0, duration: 0.5 }, '-=0.3')

  }, { scope: mainRef })

  /* 마퀴 텍스트 (Dennis Snellenberg 스타일) */
  const marqueeText = 'KD4 — ACTING STUDIO — KD4 — ACTING STUDIO — '

  return (
    <div ref={mainRef} style={{ background: '#0a0a0a', color: '#f0f0f0', overflow: 'hidden' }}>

      {/* ════════ PRELOADER (Dennis 스타일) ════════ */}
      <div
        className="preloader"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {['Hello', 'Bonjour', '안녕하세요', 'Hola', 'KD4'].map((word, i) => (
          <span
            key={i}
            className="greeting-word"
            style={{
              position: 'absolute',
              fontFamily: 'Oswald, sans-serif',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 300,
              color: i === 4 ? '#c4a55a' : '#ffffff',
              opacity: 0,
              letterSpacing: '0.1em',
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* ════════ HERO (Dennis Snellenberg 스타일) ════════ */}
      <section
        style={{
          height: '100vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        {/* 배경 그라데이션 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(196,165,90,0.06) 0%, transparent 60%)',
        }} />

        {/* 위치 뱃지 (왼쪽) — Dennis의 "Located in Netherlands" */}
        <div
          className="hero-badge"
          style={{
            position: 'absolute', left: 'clamp(24px, 4vw, 60px)', top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(196,165,90,0.08)',
            border: '1px solid rgba(196,165,90,0.2)',
            borderRadius: '40px',
            padding: '16px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📍</span>
          <span style={{
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            textAlign: 'center', lineHeight: 1.5,
            fontFamily: 'Oswald, sans-serif',
          }}>
            Seoul<br />Korea<br />Sinchon
          </span>
        </div>

        {/* 서브타이틀 + 화살표 (오른쪽 하단) — Dennis의 "Freelance Designer" 위치 */}
        <div
          style={{
            position: 'absolute',
            right: 'clamp(24px, 4vw, 60px)',
            bottom: 'clamp(100px, 18vh, 180px)',
            textAlign: 'right',
          }}
        >
          <div className="hero-arrow" style={{ marginBottom: '16px', textAlign: 'right' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(196,165,90,0.5)" strokeWidth="1">
              <path d="M7 7l10 10M17 7v10H7" />
            </svg>
          </div>
          <p
            className="hero-subtitle"
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              fontWeight: 300,
              color: '#ffffff',
              lineHeight: 1.5,
              letterSpacing: '0.05em',
            }}
          >
            <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.85em' }}>Meisner Technique</span>
            연기하지 않는 연기
          </p>
        </div>

        {/* 마퀴 (Dennis의 Big Name) — 하단에 거대한 텍스트 */}
        <div
          ref={marqueeRef}
          style={{
            width: '100%',
            overflow: 'hidden',
            paddingBottom: 'clamp(40px, 8vh, 80px)',
          }}
        >
          <div
            ref={marqueeInnerRef}
            style={{
              display: 'flex',
              whiteSpace: 'nowrap',
              willChange: 'transform',
            }}
          >
            {[0, 1].map((copy) => (
              <h1
                key={copy}
                style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: 'clamp(4rem, 15vw, 12rem)',
                  fontWeight: 700,
                  color: '#c4a55a',
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  margin: 0,
                  padding: '0 3vw',
                  flexShrink: 0,
                }}
              >
                {marqueeText}
              </h1>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ STORY ════════ */}
      <section style={{ padding: '120px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="gold-line" style={{
          width: '60px', height: '2px', background: '#c4a55a',
          margin: '0 auto 48px', transformOrigin: 'center',
        }} />

        {[
          { text: '감정을 가두지 마세요.', size: '1.6rem' },
          { text: 'KD4에서는 마이즈너 테크닉을 기반으로', size: '1.6rem', gold: '마이즈너 테크닉' },
          { text: '당신 안의 진짜 감정을 꺼냅니다.', size: '1.6rem' },
          { text: '서울 신촌 · 현직 배우 100여명 참여 · 캐스팅 연계', size: '1rem', dim: true },
        ].map((line, i) => (
          <p
            key={i}
            className="story-line"
            style={{
              fontSize: line.size,
              lineHeight: 1.8,
              color: line.dim ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              marginBottom: '24px',
              fontWeight: 300,
              marginTop: line.dim ? '40px' : undefined,
            }}
          >
            {line.gold
              ? <>KD4에서는 <span style={{ color: '#c4a55a', fontWeight: 600 }}>{line.gold}</span>을 기반으로</>
              : line.text
            }
          </p>
        ))}
      </section>

      {/* ════════ CLASSES ════════ */}
      <section style={{ padding: '80px 24px 120px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{
          fontFamily: 'Oswald, sans-serif', fontSize: '0.8rem',
          color: '#c4a55a', letterSpacing: '0.3em', textTransform: 'uppercase',
          textAlign: 'center', marginBottom: '48px',
        }}>
          Our Classes
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {CLASSES.map((cls, i) => (
            <div
              key={i}
              className="class-card"
              style={{
                background: cls.highlight ? 'linear-gradient(135deg, rgba(196,165,90,0.12), rgba(196,165,90,0.04))' : '#111',
                border: `1px solid ${cls.highlight ? 'rgba(196,165,90,0.3)' : '#222'}`,
                borderRadius: '12px',
                padding: '32px 28px',
                cursor: 'pointer',
                transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.borderColor = '#c4a55a'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(196,165,90,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = cls.highlight ? 'rgba(196,165,90,0.3)' : '#222'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#c4a55a', letterSpacing: '0.2em', fontFamily: 'Oswald, sans-serif' }}>
                {cls.step}
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '12px 0 8px', color: '#fff' }}>
                {cls.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '16px' }}>
                {cls.quote}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: cls.highlight ? '#c4a55a' : '#fff' }}>
                  ₩{cls.price}
                </span>
                {cls.highlight && (
                  <span style={{
                    fontSize: '0.65rem', background: 'rgba(196,165,90,0.15)',
                    color: '#c4a55a', padding: '4px 10px', borderRadius: '20px',
                    border: '1px solid rgba(196,165,90,0.3)',
                  }}>
                    🌸 봄맞이 할인
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ REVIEWS ════════ */}
      <section style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="gold-line" style={{
          width: '60px', height: '2px', background: '#c4a55a',
          margin: '0 auto 48px', transformOrigin: 'center',
        }} />
        <h2 style={{
          fontFamily: 'Oswald, sans-serif', fontSize: '0.8rem',
          color: '#c4a55a', letterSpacing: '0.3em', textTransform: 'uppercase',
          textAlign: 'center', marginBottom: '48px',
        }}>
          동료 배우 이야기
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              className="review-card"
              style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                background: '#111', border: '1px solid #1a1a1a',
                borderRadius: '12px', padding: '24px',
                transition: 'border-color 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,165,90,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a' }}
            >
              <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{r.emoji}</span>
              <div>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                  {r.text} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>— {r.author}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section
        className="cta-section"
        style={{
          minHeight: '70vh',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: '80px 24px', position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(196,165,90,0.06) 0%, transparent 50%)',
        }} />
        <h2
          className="cta-text"
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700, color: '#c4a55a',
            textAlign: 'center', lineHeight: 1.2, marginBottom: '32px',
          }}
        >
          당신의 이야기를<br />시작하세요
        </h2>
        <a
          href="https://forms.gle/68E7yFFFoDiPCRwD9"
          className="cta-btn"
          style={{
            display: 'inline-block', padding: '16px 48px',
            background: 'linear-gradient(135deg, #c4a55a, #d4b870)',
            color: '#0a0a0a', fontWeight: 700, fontSize: '1rem',
            borderRadius: '8px', textDecoration: 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(196,165,90,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          수강신청하기 →
        </a>
      </section>

      <div style={{ height: '80px' }} />
    </div>
  )
}
