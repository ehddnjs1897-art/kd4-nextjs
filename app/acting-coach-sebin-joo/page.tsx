import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CLASSES, SEBIN } from '@/lib/classes'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildPersonSebinDetailed, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/acting-coach-sebin-joo`

const SEBIN_CLASS = CLASSES.find((c) => c.nameKo === '오디션 테크닉 클래스')

export const metadata: Metadata = {
  title: '주세빈 — 오디션 테크닉 클래스 강사 · 현역 배우',
  description:
    'KD4 액팅 스튜디오 오디션 테크닉 클래스 강사 주세빈. 동국대학교 연극영화과 졸업, TV조선 닥터신 주연 등 드라마·연극·CF 다수 출연 중인 현역 배우. 서울 신촌.',
  keywords: ['주세빈', '주세빈 배우', '주세빈 KD4', '오디션 테크닉 강사', '액팅 코치', '신촌 액팅코치', '서울 액팅 코치'],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'profile',
    firstName: '세빈',
    lastName: '주',
    url: PAGE_URL,
    title: '주세빈 — 오디션 테크닉 클래스 강사 · 현역 배우 | KD4',
    description: 'KD4 오디션 테크닉 클래스 강사. TV조선 닥터신 주연 등 드라마·연극·CF 다수 출연 중인 현역 배우.',
    images: [{ url: `${SITE_URL}${SEBIN.photo}`, width: 532, height: 771, alt: '주세빈 KD4 오디션 테크닉 클래스 강사' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '주세빈 — KD4 오디션 테크닉 클래스 강사',
    description: 'TV조선 닥터신 주연 등 드라마·연극·CF 다수 출연 중인 현역 배우.',
    images: [{ url: `${SITE_URL}${SEBIN.photo}`, width: 532, height: 771, alt: '주세빈 KD4 오디션 테크닉 클래스 강사' }],
  },
}

export default function SebinCoachPage() {
  return (
    <div style={{ paddingTop: '64px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '액팅 코치', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ProfilePage',
            idPath: '/acting-coach-sebin-joo#webpage',
            url: PAGE_URL,
            name: '주세빈 — 오디션 테크닉 클래스 강사 · 현역 배우 | KD4 액팅 스튜디오',
            description: 'KD4 오디션 테크닉 클래스 강사이자 현역 배우. TV조선 닥터신 주연 등 드라마·연극·CF 다수 출연 중.',
            mainEntity: { '@id': `${SITE_URL}#sebin` },
            dateModified: '2026-07-21',
            speakableCssSelectors: ['h1', '.section-desc'],
          }),
          buildPersonSebinDetailed(),
        ]}
      />

      {/* ===== HERO — 세로 사진 + 네이비 그라데이션 ===== */}
      <section
        aria-label="주세빈 액팅 코치 소개"
        style={{
          background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 55%, #133f78 100%)',
          padding: 'clamp(48px, 8vw, 80px) 24px clamp(56px, 9vw, 88px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden style={{ position: 'absolute', top: '-120px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.22), transparent 70%)' }} />
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 5vw, 40px)' }}>
            <p className="section-eyebrow" style={{ color: '#F0A8A8', marginBottom: '14px', letterSpacing: '0.22em' }}>
              <span lang="en">AUDITION TECHNIQUE · KD4</span>
            </p>
            <h1
              className="section-title-serif"
              style={{ color: '#fff', fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.3, marginBottom: '16px', wordBreak: 'keep-all' }}
            >
              주세빈 — {SEBIN.title.replace('KD4 ', '')}
            </h1>
            <p style={{ fontSize: 'clamp(0.95rem, 2.4vw, 1.08rem)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, maxWidth: '520px', margin: '0 auto', wordBreak: 'keep-all' }}>
              동국대학교 연극영화과 졸업. TV조선 &ldquo;닥터신&rdquo; 주연 등 드라마·연극·CF에서 활동 중인 현역 배우입니다.
            </p>
          </div>

          {/* 세로 대표 사진 — 원본 비율 그대로 (크롭 없음) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              aspectRatio: '532 / 771',
              margin: '0 auto',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 30px 70px -25px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <Image
              src={SEBIN.photo}
              alt="주세빈 KD4 오디션 테크닉 클래스 강사"
              fill
              sizes="(max-width: 400px) 90vw, 360px"
              style={{ objectFit: 'cover' }}
              priority
            />
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,51,100,0.35), transparent 45%)' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'clamp(24px, 4vw, 36px)' }}>
            <JoinCTALink href="#form" location="coach-sebin-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="coach-sebin-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* ===== PROFILE — 기본 정보 ===== */}
      <section aria-label="기본 프로필" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">01 — PROFILE</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>기본 프로필</h2>
          </div>
          <dl
            style={{
              maxWidth: '640px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px',
            }}
          >
            {[
              { label: 'EDUCATION', value: SEBIN.education.join(' · ') },
              { label: 'BIRTH', value: SEBIN.birth },
              { label: 'HEIGHT / WEIGHT', value: `${SEBIN.height} · ${SEBIN.weight}` },
              { label: 'TALENT', value: SEBIN.talent.join(', ') },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: '8px', padding: '14px 16px' }}>
                <dt style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--navy)', fontWeight: 700, marginBottom: '6px' }}>
                  <span lang="en">{label}</span>
                </dt>
                <dd style={{ fontSize: '0.92rem', color: '#111', lineHeight: 1.6, wordBreak: 'keep-all' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== FILMOGRAPHY ===== */}
      <section aria-label="필모그래피" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">02 — FILMOGRAPHY</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>필모그래피</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {[
              { label: 'DRAMA', items: SEBIN.filmography.drama },
              { label: 'PLAY', items: SEBIN.filmography.play },
              { label: 'CF', items: SEBIN.filmography.cf },
              { label: 'MOVIE', items: SEBIN.filmography.movie },
            ].map(({ label, items }) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.15em', color: 'var(--navy)', fontWeight: 700, marginBottom: '12px' }}>
                  <span lang="en">{label}</span>
                </h3>
                <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map((title) => (
                    <li key={title} style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.6, paddingLeft: '14px', position: 'relative', wordBreak: 'keep-all' }}>
                      <span style={{ position: 'absolute', left: 0, top: '0.6em', width: '6px', height: '1px', background: 'var(--navy)' }} />
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CLASS ===== */}
      {SEBIN_CLASS && (
        <section aria-label="주세빈 강사 직강 클래스" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--navy)', color: '#fff' }}>
          <div className="container">
            <div style={{ maxWidth: '720px', margin: '0 auto 36px', textAlign: 'center' }}>
              <p className="section-eyebrow" style={{ color: '#F0A8A8' }}><span lang="en">03 — CLASS</span></p>
              <h2 className="section-title-serif" style={{ color: '#fff', marginBottom: '12px' }}>주세빈 강사 직강 클래스</h2>
            </div>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', padding: '22px', minHeight: '160px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.14em', color: '#fff', background: 'rgba(255,255,255,0.14)', borderRadius: '4px', padding: '3px 8px', alignSelf: 'flex-start' }}>
                  {SEBIN_CLASS.step}
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', fontWeight: 700, marginTop: '12px', marginBottom: '6px', color: '#fff' }}>{SEBIN_CLASS.nameKo}</p>
                <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '14px', wordBreak: 'keep-all' }}>{SEBIN_CLASS.quote}</p>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>{SEBIN_CLASS.schedule}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>월 ₩{SEBIN_CLASS.originalPrice ?? SEBIN_CLASS.price}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CROSS-LINK ===== */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '28px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container">
          <nav aria-label="관련 페이지 내비게이션" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              전체 클래스 보기
            </Link>
            <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              권동원 액팅 코치
            </Link>
            <Link href="/sinchon-acting-academy" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              신촌 스튜디오 오시는 길
            </Link>
            <Link href="/about" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              KD4 소개
            </Link>
          </nav>
        </div>
      </section>

      {/* ===== FORM ===== */}
      <section id="form" aria-label="무료 상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                주세빈 강사 오디션 테크닉 클래스 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>
    </div>
  )
}
