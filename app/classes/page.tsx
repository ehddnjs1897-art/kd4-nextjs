'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { CLASSES, PROMO_DEADLINE } from '@/lib/classes'

import { analytics } from '@/lib/analytics'

/** 신규 SEO 상세 페이지 매핑 — 마이즈너/출연영상 카드 하단에 상세 페이지 링크 노출 */
const CLASS_DETAIL_HREF: Record<string, string> = {
  '베이직 클래스': '/basic-acting-class',
  '마이즈너 테크닉 정규 클래스': '/meisner-technique-class',
  '출연영상 클래스': '/reel-production-class',
  '오디션 테크닉 클래스': '/audition-technique-class',
  '출연영상 심화 클래스': '/advanced-reel-class',
  '출연영상 1달 완성 클래스': '/one-month-reel-class',
}

/** 하단 "자주 묻는 결정" 직답용 — 가격·코스는 lib/classes.ts 실값만 인용 (하드코딩 금지) */
const findClass = (nameKo: string) => CLASSES.find((c) => c.nameKo === nameKo)
const BASIC_C = findClass('베이직 클래스')
const MEISNER_C = findClass('마이즈너 테크닉 정규 클래스')
const REEL_C = findClass('출연영상 클래스')
const AUDITION_C = findClass('오디션 테크닉 클래스')
const MOVEMENT_C = findClass('움직임 클래스')
const PERSONAL_C = findClass('개인 레슨')

