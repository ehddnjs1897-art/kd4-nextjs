import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { COACH_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildPersonDongwonDetailed } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/acting-coach-dongwon-kwon`

const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!

export const metadata: Metadata = {
  title: '권동원 — 마이즈너 액팅 코치 · 현역 배우 | KD4 대표',
  description:
    'KD4 액팅 스튜디오 대표 권동원. 마이즈너 테크닉 액팅 코치, 현역 배우. Disney+ 무빙2·Netflix 중증외상센터 등 출연. K-웹드라마 어워드 연기상 수상.',
  keywords: [
    '권동원',
    '권동원 배우',
    '권동원 KD4',
    '마이즈너 강사',
    '액팅 코치',
    '현역 배우 강사',
    '연기 선생님 서울',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'profile',
    url: PAGE_URL,
    title: '권동원 — 마이즈너 액팅 코치 · 현역 배우 | KD4 대표',
    description: 'KD4 액팅 스튜디오 대표. 마이즈너 테크닉 정통 코치이자 현역 배우.',
    images: ['/director.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '권동원 — KD4 대표 · 마이즈너 액팅 코치',
    description: 'Disney+ 무빙2 · Netflix 중증외상센터 출연 중인 현역 배우.',
    images: ['/director.jpg'],
  },
}

export default function CoachPage() {
  return (
    <main style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '강사', url: PAGE_URL },
          ]),
          buildPersonDongwonDetailed(),
          buildFaqPage(COACH_FAQ),
        ]}
      />

      {/* HERO */}
      <section style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '40px',
            alignItems: 'center',
            maxWidth: '960px',
            margin: '0 auto',
          }}
          data-hero-grid
        >
          <div
            style={{
              position: 'relative',
              width: '260px',
              height: '340px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            data-hero-photo
          >
            <Image
              src={DIRECTOR.photo}
              alt={`${DIRECTOR.name} 대표 사진`}
              fill
              sizes="(max-width: 720px) 80vw, 260px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          <div style={{ color: '#fff' }}>
            <p
              className="section-eyebrow"
              style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}
            >
              THE LEADER
            </p>
            <h1
              className="section-title-serif"
              style={{
                color: '#fff',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                lineHeight: 1.35,
                marginBottom: '14px',
                wordBreak: 'keep-all',
              }}
            >
              {DIRECTOR.name} — 마이즈너 액팅 코치
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                marginBottom: '22px',
                wordBreak: 'keep-all',
              }}
            >
              {DIRECTOR.title}. Disney+ 무빙2, Netflix 중증외상센터 출연 중. LA Meisner Workshop 수료,
              프로 배우 400명 이상 지도.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <JoinCTALink
                href="#form"
                location="coach-hero"
                label="무료 상담 신청"
                className="btn-primary"
                style={{ background: '#fff', color: 'var(--navy)' }}
              >
                무료 상담 신청
              </JoinCTALink>
              <JoinCTALink
                href="https://pf.kakao.com/_ximxdqn"
                kind="external"
                channel="kakao"
                location="coach-hero"
                label="카카오 채널 문의"
                className="btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}
              >
                카카오 채널 문의
              </JoinCTALink>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="section-eyebrow">01 — TEACHING PHILOSOPHY</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              가르치는 철학
            </h2>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--navy)',
              fontSize: '1.1rem',
              lineHeight: 1.75,
              marginBottom: '28px',
              textAlign: 'center',
              wordBreak: 'keep-all',
            }}
          >
            &ldquo;{DIRECTOR.quote}&rdquo;
          </p>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--gray-light)',
              lineHeight: 1.85,
              wordBreak: 'keep-all',
            }}
          >
            마이즈너 테크닉은 한국에서 아직 깊이 있게 가르쳐지지 않은 미국 정통 액팅 메소드입니다. 권동원
            대표는 미국 LA Meisner Workshop을 직접 수료하고 한국 마이즈너테크닉 아카데미에서도 정통
            과정을 밟은 후, 한국 배우들에게 맞춰 재해석된 커리큘럼을 운영하고 있습니다.
          </p>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--gray-light)',
              lineHeight: 1.85,
              marginTop: '14px',
              wordBreak: 'keep-all',
            }}
          >
            현역 배우로서 매년 작품에 출연하면서 가르치는 것이 KD4의 핵심 차별점입니다. 이론만 익힌
            강사가 아니라 지금 촬영장에서 통하는 연기·캐스팅 흐름·디렉터의 시선을 매주 수업에
            가져옵니다. 멤버는 책에서 배우는 연기가 아니라 현장에서 살아남는 연기를 배웁니다.
          </p>
        </div>
      </section>

      {/* PROFILE */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — PROFILE</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              주요 경력
            </h2>
          </div>
          <ul
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {DIRECTOR.profileFlat.map((line, i) => (
              <li
                key={i}
                style={{
                  padding: '14px 20px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '0.92rem',
                  color: '#111',
                  position: 'relative',
                  paddingLeft: '40px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.78rem',
                    color: 'var(--navy)',
                    fontWeight: 700,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FILMOGRAPHY */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — FILMOGRAPHY</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              필모그래피
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {[
              { label: 'DRAMA', items: DIRECTOR.filmography.drama },
              { label: 'FILM', items: DIRECTOR.filmography.film },
              { label: 'CF', items: DIRECTOR.filmography.cf },
            ].map(({ label, items }) => (
              <div
                key={label}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px 22px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.15em',
                    color: 'var(--navy)',
                    fontWeight: 700,
                    marginBottom: '16px',
                  }}
                >
                  {label}
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((title) => (
                    <li
                      key={title}
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--gray-light)',
                        lineHeight: 1.6,
                        paddingLeft: '14px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '0.6em',
                          width: '6px',
                          height: '1px',
                          background: 'var(--navy)',
                        }}
                      />
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AWARDS & EDUCATION */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              maxWidth: '880px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '28px 26px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.15em',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                AWARDS
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DIRECTOR.credentials.awards.map((a) => (
                  <li
                    key={a}
                    style={{
                      fontSize: '0.92rem',
                      color: '#111',
                      lineHeight: 1.6,
                      fontWeight: 600,
                    }}
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '28px 26px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.15em',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                EDUCATION
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DIRECTOR.credentials.education.map((e) => (
                  <li
                    key={e}
                    style={{ fontSize: '0.92rem', color: '#111', lineHeight: 1.6, fontWeight: 600 }}
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHICH CLASS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <p className="section-eyebrow">04 — CLASS</p>
          <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
            권동원 대표 직강 클래스
          </h2>
          <p className="section-desc" style={{ marginBottom: '24px' }}>
            마이즈너 테크닉 정규 클래스를 권동원 대표가 직접 지도합니다.
          </p>
          <div
            style={{
              background: 'var(--bg2)',
              border: '1.5px solid var(--navy)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              {MAIN_CLASS.nameKo}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', marginBottom: '14px' }}>
              4개월 코스 · 정원 8명 · 회당 4시간 · 월 ₩{MAIN_CLASS.price}
            </p>
            <Link
              href="/meisner-technique-class"
              style={{ fontSize: '0.9rem', color: 'var(--navy)', fontWeight: 600 }}
            >
              클래스 상세 페이지 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              자주 묻는 질문
            </h2>
          </div>
          <FaqAccordion items={COACH_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section
        id="form"
        style={{
          padding: 'clamp(56px, 9vw, 80px) 0',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '10px' }}
              >
                권동원 대표 직강 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 720px) {
          [data-hero-grid] {
            grid-template-columns: 1fr !important;
            text-align: center;
            justify-items: center;
          }
          [data-hero-photo] {
            width: 200px !important;
            height: 260px !important;
          }
        }
      `}</style>
    </main>
  )
}
