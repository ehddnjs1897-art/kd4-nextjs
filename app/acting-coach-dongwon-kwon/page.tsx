import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { COACH_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildPersonDongwonDetailed, buildOrganization } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/acting-coach-dongwon-kwon`

// 권동원 직강 클래스 (오디션 테크닉·움직임·베이직 제외 — 전부 대표 직강)
const COACH_CLASS_NAMES = [
  '마이즈너 테크닉 정규 클래스',
  '출연영상 클래스',
  '출연영상 심화 클래스',
  '출연영상 1달 완성 클래스',
  '액터스 리더 클래스',
  '개인 레슨',
]
const COACH_CLASSES = COACH_CLASS_NAMES
  .map((n) => CLASSES.find((c) => c.nameKo === n))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))

const CLASS_LINK: Record<string, string> = {
  '마이즈너 테크닉 정규 클래스': '/meisner-technique-class',
  '출연영상 클래스': '/reel-production-class',
}

// SEO 랜딩은 정가(첫달 할인 전) 표시
const priceOf = (c: { price: string; originalPrice?: string }) => c.originalPrice ?? c.price

// profileFlat 항목 내 영어 고유명사에 lang="en" 추가 (WCAG 3.1.2)
const EN_PROFILE_TOKENS = ['LA Meisner Workshop', 'YouTube', 'The Chora'] as const
function wrapEnglishToken(text: string): React.ReactNode {
  for (const token of EN_PROFILE_TOKENS) {
    const idx = text.indexOf(token)
    if (idx !== -1) {
      return <>{text.slice(0, idx)}<span lang="en">{token}</span>{text.slice(idx + token.length)}</>
    }
  }
  return text
}

export const metadata: Metadata = {
  title: '권동원 — 액팅 코치 (리더) · 현역 배우',
  description:
    'KD4 액팅 스튜디오 대표 권동원. 마이즈너 테크닉 액팅 코치(리더), 현역 배우. Disney+ 무빙2·Netflix 중증외상센터 출연. LA Meisner Workshop 수료, 프로 배우 400명+ 코칭. 서울 신촌.',
  keywords: ['권동원', '권동원 배우', '권동원 KD4', '마이즈너 강사', '액팅 코치', '액팅 리더', '현역 배우 강사'],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'profile',
    firstName: '동원',
    lastName: '권',
    url: PAGE_URL,
    title: '권동원 — 액팅 코치 (리더) · 현역 배우 | KD4 대표',
    description: 'KD4 액팅 스튜디오 대표. 마이즈너 테크닉 정통 코치(리더)이자 현역 배우.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: '권동원 KD4 액팅 코치' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '권동원 — KD4 대표 · 액팅 코치 (리더)',
    description: 'Disney+ 무빙2 · Netflix 중증외상센터 출연 중인 현역 배우.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: '권동원 KD4 액팅 코치' }],
  },
}

export default function CoachPage() {
  return (
    <div style={{ paddingTop: '64px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '액팅 코치', url: PAGE_URL },
          ]),
          buildPersonDongwonDetailed(),
          buildOrganization(),
          buildFaqPage(COACH_FAQ),
        ]}
      />

      {/* ===== HERO — 가로 사진 크게 + 네이비 그라데이션 ===== */}
      <section
        aria-label="권동원 액팅 코치 소개"
        style={{
          background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 55%, #133f78 100%)',
          padding: 'clamp(48px, 8vw, 80px) 24px clamp(56px, 9vw, 88px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 데코 글로우 */}
        <div aria-hidden style={{ position: 'absolute', top: '-120px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.22), transparent 70%)' }} />
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 5vw, 44px)' }}>
            <p className="section-eyebrow" style={{ color: '#F0A8A8', marginBottom: '14px', letterSpacing: '0.22em' }}>
              <span lang="en">THE LEADER · KD4</span>
            </p>
            <h1
              className="section-title-serif"
              style={{ color: '#fff', fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.3, marginBottom: '16px', wordBreak: 'keep-all' }}
            >
              권동원 — 액팅 코치 <span style={{ color: '#F0A8A8' }}>(리더)</span>
            </h1>
            <p style={{ fontSize: 'clamp(0.95rem, 2.4vw, 1.08rem)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, maxWidth: '600px', margin: '0 auto', wordBreak: 'keep-all' }}>
              {DIRECTOR.title}. <span lang="en">Disney+</span> 무빙2, <span lang="en">Netflix</span> 중증외상센터 출연 중. <span lang="en">LA Meisner Workshop</span> 수료.
            </p>
          </div>

          {/* 가로 대표 사진 — 크게 */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '3 / 2',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 30px 70px -25px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <Image
              src={DIRECTOR.photo}
              alt="권동원 KD4 액팅 코치 (리더)"
              fill
              sizes="(max-width: 1000px) 100vw, 960px"
              style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
              priority
            />
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,51,100,0.45), transparent 45%)' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'clamp(24px, 4vw, 36px)' }}>
            <JoinCTALink href="#form" location="coach-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="coach-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section aria-label="가르치는 철학" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="section-eyebrow"><span lang="en">01 — PHILOSOPHY</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>가르치는 철학</h2>
            <div aria-hidden style={{ width: '48px', height: '3px', background: 'var(--accent-red)', borderRadius: '2px', margin: '0 auto' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--navy)', fontSize: '1.12rem', lineHeight: 1.75, marginBottom: '24px', textAlign: 'center', wordBreak: 'keep-all' }}>
            &ldquo;{DIRECTOR.quote}&rdquo;
          </p>
          <p style={{ fontSize: '0.96rem', color: 'var(--gray-light)', lineHeight: 1.85, wordBreak: 'keep-all' }}>
            마이즈너 테크닉은 한국에 아직 깊이 알려지지 않은 미국 정통 액팅 메소드입니다. <span lang="en">LA Meisner Workshop</span>과 한국 마이즈너 테크닉 아카데미를 모두 수료하고, 한국 배우에게 맞게 재해석한 커리큘럼으로 가르칩니다. 현역 배우로 매년 작품에 출연하기에, 책 속 이론이 아니라 지금 촬영장에서 통하는 감각을 매주 수업에 담습니다.
          </p>
        </div>
      </section>

      {/* ===== PROFILE LIST ===== */}
      <section aria-label="주요 경력" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">02 — PROFILE</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>주요 경력</h2>
          </div>
          <ul style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DIRECTOR.profileFlat.map((line, i) => (
              <li key={i} style={{ padding: '14px 16px 14px 44px', background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: '8px', fontSize: '0.94rem', color: '#111', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--navy)', fontWeight: 700 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {wrapEnglishToken(line)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== FILMOGRAPHY + CREDENTIALS ===== */}
      <section aria-label="필모그래피와 자격" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">03 — FILMOGRAPHY &amp; CREDENTIALS</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>필모그래피와 자격</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {[
              { label: 'DRAMA', items: DIRECTOR.filmography.drama },
              { label: 'FILM', items: DIRECTOR.filmography.film },
              { label: 'CF', items: DIRECTOR.filmography.cf },
              { label: 'AWARDS', items: DIRECTOR.credentials.awards },
              { label: 'EDUCATION', items: DIRECTOR.credentials.education },
            ].map(({ label, items }) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.15em', color: 'var(--navy)', fontWeight: 700, marginBottom: '12px' }}>
                  <span lang="en">{label}</span>
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map((title) => (
                    <li key={title} style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.6, paddingLeft: '14px', position: 'relative' }}>
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

      {/* ===== DIRECT CLASSES — 권동원 직강 클래스 전체 ===== */}
      <section aria-label="권동원 리더 직강 클래스" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--navy)', color: '#fff' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 36px', textAlign: 'center' }}>
            <p className="section-eyebrow" style={{ color: '#F0A8A8' }}><span lang="en">04 — CLASSES</span></p>
            <h2 className="section-title-serif" style={{ color: '#fff', marginBottom: '12px' }}>권동원 리더 직강 클래스</h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
              오디션 테크닉·움직임 클래스를 제외한 모든 정규 트랙을 권동원 리더가 직접 지도합니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', maxWidth: '1040px', margin: '0 auto' }}>
            {COACH_CLASSES.map((c) => {
              const href = CLASS_LINK[c.nameKo]
              const inner = (
                <>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.14em', color: '#fff', background: 'rgba(255,255,255,0.14)', borderRadius: '4px', padding: '3px 8px', alignSelf: 'flex-start' }}>
                    {c.step}
                  </span>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', fontWeight: 700, marginTop: '12px', marginBottom: '6px', color: '#fff' }}>{c.nameKo}</p>
                  <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '14px', wordBreak: 'keep-all' }}>{c.quote}</p>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>{c.course ?? c.schedule}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>월 ₩{priceOf(c)}</span>
                  </div>
                  {href && (
                    <span style={{ fontSize: '0.82rem', color: '#F0A8A8', fontWeight: 600, marginTop: '12px' }}>상세 보기 <span aria-hidden="true">→</span></span>
                  )}
                </>
              )
              const cardStyle: React.CSSProperties = {
                display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', padding: '22px', textDecoration: 'none', minHeight: '180px',
              }
              return href ? (
                <Link key={c.nameKo} href={href} style={cardStyle}>{inner}</Link>
              ) : (
                <div key={c.nameKo} style={cardStyle}>{inner}</div>
              )
            })}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginTop: '20px' }}>
            * 표기 금액은 정가(월 수강료) 기준입니다.
          </p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">FAQ</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={COACH_FAQ} />
        </div>
      </section>

      {/* ===== FORM ===== */}
      <section id="form" aria-label="무료 상담 신청" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                권동원 리더 직강 상담
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