function ClassCard({ cls }: { cls: (typeof CLASSES)[0] }) {
  // useEffect로 client-only 계산 — SSR/hydration mismatch 방지 (PROMO_DEADLINE 경계 순간)
  // SSR에서는 false(프로모 활성)로 렌더, 클라이언트 mount 시 실제 시각 반영
  const [isPromoExpired, setIsPromoExpired] = useState(false)
  useEffect(() => {
    setIsPromoExpired(Date.now() > new Date(PROMO_DEADLINE).getTime())
  }, [])
  const detailHref = CLASS_DETAIL_HREF[cls.nameKo]
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
      {/* HOT 뱃지 — 인기 클래스 */}
      {cls.hot && (
        <span style={{
          position: 'absolute', top: '12px', right: '12px',
          padding: '6px 14px', background: 'var(--accent-red)', color: '#fff',
          fontSize: '0.85rem', fontWeight: 800, borderRadius: '6px',
          letterSpacing: '0.06em', zIndex: 1,
        }}>
          🔥 HOT
        </span>
      )}

      {/* 수업 사진 — 16:9, 컬러 + 얼굴 블러 (2026-11-19 대표) */}
      {cls.photo && (
        <Image
          src={cls.photo}
          alt={cls.photoAlt ?? `${cls.nameKo} 수업 장면`}
          width={1280}
          height={720}
          sizes="(max-width: 700px) 100vw, 420px"
          style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', borderBottom: '1px solid var(--border)' }}
        />
      )}

      <div style={{ padding: '28px 24px 20px', flex: 1 }}>
        {/* 뱃지 — 2026-11-19 대표 «중복되거나 지저분한 거 지우기»: 카드마다 반복되던 STEP 딱지 삭제
            (묶음 제목이 이미 STEP 1·2·3을 말함). 취미반 딱지만 남김 */}
        {cls.isHobby && (
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              padding: '2px 8px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)', borderRadius: '2px',
              fontSize: '0.75rem', color: 'var(--gray)',
            }}>취미반</span>
          </div>
        )}

        {/* 인용구 */}
        <p style={{ color: 'var(--gold)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '12px', fontStyle: 'italic' }}>
          &ldquo;{cls.quote}&rdquo;
        </p>

        {/* 클래스명 — 2026-11-19: 영문 이름 줄·한 줄 부제 삭제 (한글 이름·인용구·수업 내용과 같은 말) */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', marginBottom: '12px' }}>
          {cls.nameKo}
        </h3>

        {cls.note && (
          <p style={{
            fontSize: '0.78rem', color: 'var(--gold)', marginBottom: '16px',
            padding: '6px 10px', background: 'rgba(21,72,138,0.08)',
            borderRadius: '2px', borderLeft: '2px solid var(--gold)',
          }}>{cls.note}</p>
        )}

        {/* bullets */}
        <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {cls.bullets.map((b, i) => (
            <li key={b} style={{ fontSize: '0.82rem', color: 'var(--gray-light)', lineHeight: 1.5, paddingLeft: '14px', position: 'relative' }}>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--gray)', display: 'block' }}>{info.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray-light)' }}>{info.value}</span>
            </div>
          ))}
        </div>

        {/* 가격 */}
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray)', letterSpacing: '0.06em' }}>월 수강료</span>
          {cls.originalPrice && (
            <p style={{ margin: '4px 0 0', lineHeight: 1 }}>
              <span className="sr-only">(이전 가격)</span><span style={{ fontSize: '0.78rem', color: 'var(--gray)', textDecoration: 'line-through' }}>₩{cls.originalPrice}</span>
              {(() => {
                const diff = parseInt(cls.originalPrice.replace(/,/g, ''), 10) - parseInt(cls.price.replace(/,/g, ''), 10)
                const label = diff >= 10000 ? `-${Math.round(diff / 10000)}만원` : `-${diff.toLocaleString()}원`
                return (
                  <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-red)', padding: '2px 6px', background: 'rgba(199,62,62,0.12)', borderRadius: '3px' }}>
                    {label}
                  </span>
                )
              })()}
            </p>
          )}
          <p style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
              fontWeight: 900, color: cls.originalPrice ? 'var(--navy)' : 'var(--white)',
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>₩{cls.price}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray)', marginLeft: '2px' }}>/월</span>
          </p>
          {cls.promoLabel && !isPromoExpired && (
            <p style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginTop: '4px' }}>{cls.promoLabel}</p>
          )}
          {/* 2027 수강료 조정 예고 — lib/classes.ts priceChangeNote, 1/1 지나면 자동으로 사라짐 */}
          {cls.priceChangeNote && (
            <p style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginTop: '4px', lineHeight: 1.5, wordBreak: 'keep-all' }}>{cls.priceChangeNote}</p>
          )}
        </div>

        {/* CTA */}
        <a
          href="/join"
          aria-label={`${cls.nameKo} 무료 상담 신청`}
          onClick={() => { analytics.viewContent(cls.nameKo); analytics.ctaClick('class_card', cls.nameKo) }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px 0', minHeight: 44,
            background: 'var(--gold)', color: '#fff', fontWeight: 700,
            fontSize: '0.88rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
            borderRadius: 'var(--radius)', textDecoration: 'none',
            transition: 'opacity 0.2s', boxShadow: '0 4px 16px rgba(21,72,138,0.25)',
          }}
        >
          무료 상담 신청
        </a>

        {detailHref && (
          <Link
            href={detailHref}
            aria-label={`${cls.nameKo} 자세히 보기`}
            onClick={() => analytics.ctaClick('class_card_detail', cls.nameKo)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 0', minHeight: 44,
              marginTop: 8, border: '1.5px solid var(--navy)', borderRadius: 'var(--radius)',
              fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
              color: 'var(--navy)', textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(21,72,138,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            자세히 보기
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ClassesPage() {
  const [step2Open, setStep2Open] = useState(false)
  const [step3Open, setStep3Open] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)

  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh' }}>
      {/* 헤더 */}
      <section aria-label="클래스 전체 목록 헤더" style={{ padding: '80px 24px 60px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <p className="section-eyebrow"><span lang="en">CURRICULUM</span></p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: '16px', lineHeight: 1.15 }}>
            KD4 클래스 전체 보기
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 32px' }}>
            베이직부터 액터스 리더까지 — 가격, 일정, 커리큘럼을 한눈에 확인하세요.
          </p>
          <Link
            href="/join"
            onClick={() => analytics.ctaClick('classes_mid_cta', '무료 상담 신청')}
            className="btn-primary"
            style={{ background: 'var(--navy)', color: '#fff', textDecoration: 'none' }}
          >
            무료 상담 신청
          </Link>
        </div>
      </section>

      {/* 「나는 어떤 클래스를 들어야 할까?」 3칸 — 2026-11-19 대표 지시로 삭제 (바로 아래 클래스 카드와 같은 세 클래스가 한 번 더 나옴) */}

      <section className="section" aria-label="클래스 상세 목록" style={{ background: 'var(--bg)' }}>
        <div className="container">

          {/* STEP 1 */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              marginBottom: '32px', gap: '10px', padding: 'clamp(20px, 5vw, 28px) clamp(20px, 5vw, 32px)',
              border: '1px solid rgba(21,72,138,0.35)', borderRadius: '12px',
              background: 'rgba(21,72,138,0.04)',
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--navy)', fontFamily: 'var(--font-display)', margin: 0 }}><span lang="en">STEP 1</span></p>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: '#111111', fontFamily: 'var(--font-serif)', margin: 0 }}>신규 멤버 클래스</h2>
              <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: 'var(--navy)', fontWeight: 600, margin: 0 }}>지금 바로 신청할 수 있어요</p>
            </div>
            <div id="class-cards-step1" className="classes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px', scrollMarginTop: 80 }}>
              {CLASSES.filter(c => c.isNewMemberOpen).map((cls) => <ClassCard key={cls.nameEn} cls={cls} />)}
            </div>
          </div>

          {/* STEP 2·3·Extra 아코디언 */}
          {[
            { label: 'STEP 2', title: '', desc: 'STEP 1 수료 후 참여할 수 있는 클래스입니다.', open: step2Open, setOpen: setStep2Open, filter: 'step2' },
            { label: 'STEP 3', title: '', desc: 'STEP 2 수료 후 참여할 수 있는 클래스입니다.', open: step3Open, setOpen: setStep3Open, filter: 'step3' },
            { label: 'EXTRA',  title: '별도 코스', desc: '별도로 운영되는 클래스입니다.', open: extraOpen, setOpen: setExtraOpen, filter: 'extra' },
          ].map(({ label, title, desc, open, setOpen, filter }) => (
            <div key={filter} style={{ marginBottom: '16px' }}>
              <button
                type="button"
                id={`btn-${filter}`}
                aria-expanded={open}
                aria-controls={`step-${filter}-panel`}
                onClick={() => setOpen((o: boolean) => !o)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
                  background: open ? 'rgba(255,255,255,0.03)' : 'none',
                  border: '1px solid var(--border)', borderRadius: '12px',
                  cursor: 'pointer', padding: '24px 32px', marginBottom: open ? '20px' : '0',
                  textAlign: 'center', gap: '8px', transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', color: 'var(--navy)', fontFamily: 'var(--font-display)', margin: 0 }}><span lang="en">{label}</span></p>
                {title && (
                  <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--gray-light)', fontFamily: 'var(--font-serif)', margin: 0 }}>{title}</span>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', margin: 0 }}>{desc}</p>
                <span aria-hidden="true" style={{ fontSize: '0.85rem', color: 'var(--gray)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', display: 'inline-block', marginTop: '4px' }}>▼</span>
              </button>
              {/* 패널은 DOM에 항상 유지 — display:none으로 가시성 제어 (ARIA accordion 패턴) */}
              <div id={`step-${filter}-panel`} aria-labelledby={`btn-${filter}`} className="classes-grid" style={{ display: open ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px', opacity: 0.85, marginTop: open ? '20px' : 0 }}>
                {CLASSES.filter(c => c.category === filter).map((cls) => <ClassCard key={cls.nameEn} cls={cls} />)}
              </div>
            </div>
          ))}

          {/* HOW IT WORKS «수업 후 캐스팅까지» 3단계 블록은 뺐다 (2026-11-19 대표 «추천대로해» — 질문 구역은 검색용으로 남김) */}
          {/* 자주 묻는 결정 3가지 — 직답 섹션 */}
          <div style={{
            marginTop: '64px', marginBottom: '40px',
            padding: 'clamp(28px, 6vw, 40px) clamp(20px, 5vw, 32px)',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <p className="section-eyebrow" style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span lang="en">DECIDE</span>
            </p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 700, color: 'var(--navy)', marginBottom: '32px' }}>
              자주 묻는 결정 3가지
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '24px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111111', margin: 0 }}>처음이면 뭐부터?</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
                  <li><strong style={{ color: '#111111', fontWeight: 600 }}>취미로 가볍게</strong> — 베이직 클래스. 정원 {BASIC_C?.capacity ?? ''}·{BASIC_C?.schedule ?? ''}·회당 {BASIC_C?.duration ?? ''}, 경험이 없어도 됩니다.</li>
                  <li><strong style={{ color: '#111111', fontWeight: 600 }}>진지하게 배우고 싶다면</strong> — 마이즈너 테크닉 정규 클래스부터.</li>
                  <li><strong style={{ color: '#111111', fontWeight: 600 }}>먼저 겪어보고 싶다면</strong> — 무료 상담에서 체험 수업 가능 여부를 확인하세요.</li>
                </ul>
                <Link href="/basic-acting-class" style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                  베이직 클래스 자세히 보기
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111111', margin: 0 }}>수강료는?</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6 }}>
                  <li>클래스별 월 수강료입니다.</li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>베이직 클래스</span><strong style={{ color: '#111111', fontWeight: 600 }}>{BASIC_C?.price ?? ''}원</strong></li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>마이즈너 테크닉 정규 클래스 ({MEISNER_C?.course ?? ''})</span><strong style={{ color: '#111111', fontWeight: 600 }}>{MEISNER_C?.price ?? ''}원</strong></li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>출연영상 클래스 ({REEL_C?.course ?? ''})</span><strong style={{ color: '#111111', fontWeight: 600 }}>{REEL_C?.price ?? ''}원</strong></li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>오디션 테크닉 클래스</span><strong style={{ color: '#111111', fontWeight: 600 }}>{AUDITION_C?.price ?? ''}원</strong></li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>움직임 클래스</span><strong style={{ color: '#111111', fontWeight: 600 }}>{MOVEMENT_C?.price ?? ''}원</strong></li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><span>개인 레슨</span><strong style={{ color: '#111111', fontWeight: 600 }}>{PERSONAL_C?.price ?? ''}원</strong></li>
                  <li>마이즈너 정규·출연영상 클래스는 일시납 시 10만원 추가 할인.</li>
                </ul>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111111', margin: 0 }}>환불·중도 변경은?</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray)', lineHeight: 1.6, margin: 0 }}>
                  클래스별 수강 동의서와 상담 안내를 따릅니다.
                </p>
                <Link href="/faq" style={{ fontSize: '0.85rem', color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                  자주 묻는 질문 전체 보기
                </Link>
              </div>
            </div>
          </div>

          {/* 하단 CTA */}
          <div style={{
            marginTop: '0', padding: 'clamp(32px, 7vw, 48px) clamp(20px, 5vw, 32px)',
            background: 'linear-gradient(135deg, rgba(21,72,138,0.06) 0%, rgba(0,0,0,0) 100%)',
            border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center',
          }}>
            <p className="section-eyebrow"><span lang="en">START NOW</span></p>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: '12px' }}>
              어떤 클래스가 맞는지 모르겠다면?
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '28px', lineHeight: 1.7 }}>
              무료 상담을 통해 나에게 맞는 클래스를 안내받으세요.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/join"
                onClick={() => analytics.ctaClick('classes_final_cta', '무료 상담 신청')}
                className="btn-primary"
                style={{ background: 'var(--navy)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 20px rgba(21,72,138,0.3)' }}
              >
                무료 상담 신청
              </Link>
              <a
                href="https://pf.kakao.com/_ximxdqn"
                target="_blank" rel="noopener noreferrer"
                aria-label="카카오 채널 상담 (새 탭에서 열림)"
                onClick={() => analytics.contact('kakao')}
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

      {/* 내부 교차 링크 */}
      <nav aria-label="관련 페이지" style={{ padding: '24px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/meisner-technique-class" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            마이즈너 테크닉 클래스
          </Link>
          <Link href="/reel-production-class" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            출연영상 클래스
          </Link>
          <Link href="/audition-technique-class" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            오디션 테크닉 클래스
          </Link>
          <Link href="/acting-coaches" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            권동원 액팅 코치
          </Link>
          <Link href="/acting-coaches#sebin" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            주세빈 액팅 코치
          </Link>
          <Link href="/about" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            KD4 소개
          </Link>
          <Link href="/benefits" style={{ fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            멤버 혜택
          </Link>
        </div>
      </nav>
    </div>
  )
}
