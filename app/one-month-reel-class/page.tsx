import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Clapperboard, Scissors, Users, Check } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import type { FaqItem } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const PAGE_URL = `${SITE_URL}/one-month-reel-class`
const KAKAO_URL = 'https://pf.kakao.com/_ximxdqn'

/** 데이터 원본은 lib/classes.ts 하나 — 가격·정원을 이 파일에 다시 적지 않는다 */
const ONE_MONTH = CLASSES.find((c) => c.nameKo === '출연영상 1달 완성 클래스')!

/** 신청 자격 — 2026-10-06 대표: «마이즈너 테크닉 정규 및 출연영상 클래스 수료한 배우들만 신청가능, *훈련된 배우들의 포트폴리오 만들기 프로젝트» */
const ELIGIBILITY = '마이즈너 테크닉 정규 클래스 및 출연영상 클래스를 수료한 배우만 신청할 수 있습니다.'
const TAGLINE = '훈련된 배우들의 포트폴리오 만들기 프로젝트'

export const metadata: Metadata = {
  title: '출연영상 1달 완성 클래스 — 수업 없이 포트폴리오 촬영만, 1개월',
  description:
    '훈련된 배우들의 포트폴리오 만들기 프로젝트. 마이즈너 테크닉 정규·출연영상 클래스 수료자를 위한 1개월 촬영 전용 워크숍. 별도 수업 없이 레퍼런스 취합 → 맞춤형 시나리오 → 테스트 촬영 → 본 촬영. 컷 편집 / 롱테이크 택 1. 클래스 비용 400,000원. 서울 신촌 KD4 액팅 스튜디오.',
  keywords: [
    '출연영상 1달',
    '출연영상 1달 완성',
    '배우 포트폴리오 촬영',
    '출연영상 제작',
    '연기 포트폴리오 영상',
    'KD4 출연영상 1달 완성 클래스',
    '신촌 출연영상',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '출연영상 1달 완성 클래스 — 훈련된 배우들의 포트폴리오 만들기 | KD4',
    description: '마이즈너 테크닉 정규·출연영상 클래스 수료자를 위한 1개월 촬영 전용 워크숍. 레퍼런스 → 맞춤 시나리오 → 테스트 촬영 → 본 촬영.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '출연영상 1달 완성 클래스 — 훈련된 배우들의 포트폴리오 만들기 | KD4', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '출연영상 1달 완성 클래스 — KD4',
    description: '마이즈너 테크닉 정규·출연영상 클래스 수료자를 위한 1개월 촬영 전용 워크숍. 레퍼런스 → 맞춤 시나리오 → 테스트 촬영 → 본 촬영.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '출연영상 1달 완성 클래스 — KD4', type: 'image/jpeg' }],
  },
}

/** 노션 원본 「출연영상 1달」·단톡방 안내 공지 기준 */
const WHAT_IS = [
  {
    Icon: Clapperboard,
    title: '수업 없이 촬영만',
    desc: '별도의 정규 수업 없이 포트폴리오 촬영에만 집중하는 워크숍입니다. 마이즈너 테크닉 정규·출연영상 클래스에서 이미 훈련을 마친 배우가 대상입니다.',
  },
  {
    Icon: Scissors,
    title: '컷 편집 / 롱테이크 택 1',
    desc: '컷을 나눠 편집하는 스타일과 한 호흡으로 이어 찍는 롱테이크 형식 중 하나를 골라 촬영합니다.',
  },
  {
    Icon: Users,
    title: '레퍼런스로 파트너 결정',
    desc: '제출한 레퍼런스를 바탕으로 가장 좋은 시너지를 낼 파트너가 정해집니다. 파트너와 호흡을 맞춰 한 편을 완성합니다.',
  },
]

