import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Film, Clapperboard, Repeat, Check } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import type { FaqItem } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const PAGE_URL = `${SITE_URL}/advanced-reel-class`

/** 데이터 원본은 lib/classes.ts 하나 — 가격·정원·시간을 이 파일에 다시 적지 않는다 */
const ADVANCED = CLASSES.find((c) => c.nameKo === '출연영상 심화 클래스')!

export const metadata: Metadata = {
  title: '출연영상 심화 클래스 — 롱테이크 출연영상 제작 2개월',
  description:
    '출연영상 클래스 수료자를 위한 2개월 심화 코스. 마이즈너 테크닉 심화 훈련으로 밀도 높은 롱테이크 출연영상을 제작합니다. 정원 6명 소수정예, 월 4회·회당 4시간, 월 450,000원. 서울 신촌 이대역 도보 3분 KD4 액팅 스튜디오.',
  keywords: [
    '출연영상 심화',
    '롱테이크 출연영상',
    '배우 포트폴리오 심화',
    '마이즈너 테크닉 심화',
    '출연영상 제작',
    'KD4 출연영상 심화 클래스',
    '신촌 출연영상',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '출연영상 심화 클래스 — 롱테이크 출연영상 제작 | KD4',
    description: '출연영상 클래스 수료자를 위한 2개월 심화 코스. 마이즈너 테크닉 심화 훈련 + 롱테이크 촬영.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '출연영상 심화 클래스 — 롱테이크 출연영상 제작 | KD4', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '출연영상 심화 클래스 — KD4',
    description: '출연영상 클래스 수료자를 위한 2개월 심화 코스. 마이즈너 테크닉 심화 훈련 + 롱테이크 촬영.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '출연영상 심화 클래스 — KD4', type: 'image/jpeg' }],
  },
}

/** 노션 원본 「출연영상 심화 클래스 안내」 안내 callout 기준 */
const WHY_ADVANCED = [
  {
    Icon: Clapperboard,
    title: '롱테이크 촬영',
    desc: '마이즈너 테크닉과 가장 잘 어울리는 촬영 기법입니다. 컷을 나누지 않고 긴 호흡으로 찍어 영상의 퀄리티를 끌어올립니다.',
  },
  {
    Icon: Repeat,
    title: '마이즈너 테크닉 심화 훈련',
    desc: 'DEEP Repetition · Perspective Repetition · Text Repetition. 긴 호흡 안에서 매 순간 살아있는 연기를 훈련합니다.',
  },
  {
    Icon: Film,
    title: 'AI가 모방할 수 없는 영상',
    desc: '롱테이크 연기는 AI가 흉내 낼 수 없습니다. 미래에도 살아남는 연기 영상을 만듭니다.',
  },
]

/** 사전준비 — 노션 원본 그대로 */
const PREP_ITEMS = [
  '원하는 대본의 방향성·소재·키워드·레퍼런스 (첫 수업 전까지 구글독스로 전달)',
  '독백(자유연기) 선정 및 개인 서사 분석 (첫 수업 전까지 구글독스로 전달)',
]

type CurriculumSession = { title: string; detail: string | null; highlight?: boolean }
type CurriculumMonth = { month: string; emoji: string; sessions: CurriculumSession[] }

/** 8회차 커리큘럼 — 노션 원본("출연영상 심화 클래스 안내") 그대로. 2개월 코스 월 4회. highlight = 촬영 회차 */
const CURRICULUM_MONTHS: CurriculumMonth[] = [
  {
    month: '첫째 달',
    emoji: '🌒',
    sessions: [
      { title: 'DEEP Repetition', detail: '레퍼런스 · 독백 서사 점검' },
      { title: 'DEEP Repetition with Monologue', detail: '파트너 선정' },
      { title: 'Scene Acting', detail: null },
      { title: 'Scene Acting', detail: null },
    ],
  },
  {
    month: '둘째 달',
    emoji: '🌔',
    sessions: [
      { title: '대본 전달 · 대본 분석', detail: 'Perspective Repetition' },
      { title: 'Perspective Repetition · Text Repetition', detail: '장면 만들기' },
      { title: '장면 만들기', detail: null },
      { title: '촬영', detail: '로케이션 — 파주 인근', highlight: true },
    ],
  },
]

const INCLUDES = [
  '본인 레퍼런스 기반 맞춤형 시나리오',
  '전문 영화팀 촬영 (카메라·조명·사운드)',
  '로케이션 촬영 (파주 인근)',
  '편집 완료 롱테이크 출연영상 납품',
]

