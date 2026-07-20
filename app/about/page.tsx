import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import YouTubeFacade from '@/components/youtube/YouTubeFacade'

export const metadata: Metadata = {
  title: '스튜디오 소개',
  description:
    '마이즈너 테크닉과 연기하지 않는 연기를 중심으로, 배우의 성장을 운영합니다. 교육·실행·관리·커리어·커뮤니티 5개 레이어의 Actor Operating System. KD4 액팅 스튜디오 소개. 서울 신촌 이대역 도보 3분.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/about` },
  keywords: ['KD4 액팅 스튜디오', '마이즈너 테크닉', '신촌 연기학원', '권동원', '연기 코칭', '연기 스튜디오 소개', '배우 양성', 'Actor Operating System', '배우 성장 운영', 'AMS 배우 관리 시스템'],
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/about`,
    title: '스튜디오 소개 | KD4 액팅 스튜디오',
    description: '마이즈너 테크닉과 연기하지 않는 연기를 중심으로, 배우의 성장을 운영합니다. 세계에서 가장 뛰어난 Actor Operating System을 만듭니다.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '스튜디오 소개 | KD4 액팅 스튜디오',
    description: '마이즈너 테크닉과 연기하지 않는 연기를 중심으로, 배우의 성장을 운영합니다.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

const PARTNERS = [
  'CGV 신촌아트레온 아트하우스',
  '액터길드 (Actor Guild)',
  '방진원 캐스팅 디렉터',
  '이상원 캐스팅 디렉터',
  '박안드레 조감독',
  'neez.n 프로덕션',
]

/** 파트너 이름 내 괄호 영문 부분(e.g. "(Actor Guild)")에 lang="en" 적용 — WCAG 3.1.2 */
function renderPartnerName(name: string) {
  const m = name.match(/^(.*?)(\([A-Za-z][^)]*\))(.*)$/)
  if (!m) return name
  return <>{m[1]}<span lang="en">{m[2]}</span>{m[3]}</>
}

const STEPS = [
  {
    num: '01',
    title: '마이즈너 테크닉 / 이바나 처벅 테크닉 훈련',
    sub: '연기력 확장 · 카메라 연기 최적화',
    desc: '마이즈너의 Repetition 훈련과 이바나 처벅 테크닉을 결합하여, 억지로 짜내는 감정 없이 상대방의 반응에 진정성 있게 살아있는 연기를 만듭니다.',
    descNode: (<>마이즈너의 <span lang="en">Repetition</span> 훈련과 이바나 처벅 테크닉을 결합하여, 억지로 짜내는 감정 없이 상대방의 반응에 진정성 있게 살아있는 연기를 만듭니다.</>),
  },
  {
    num: '02',
    title: '포트폴리오 제작',
    sub: '전문 영화팀과 출연영상 제작 시스템',
    desc: '배우의 개성을 살린 맞춤형 시나리오로 영화 퀄리티 출연영상을 제작합니다. KD4가 가장 잘 하는 것.',
  },
  {
    num: '03',
    title: '캐스팅 연계',
    sub: '협업 캐스팅 디렉터 · 정기 오디션',
    desc: '협업 캐스팅 디렉터, 인물 조감독과 정기 오디션 및 캐스팅을 연계합니다. 디즈니+ · 넷플릭스 · tvN · 상업영화.',
  },
]

// 배우가 실패하는 진짜 이유 (Pain Points) — 대표 전략 정의 언어 그대로
const PAIN_POINTS = [
  '무엇을 연습해야 하는지 모른다',
  '언제 촬영해야 하는지 모른다',
  '어떤 독백을 해야 하는지 모른다',
  '어떤 오디션을 선택해야 하는지 모른다',
  '성장하고 있는지 알 수 없다',
  '혼자서 계속 흔들린다',
]

// Actor Operating System — 배우의 성장을 운영하는 5개 레이어
const LAYERS = [
  { num: '01', name: '교육', desc: '오프라인 수업 · 개인레슨 · 마스터클래스' },
  { num: '02', name: '실행', desc: '촬영 · 출연영상 · 독백 · 레피티션 · 장면' },
  { num: '03', name: '관리', desc: '목표 · 피드백 · 성장 기록 · AI 분석 · 멘토 리뷰' },
  { num: '04', name: '커리어', desc: '프로필 · 오디션 · 캐스팅 · 감독 네트워크 · 제작' },
  { num: '05', name: '커뮤니티', desc: '멤버십 · 선후배 · 스터디 · 협업' },
]

const TESTIMONIALS = [
  {
    text: '다시금 연기에 대한 열정과 재미, 행복을 느끼게 해 준 수업이었습니다.',
    name: '조*슬 배우',
  },
  {
    text: '감정해방이란 이런 것이구나, 모든 현장에서 이렇게 교감을 할 수 있다면 모두가 명배우가 될 수 있겠다는 생각이 들었습니다.',
    name: '박*진 배우',
  },
  {
    text: '정답인 연기를 요구하지 않고, 저 자체로 보여줄 수 있는 연기를 할 수 있게 여러 질문을 던져주셨습니다.',
    name: '배우 윤*숙',
  },
]

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--white)', minHeight: '100vh', paddingTop: '64px' }}>
      {/* Organization·Person은 글로벌 JsonLd(layout.tsx)에서 출력.
          @id 참조 그래프로 연결 유지. */}
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '스튜디오 소개', url: `${SITE_URL}/about` },
        ]),
        buildWebPage({
          type: 'AboutPage',
          idPath: '/about#webpage',
          url: `${SITE_URL}/about`,
          name: '스튜디오 소개 — KD4 액팅 스튜디오',
          description: '마이즈너 테크닉과 연기하지 않는 연기를 중심으로, 현장에서 통하는 배우를 키웁니다.',
          about: { '@id': `${SITE_URL}#org` },
          dateModified: '2026-06-11',
          speakableCssSelectors: ['h1', 'h2', '.section-desc'],
        }),
        {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          '@id': `${SITE_URL}/about#video-kd4-intro`,
          name: 'KD4 연기하지 않는 연기',
          description: 'KD4 액팅 스튜디오의 마이즈너 테크닉 기반 연기 훈련 소개 영상. 연기하지 않는 연기, 진짜 반응을 훈련하는 KD4의 방식을 담았습니다.',
          thumbnailUrl: 'https://i.ytimg.com/vi/tB7f4VnC6rM/hqdefault.jpg',
          uploadDate: '2024-01-01',
          contentUrl: 'https://www.youtube.com/watch?v=tB7f4VnC6rM',
          embedUrl: 'https://www.youtube.com/embed/tB7f4VnC6rM',
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
          '@id': `${SITE_URL}/about#howto`,
          name: 'KD4 액팅 스튜디오로 배우 커리어를 만드는 방법',
          description: '마이즈너 테크닉 훈련부터 출연영상 포트폴리오 제작, 캐스팅 연계까지 — 배우의 성장을 운영하는 KD4 3단계 시스템.',
          step: STEPS.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.title,
            text: s.desc,
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          '@id': `${SITE_URL}/about#term-ivana-chubbuck`,
          name: '이바나 처벅 테크닉',
          alternateName: 'Ivana Chubbuck Technique',
          description: '이바나 처벅이 개발한 목표 지향적 연기 방법론. 캐릭터의 슈퍼 오브젝티브(최상위 목표)를 중심에 놓고 감정을 욕망 달성의 동력으로 삼는다. 마이즈너 테크닉과 함께 KD4 심화 과정에서 활용된다.',
          url: `${SITE_URL}/about`,
          sameAs: 'https://en.wikipedia.org/wiki/Ivana_Chubbuck',
        },
      ]} />

      {/* ── HERO ── */}
      <section
        aria-label="KD4 액팅 스튜디오 소개"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(64px, 10vw, 120px) 24px clamp(48px, 7vw, 80px)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display), Oswald, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.3em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          <span lang="en">KD4 Acting Studio</span>
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 6vw, 3.6rem)',
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: '28px',
          }}
        >
          뻔한 연기,<br />이제 방법을 바꿀 때
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.9,
            maxWidth: '620px',
            margin: '0 auto 12px',
            letterSpacing: '0.03em',
          }}
        >
          마이즈너 테크닉 훈련 · 출연영상 제작 · 캐스팅 연계
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.8,
            maxWidth: '560px',
            margin: '0 auto 40px',
          }}
        >
          카메라 앞에서 통하는 &lsquo;연기하지 않는 연기&rsquo;를 배웁니다.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display), Oswald, sans-serif',
            fontSize: 'clamp(2.4rem, 7vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--navy)',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginTop: '8px',
          }}
        >
          <span lang="en">OFF THE PLASTIC</span>
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 철학 ── */}
      <section id="meisner" aria-label="마이즈너 테크닉 소개" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
          <span lang="en">PHILOSOPHY</span>
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, lineHeight: 1.3, marginBottom: '20px' }}>
          연기하지 않는 연기
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, maxWidth: '680px' }}>
          <strong style={{ color: 'var(--white)' }}>마이즈너 테크닉</strong>은 혼자 감정을 만들어내는 것이 아니라,
          상대방에게 집중하여 순간의 충동에 반응하는 훈련법입니다.
          카메라 연기에 최적화된 &apos;연기하지 않는 연기&apos;의 핵심 기법.
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, marginTop: '16px', maxWidth: '680px' }}>
          플라스틱처럼 굳어버린 연기 패턴에서 벗어나,
          상대방에게 반응하는 살아있는 연기를 훈련합니다.
        </p>

        {/* 마이즈너 핵심 3요소 */}
        <div style={{ marginTop: '36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            {
              label: 'REPETITION',
              title: 'Repetition 훈련',
              titleNode: (<><span lang="en">Repetition</span>{' 훈련'}</>),
              desc: '두 배우가 상대를 관찰하며 말과 행동을 반복·반응하는 핵심 훈련. 감정을 혼자 만들지 않고, 상대에게서 촉발된 충동에 반응합니다.',
            },
            {
              label: 'CAMERA',
              title: '카메라 연기에 최적화',
              desc: '마이즈너 테크닉은 과장 없이 미세한 반응으로 진실을 담는 방식입니다. 무대 연기와 달리 클로즈업 카메라 앞에서 오히려 더 강력합니다.',
            },
            {
              label: 'VS OTHER METHODS',
              title: '다른 방법과의 차이',
              desc: '스타니슬랍스키의 감정기억과 달리, 마이즈너는 상대에게 집중합니다. 혼자 짜내는 감정이 아니라 관계 속에서 살아나는 연기입니다.',
            },
          ].map(item => (
            <div
              key={item.label}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '22px 20px',
              }}
            >
              <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
                <span lang="en">{item.label}</span>
              </p>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>
                {'titleNode' in item ? item.titleNode : item.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: 1.75 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* YouTube 영상 — 클릭 시 재생 (YouTubeFacade: 지연 로드) */}
        <div style={{
          marginTop: '48px',
          borderRadius: '4px',
          overflow: 'hidden',
          aspectRatio: '21/9',
          width: '100vw',
          maxWidth: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          background: '#000',
        }}>
          <YouTubeFacade
            videoId="tB7f4VnC6rM"
            title="KD4 연기하지 않는 연기"
            containerStyle={{ paddingBottom: 0, height: '100%' }}
          />
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 배우가 실패하는 진짜 이유 (Pain Points) ── */}
      <section aria-label="배우가 실패하는 진짜 이유" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          <span lang="en">WHY ACTORS FAIL</span>
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '20px' }}>
          배우가 실패하는 진짜 이유
        </h2>
        <p className="section-desc" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, textAlign: 'center', maxWidth: '620px', margin: '0 auto 40px' }}>
          배우는 연기를 몰라서 실패하지 않습니다. 무엇을 연습하고, 언제 촬영하고,
          지금 성장하고 있는지 — 그 성장을 운영해줄 시스템이 없어서 흔들립니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {PAIN_POINTS.map((item, i) => (
            <div
              key={item}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px 20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                color: 'var(--gold)',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginTop: '1px',
                flexShrink: 0,
                minWidth: '20px',
              }}>
                {i + 1}.
              </span>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--white)' }}>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── ACTOR OPERATING SYSTEM ── */}
      <section aria-label="배우의 성장을 운영하는 방식" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          <span lang="en">ACTOR OPERATING SYSTEM</span>
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '20px' }}>
          배우의 성장을 운영합니다
        </h2>
        <p className="section-desc" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          기업에는 CRM·ERP·LMS가 있지만, 배우를 위한 운영 시스템은 없었습니다.
          KD4는 배우의 성장을 운영하는 <span lang="en">Actor Management System</span>을 만듭니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {STEPS.map(step => (
            <div
              key={step.num}
              style={{
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '28px 32px',
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '24px',
                alignItems: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase' }}><span lang="en">STEP</span></p>
                <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '2.4rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{step.num}</p>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '8px' }}>{step.sub}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: 1.7 }}>{'descNode' in step ? step.descNode : step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 5개 레이어 — Actor Operating System 아키텍처 */}
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', textAlign: 'center', margin: 'clamp(48px, 7vw, 72px) 0 24px', letterSpacing: '0.02em' }}>
          KD4는 5개 레이어로 배우의 성장을 운영합니다
        </h3>
        <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', margin: 0, padding: 0 }}>
          {LAYERS.map(layer => (
            <li
              key={layer.num}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px 22px',
                display: 'grid',
                gridTemplateColumns: '44px 1fr',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{layer.num}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.98rem', fontWeight: 700, color: 'var(--white)', marginBottom: '3px' }}>{layer.name}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: 1.6 }}>{layer.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 대표 소개 ── */}
      <section aria-label="권동원 대표 소개" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* 좌측: 텍스트 */}
          <div>
            <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
              <span lang="en">FOUNDER · OPERATOR</span>
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '20px' }}>
              권동원 대표
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', lineHeight: 1.85, marginBottom: '24px' }}>
              상업 영화 · 드라마 100여 편 출연, 연기상 수상 현역 배우가
              직접 지도합니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                '최근 캐스팅 60건',
                '누적 코칭 배우 400명+',
                '현직 배우 멤버들과 함께하는 커뮤니티',
                '디즈니+ · 넷플릭스 · tvN · MBC · KBS · 상업영화 100여편 출연',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: '7px' }} />
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 사진 */}
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '3/4',
              border: '1px solid rgba(196,165,90,0.2)',
              boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
            }}
          >
            <Image
              src="/director.jpg"
              alt="권동원 대표"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px 20px 16px',
              background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 100%)',
            }}>
              <p style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: 'rgba(196,165,90,0.8)',
                textTransform: 'uppercase',
              }}>
                <span lang="en">KD4 Acting Studio</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 멤버 이야기 ── */}
      <section id="reviews" aria-label="멤버 이야기" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          <span lang="en">ACTORS SAY</span>
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '40px' }}>
          멤버 이야기
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {TESTIMONIALS.map(t => (
            <blockquote
              key={t.name}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '28px 24px',
                margin: 0,
              }}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: 1.85, marginBottom: '16px', fontStyle: 'italic' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <cite style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gold)', fontStyle: 'normal' }}>— {t.name}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 협력 파트너 ── */}
      <section aria-label="협력 파트너" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
          <span lang="en">PARTNERSHIP</span>
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '32px' }}>
          협력 파트너
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {PARTNERS.map(p => (
            <span
              key={p}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                padding: '8px 18px',
              }}
            >
              {renderPartnerName(p)}
            </span>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            href="/benefits"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: 'var(--gold)',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.03em',
              textDecoration: 'none',
            }}
          >
            제휴 혜택 전체 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* ── 위치 ── */}
      <section aria-label="찾아오시는 길" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
              <span lang="en">LOCATION</span>
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 700, marginBottom: '16px' }}>
              유익액터스 홀
            </h2>
            {/* address: 조직 연락처 시맨틱 마크업 — WCAG 1.3.1 / HTML semantics */}
            <address style={{ fontStyle: 'normal' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: 1.8 }}>
                서울시 서대문구 이화여대1안길 12<br />
                아리움3차 1층 101호<br />
                <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>이대역 도보 3분 · 1층 위치</span>
              </p>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="mailto:uikactors@gmail.com"
                  aria-label="이메일 보내기 uikactors@gmail.com"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <span aria-hidden="true">✉</span> uikactors@gmail.com
                </a>
                <a
                  href="tel:010-8564-0244"
                  aria-label="전화하기 010-8564-0244"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <span aria-hidden="true">☎</span> 010-8564-0244
                </a>
              </div>
            </address>
          </div>
          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              aspectRatio: '16/9',
            }}
          >
            <iframe
              src="https://maps.google.com/maps?q=%EC%84%9C%EC%9A%B8%EC%8B%9C+%EC%84%9C%EB%8C%80%EB%AC%B8%EA%B5%AC+%EC%9D%B4%ED%99%94%EC%97%AC%EB%8C%801%EC%95%88%EA%B8%B8+12&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', filter: 'invert(0.85) hue-rotate(180deg)' }}
              loading="lazy"
              title="KD4 액팅 스튜디오 위치"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      </section>

      {/* ── 헤세 인용구 — 맨 하단 ── */}
      <section
        aria-label="인용구"
        style={{
          borderTop: '1px solid var(--border)',
          padding: 'clamp(32px, 6vw, 56px) 24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
            color: 'var(--navy)',
            lineHeight: 1.6,
            letterSpacing: '0.02em',
            fontStyle: 'italic',
          }}
        >
          &ldquo;새는 알에서 나오기 위해 투쟁한다. 알은 새의 세계이다. 누구든지 태어나려고 하는 자는 하나의 세계를 파괴하여야 한다. 새는 신을 향해 날아간다.&rdquo;
          &nbsp;&nbsp;<span style={{ fontStyle: 'normal', color: 'var(--navy)', fontSize: '0.85em' }}>— 헤르만 헤세, 데미안</span>
        </p>
      </section>

      {/* ── CTA ── */}
      <section
        aria-label="상담 신청"
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          padding: 'clamp(48px, 8vw, 80px) 24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, marginBottom: '16px' }}>
          지금 바로 시작하세요
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--secondary)', marginBottom: '32px' }}>
          무료 오픈 클래스로 먼저 체험해 보세요.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/join"
            aria-label="무료 상담 신청"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'var(--gold)',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.04em',
            }}
          >
            무료 상담 신청
          </a>
          <Link
            href="/classes"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              border: '1px solid rgba(196,165,90,0.4)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.04em',
            }}
          >
            클래스 보기
          </Link>
        </div>

        {/* 내부 교차 링크 — 주요 SEO 페이지 연결 */}
        <nav aria-label="관련 페이지" style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              권동원 액팅 코치 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/acting-coach-sebin-joo" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              주세빈 액팅 코치 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/meisner-technique-class" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              마이즈너 테크닉 클래스 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/sinchon-acting-academy" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              신촌 연기학원 오시는 길 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/classes" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              클래스 안내 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/benefits" style={{ fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
              멤버 혜택 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </section>
    </div>
  )
}