/** 진행 순서 — 노션 「과정 안내」·「테스트 촬영 안내」·「레퍼런스 제출」 그대로 */
const PROCESS = [
  { num: '01', title: '레퍼런스 취합', desc: '원하는 방향의 영상·대본 레퍼런스를 구글독스로 정리해 전달합니다. 공유 권한은 「링크가 있는 모든 사용자 · 편집자」로 설정해 주세요.' },
  { num: '02', title: '맞춤형 시나리오 전달 · 파트너 결정', desc: '레퍼런스를 바탕으로 본인 전용 시나리오를 쓰고, 시너지가 맞는 파트너를 정합니다.' },
  { num: '03', title: '테스트 촬영 1회', desc: '본 촬영 전 스튜디오에서 테스트 촬영을 한 번 진행합니다. 일정은 대본이 나온 뒤 안내합니다.' },
  { num: '04', title: '본 촬영', desc: '컷 편집 스타일 또는 롱테이크 형식 중 선택한 방식으로 촬영합니다.' },
]

const INCLUDES = [
  '본인 레퍼런스 기반 맞춤형 시나리오',
  '레퍼런스에 맞춘 파트너 매칭',
  '스튜디오 테스트 촬영 1회',
  '본 촬영 (컷 편집 스타일 / 롱테이크 형식 택 1)',
  '한 달 안에 완성하는 출연영상 한 편',
]

/** 유의사항 — 노션 원본·단톡방 공지 기준, 신청 자격은 2026-10-06 대표 지시 */
const NOTICE_ITEMS: { text: string; note?: string }[] = [
  { text: ELIGIBILITY, note: `*${TAGLINE}` },
  { text: '1개월 집중 과정이며, 파트너와 함께 호흡을 맞추는 촬영 특성상 중간 드랍이 어렵습니다.' },
  { text: '레퍼런스는 구글독스로 취합해 전달해 주세요. 공유 권한이 「링크가 있는 모든 사용자 · 편집자」가 아니면 검토가 어렵습니다.' },
]

const ONE_MONTH_FAQ: FaqItem[] = [
  {
    q: '누가 신청할 수 있나요?',
    a: `${TAGLINE}라서, 마이즈너 테크닉 정규 클래스 및 출연영상 클래스를 수료한 배우만 신청할 수 있습니다. 신청은 카카오채널로 받습니다. 처음이라면 마이즈너 테크닉 정규 클래스나 출연영상 클래스부터 시작해 주세요.`,
  },
  {
    q: '수업이 없다는 건 무슨 뜻인가요?',
    a: '매주 모이는 정규 수업 없이 촬영 준비와 촬영만 진행합니다. 레퍼런스 취합 → 맞춤형 시나리오 전달 → 테스트 촬영 1회 → 본 촬영 순서로, 한 달 안에 출연영상 한 편을 완성합니다.',
  },
  {
    q: '촬영 형식은 무엇이 있나요?',
    a: '컷 편집 스타일과 롱테이크 형식 두 가지입니다. 이 중 하나를 골라 촬영합니다.',
  },
  {
    q: '할인이 있나요?',
    a: '같은 달에 다른 클래스를 함께 수강하면 KD4 매니아 할인(추가 클래스 15%)이 적용됩니다. 그 밖의 할인(재수강·일시납·지인 소개·컴백 등)은 적용되지 않습니다.',
  },
]

/** 1달 클래스 결과물 — 2026-10-06 대표 추가 2편 + /join 표기 1편. 제목·uploadDate는 유튜브 실측 */
const PORTFOLIO_VIDEOS = [
  { id: 'AMcMn4UgJp4', title: '저 혼자 뒤집어쓸 줄 아셨어요?', uploadDate: '2026-10-05T03:00:13-07:00' },
  { id: 'lYdllWYftG0', title: '테토녀와 사내연애', uploadDate: '2026-07-29T22:00:08-07:00' },
  { id: 'tLAZZOGd3FA', title: '단편 「백만 원에 난리난 현실남매」', uploadDate: '2026-05-29T01:00:29-07:00' },
]

const KAKAO_BUTTON: CSSProperties = {
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
}

