import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Repeat2, DoorOpen, Heart } from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { MEISNER_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const PAGE_URL = `${SITE_URL}/meisner-technique-class`

const MAIN_CLASS = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!

export const metadata: Metadata = {
  title: '마이즈너 테크닉 정규 클래스',
  description:
    '마이즈너 Repetition 훈련으로 억지 감정 없이 살아있는 연기를 만듭니다. 권동원 리더 직강, 4개월 코스, 정원 8명 소수정예. 감정 해방·이바나 처벅 테크닉·독백. 서울 신촌 이대역 도보 3분.',
  keywords: [
    '마이즈너 테크닉',
    '마이즈너 정규반',
    'KD4 마이즈너 클래스',
    '신촌 마이즈너 테크닉',
    '연기 입문',
    '연기학원 신촌',
    '이바나 처벅 테크닉',
    '연기하지 않는 연기',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '마이즈너 테크닉 정규 클래스 — KD4 액팅 스튜디오',
    description: '권동원 리더 직강, 4개월 코스, 정원 8명 소수정예. Repetition 훈련으로 억지 감정 없는 살아있는 연기를 만듭니다.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '마이즈너 테크닉 정규 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '마이즈너 테크닉 정규 클래스 — KD4',
    description: '권동원 리더 직강, 4개월 코스, 정원 8명. Repetition 훈련으로 억지 감정 없는 살아있는 연기.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '마이즈너 테크닉 정규 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

const PILLARS = [
  {
    Icon: Repeat2,
    title: 'Repetition',
    desc: '두 명이 짧은 대사를 반복하며 상대의 미세한 변화에 반응하는 훈련. 머리로 연기하는 습관을 벗고 본능을 회복하는 7단계.',
  },
  {
    Icon: DoorOpen,
    title: 'Activity & Door',
    desc: '주어진 활동에 몰입한 상태에서 상대의 갑작스러운 등장에 반응하는 훈련. 계산이 아니라 지금 이 순간의 진짜 반응.',
  },
  {
    Icon: Heart,
    title: 'Emotional Preparation',
    desc: '장면 직전 상상력으로 필요한 감정을 미리 준비하는 법. 억지 감정이 아니라 자기 안에서 솟아나는 정직한 감정.',
  },
]

const COMPARISON_ROWS = [
  { label: '1인 피드백 시간', normal: '회당 5~10분', kd4: '회당 30분+' },
  { label: '정원', normal: '15~25명', kd4: '6~8명' },
  { label: '수업 길이', normal: '1.5~2시간', kd4: '4시간' },
  { label: '리더', normal: '전임 강사 중심', kd4: '현역 배우·전문 액팅 코치' },
]

export default function MeisnerPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '마이즈너 테크닉 정규 클래스', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ItemPage',
            idPath: '/meisner-technique-class#webpage',
            url: PAGE_URL,
            name: '마이즈너 테크닉 정규 클래스 — KD4 액팅 스튜디오',
            description: '마이즈너 테크닉으로 훈련하는 소수정예 연기 클래스. 권동원 대표 직강.',
            mainEntity: { '@id': `${PAGE_URL}#course-meisner-technique-class` },
            dateModified: '2026-06-11',
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildCourseFromClass(MAIN_CLASS, { url: PAGE_URL, image: `${SITE_URL}/og-heart.jpg` }),
          buildFaqPage(MEISNER_FAQ, PAGE_URL),
          {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            '@id': `${PAGE_URL}#video-meisner-intro`,
            name: '마이즈너 테크닉 — KD4 액팅 스튜디오',
            description: 'KD4 액팅 스튜디오 마이즈너 테크닉 정규 클래스 소개 영상. 연기하지 않는 연기, 진짜 반응 훈련 방식을 담았습니다.',
            thumbnailUrl: 'https://i.ytimg.com/vi/6crvxRnBerk/hqdefault.jpg',
            uploadDate: '2024-01-01',
            contentUrl: 'https://www.youtube.com/watch?v=6crvxRnBerk',
            embedUrl: 'https://www.youtube.com/embed/6crvxRnBerk',
            inLanguage: 'ko',
            publisher: {
              '@type': 'Organization',
              '@id': `${SITE_URL}#org`,
              name: 'KD4 액팅 스튜디오',
              url: SITE_URL,
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            '@id': `${PAGE_URL}#howto`,
            name: '마이즈너 테크닉으로 연기하는 방법',
            description: 'KD4 액팅 스튜디오의 마이즈너 테크닉 3가지 핵심 훈련 방법 — Repetition, Activity & Door, Emotional Preparation.',
            step: PILLARS.map((p, i) => ({
              '@type': 'HowToStep',
              position: i + 1,
              name: p.title,
              text: p.desc,
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            '@id': `${PAGE_URL}#term-meisner`,
            name: '마이즈너 테크닉',
            alternateName: 'Meisner Technique',
            description: 'Sandy Meisner가 개발한 배우 훈련 방법론. "상대방이 하는 것 위에서 살아있는 것"을 핵심 원리로 하며, Repetition·Activity & Door·Emotional Preparation 세 가지 훈련으로 억지 감정 없이 진짜 반응하는 연기를 만든다.',
            url: PAGE_URL,
            sameAs: 'https://en.wikipedia.org/wiki/Meisner_technique',
          },
        ]}
      />

      {/* HERO */}
      <section aria-label="마이즈너 테크닉 정규 클래스 소개" style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" lang="en" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '16px' }}>
            STEP 01 · MEISNER TECHNIQUE
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            마이즈너 테크닉 정규 클래스
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '8px', maxWidth: '560px', margin: '0 auto 8px', wordBreak: 'keep-all', fontStyle: 'italic' }}>
            &ldquo;{MAIN_CLASS.quote}&rdquo;
          </p>
          <p style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,255,255,0.75)', marginBottom: '32px', letterSpacing: '0.03em' }}>
            정원 {MAIN_CLASS.capacity} · {MAIN_CLASS.course} · {MAIN_CLASS.instructor ?? '권동원 대표'} 직강
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="meisner-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="meisner-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section aria-label="마이즈너 테크닉이란" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">01 — METHOD</p>
            <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>마이즈너 테크닉이란</h2>
            <p className="section-desc">
              샌포드 마이즈너가 정립한 연기 훈련 방법. 핵심은 &ldquo;연기하지 않는 연기&rdquo;. 상대에 정직하게 반응하는 훈련으로 가짜 감정과 정형화된 습관을 해체하고 배우의 본능을 회복시킵니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '960px', margin: '0 auto' }}>
            {PILLARS.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <Icon aria-hidden={true} size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <h3 lang="en" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section aria-label="4개월 정규 코스 커리큘럼" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">02 — CURRICULUM</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>4개월 정규 코스</h2>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg)', border: '1.5px solid var(--navy)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{MAIN_CLASS.nameKo}</p>
            <p lang="en" style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>{MAIN_CLASS.nameEn}</p>
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {MAIN_CLASS.bullets.map((b, i) => (
                <li key={i} style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.55em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { label: '일정', value: MAIN_CLASS.schedule },
                { label: '시간', value: MAIN_CLASS.duration },
                { label: '정원', value: MAIN_CLASS.capacity },
                { label: '코스', value: MAIN_CLASS.course ?? '4개월' },
                { label: '월 수강료', value: `₩${MAIN_CLASS.originalPrice ?? MAIN_CLASS.price}` },
              ].map((info) => (
                <div key={info.label}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray)', display: 'block' }}>{info.label}</span>
                  <span style={{ fontSize: '0.92rem', color: '#111', fontWeight: 600 }}>{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INSTRUCTOR */}
      <section aria-label="액팅 코치 소개" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">03 — INSTRUCTOR</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>액팅 코치 — 권동원 (리더)</h2>
          </div>
          <div className="meisner-director-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'start', maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ position: 'relative', width: '200px', height: '266px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <Image src={DIRECTOR.photo} alt={`${DIRECTOR.name} 대표`} fill loading="lazy" sizes="200px" style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--navy)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.7, wordBreak: 'keep-all' }}>
                &ldquo;{DIRECTOR.quote}&rdquo;
              </p>
              <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {DIRECTOR.highlights.map((line, i) => (
                  <li key={i} style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.6, paddingLeft: '14px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: '0.6em', width: '6px', height: '1px', background: 'var(--navy)' }} />
                    {line}
                  </li>
                ))}
              </ul>
              <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.88rem', color: 'var(--navy)', fontWeight: 600 }}>
                액팅 코치 프로필 자세히 보기 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section aria-label="일반 학원 평균과 KD4 비교" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">04 — DIFFERENCE</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>일반 학원 평균과 비교</h2>
          </div>
          <div role="table" aria-label="일반 학원 평균 vs KD4 비교" style={{ maxWidth: '720px', margin: '0 auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div role="rowgroup">
              <div role="row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', background: 'var(--navy-tint-1)', fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--navy)' }}>
                <div role="columnheader" style={{ padding: '14px 16px' }}>항목</div>
                <div role="columnheader" style={{ padding: '14px 16px', textAlign: 'center' }}>일반 학원 평균</div>
                <div role="columnheader" style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--navy)', color: '#fff' }}>KD4</div>
              </div>
            </div>
            <div role="rowgroup">
              {COMPARISON_ROWS.map((row, i) => (
                <div role="row" key={row.label} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', borderTop: i === 0 ? 'none' : '1px solid var(--border)', fontSize: '0.88rem' }}>
                  <div role="rowheader" style={{ padding: '14px 16px', fontWeight: 600 }}>{row.label}</div>
                  <div role="cell" style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--gray)' }}>{row.normal}</div>
                  <div role="cell" style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--navy)', fontWeight: 700, background: 'var(--navy-tint-1)' }}>{row.kd4}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* YOUTUBE */}
      <section aria-label="마이즈너 테크닉 소개 영상" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">05 — VIDEO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>마이즈너 테크닉 소개</h2>
          </div>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <YouTubeFacade videoId="6crvxRnBerk" title="마이즈너 테크닉 — KD4 액팅 스튜디오" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={MEISNER_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" aria-label="무료 상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
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

      {/* 관련 클래스 크로스링크 */}
      <section aria-label="관련 클래스 바로가기" style={{ padding: '32px 24px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            <span aria-hidden="true">← </span>전체 클래스 보기
          </Link>
          <Link href="/reel-production-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            출연영상 클래스 <span aria-hidden="true">→</span>
          </Link>
          <Link href="/sinchon-acting-academy" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            신촌 스튜디오 오시는 길
          </Link>
          <Link href="/about" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            KD4 소개
          </Link>
          <Link href="/benefits" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            멤버 혜택
          </Link>
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
        /* 모바일: 비교표 셀 좌우 여백 축소 — 좁은 칸 글자 세로깨짐 완화 (데스크톱 무영향) */
        @media (max-width: 480px) {
          [role="table"] [role="row"] > div { padding: 12px 8px !important; }
        }
      `}</style>
    </div>
  )
}