/** 수강 유의사항 — 노션 Step4 안내 + 수강료 할인규정(04-ops/playbooks) 기준 */
const NOTICE_ITEMS = [
  '출연영상 클래스를 1회 이상 수료한 멤버만 신청할 수 있습니다.',
  '정원(6명)이 모이면 개설되는 클래스입니다. 신청 인원이 적으면 개강이 미뤄질 수 있습니다.',
  '재수강 할인·일시납 할인은 적용되지 않습니다.',
  '제작된 영상은 KD4 액팅 스튜디오의 홍보·광고에 사용될 수 있습니다.',
]

const ADVANCED_FAQ: FaqItem[] = [
  {
    q: '누가 신청할 수 있나요?',
    a: '출연영상 클래스를 1회 이상 수료한 KD4 멤버만 신청할 수 있습니다. 처음이라면 출연영상 클래스(3개월)부터 시작해 주세요.',
  },
  {
    q: '출연영상 클래스와 무엇이 다른가요?',
    a: '출연영상 클래스가 마이즈너 기초 훈련과 2인 장면 촬영이라면, 심화는 DEEP Repetition·Perspective Repetition 등 마이즈너 심화 훈련을 거쳐 컷을 나누지 않는 롱테이크로 촬영합니다. 2개월 집중 코스입니다.',
  },
  {
    q: '촬영은 어디서 하나요?',
    a: '8회차에 파주 인근 로케이션에서 전문 영화팀과 촬영합니다. 시나리오는 첫 수업 전 전달해 주신 레퍼런스와 독백 서사를 바탕으로 만듭니다.',
  },
  {
    q: '첫 수업 전에 무엇을 준비하나요?',
    a: '두 가지입니다. ① 원하는 대본의 방향성·소재·키워드·레퍼런스 ② 독백(자유연기) 선정과 개인 서사 분석. 둘 다 첫 수업 전까지 구글독스로 전달해 주세요.',
  },
]

/** 심화 클래스 결과물 — 기수·작품명은 /join 포트폴리오 표기, uploadDate는 유튜브 실측 */
const PORTFOLIO_VIDEOS = [
  { id: '7Q62XeyVLbc', title: '심화 1기 — 단편 「여배우들」', uploadDate: '2026-08-08T06:48:27-07:00' }, // 2026-10-06 대표
  { id: 'zoDJtGT3aQM', title: '심화 2기 — 단편 「그 사람이 떠나기 전날 밤」', uploadDate: '2026-05-25T05:00:30-07:00' },
  { id: 's_AE-Vy0Ka0', title: '심화 1기 — 단편 「우리들의 로맨스」', uploadDate: '2026-05-21T00:17:11-07:00' },
]

