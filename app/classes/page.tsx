'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CLASSES } from '@/lib/classes'
import { pixel } from '@/lib/meta-pixel'
import { ArrowRight } from 'lucide-react'

/**
 * 상담 CTA — 어떤 페이지에서든 메인 #contact 섹션으로 이동
 * /classes 는 독립 페이지라 앵커 스크롤 불가 → 항상 router.push('/#contact')
 */
function useContactNav() {
  const router = useRouter()
  return (e: React.MouseEvent) => {
    e.preventDefault()
    pixel.contact()
    router.push('/#contact')
  }
}

function ClassCard({ cls }: { cls: (typeof CLASSES)[0] }) {
  const handleContact = useContactNav()
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
          href="/#contact"
          onClick={(e) => {
            pixel.viewContent(cls.nameKo)
            handleContact(e)
          }}
          style={{
            display: 'block', textAlign: 'center', padding: '12px 0',
            background: 'var(--gold)', color: '#fff', fontWeight: 700,
            fontSize: '0.88rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
            borderRadius: 'var(--radius)', textDecoration: 'none',
            transition: 'opacity 0.2s', boxShadow: '0 4px 16px rgba(21,72,138,0.25)',
          }}
        >
          상담 신청 →
        </a>
      </div>
    </div>
  )
}

export default function ClassesPage() {
  const [step2Open, setStep2Open] = useState(false)
  const [step3Open, setStep3Open] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)
  const handleContact = useContactNav()

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
          <a
            href="/#contact"
            onClick={handleContact}
            className="btn-primary"
            style={{ background: 'var(--navy)', color: '#fff', textDecoration: 'none' }}
          >
            무료 상담 신청 <ArrowRight size={14} />
          </a>
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
            <div className="classes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
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
              <a
                href="/#contact"
                onClick={handleContact}
                className="btn-primary"
                style={{ background: 'var(--navy)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 20px rgba(21,72,138,0.3)' }}
              >
                무료 상담 신청 →
              </a>
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
