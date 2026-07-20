import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CLASSES, DONGWON_COACH, SEBIN, HYUNJAE, type InstructorProfile } from '@/lib/classes'
import { COACH_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildPersonDongwonDetailed, buildPersonSebinDetailed, buildPersonHyunjaeDetailed, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/acting-coaches`

// 상세 페이지가 있는 클래스 — 담당 클래스 카드에서 링크
const CLASS_LINK: Record<string, string> = {
  '마이즈너 테크닉 정규 클래스': '/meisner-technique-class',
  '출연영상 클래스': '/reel-production-class',
}

export const metadata: Metadata = {
  title: 'KD4 액팅 코치 — 권동원 · 주세빈 · 이현재',
  description:
    'KD4 액팅 스튜디오 강사진. 권동원 리더 — 마이즈너 테크닉 코치, Disney+ 무빙2·Netflix 중증외상센터 출연 현역 배우, 프로 배우 400명+ 코칭. 주세빈 강사 — 오디션 테크닉·개인 레슨, TV조선 닥터신 주연. 이현재 코치 — 중국 iQIYI 영화부문 신인상(한국인 최초) 수상 현역 배우. 서울 신촌.',
  keywords: ['KD4 액팅 코치', '권동원', '권동원 배우', '권동원 KD4', '주세빈', '주세빈 배우', '주세빈 KD4', '이현재', '이현재 배우', '이현재 KD4', '마이즈너 강사', '오디션 테크닉 강사', '액팅 코치', '액팅 리더', '현역 배우 강사', '신촌 액팅코치', '서울 액팅 코치'],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'KD4 액팅 코치 — 권동원 · 주세빈 · 이현재',
    description: '현역 배우로 활동 중인 코치진이 직접 지도합니다. 권동원(마이즈너 테크닉) · 주세빈(오디션 테크닉·개인 레슨) · 이현재.',
    images: [{ url: `${SITE_URL}/director.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 코치 권동원' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KD4 액팅 코치 — 권동원 · 주세빈 · 이현재',
    description: '현역 배우로 활동 중인 코치진이 직접 지도합니다.',
    images: [{ url: `${SITE_URL}/director.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 코치 권동원' }],
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
          buildWebPage({
            type: 'WebPage',
            idPath: '/acting-coaches#webpage',
            url: PAGE_URL,
            name: 'KD4 액팅 코치 — 권동원 · 주세빈 · 이현재 | KD4 액팅 스튜디오',
            description: '현역 배우로 활동 중인 KD4 강사진. 권동원 리더(마이즈너 테크닉) · 주세빈 강사(오디션 테크닉·개인 레슨) · 이현재 코치.',
            dateModified: '2026-07-21',
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildPersonDongwonDetailed(), // 권동원 Person 정본 (필모·수상·학력 포함)
          buildPersonSebinDetailed(), // 주세빈 강사 (오디션 테크닉·개인 레슨)
          buildPersonHyunjaeDetailed(), // 이현재 코치
          buildFaqPage(COACH_FAQ, PAGE_URL),
        ]}
      />

      {/* ===== HERO — 강사진 공통 소개 ===== */}
      <section
        aria-label="KD4 액팅 코치 소개"
        style={{
          background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 55%, #133f78 100%)',
          padding: 'clamp(48px, 8vw, 80px) 24px clamp(48px, 8vw, 72px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 데코 글로우 */}
        <div aria-hidden style={{ position: 'absolute', top: '-120px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.22), transparent 70%)' }} />
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <p className="section-eyebrow" style={{ color: '#F0A8A8', marginBottom: '14px', letterSpacing: '0.22em' }}>
              <span lang="en">ACTING COACHES · KD4</span>
            </p>
            <h1
              className="section-title-serif"
              style={{ color: '#fff', fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.3, marginBottom: '16px', wordBreak: 'keep-all' }}
            >
              KD4 액팅 코치
            </h1>
            <p style={{ fontSize: 'clamp(0.95rem, 2.4vw, 1.08rem)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, maxWidth: '600px', margin: '0 auto', wordBreak: 'keep-all' }}>
              현역 배우로 활동 중인 코치진이 책 속 이론이 아니라
              지금 촬영장에서 통하는 감각으로 직접 지도합니다.
            </p>

            {/* 강사 바로가기 */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
              <a href="#dongwon" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', minHeight: '44px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '999px', color: '#fff', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
                권동원 — 마이즈너 테크닉 <span aria-hidden="true" style={{ color: '#F0A8A8' }}>↓</span>
              </a>
              <a href="#sebin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', minHeight: '44px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '999px', color: '#fff', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
                주세빈 — 오디션 테크닉 <span aria-hidden="true" style={{ color: '#F0A8A8' }}>↓</span>
              </a>
              <a href="#hyunjae" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', minHeight: '44px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '999px', color: '#fff', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
                이현재 — 강사 <span aria-hidden="true" style={{ color: '#F0A8A8' }}>↓</span>
              </a>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>
              <JoinCTALink href="#form" location="coach-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
                무료 상담 신청
              </JoinCTALink>
              <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="coach-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
                카카오 채널 문의
              </JoinCTALink>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 01 — 권동원 (수평 팀 — 세 강사 동일 형식) ===== */}
      <InstructorSection
        person={DONGWON_COACH}
        sectionId="dongwon"
        eyebrow="01 — MEISNER TECHNIQUE COACH"
        heading="권동원 — 대표/리더 · 액팅 코치"
        background="var(--bg)"
        cardBackground="var(--bg2)"
        photoWide
        classCardLabel="대표 직강 클래스"
        intro={
          <><span lang="en">KD4</span> 대표 · <span lang="en">Disney+</span> 무빙2, <span lang="en">Netflix</span> 중증외상센터 출연 중인 현역 배우. 프로 배우 400명+ 액팅 코칭.</>
        }
        classNames={['마이즈너 테크닉 정규 클래스', '출연영상 클래스', '출연영상 심화 클래스', '출연영상 1달 완성 클래스', '액터스 리더 클래스']}
      />

      {/* ===== 02 — 주세빈 (오디션 테크닉·개인 레슨) ===== */}
      <InstructorSection
        person={SEBIN}
        sectionId="sebin"
        eyebrow="02 — AUDITION TECHNIQUE COACH"
        heading="주세빈 — 오디션 테크닉 강사"
        background="var(--bg2)"
        cardBackground="var(--bg)"
        intro={
          <>동국대학교 연극영화과 졸업. <span lang="en">TV</span>조선 &ldquo;닥터신&rdquo; 주연 등 드라마·연극·<span lang="en">CF</span>에서 활동 중인 현역 배우입니다.</>
        }
        classNames={['오디션 테크닉 클래스', '개인 레슨']}
      />

      {/* ===== 03 — 이현재 ===== */}
      <InstructorSection
        person={HYUNJAE}
        sectionId="hyunjae"
        eyebrow="03 — ACTING COACH"
        heading="이현재 — 강사"
        background="var(--bg)"
        cardBackground="var(--bg2)"
        intro={
          <>청주대학교 예술대학원 연극영화학과 박사수료. 중국 <span lang="en">iQIYI</span>(아이치이) 영화부문 신인상을 한국인 최초로 수상, 한국과 중화권 영화·드라마에서 활동해 온 현역 배우입니다.</>
        }
        classNames={['개인 레슨']}
      />

      {/* ===== FAQ ===== */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">FAQ</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={COACH_FAQ} />
        </div>
      </section>

      {/* ===== CROSS-LINK — 관련 페이지 바로가기 ===== */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '28px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container">
          <nav aria-label="관련 페이지 내비게이션" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              마이즈너 정규 클래스
            </Link>
            <Link href="/reel-production-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              출연영상 클래스
            </Link>
            <Link href="/sinchon-acting-academy" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              신촌 스튜디오 오시는 길
            </Link>
            <Link href="/about" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              KD4 소개
            </Link>
            <Link href="/benefits" style={{ fontSize: '0.9rem', color: 'var(--navy)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', textDecoration: 'none' }}>
              멤버 혜택
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

/* ── 강사 섹션 공용 컴포넌트 — 제공된 프로필 필드만 렌더 (없는 값은 표시 안 함) ── */
function InstructorSection({
  person,
  sectionId,
  eyebrow,
  heading,
  intro,
  classNames,
  background,
  cardBackground,
  photoMaxWidth = '300px',
  photoWide = false,
  classCardLabel = '담당 클래스',
}: {
  person: InstructorProfile
  sectionId: string
  eyebrow: string
  heading: string
  intro: React.ReactNode
  classNames: string[]
  background: string
  cardBackground: string
  photoMaxWidth?: string
  photoWide?: boolean
  classCardLabel?: string
}) {
  const profileRows: { label: string; value: string }[] = [
    { label: 'EDUCATION', value: person.education.join(' · ') },
    ...(person.birth ? [{ label: 'BIRTH', value: person.birth }] : []),
    ...(person.height && person.weight ? [{ label: 'HEIGHT / WEIGHT', value: `${person.height} · ${person.weight}` }] : []),
    ...(person.talent ? [{ label: 'TALENT', value: person.talent.join(', ') }] : []),
    ...(person.awards ? [{ label: 'AWARDS', value: person.awards.join(' · ') }] : []),
  ]
  const assignedClasses = classNames
    .map((n) => CLASSES.find((c) => c.nameKo === n))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  return (
    <section id={sectionId} aria-label={heading} style={{ scrollMarginTop: '80px', padding: 'clamp(64px, 10vw, 96px) 0', background }}>
      <div className="container">
        <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
          <p className="section-eyebrow"><span lang="en">{eyebrow}</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>{heading}</h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>{intro}</p>
        </div>

        {photoWide ? (
          <>
            {/* 와이드 사진 — 이전 히어로처럼 컨테이너 전체 폭 */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '960px', aspectRatio: person.photoAspect, margin: '0 auto clamp(24px, 4vw, 36px)', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 30px 70px -25px rgba(0,0,0,0.35)' }}>
              <Image
                src={person.photo}
                alt={`${person.name} ${person.title}`}
                fill
                sizes="(max-width: 960px) calc(100vw - 48px), 912px"
                style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                priority
              />
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', maxWidth: '820px', margin: '0 auto 20px' }}>
              {profileRows.map(({ label, value }) => (
                <div key={label} style={{ background: cardBackground, border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: '8px', padding: '14px 16px' }}>
                  <dt style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--navy)', fontWeight: 700, marginBottom: '6px' }}>
                    <span lang="en">{label}</span>
                  </dt>
                  <dd style={{ fontSize: '0.92rem', color: '#111', lineHeight: 1.6, wordBreak: 'keep-all' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '820px', margin: '0 auto 20px', alignItems: 'start' }}>
          {/* 사진 — 원본 비율 유지 (크롭 없음) */}
          <div style={{ position: 'relative', width: '100%', maxWidth: photoMaxWidth, aspectRatio: person.photoAspect, margin: '0 auto', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <Image
              src={person.photo}
              alt={`${person.name} ${person.title}`}
              fill
              sizes="(max-width: 640px) 90vw, 300px"
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* 기본 프로필 — 제공된 필드만 */}
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {profileRows.map(({ label, value }) => (
              <div key={label} style={{ background: cardBackground, border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: '8px', padding: '14px 16px' }}>
                <dt style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--navy)', fontWeight: 700, marginBottom: '6px' }}>
                  <span lang="en">{label}</span>
                </dt>
                <dd style={{ fontSize: '0.92rem', color: '#111', lineHeight: 1.6, wordBreak: 'keep-all' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        )}

        {/* 필모그래피 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '1040px', margin: '0 auto' }}>
          {person.filmographySections.map(({ label, items }) => (
            <div key={label} style={{ background: cardBackground, border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
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

        {/* 담당 클래스 */}
        {assignedClasses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', maxWidth: '820px', margin: '20px auto 0' }}>
            {assignedClasses.map((cls) => {
              const href = CLASS_LINK[cls.nameKo]
              const inner = (
                <>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.14em', color: 'var(--navy)', fontWeight: 700, marginBottom: '4px' }}>{classCardLabel}</p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700, color: '#111' }}>{cls.nameKo}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--gray-light)', marginTop: '2px' }}>
                      {cls.schedule} · {cls.duration} · 정원 {cls.capacity}
                      {href && <span style={{ color: 'var(--navy)', fontWeight: 600 }}> · 상세 보기 <span aria-hidden="true">→</span></span>}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)' }}>월 ₩{cls.price}</span>
                </>
              )
              const cardStyle: React.CSSProperties = { background: cardBackground, border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', textDecoration: 'none' }
              return href ? (
                <Link key={cls.nameKo} href={href} style={cardStyle}>{inner}</Link>
              ) : (
                <div key={cls.nameKo} style={cardStyle}>{inner}</div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
