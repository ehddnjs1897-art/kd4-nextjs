import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Eye, Film, Check, X } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import { REEL_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const PAGE_URL = `${SITE_URL}/reel-production-class`

const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

export const metadata: Metadata = {
  title: '출연영상 클래스 — 배우 포트폴리오 제작',
  description:
    '전문 영화팀과 함께 만드는 출연영상 포트폴리오. 마이즈너 테크닉 + 맞춤 시나리오 + 현장 촬영. 현직 배우 100명+ 참여한 시그니처 클래스. 서울 신촌 이대역 도보 3분. 무료 상담 신청.',
  keywords: [
    '출연영상 제작',
    '배우 포트폴리오',
    '연기 포트폴리오',
    '배우 프로필 영상',
    '오디션 영상',
    'KD4 출연영상 클래스',
    '신촌 출연영상',
    '서울 배우 포트폴리오',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4',
    description: '전문 영화팀 + 맞춤 시나리오로 만드는 캐스팅용 출연영상 포트폴리오. 현직 배우 100명+ 참여한 시그니처 클래스.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '출연영상 클래스 — KD4',
    description: '전문 영화팀 + 맞춤 시나리오로 만드는 캐스팅용 출연영상 포트폴리오.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '출연영상 클래스 — KD4', type: 'image/jpeg' }],
  },
}

const WHY_REEL = [
  {
    Icon: Eye,
    title: '캐스팅 디렉터의 시선',
    desc: '프로필 사진으로는 연기력이 보이지 않습니다. 캐스팅 디렉터는 영상으로 배우의 연기·표정·호흡을 한 번에 확인합니다.',
  },
  {
    Icon: Film,
    title: '실제 영화 현장의 퀄리티',
    desc: '핸드폰이나 학원 자체 영상이 아닌 실제 영화팀(촬영감독·조명·사운드) 셋업으로 제작. 그대로 오디션 제출 가능.',
  },
]

const PROCESS = [
  { num: '01', title: '레퍼런스 취합', desc: '본인 톤·매력에 맞는 영상 레퍼런스를 함께 큐레이션.' },
  { num: '02', title: '시나리오 작성', desc: '레퍼런스 기반 본인 전용 시나리오. 단순 독백이 아닌 임팩트 장면.' },
  { num: '03', title: '전문 영화팀 촬영', desc: '영화 현장의 카메라·조명·사운드 셋업. 마이즈너 훈련 병행.' },
  { num: '04', title: '편집·납품', desc: '컬러 그레이딩·사운드 디자인 완료. 오디션 제출에 바로 사용.' },
]

const INCLUDES = [
  { yes: true, text: '시나리오 작성 (본인 톤 맞춤)' },
  { yes: true, text: '전문 영화팀 촬영 (카메라·조명·사운드)' },
  { yes: true, text: '편집·컬러 그레이딩·사운드 디자인' },
  { yes: true, text: '캐스팅·오디션 제출용 영상 납품' },
]

const PORTFOLIO_VIDEOS = [
  { id: 's_AE-Vy0Ka0', title: '출연영상 대표 샘플' },
  { id: '7Q62XeyVLbc', title: '출연영상 샘플 1' },
  { id: 'IWL6hlOrU-w', title: '출연영상 샘플 2' },
  { id: 'PUlrhjOkvjA', title: '출연영상 샘플 3' },
]

const PORTFOLIO_PLAYLIST = 'https://www.youtube.com/playlist?list=PLMbZlnkLfP7iaE41p_g9dzGKp5eU9VZk2'

type CurriculumSession = { title: string; detail: string | null; highlight?: boolean }
type CurriculumMonth = { month: string; emoji: string; goal: string | null; sessions: CurriculumSession[] }

/** 월별 커리큘럼 — 3개월 코스 월 4회(회당 4시간). highlight: true 인 회차는 촬영·납품 단계(강조 카드로 렌더) */
const CURRICULUM_MONTHS: CurriculumMonth[] = [
  {
    month: '첫째 달',
    emoji: '🎬',
    goal: '본인의 톤과 매력을 객관적으로 파악하고, 카메라 앞에서 살아있는 반응을 만드는 법',
    sessions: [
      { title: 'OT · 레퍼런스 취합', detail: '본인 톤·매력에 맞는 영상 레퍼런스를 함께 큐레이션' },
      { title: '마이즈너 테크닉 — 레피티션', detail: '상대에게서 연기의 근거를 찾는 훈련. 카메라 앞 집중력의 토대' },
      { title: '이바나 처벅 — 목표와 장애', detail: '인물의 목표·장애·행동을 분석해 장면의 동력 설계' },
      { title: '캐릭터 방향 확정', detail: '배우 개인의 서사와 캐스팅 포지션을 정리해 시나리오 방향 결정' },
    ],
  },
  {
    month: '둘째 달',
    emoji: '📝',
    goal: '본인 전용 시나리오를 완성하고, 카메라 연기로 장면을 소화하는 능력',
    sessions: [
      { title: '맞춤 시나리오 초고 리딩', detail: '레퍼런스 기반 본인 전용 시나리오. 단순 독백이 아닌 임팩트 장면' },
      { title: '장면 분석 · 비트 나누기', detail: '대사 아래 흐르는 행동을 찾아 장면을 구조화' },
      { title: '카메라 연기 훈련', detail: '풀샷·바스트·클로즈업 등 사이즈별 연기 조절' },
      { title: '시나리오 확정 · 리허설', detail: '촬영본 확정 후 현장 조건에 맞춘 리허설' },
    ],
  },
  {
    month: '셋째 달',
    emoji: '🎥',
    goal: '전문 영화팀과 실제 촬영을 진행하고 완성 영상으로 납품받기',
    sessions: [
      { title: '프리 프로덕션', detail: '콘티·장소·의상·스케줄 확정', highlight: true },
      { title: '전문 영화팀 현장 촬영', detail: '영화 현장의 카메라·조명·사운드 셋업으로 촬영', highlight: true },
      { title: '1차 편집본 리뷰', detail: '편집본을 함께 확인하고 피드백 반영' },
      { title: '컬러·사운드 완료 · 납품', detail: '컬러 그레이딩·사운드 디자인 완료. 오디션 제출에 바로 사용', highlight: true },
    ],
  },
]

export default function ReelPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '출연영상 클래스', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ItemPage',
            idPath: '/reel-production-class#webpage',
            url: PAGE_URL,
            name: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4 액팅 스튜디오',
            description: '전문 영화팀과 제작하는 배우 출연영상 포트폴리오 클래스. KD4 액팅 스튜디오.',
            mainEntity: { '@id': `${PAGE_URL}#course-intensive-class` },
            dateModified: '2026-07-19',
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildCourseFromClass(FILM_CLASS, { url: PAGE_URL, image: `${SITE_URL}/og-heart.jpg` }),
          buildFaqPage(REEL_FAQ, PAGE_URL),
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            '@id': `${PAGE_URL}#howto`,
            name: '출연영상(배우 포트폴리오 영상) 만드는 방법',
            description: '전문 영화팀이 제작하는 KD4 출연영상 4단계 프로세스 — 레퍼런스 큐레이션부터 편집 납품까지.',
            step: PROCESS.map((p, i) => ({
              '@type': 'HowToStep',
              position: i + 1,
              name: p.title,
              text: p.desc,
            })),
          },
          ...PORTFOLIO_VIDEOS.map((v) => ({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: `KD4 출연영상 포트폴리오 — ${v.title}`,
            description: `KD4 액팅 스튜디오 멤버가 제작한 출연영상 포트폴리오. 전문 영화팀이 촬영·편집한 배우 캐스팅용 영상입니다.`,
            thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
            uploadDate: '2024-01-01',
            contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
            embedUrl: `https://www.youtube.com/embed/${v.id}`,
            inLanguage: 'ko',
            publisher: {
              '@type': 'Organization',
              '@id': `${SITE_URL}#org`,
              name: 'KD4 액팅 스튜디오',
              url: SITE_URL,
            },
          })),
        ]}
      />

      {/* HERO */}
      <section aria-label="출연영상 클래스 소개" style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 60%, #133f78 100%)', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.2), transparent 70%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <p className="section-eyebrow" lang="en" style={{ color: '#F0A8A8', marginBottom: '16px' }}>
            STEP 01 · REEL PRODUCTION
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            출연영상 클래스
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '8px', maxWidth: '600px', margin: '0 auto 8px', wordBreak: 'keep-all', fontStyle: 'italic' }}>
            &ldquo;{FILM_CLASS.quote}&rdquo;
          </p>
          <p style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', letterSpacing: '0.03em' }}>
            {FILM_CLASS.course} · 정원 {FILM_CLASS.capacity} · 전문 영화팀 촬영
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="reel-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="reel-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* WHY REEL */}
      <section aria-label="출연영상이 필요한 이유" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">01 — WHY REEL</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>왜 출연영상이 필요한가</h2>
            <p className="section-desc">
              현직 배우 100명 이상이 거쳐간 KD4 시그니처 클래스. 한 편의 영상이 캐스팅으로 이어지는 자산이 됩니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
            {WHY_REEL.map(({ Icon, title, desc }) => (
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
      <section aria-label="결과물 샘플 포트폴리오" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">02 — PORTFOLIO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>결과물 샘플</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {PORTFOLIO_VIDEOS.map((v) => (
              <div key={v.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <YouTubeFacade videoId={v.id} title={v.title} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <a href={PORTFOLIO_PLAYLIST} target="_blank" rel="noopener noreferrer" aria-label="출연영상 클래스 포트폴리오 YouTube 재생목록 (새 탭에서 열림)" className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
              포트폴리오 더보기 (유튜브 재생목록) <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section aria-label="제작 4단계 프로세스" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">03 — PROCESS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>제작 4단계</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {PROCESS.map(({ num, title, desc }) => (
              <div key={num} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy-tint-3)', lineHeight: 1, display: 'block', marginBottom: '12px', letterSpacing: '0.02em' }}>
                  {num}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.65, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section aria-label="3개월 코스 커리큘럼" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">04 — CURRICULUM</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>3개월 코스</h2>
            <p className="section-desc">
              월 4회 · 회당 4시간. 마이즈너 훈련을 병행하며 촬영은 후반부에 집중됩니다.
            </p>
          </div>

          {/* 월별 타임라인 */}
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
                  {m.goal && (
                    <p style={{ fontSize: 'clamp(0.86rem, 2.1vw, 0.92rem)', color: 'var(--navy)', lineHeight: 1.7, marginBottom: '16px', wordBreak: 'keep-all' }}>
                      <span lang="en" style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--gray)', display: 'block', marginBottom: '4px' }}>GOAL</span>
                      {m.goal}
                    </p>
                  )}
                  <ol role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none' }}>
                    {m.sessions.map((s, si) => (
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
                          {si + 1}
                        </span>
                        <span>
                          <span style={{ display: 'block', fontSize: 'clamp(0.88rem, 2.1vw, 0.92rem)', fontWeight: 600, color: '#111', lineHeight: 1.6, wordBreak: 'keep-all' }}>
                            <span className="sr-only">{si + 1}회차 — </span>{s.title}
                          </span>
                          {s.detail && (
                            <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gray-light)', lineHeight: 1.65, marginTop: '4px', wordBreak: 'keep-all' }}>{s.detail}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASS DETAILS */}
      <section aria-label="클래스 상세 정보" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">05 — DETAILS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>클래스 정보</h2>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg)', border: '1.5px solid var(--navy)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{FILM_CLASS.nameKo}</p>
            <p lang="en" style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>{FILM_CLASS.nameEn}</p>
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {FILM_CLASS.bullets.map((b, i) => (
                <li key={i} style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.55em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { label: '일정', value: FILM_CLASS.schedule },
                { label: '시간', value: FILM_CLASS.duration },
                { label: '정원', value: FILM_CLASS.capacity },
                { label: '코스', value: FILM_CLASS.course ?? '3개월' },
                { label: '월 수강료', value: `₩${FILM_CLASS.originalPrice ?? FILM_CLASS.price}` },
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
      <section aria-label="포함 사항" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">06 — INCLUDES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>포함 사항</h2>
            <p className="section-desc">
              영상 소유권은 KD4가 보유하되 멤버는 캐스팅 활동에 자유롭게 사용 가능합니다.
            </p>
          </div>
          <ul role="list" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INCLUDES.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                {item.yes ? <Check aria-hidden={true} size={18} color="var(--navy)" strokeWidth={2.2} /> : <X aria-hidden={true} size={18} color="var(--gray)" strokeWidth={2.2} />}
                <span style={{ fontSize: '0.92rem', color: item.yes ? '#111' : 'var(--gray)', fontWeight: item.yes ? 600 : 400 }}>
                  <span className="sr-only">{item.yes ? '포함:' : '미포함:'}</span>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={REEL_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" aria-label="무료 상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                출연영상 클래스 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* CROSS-LINK */}
      <section aria-label="관련 클래스 바로가기" style={{ padding: '24px', background: 'var(--bg)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          <span aria-hidden="true">← </span>마이즈너 정규 클래스
        </Link>
        <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          권동원 리더 소개
        </Link>
        <Link href="/sinchon-acting-academy" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          신촌 스튜디오 오시는 길
        </Link>
        <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>
          전체 클래스 보기 <span aria-hidden="true">→</span>
        </Link>
        <Link href="/about" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginLeft: '20px' }}>
          KD4 소개
        </Link>
        <Link href="/benefits" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginLeft: '20px' }}>
          멤버 혜택
        </Link>
      </section>

      <style>{`
        /* 모바일: 커리큘럼 타임라인 — 세로 레일 해제하고 월 헤더를 가로로 스택 */
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
