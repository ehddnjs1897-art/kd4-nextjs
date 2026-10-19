import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { CLASSES, SEBIN } from '@/lib/classes'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
import { wonOf } from '@/lib/class-price'
import { AUDITION_AUDIENCE as AUDIENCE, AUDITION_CURRICULUM as CURRICULUM, AUDITION_REVIEWS as REVIEWS, AUDITION_FAQ } from '@/lib/class-landing-content'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/audition-technique-class`

/** 데이터 원본은 lib/classes.ts 하나 — 가격·정원·시간을 이 파일에 다시 적지 않는다 */
const AUDITION = CLASSES.find((c) => c.nameKo === '오디션 테크닉 클래스')!

export const metadata: Metadata = {
  title: '오디션 테크닉 클래스 — 오디션 독백·에티튜드·모의 오디션 3개월',
  description:
    `오디션에서 통하는 나만의 독백을 만들고, 오디션 현장 에티튜드와 실전 변수 대응까지 훈련하는 3개월 클래스. 이미지 브랜딩 → 연기 고도화 → 모의 오디션. 정원 6명 소수정예, 월 4회·회당 4시간, 월 ${wonOf('오디션 테크닉 클래스')}. 서울 신촌 이대역 도보 3분 KD4 액팅 스튜디오.`,
  keywords: [
    '오디션 테크닉',
    '오디션 준비',
    '오디션 독백',
    '오디션 클래스',
    '배우 오디션 준비',
    '모의 오디션',
    '오디션 에티튜드',
    '독백 만들기',
    '신촌 연기학원',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '오디션 테크닉 클래스 | KD4 액팅 스튜디오',
    description: `오디션 독백 만들기 · 현장 에티튜드 · 모의 오디션까지 3개월. 정원 6명 소수정예, 월 4회·회당 4시간, 월 ${wonOf('오디션 테크닉 클래스')}.`,
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '오디션 테크닉 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '오디션 테크닉 클래스 | KD4 액팅 스튜디오',
    description: `오디션 독백 만들기 · 현장 에티튜드 · 모의 오디션까지 3개월. 정원 6명 소수정예, 월 ${wonOf('오디션 테크닉 클래스')}.`,
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '오디션 테크닉 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}





const SPEC_ITEMS: { label: string; value: string; note?: string }[] = [
  // 2026-09-17 대표 확정 — 매주 화요일 12:00~16:00 (상담정리문자_발송.md §오디션 테크닉)
  { label: '일정', value: `매주 화요일 12:00~16:00 · ${AUDITION.schedule}` },
  { label: '시간', value: `회당 ${AUDITION.duration}`, note: '*인원에 따라 유동적' },
  { label: '정원', value: `${AUDITION.capacity} (소수정예)` },
  { label: '월 수강료', value: `₩${AUDITION.price}` },
  { label: '액팅 코치', value: AUDITION.instructor ?? '' },
]

const cardStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: 'clamp(20px, 3.5vw, 28px)',
}

const proseStyle: React.CSSProperties = {
  fontSize: 'clamp(0.9rem, 2.2vw, 0.98rem)',
  color: 'var(--gray-light)',
  lineHeight: 1.85,
  wordBreak: 'keep-all',
}

export default function AuditionTechniqueClassPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '오디션 테크닉 클래스', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ItemPage',
            idPath: '/audition-technique-class#webpage',
            url: PAGE_URL,
            name: '오디션 테크닉 클래스 | KD4 액팅 스튜디오',
            description: '오디션 독백 만들기 · 오디션 현장 에티튜드 · 모의 오디션까지 3개월 과정. 정원 6명 소수정예.',
            mainEntity: { '@id': `${PAGE_URL}#course-audition-technique-class` },
            dateModified: LAST_UPDATED.audition,
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildCourseFromClass(AUDITION, { url: PAGE_URL, image: `${SITE_URL}/og-heart.jpg` }),
          buildFaqPage(AUDITION_FAQ, PAGE_URL),
        ]}
      />

      {/* ===== HERO ===== */}
      <section aria-label="오디션 테크닉 클래스 소개" style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            <span lang="en">{AUDITION.step} · {AUDITION.nameEn}</span>
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', wordBreak: 'keep-all' }}>
            오디션 테크닉 클래스
          </h1>
          <p className="section-desc" style={{ color: 'rgba(255,255,255,0.9)', maxWidth: '640px', margin: '0 auto' }}>
            {AUDITION.quote}. 카메라 앞 긴장에서 자유로워지고, 내 매력을 정확히 알고, 오디션에서 꺼낼 무기를 만드는 3개월입니다.
          </p>
        </div>
      </section>

      {/* ===== 한눈에 ===== */}
      <section aria-label="오디션 테크닉 클래스 한눈에" style={{ padding: 'clamp(48px, 8vw, 72px) 0 clamp(24px, 4vw, 32px)', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', margin: 0 }}>
            {SPEC_ITEMS.map((s) => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
                <dt style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>{s.label}</dt>
                <dd style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: '#111', wordBreak: 'keep-all' }}>
                  {s.value}
                  {s.note && <span style={{ display: 'block', marginTop: 4, fontSize: '0.78rem', color: 'var(--gray)' }}>{s.note}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== 이런 분께 ===== */}
      <section aria-label="누구를 위한 클래스인가" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p className="section-eyebrow"><span lang="en">FOR WHOM</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>이런 분께 추천합니다</h2>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {AUDIENCE.map((a) => (
              <li key={a} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ color: 'var(--navy)', fontWeight: 700, flexShrink: 0 }}>·</span>
                <span style={{ ...proseStyle, lineHeight: 1.6 }}>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== 커리큘럼 ===== */}
      <section aria-label="3개월 커리큘럼" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p className="section-eyebrow"><span lang="en">CURRICULUM</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>3개월 커리큘럼</h2>
            <p className="section-desc" style={{ maxWidth: '620px', margin: '0 auto' }}>
              독백을 고르는 것부터 실제 오디션장과 같은 환경의 최종 모의 오디션까지, 12주 동안 순서대로 쌓아 갑니다.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {CURRICULUM.map((m) => (
              <article key={m.month} style={{ ...cardStyle, background: 'var(--bg2)' }}>
                <header style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--navy)', fontWeight: 700, marginBottom: '6px' }}>{m.month}</p>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', wordBreak: 'keep-all' }}>{m.title}</h3>
                  <p style={{ ...proseStyle, fontSize: '0.88rem' }}>{m.goal}</p>
                </header>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {m.weeks.map((w) => (
                    <li key={w.w} style={{ display: 'grid', gridTemplateColumns: '68px 1fr', gap: '12px', alignItems: 'start' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', paddingTop: '3px' }}>{w.w}</span>
                      <span>
                        <strong style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '3px', wordBreak: 'keep-all' }}>{w.h}</strong>
                        <span style={{ ...proseStyle, fontSize: '0.88rem', display: 'block' }}>{w.d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 액팅 코치 ===== */}
      <section aria-label="액팅 코치 소개" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p className="section-eyebrow"><span lang="en">COACH</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>액팅 코치</h2>
          </div>
          <div style={{ ...cardStyle, display: 'grid', gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)', gap: 'clamp(20px, 4vw, 32px)', alignItems: 'start' }} className="audition-coach">
            <Image
              src={SEBIN.photo}
              alt={`${SEBIN.name} 액팅 코치`}
              width={532}
              height={771}
              sizes="(max-width: 720px) 60vw, 220px"
              style={{ width: '100%', height: 'auto', aspectRatio: SEBIN.photoAspect, objectFit: 'cover', borderRadius: '10px', display: 'block' }}
            />
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
                {SEBIN.name} <span style={{ fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 400 }} lang="en">{SEBIN.nameEn}</span>
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '14px' }}>{SEBIN.title}</p>
              <p style={{ ...proseStyle, marginBottom: '16px' }}>
                대형 기획사·매니지먼트 소속부터 드라마 여주인공까지, 상업 프로덕션 현장을 두루 경험한 현역 배우가 실질적인 오디션 테크닉을 코칭하고 피드백합니다.
              </p>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <dt style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--navy)', fontWeight: 700, marginBottom: '4px' }} lang="en">EDUCATION</dt>
                  <dd style={{ ...proseStyle, margin: 0, fontSize: '0.88rem' }}>{SEBIN.education.join(' · ')}</dd>
                </div>
                {SEBIN.filmographySections.map((sec) => (
                  <div key={sec.label}>
                    <dt style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--navy)', fontWeight: 700, marginBottom: '4px' }} lang="en">{sec.label}</dt>
                    <dd style={{ ...proseStyle, margin: 0, fontSize: '0.88rem' }}>{sec.items.join(' · ')}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/acting-coaches#sebin" className="btn-outline" style={{ display: 'inline-block', marginTop: '18px' }}>
                코치 소개 자세히 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .audition-coach { grid-template-columns: 1fr !important; justify-items: center; }
          .audition-coach > div { width: 100%; }
        }
      `}</style>

      {/* ===== 후기 ===== */}
      <section aria-label="참여 배우 후기" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p className="section-eyebrow"><span lang="en">REVIEWS</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>참여 배우 후기</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {REVIEWS.map((r) => (
              <blockquote key={r.who} style={{ ...cardStyle, background: 'var(--bg2)', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ ...proseStyle, fontFamily: 'var(--font-serif)', color: '#111' }}>&ldquo;{r.body}&rdquo;</p>
                <footer style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>— {r.who}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">FAQ</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={AUDITION_FAQ} />
        </div>
      </section>

      {/* ===== 상담 신청 ===== */}
      <section id="form" aria-label="무료 상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                오디션 테크닉 클래스 상담 신청
              </h2>
              <p className="section-desc">이름과 연락처만 남겨주시면 24시간 이내 연락드립니다.</p>
            </div>
            <JoinForm initialClass="오디션 테크닉 클래스" />
          </div>
        </div>
      </section>

      {/* ===== 관련 페이지 ===== */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '32px 24px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            <span aria-hidden="true">← </span>전체 클래스 보기
          </Link>
          <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            마이즈너 테크닉 정규 클래스 <span aria-hidden="true">→</span>
          </Link>
          <Link href="/reel-production-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            출연영상 클래스 <span aria-hidden="true">→</span>
          </Link>
          <Link href="/monologues" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            독백 대본 모음
          </Link>
          <Link href="/acting-coaches" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            액팅 코치 소개
          </Link>
        </div>
      </section>
    </div>
  )
}
