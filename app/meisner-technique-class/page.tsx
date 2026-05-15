import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Repeat2, DoorOpen, Heart, Award, Users } from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { MEISNER_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/meisner-technique-class`

const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!

export const metadata: Metadata = {
  title: '마이즈너 테크닉 정규 클래스 — KD4 액팅 스튜디오',
  description:
    '반복연습·감정해방·실시간 반응 — 마이즈너 테크닉 정규 4개월 코스. 권동원 대표 직강, 정원 8명 소수정예. 서울 신촌 KD4 액팅 스튜디오.',
  keywords: [
    '마이즈너 테크닉',
    '마이즈너 정규반',
    '마이즈너 클래스',
    '연기 입문',
    '연기학원 신촌',
    '이바나 처벅 테크닉',
    '연기하지 않는 연기',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '마이즈너 테크닉 정규 클래스 — KD4 액팅 스튜디오',
    description: '반복연습·감정해방·실시간 반응. 권동원 대표 직강 4개월 정규 코스.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '마이즈너 테크닉 정규 클래스 — KD4',
    description: '권동원 대표 직강, 정원 8명 소수정예 4개월 코스.',
    images: ['/og-image.jpg'],
  },
}

const PILLARS = [
  {
    Icon: Repeat2,
    title: 'Repetition (반복연습)',
    desc: '두 명의 배우가 짧은 대사를 반복하며 상대의 미세한 변화에 반응하는 훈련. 머리로 연기하는 습관을 벗고 상대에게서 진짜 자극을 받는 본능을 회복합니다. 마이즈너 7단계를 차근차근 밟아갑니다.',
  },
  {
    Icon: DoorOpen,
    title: 'Activity & Door (활동과 노크)',
    desc: '주어진 활동에 몰입한 상태에서 상대의 갑작스러운 등장에 어떻게 반응하는지 훈련합니다. 미리 계산된 연기가 아니라 지금 이 순간 일어나는 진짜 반응을 만드는 방법론입니다.',
  },
  {
    Icon: Heart,
    title: 'Emotional Preparation (감정 준비)',
    desc: '장면에 들어가기 직전 자신의 상상력으로 필요한 감정을 미리 준비하는 법. 억지 감정이 아니라 자기 안에서 자연스럽게 솟아나는 정직한 감정을 다루는 훈련입니다.',
  },
]

const COMPARISON_ROWS = [
  { label: '1인 피드백 시간', normal: '회당 5~10분', kd4: '회당 30분+' },
  { label: '정원', normal: '15~25명', kd4: '6~8명' },
  { label: '수업 길이', normal: '1.5~2시간', kd4: '4시간' },
  { label: '강사', normal: '전임 강사 중심', kd4: '현역 배우·전문 액팅코치' },
  { label: '포트폴리오 제작', normal: '별도 과정 · 유료', kd4: '정규 과정 포함' },
  { label: '캐스팅 수수료', normal: '10~30%', kd4: '수수료 없음 · 직접 연결' },
  { label: '월 수강료', normal: '월 45~55만원', kd4: '월 25~37만원' },
]

export default function MeisnerPage() {
  return (
    <main style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '마이즈너 테크닉 정규 클래스', url: PAGE_URL },
          ]),
          buildCourseFromClass(MAIN_CLASS, { url: PAGE_URL }),
          buildFaqPage(MEISNER_FAQ),
        ]}
      />

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)',
          background: 'var(--navy)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '18px' }}>
            STEP 01 · MEISNER TECHNIQUE
          </p>
          <h1
            className="section-title-serif"
            style={{
              color: '#fff',
              fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)',
              lineHeight: 1.35,
              marginBottom: '20px',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            마이즈너 테크닉 정규 클래스
          </h1>
          <p
            style={{
              fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)',
              color: 'rgba(255,255,255,0.86)',
              lineHeight: 1.7,
              marginBottom: '12px',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{MAIN_CLASS.quote}&rdquo;
          </p>
          <p
            style={{
              fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '32px',
              letterSpacing: '0.03em',
            }}
          >
            정원 8명 소수정예 · 4개월 코스 · 권동원 대표 직강
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink
              href="#form"
              location="meisner-hero"
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
              location="meisner-hero"
              label="카카오 채널 문의"
              className="btn-outline"
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}
            >
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* 마이즈너란? */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — METHOD</p>
            <h2 className="section-title-serif" style={{ marginBottom: '18px' }}>
              마이즈너 테크닉이란
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-light)', lineHeight: 1.85, wordBreak: 'keep-all' }}>
              미국 연기 교사 샌포드 마이즈너(Sanford Meisner)가 정립한 연기 훈련 방법입니다. 핵심은
              <strong> &ldquo;연기하지 않는 연기&rdquo;</strong> — 상대의 행동에 정직하게 반응하는 훈련을 통해
              가짜 감정과 정형화된 표현 습관을 벗겨냅니다. 한국 연기 교육에서 흔히 보이는 &ldquo;감정을
              만들어내려는&rdquo; 매너리즘을 해체하고, 배우의 본능과 충동을 회복시키는 정통 액팅 메소드입니다.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {PILLARS.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '26px 24px',
                }}
              >
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.75,
                    wordBreak: 'keep-all',
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 36px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — CURRICULUM</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              4개월 정규 코스 커리큘럼
            </h2>
          </div>
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              background: 'var(--bg)',
              border: '1.5px solid var(--navy)',
              borderRadius: '12px',
              padding: '28px 26px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.15rem',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              {MAIN_CLASS.nameKo}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>
              {MAIN_CLASS.nameEn}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              {MAIN_CLASS.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.7,
                    paddingLeft: '18px',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '0.55em',
                      width: '8px',
                      height: '1px',
                      background: 'var(--navy)',
                    }}
                  />
                  {b}
                </li>
              ))}
            </ul>
            <div
              style={{
                display: 'flex',
                gap: '18px',
                flexWrap: 'wrap',
                paddingTop: '18px',
                borderTop: '1px solid var(--border)',
              }}
            >
              {[
                { label: '일정', value: MAIN_CLASS.schedule },
                { label: '시간', value: MAIN_CLASS.duration },
                { label: '정원', value: MAIN_CLASS.capacity },
                { label: '코스', value: MAIN_CLASS.course ?? '4개월 코스' },
                { label: '월 수강료', value: `₩${MAIN_CLASS.price}` },
              ].map((info) => (
                <div key={info.label}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray)', display: 'block' }}>
                    {info.label}
                  </span>
                  <span style={{ fontSize: '0.92rem', color: '#111', fontWeight: 600 }}>
                    {info.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIRECTOR (full director-card style) */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — INSTRUCTOR</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              강사 — 권동원 대표
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '32px',
              alignItems: 'start',
              maxWidth: '900px',
              margin: '0 auto',
            }}
            className="meisner-director-grid"
          >
            <div
              style={{
                position: 'relative',
                width: '240px',
                height: '320px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <Image
                src={DIRECTOR.photo}
                alt={`${DIRECTOR.name} 대표 사진`}
                fill
                sizes="240px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--navy)',
                  fontSize: '0.95rem',
                  marginBottom: '20px',
                  lineHeight: 1.7,
                  wordBreak: 'keep-all',
                }}
              >
                &ldquo;{DIRECTOR.quote}&rdquo;
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {DIRECTOR.profileFlat.map((line, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--gray-light)',
                      lineHeight: 1.7,
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
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href="/acting-coach-dongwon-kwon"
                style={{
                  display: 'inline-block',
                  marginTop: '18px',
                  fontSize: '0.9rem',
                  color: 'var(--navy)',
                  textDecoration: 'underline',
                }}
              >
                강사 프로필 자세히 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">04 — DIFFERENCE</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              일반 연기학원과 무엇이 다른가
            </h2>
          </div>
          <div
            style={{
              maxWidth: '780px',
              margin: '0 auto',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                background: 'var(--navy-tint-1)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                fontWeight: 700,
                color: 'var(--navy)',
              }}
            >
              <div style={{ padding: '14px 18px' }}>항목</div>
              <div style={{ padding: '14px 18px', textAlign: 'center' }}>일반 학원</div>
              <div
                style={{
                  padding: '14px 18px',
                  textAlign: 'center',
                  background: 'var(--navy)',
                  color: '#fff',
                }}
              >
                KD4
              </div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ padding: '14px 18px', fontWeight: 600 }}>{row.label}</div>
                <div style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--gray)' }}>
                  {row.normal}
                </div>
                <div
                  style={{
                    padding: '14px 18px',
                    textAlign: 'center',
                    color: 'var(--navy)',
                    fontWeight: 700,
                    background: 'var(--navy-tint-1)',
                  }}
                >
                  {row.kd4}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUTUBE */}
      <section style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 28px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — VIDEO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              마이즈너 테크닉 소개 영상
            </h2>
          </div>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <YouTubeFacade videoId="6crvxRnBerk" title="마이즈너 테크닉 — KD4 액팅 스튜디오" />
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
          <FaqAccordion items={MEISNER_FAQ} />
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
                마이즈너 정규반 등록 상담
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
          .meisner-director-grid {
            grid-template-columns: 1fr !important;
            justify-items: center;
            text-align: center;
          }
        }
      `}</style>
    </main>
  )
}
