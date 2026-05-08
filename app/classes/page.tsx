'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CLASSES } from '@/lib/classes'
import { pixel } from '@/lib/meta-pixel'
import { ArrowRight, Sparkles, Flame, Film } from 'lucide-react'

function ClassCard({ cls }: { cls: (typeof CLASSES)[0] }) {
  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1.5px solid var(--navy)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* 잔여석 뱃지 */}
      {cls.remainingSeats != null && (
        <span style={{
          position: 'absolute', top: '12px', right: '12px',
          padding: '6px 14px', background: 'var(--accent-red)', color: '#fff',
          fontSize: '0.85rem', fontWeight: 800, borderRadius: '6px',
          letterSpacing: '0.04em', zIndex: 1,
        }}>
          잔여 {cls.remainingSeats}석
        </span>
      )}

      <div style={{ padding: '28px 24px 20px', flex: 1 }}>
        {/* 뱃지 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', background: 'rgba(21,72,138,0.08)',
            border: '1px solid rgba(21,72,138,0.35)', borderRadius: '2px',
            fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--navy)', fontWeight: 700,
          }}>
            {cls.step}
          </span>
          {cls.isHobby && (
            <span style={{
              padding: '2px 8px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)', borderRadius: '2px',
              fontSize: '0.68rem', color: 'var(--gray)',
            }}>취미반</span>
          )}
        </div>

        {/* 인용구 */}
        <p style={{ color: 'var(--gold)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '12px', fontStyle: 'italic' }}>
          &ldquo;{cls.quote}&rdquo;
        </p>

        {/* 클래스명 */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>
          {cls.nameKo}
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '12px' }}>
          {cls.nameEn}
        </p>

        {cls.subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-light)', marginBottom: '8px' }}>{cls.subtitle}</p>
        )}

        {cls.note && (
          <p style={{
            fontSize: '0.78rem', color: 'var(--gold)', marginBottom: '16px',
            padding: '6px 10px', background: 'rgba(21,72,138,0.08)',
            borderRadius: '2px', borderLeft: '2px solid var(--gold)',
          }}>{cls.note}</p>
        )}

        {/* bullets */}
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {cls.bullets.map((b, i) => (
            <li key={i} style={{ fontSize: '0.82rem', color: 'var(--gray-light)', lineHeight: 1.5, paddingLeft: '14px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: '0.45em', width: '5px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* 메타 */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: '일정', value: cls.schedule },
            { label: '시간', value: cls.duration },
            { label: '정원', value: cls.capacity },
            ...(cls.course ? [{ label: '코스', value: cls.course }] : []),
          ].map(info => (
            <div key={info.label}>
              <span style={{ fontSize: '0.68rem', color: 'var(--gray)', display: 'block' }}>{info.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray-light)' }}>{info.value}</span>
            </div>
          ))}
        </div>

        {/* 가격 */}
        <div>
          <span style={{ fontSize: '0.65rem', color: 'var(--gray)', letterSpacing: '0.06em' }}>월 수강료</span>
          {cls.originalPrice && (
            <p style={{ margin: '4px 0 0', lineHeight: 1 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--gray)', textDecoration: 'line-through' }}>₩{cls.originalPrice}</span>
              <span style={{ marginLeft: '8px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-red)', padding: '2px 6px', background: 'rgba(199,62,62,0.12)', borderRadius: '3px' }}>
                -10만원
              </span>
            </p>
          )}
          <p style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
              fontWeight: 900, color: cls.originalPrice ? 'var(--navy)' : 'var(--white)',
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>₩{cls.price}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray)', marginLeft: '2px' }}>/월</span>
          </p>
          {cls.promoLabel && (
            <p style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginTop: '4px' }}>{cls.promoLabel}</p>
          )}
        </div>

        {/* CTA */}
        <a
          href="/join"
          onClick={() => { pixel.viewContent(cls.nameKo); pixel.contact() }}
          style={{
            display: 'block', textAlign: 'center', padding: '12px 0',
            background: 'var(--gold)', color: '#fff', fontWeight: 700,
            fontSize: '0.88rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
            borderRadius: 'var(--radius)', textDecoration: 'none',
            transition: 'opacity 0.2s', boxShadow: '0 4px 16px rgba(21,72,138,0.25)',
          }}
        >
          무료 상담 신청 →
        </a>
      </div>
    </div>
  )
}