export default function OneMonthReelPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '출연영상 1달 완성 클래스', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ItemPage',
            idPath: '/one-month-reel-class#webpage',
            url: PAGE_URL,
            name: '출연영상 1달 완성 클래스 — 훈련된 배우들의 포트폴리오 만들기 | KD4 액팅 스튜디오',
            description: '마이즈너 테크닉 정규·출연영상 클래스 수료자를 위한 1개월 촬영 전용 워크숍. 레퍼런스 취합 → 맞춤형 시나리오 → 테스트 촬영 → 본 촬영.',
            mainEntity: { '@id': `${PAGE_URL}#course-1-month-film-class` },
            dateModified: LAST_UPDATED.oneMonthReel,
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildCourseFromClass(ONE_MONTH, { url: PAGE_URL, image: `${SITE_URL}/og-heart.jpg` }),
          buildFaqPage(ONE_MONTH_FAQ, PAGE_URL),
          ...PORTFOLIO_VIDEOS.map((v) => ({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: `KD4 출연영상 포트폴리오 — ${v.title}`,
            description: 'KD4 액팅 스튜디오 출연영상 1달 완성 클래스 멤버가 촬영한 배우 캐스팅용 출연영상입니다.',
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
      <section aria-label="출연영상 1달 완성 클래스 소개" style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 60%, #133f78 100%)', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.2), transparent 70%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <p className="section-eyebrow" lang="en" style={{ color: '#F0A8A8', marginBottom: '16px' }}>
            STEP 02 · 1 MONTH REEL
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            출연영상 1달 완성 클래스
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 8px', wordBreak: 'keep-all', fontStyle: 'italic' }}>
            &ldquo;{ONE_MONTH.quote}&rdquo;
          </p>
          <p style={{ fontSize: 'clamp(0.9rem, 2.4vw, 1rem)', color: 'rgba(255,255,255,0.86)', fontWeight: 600, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 6px', wordBreak: 'keep-all' }}>
            {TAGLINE}
          </p>
          <p style={{ fontSize: 'clamp(0.82rem, 2.1vw, 0.92rem)', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', letterSpacing: '0.02em', wordBreak: 'keep-all' }}>
            마이즈너 테크닉 정규·출연영상 클래스 수료자 전용 · 클래스 비용 ₩{ONE_MONTH.price}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href={KAKAO_URL} kind="external" channel="kakao" location="one-month-reel-hero" label="카카오채널로 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              카카오채널로 신청
            </JoinCTALink>
            <JoinCTALink href="#apply" location="one-month-reel-hero" label="신청 방법" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              신청 방법
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* WHAT IS */}
      <section aria-label="1달 완성 클래스란" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">01 — WHAT IS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>수업 없이, 영상 한 편만</h2>
            <p className="section-desc">
              {TAGLINE}입니다. 마이즈너 테크닉 정규·출연영상 클래스를 마친 배우가 정규 수업 없이, 한 달 동안 촬영 준비와 촬영에만 집중합니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', maxWidth: '1040px', margin: '0 auto' }}>
            {WHAT_IS.map(({ Icon, title, desc }) => (
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
      <section aria-label="1달 완성 클래스 결과물" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">02 — PORTFOLIO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>1달 완성 클래스 결과물</h2>
            <p className="section-desc">출연영상 1달 완성 클래스 멤버가 촬영한 출연영상입니다.</p>
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
              출연영상 클래스 커리큘럼·포트폴리오 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section aria-label="진행 순서" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">03 — PROCESS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>한 달, 4단계</h2>
            <p className="section-desc">레퍼런스 취합에서 본 촬영까지. 중간에 스튜디오 테스트 촬영을 한 번 거칩니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
            {PROCESS.map(({ num, title, desc }) => (
              <div key={num} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy-tint-3)', lineHeight: 1, display: 'block', marginBottom: '12px', letterSpacing: '0.02em' }}>
                  {num}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '8px', wordBreak: 'keep-all' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.65, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICE */}
      <section aria-label="신청 전 유의사항" style={{ padding: '0 0 clamp(64px, 10vw, 96px)', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: '10px', padding: 'clamp(20px, 3.5vw, 26px)' }}>
            <p className="section-eyebrow" lang="en" style={{ marginBottom: '12px' }}>NOTICE</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#111' }}>신청 전 유의사항</h2>
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
              {NOTICE_ITEMS.map((item, i) => (
                <li key={i} style={{ fontSize: 'clamp(0.86rem, 2.1vw, 0.9rem)', color: 'var(--gray-light)', lineHeight: 1.75, paddingLeft: '16px', position: 'relative', wordBreak: 'keep-all' }}>
                  <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '0.6em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {item.text}
                  {item.note && (
                    <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 600, marginTop: '2px' }}>{item.note}</span>
                  )}
                </li>
              ))}
            </ul>
            <JoinCTALink href={KAKAO_URL} kind="external" channel="kakao" location="one-month-reel-notice" label="카카오채널 문의" style={KAKAO_BUTTON}>
              <Image src="/icons/kakao.png" alt="" aria-hidden="true" width={18} height={18} style={{ objectFit: 'contain' }} />
              카카오채널로 문의하기
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* CLASS DETAILS */}
      <section aria-label="클래스 상세 정보" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">04 — DETAILS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>클래스 정보</h2>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg)', border: '1.5px solid var(--navy)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{ONE_MONTH.nameKo}</p>
            <p lang="en" style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>{ONE_MONTH.nameEn}</p>
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {ONE_MONTH.bullets.map((b, i) => (
                <li key={i} style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.55em', width: '8px', height: '1px', background: 'var(--navy)' }} />
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { label: '기간', value: '1개월' },
                { label: '일정', value: ONE_MONTH.schedule },
                { label: '정원', value: ONE_MONTH.capacity },
                { label: '촬영 형식', value: '컷 편집 / 롱테이크 택 1' },
                { label: '클래스 비용', value: `₩${ONE_MONTH.price}` },
                { label: '신청 자격', value: '마이즈너 정규·출연영상 수료자' },
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
            <p className="section-eyebrow" lang="en">05 — INCLUDES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>포함 사항</h2>
          </div>
          <ul role="list" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INCLUDES.map((text, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
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
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={ONE_MONTH_FAQ} />
        </div>
      </section>

      {/* APPLY — 수료자 전용이라 상담 폼(신규 멤버용: 베이직·출연영상·마이즈너 정규만) 대신 카카오채널 신청 (2026-10-06 대표) */}
      <section id="apply" aria-label="신청 방법" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">HOW TO APPLY</p>
            <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '12px' }}>
              신청은 카카오채널로
            </h2>
            <p className="section-desc" style={{ marginBottom: '24px' }}>
              마이즈너 테크닉 정규·출연영상 클래스를 수료한 배우 전용 클래스라, 상담 폼 대신 카카오채널로 신청을 받습니다.
            </p>
            <JoinCTALink href={KAKAO_URL} kind="external" channel="kakao" location="one-month-reel-apply" label="카카오채널로 신청하기" style={KAKAO_BUTTON}>
              <Image src="/icons/kakao.png" alt="" aria-hidden="true" width={18} height={18} style={{ objectFit: 'contain' }} />
              카카오채널로 신청하기
            </JoinCTALink>
            <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.75, marginTop: '32px', wordBreak: 'keep-all' }}>
              배우님의 최고의 결과물을 위해 함께 고민하고 달리겠습니다.
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.92rem', fontWeight: 700, color: '#111', marginTop: '6px' }}>
              KD4 액팅 스튜디오 대표 권동원 드림
            </p>
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--gray)', marginBottom: '10px' }}>아직 수료 전이라면</p>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/meisner-technique-class#form" style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.92rem' }}>
                  마이즈너 테크닉 정규 클래스 상담 <span aria-hidden="true">→</span>
                </Link>
                <Link href="/reel-production-class#form" style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.92rem' }}>
                  출연영상 클래스 상담 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
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
        <Link href="/advanced-reel-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', marginRight: '20px' }}>
          출연영상 심화 클래스
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
    </div>
  )
}