export default function AdvancedReelPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '출연영상 심화 클래스', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ItemPage',
            idPath: '/advanced-reel-class#webpage',
            url: PAGE_URL,
            name: '출연영상 심화 클래스 — 롱테이크 출연영상 제작 | KD4 액팅 스튜디오',
            description: '출연영상 클래스 수료자를 위한 2개월 심화 코스. 마이즈너 테크닉 심화 훈련으로 롱테이크 출연영상을 제작합니다.',
            mainEntity: { '@id': `${PAGE_URL}#course-advanced-class` },
            dateModified: LAST_UPDATED.advancedReel,
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildCourseFromClass(ADVANCED, { url: PAGE_URL, image: `${SITE_URL}/og-heart.jpg` }),
          buildFaqPage(ADVANCED_FAQ, PAGE_URL),
          ...PORTFOLIO_VIDEOS.map((v) => ({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: `KD4 출연영상 포트폴리오 — ${v.title}`,
            description: 'KD4 액팅 스튜디오 출연영상 심화 클래스 멤버가 제작한 롱테이크 출연영상. 전문 영화팀이 촬영·편집한 배우 캐스팅용 영상입니다.',
            thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
            uploadDate: v.uploadDate,
            contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
            embedUrl: `https://www.youtube.com/embed/${v.id}`,
            inLanguage: 'ko',
            publisher: { '@type': 'Organization', '@id': `${SITE_URL}#org`, name: 'KD4 액팅 스튜디오', url: SITE_URL },
          })),
        ]}
      />

      {/* HERO */}
      <section aria-label="출연영상 심화 클래스 소개" style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 60%, #133f78 100%)', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.2), transparent 70%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <p className="section-eyebrow" lang="en" style={{ color: '#F0A8A8', marginBottom: '16px' }}>
            STEP 02 · ADVANCED REEL
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            출연영상 심화 클래스
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '8px', maxWidth: '600px', margin: '0 auto 8px', wordBreak: 'keep-all', fontStyle: 'italic' }}>
            &ldquo;마이즈너 테크닉 심화 훈련으로 만드는 밀도 높은 롱테이크 출연영상&rdquo;
          </p>
          <p style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', letterSpacing: '0.03em' }}>
            {ADVANCED.course} 집중 코스 · 정원 {ADVANCED.capacity} · 출연영상 클래스 수료자 전용
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="advanced-reel-hero" label="상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="advanced-reel-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* WHY ADVANCED */}
      <section aria-label="심화 클래스의 특징" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">01 — WHY ADVANCED</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>연기의 꽃, 롱테이크</h2>
            <p className="section-desc">
              이미 출연영상을 찍어 본 멤버가 연기 밀도를 한 단계 올리는 과정입니다. 컷 없이 이어지는 긴 호흡 안에서 매 순간 살아있는 연기를 훈련하고, 그대로 촬영합니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', maxWidth: '1040px', margin: '0 auto' }}>
            {WHY_ADVANCED.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <Icon aria-hidden={true} size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section aria-label="심화 클래스 결과물" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">02 — PORTFOLIO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>심화 클래스 결과물</h2>
            <p className="section-desc">출연영상 심화 1기·2기 멤버가 롱테이크로 촬영한 출연영상입니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {PORTFOLIO_VIDEOS.map((v) => (
              <div key={v.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <YouTubeFacade videoId={v.id} title={v.title} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <Link href="/reel-production-class#portfolio" className="btn-outline" style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}>
              출연영상 클래스 포트폴리오 더보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PREP */}
      <section aria-label="사전 준비" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">03 — PREPARATION</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>첫 수업 전 준비</h2>
            <p className="section-desc">두 가지를 첫 수업 전까지 구글독스로 전달해 주세요. 이 자료가 본인 전용 시나리오의 출발점이 됩니다.</p>
          </div>
          <ol role="list" style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none' }}>
            {PREP_ITEMS.map((item, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', alignItems: 'start', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', background: 'var(--navy-tint-1)', borderRadius: '999px', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 'clamp(0.88rem, 2.1vw, 0.92rem)', color: '#111', lineHeight: 1.65, wordBreak: 'keep-all' }}>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CURRICULUM */}
      <section aria-label="2개월 코스 커리큘럼" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">04 — CURRICULUM</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>2개월 · 8회차</h2>
            <p className="section-desc">
              월 4회 · 회당 {ADVANCED.duration}. 첫째 달은 심화 훈련과 장면 연기, 둘째 달은 대본 분석과 장면 만들기를 거쳐 마지막 회차에 촬영합니다.
            </p>
          </div>

          <div className="reel-timeline" style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
            <span className="reel-timeline-line" aria-hidden="true" style={{ position: 'absolute', left: '104px', top: '12px', bottom: '12px', width: '1px', background: 'var(--border)' }} />
            {CURRICULUM_MONTHS.map((m, mi) => (
              <div key={m.month} className="reel-month" style={{ display: 'grid', gridTemplateColumns: '104px 1fr', marginBottom: mi === CURRICULUM_MONTHS.length - 1 ? 0 : 'clamp(32px, 5vw, 48px)' }}>
                <div className="reel-month-rail" style={{ position: 'relative', textAlign: 'right', paddingRight: '28px' }}>
                  <div aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1 }}>{m.emoji}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginTop: '10px', color: '#111' }}>{m.month}</div>
                  <div lang="en" style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--gray)', marginTop: '2px' }}>MONTH {mi + 1}</div>
                  <span className="reel-month-dot" aria-hidden="true" style={{ position: 'absolute', right: '-4px', top: '0.5rem', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--navy)', border: '2px solid var(--bg2)', boxSizing: 'content-box' }} />
                </div>
                <div className="reel-month-body" style={{ paddingLeft: '28px' }}>
                  <ol role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
                    {m.sessions.map((s, si) => {
                      const n = mi * 4 + si + 1
                      return (
                        <li
                          key={si}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            gap: '14px',
                            alignItems: 'start',
                            background: s.highlight ? 'var(--navy-tint-1)' : 'var(--bg)',
                            border: `1px solid ${s.highlight ? 'var(--navy-tint-3)' : 'var(--border)'}`,
                            borderRadius: '10px',
                            padding: '14px 16px',
                          }}
                        >
                          <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', background: s.highlight ? 'var(--navy-tint-2)' : 'var(--navy-tint-1)', borderRadius: '999px', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                            {n}
                          </span>
                          <span>
                            <span style={{ display: 'block', fontSize: 'clamp(0.88rem, 2.1vw, 0.92rem)', fontWeight: 600, color: '#111', lineHeight: 1.6, wordBreak: 'keep-all' }}>
                              <span className="sr-only">{n}회차 — </span>{s.title}
                            </span>
                            {s.detail && (
                              <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gray-light)', lineHeight: 1.65, marginTop: '4px', wordBreak: 'keep-all' }}>{s.detail}</span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICE */}
      <section aria-label="수강 유의사항" style={{ padding: '0 0 clamp(64px, 10vw, 96px)', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: '10px', padding: 'clamp(20px, 3.5vw, 26px)' }}>
            <p className="section-eyebrow" lang="en" style={{ marginBottom: '12px' }}>NOTICE</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#111' }}>신청 전 유의사항</h2>
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
              {NOTICE_ITEMS.map((item, i) => (
                <li key={i} style={{ fontSize: 'clamp(0.86rem, 2.1vw, 0.9rem)', color: 'var(--gray-light)', lineHeight: 1.75, paddingLeft: '16px', position: 'relative', wordBreak: 'keep-all' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.6em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {item}
                </li>
              ))}
            </ul>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="advanced-reel-notice"
              label="카카오채널 문의"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 48,
                padding: '12px 20px',
                background: '#FEE500',
                color: '#3C1E1E',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 10,
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              <Image src="/icons/kakao.png" alt="" aria-hidden="true" width={18} height={18} style={{ objectFit: 'contain' }} />
              카카오채널로 문의하기
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* CLASS DETAILS */}
      <section aria-label="클래스 상세 정보" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">05 — DETAILS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>클래스 정보</h2>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg2)', border: '1.5px solid var(--navy)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{ADVANCED.nameKo}</p>
            <p lang="en" style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>{ADVANCED.nameEn}</p>
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {ADVANCED.bullets.map((b, i) => (
                <li key={i} style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.55em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { label: '일정', value: ADVANCED.schedule },
                { label: '시간', value: ADVANCED.duration },
                { label: '정원', value: ADVANCED.capacity },
                { label: '코스', value: ADVANCED.course ?? '2개월' },
                { label: '월 수강료', value: `₩${ADVANCED.price}` },
                { label: '신청 자격', value: '출연영상 클래스 수료자' },
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

      {/* INCLUDES */}
      <section aria-label="포함 사항" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">06 — INCLUDES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>포함 사항</h2>
            <p className="section-desc">영상 소유권은 KD4가 보유하되 멤버는 캐스팅 활동에 자유롭게 사용 가능합니다.</p>
          </div>
          <ul role="list" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INCLUDES.map((text, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <Check aria-hidden={true} size={18} color="var(--navy)" strokeWidth={2.2} />
                <span style={{ fontSize: '0.92rem', color: '#111', fontWeight: 600 }}>
                  <span className="sr-only">포함:</span>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={ADVANCED_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" aria-label="상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                출연영상 심화 클래스 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm initialClass="출연영상 심화 클래스" />
          </div>
        </div>
      </section>

      {/* CROSS-LINK */}
      <section aria-label="관련 클래스 바로가기" style={{ padding: '24px', background: 'var(--bg)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <Link href="/reel-production-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          <span aria-hidden="true">← </span>출연영상 클래스
        </Link>
        <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          마이즈너 정규 클래스
        </Link>
        <Link href="/one-month-reel-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          출연영상 1달 완성 클래스
        </Link>
        <Link href="/acting-coaches" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          권동원 액팅 코치
        </Link>
        <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>
          전체 클래스 보기 <span aria-hidden="true">→</span>
        </Link>
        <Link href="/benefits" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginLeft: '20px' }}>
          멤버 혜택
        </Link>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .reel-timeline-line { display: none !important; }
          .reel-month { grid-template-columns: 1fr !important; }
          .reel-month-rail {
            text-align: left !important;
            padding-right: 0 !important;
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border);
          }
          .reel-month-dot { display: none !important; }
          .reel-month-body { padding-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