export default function ClassesPage() {
  const [step2Open, setStep2Open] = useState(false)
  const [step3Open, setStep3Open] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)

  return (
    <main style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh' }}>
      {/* 헤더 */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <p className="section-eyebrow">CURRICULUM</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: '16px', lineHeight: 1.15 }}>
            KD4 클래스 전체 보기
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 32px' }}>
            베이직부터 액터스 리더까지 — 가격, 일정, 커리큘럼을 한눈에 확인하세요.
          </p>
          <Link
            href="/join"
            onClick={() => pixel.contact()}
            className="btn-primary"
            style={{ background: 'var(--navy)', color: '#fff', textDecoration: 'none' }}
          >
            무료 상담 신청 <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 자가진단 — 직관적 비주얼 (큰 아이콘 + 레벨 시각화 + 골드 클래스명) ─── */}
      <section
        style={{
          padding: 'clamp(56px, 8vw, 80px) 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container" style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ textAlign: 'center', marginBottom: 14 }}>
            FIND YOUR CLASS
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: 'var(--white)',
              textAlign: 'center',
              lineHeight: 1.35,
              marginBottom: 'clamp(40px, 6vw, 56px)',
            }}
          >
            나는 어떤 클래스를 들어야 할까?
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {[
              {
                Icon: Sparkles,
                level: 1,
                levelLabel: 'BEGINNER',
                question: '취미로\n연기를 하고 싶다',
                target: '베이직 클래스',
                accent: '#7BC97B', // 그린
                accentBg: 'rgba(123, 201, 123, 0.08)',
              },
              {
                Icon: Flame,
                level: 2,
                levelLabel: 'TRAINING',
                question: '제대로 배우 훈련을 받고 싶다\n연기 매너리즘이 왔다',
                target: '마이즈너 테크닉\n정규 클래스',
                accent: '#E89A3C', // 따뜻한 앰버 — 하단 골드 CTA와 톤 분리
                accentBg: 'rgba(232, 154, 60, 0.1)',
              },
              {
                Icon: Film,
                level: 3,
                levelLabel: 'PORTFOLIO',
                question: '캐스팅 되는\n포트폴리오를 만들고 싶다',
                target: '출연영상 클래스',
                accent: '#E55353', // 레드
                accentBg: 'rgba(229, 83, 83, 0.08)',
              },
            ].map(({ Icon, level, levelLabel, question, target, accent, accentBg }) => (
              <a
                key={target}
                href="#class-cards-step1"
                onClick={(e) => {
                  e.preventDefault()
                  const reduceMotion =
                    typeof window !== 'undefined' &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  document
                    .getElementById('class-cards-step1')
                    ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
                }}
                style={{
                  position: 'relative',
                  background: 'var(--bg2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 16,
                  padding: 'clamp(28px, 4vw, 40px) clamp(22px, 3vw, 32px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 12px 32px ${accentBg}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* 상단 강조 바 */}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: accent,
                  }}
                />

                {/* 큰 아이콘 + 레벨 라벨 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    aria-hidden
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: accentBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: accent,
                    }}
                  >
                    <Icon size={32} strokeWidth={1.6} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display), Oswald, sans-serif',
                        fontSize: '0.62rem',
                        letterSpacing: '0.25em',
                        color: accent,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      {levelLabel}
                    </span>
                    {/* 레벨 도트 ●○○ / ●●○ / ●●● */}
                    <div style={{ display: 'flex', gap: 3 }} aria-label={`레벨 ${level}/3`}>
                      {[1, 2, 3].map((i) => (
                        <span
                          key={i}
                          aria-hidden
                          style={{
                            display: 'block',
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: i <= level ? accent : 'var(--border)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 질문 */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
                    fontWeight: 700,
                    color: 'var(--white)',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-line',
                    letterSpacing: '-0.005em',
                    marginTop: 4,
                  }}
                >
                  {question}
                </p>

                {/* 하단 CTA — 클래스명 골드 큼 */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 18,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.7rem',
                      color: 'var(--gray)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    YOUR CLASS
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                        color: 'var(--gold)',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                      }}
                    >
                      {target}
                    </span>
                    <ArrowRight size={18} aria-hidden style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  </div>
                </div>
              </a>
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              color: 'var(--gray)',
              textAlign: 'center',
              marginTop: 28,
            }}
          >
            ↓ 카드를 클릭하면 클래스 상세로 이동합니다
          </p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">

          {/* STEP 1 */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              marginBottom: '32px', gap: '10px', padding: '28px 32px',
              border: '1px solid rgba(21,72,138,0.35)', borderRadius: '12px',
              background: 'rgba(21,72,138,0.04)',
            }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--navy)', fontFamily: 'var(--font-display)', margin: 0 }}>STEP 1</p>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: '#111111', fontFamily: 'var(--font-serif)', margin: 0 }}>A 코스</h2>
              <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: 'var(--navy)', fontWeight: 600, margin: 0 }}>신규 멤버 신청 가능</p>
            </div>
            <div id="class-cards-step1" className="classes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px', scrollMarginTop: 80 }}>
              {CLASSES.filter(c => c.isNewMemberOpen).map((cls, i) => <ClassCard key={i} cls={cls} />)}
            </div>
          </div>

          {/* STEP 2·3·Extra 아코디언 */}
          {[
            { label: 'STEP 2', title: 'B 코스', desc: 'STEP 1 수료 후 참여할 수 있는 클래스입니다.', open: step2Open, setOpen: setStep2Open, filter: 'step2' },
            { label: 'STEP 3', title: 'C 코스', desc: 'STEP 2 수료 후 참여할 수 있는 클래스입니다.', open: step3Open, setOpen: setStep3Open, filter: 'step3' },
            { label: 'EXTRA',  title: '별도 코스', desc: '별도로 운영되는 클래스입니다.', open: extraOpen, setOpen: setExtraOpen, filter: 'extra' },
          ].map(({ label, title, desc, open, setOpen, filter }) => (
            <div key={filter} style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setOpen((o: boolean) => !o)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
                  background: open ? 'rgba(255,255,255,0.03)' : 'none',
                  border: '1px solid var(--border)', borderRadius: '12px',
                  cursor: 'pointer', padding: '24px 32px', marginBottom: open ? '20px' : '0',
                  textAlign: 'center', gap: '8px', transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--navy)', fontFamily: 'var(--font-display)', margin: 0 }}>{label}</p>
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--gray-light)', fontFamily: 'var(--font-serif)', margin: 0 }}>{title}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', margin: 0 }}>{desc}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', display: 'inline-block', marginTop: '4px' }}>▼</span>
              </button>
              {open && (
                <div className="classes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px', opacity: 0.85 }}>
                  {CLASSES.filter(c => c.category === filter).map((cls, i) => <ClassCard key={i} cls={cls} />)}
                </div>
              )}
            </div>
          ))}

          {/* 하단 CTA */}
          <div style={{
            marginTop: '64px', padding: '48px 32px',
            background: 'linear-gradient(135deg, rgba(21,72,138,0.06) 0%, rgba(0,0,0,0) 100%)',
            border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center',
          }}>
            <p className="section-eyebrow">START NOW</p>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: '12px' }}>
              어떤 클래스가 맞는지 모르겠다면?
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '28px', lineHeight: 1.7 }}>
              무료 상담을 통해 나에게 맞는 클래스를 안내받으세요.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/join"
                onClick={() => pixel.contact()}
                className="btn-primary"
                style={{ background: 'var(--navy)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 20px rgba(21,72,138,0.3)' }}
              >
                무료 상담 신청 →
              </Link>
              <a
                href="https://pf.kakao.com/_ximxdqn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => pixel.contact()}
                style={{
                  display: 'inline-block', padding: '14px 32px',
                  border: '1px solid rgba(17,17,17,0.35)', color: '#111111',
                  fontWeight: 600, fontSize: '0.9rem', borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                }}
              >
                카카오 상담
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
