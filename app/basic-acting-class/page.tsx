import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CLASSES } from '@/lib/classes'
import type { FaqItem } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/basic-acting-class`

/** 데이터 원본은 lib/classes.ts 하나 — 가격·정원·시간을 이 파일에 다시 적지 않는다 */
const BASIC = CLASSES.find((c) => c.nameKo === '베이직 클래스')!
const MEISNER = CLASSES.find((c) => c.nameKo === '마이즈너 테크닉 정규 클래스')!

export const metadata: Metadata = {
  title: '성인 취미 연기 입문 — 베이직 클래스 (연기 경험 없어도 OK)',
  description:
    '연기를 처음 배우는 성인을 위한 취미 연기 입문 클래스. 연기 경험 없어도 OK, 정원 6명 소수정예, 월 4회·회당 3시간, 월 250,000원. 서울 신촌 이대역 도보 3분 KD4 액팅 스튜디오.',
  keywords: [
    '성인 취미 연기',
    '연기 입문',
    '취미 연기 클래스',
    '연기 배우기',
    '성인 연기학원',
    '연기 초보',
    '직장인 연기 클래스',
    '신촌 연기 입문',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '성인 취미 연기 입문 — 베이직 클래스 | KD4 액팅 스튜디오',
    description: '연기 경험 없어도 OK. 정원 6명 소수정예, 월 4회·회당 3시간, 월 250,000원. 서울 신촌 이대역 도보 3분.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '성인 취미 연기 입문 베이직 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '성인 취미 연기 입문 — 베이직 클래스 | KD4',
    description: '연기 경험 없어도 OK. 정원 6명 소수정예, 월 4회·회당 3시간, 월 250,000원.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '성인 취미 연기 입문 베이직 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

/** 이 페이지 전용 FAQ — 답변은 /faq 기존 답변을 요약해 재사용 (새 사실 추가 금지) */
const BASIC_FAQ: FaqItem[] = [
  {
    q: '연기 경험이 전혀 없어도 되나요?',
    a: '괜찮습니다. 베이직 클래스는 연기 경험 없어도 OK · 취미 참여 환영인 입문 트랙입니다. 마이즈너 테크닉은 "반응"을 훈련하는 방식이라 기존에 배운 습관이 없는 분이 오히려 더 빠르게 체화되는 경우가 많습니다.',
  },
  {
    q: '나이 제한이 있나요?',
    a: '연령 제한은 없습니다. 성인 취미 연기부터 지망생·직장인·경력 배우까지 다양한 연령대가 함께 훈련합니다.',
  },
  {
    q: '직장인도 병행할 수 있나요?',
    a: '가능합니다. 수업은 평일 저녁·주말 중심으로 운영하며(월~토 10:00–22:00, 일요일 휴무), 베이직 클래스는 월 4회·회당 3시간입니다. 기수별 정확한 요일은 상담 시 안내드립니다.',
  },
]

const AUDIENCE = [
  {
    title: '연기를 처음 접하는 성인',
    desc: '연기 경험 없어도 OK · 취미 참여 환영. 카메라 앞이 처음이어도 처음부터 함께 시작합니다.',
  },
  {
    title: '취미로 가볍게 시작하고 싶은 분',
    desc: '취미 클래스 · 연기 입문 트랙입니다. KD4는 입시 전문 학원이 아닙니다.',
  },
  {
    title: '평일 저녁·주말에 시간을 내는 직장인',
    desc: '수업은 주말 및 평일 저녁으로 운영됩니다(월~토 10:00–22:00, 일요일 휴무).',
  },
  {
    title: '나이가 걱정되는 분',
    desc: '연령 제한은 없습니다. 지망생부터 직장인, 경력 배우까지 다양한 연령대가 함께 훈련합니다.',
  },
]

const SPEC_ITEMS = [
  { label: '일정', value: BASIC.schedule },
  { label: '시간', value: BASIC.duration },
  { label: '정원', value: BASIC.capacity },
  { label: '월 수강료', value: `₩${BASIC.price}` },
  { label: '리더', value: BASIC.instructor ?? '' },
]

export default function BasicActingClassPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '베이직 클래스', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'ItemPage',
            idPath: '/basic-acting-class#webpage',
            url: PAGE_URL,
            name: '성인 취미 연기 입문 — 베이직 클래스 | KD4 액팅 스튜디오',
            description: '연기를 처음 배우는 성인을 위한 취미 연기 입문 클래스. 정원 6명 소수정예, 월 4회·회당 3시간.',
            mainEntity: { '@id': `${PAGE_URL}#course-basic-class` },
            dateModified: LAST_UPDATED.basic,
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
          }),
          buildCourseFromClass(BASIC, { url: PAGE_URL, image: `${SITE_URL}/og-heart.jpg` }),
          buildFaqPage(BASIC_FAQ, PAGE_URL),
        ]}
      />

      {/* HERO */}
      <section aria-label="베이직 클래스 소개" style={{ padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <p className="section-eyebrow" lang="en" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '16px' }}>
            STEP 01 · BASIC CLASS
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            성인 취미 연기 입문 — 베이직 클래스
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '8px', maxWidth: '560px', margin: '0 auto 8px', wordBreak: 'keep-all', fontStyle: 'italic' }}>
            &ldquo;{BASIC.quote}&rdquo;
          </p>
          <p style={{ fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,255,255,0.75)', marginBottom: '32px', letterSpacing: '0.03em', wordBreak: 'keep-all' }}>
            {BASIC.note} · 정원 {BASIC.capacity}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="basic-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="basic-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* 직답 리드 */}
      <section aria-label="베이직 클래스 한눈에" style={{ padding: 'clamp(48px, 8vw, 72px) 0 clamp(24px, 4vw, 32px)', background: 'var(--bg)' }}>
        <div className="container">
          <p className="section-desc" style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            연기를 처음 배우는 성인을 위한 취미 클래스입니다. 베이직 클래스는 연기 경험이 없어도 시작할 수 있고, 정원 {BASIC.capacity} 소수정예로 {BASIC.schedule}·회당 {BASIC.duration} 진행합니다. 월 수강료는 {BASIC.price}원이며 {BASIC.instructor}가 지도합니다. 수업은 서울 서대문구 이화여대1안길 12 아리움3차 1층 101호, 2호선 이대역 5번 출구에서 도보 약 3분 거리의 KD4 액팅 스튜디오에서 진행됩니다.
          </p>
        </div>
      </section>

      {/* 01 — WHO */}
      <section aria-label="누구를 위한 클래스인가" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">01 — WHO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>누구를 위한 클래스인가</h2>
            <p className="section-desc">
              베이직 클래스는 배우를 직업으로 준비하는 트랙이 아니라, 연기를 처음 접해보고 싶은 성인을 위한 입문 트랙입니다.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxWidth: '960px', margin: '0 auto' }}>
            {AUDIENCE.map(({ title, desc }) => (
              <div key={title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700, marginBottom: '8px', wordBreak: 'keep-all' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 — CURRICULUM */}
      <section aria-label="무엇을 배우나" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">02 — CURRICULUM</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>무엇을 배우나</h2>
            <p className="section-desc">
              감정 해방 훈련에서 시작해 마이즈너 테크닉 기초와 이바나 처벅 테크닉 입문, 독백과 장면연기까지 다룹니다. 정원 {BASIC.capacity} 소수정예라 매 회차 직접 해보는 시간이 충분합니다.
            </p>
          </div>
          <ul role="list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '900px', margin: '0 auto', listStyle: 'none', padding: 0 }}>
            {BASIC.bullets.map((b, i) => (
              <li key={b} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', alignItems: 'start', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
                <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', background: 'var(--navy-tint-1)', borderRadius: '999px', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 'clamp(0.88rem, 2.1vw, 0.92rem)', color: 'var(--gray-light)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 03 — CLASS INFO */}
      <section aria-label="수업 방식과 수강료" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">03 — CLASS INFO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>수업 방식과 수강료</h2>
            <p className="section-desc">
              수업은 {BASIC.schedule}, 회당 {BASIC.duration}입니다. 정원 {BASIC.capacity}으로 운영하며 {BASIC.instructor}가 지도합니다. 월 수강료는 {BASIC.price}원이고, 납부는 월납 또는 전체 수강료 일시납 중 선택할 수 있습니다. 계좌이체·카드결제 모두 가능합니다. 요일과 시간은 기수마다 달라 상담 시 안내드립니다.
            </p>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto', background: 'var(--bg)', border: '1.5px solid var(--navy)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{BASIC.nameKo}</p>
            <p lang="en" style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>{BASIC.nameEn}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {SPEC_ITEMS.map((info) => (
                <div key={info.label}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray)', display: 'block' }}>{info.label}</span>
                  <span style={{ fontSize: '0.92rem', color: '#111', fontWeight: 600 }}>{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 04 — NEXT STEP */}
      <section aria-label="베이직 다음 단계" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 28px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">04 — NEXT STEP</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>베이직 다음 단계</h2>
            <p className="section-desc">
              KD4 클래스는 STEP 1(베이직·마이즈너 정규·출연영상) → STEP 2(출연영상 심화) → STEP 3(액터스 리더·오디션 테크닉) 구조로 이어집니다. 베이직에서 감정 해방과 마이즈너 기초를 경험한 뒤 연기를 더 진지하게 배우고 싶다면, 같은 STEP 1의 마이즈너 테크닉 정규 클래스로 이어가시길 추천드립니다. {MEISNER.instructor} 직강, {MEISNER.schedule}·회당 {MEISNER.duration}, 정원 {MEISNER.capacity}, {MEISNER.course}, 월 {MEISNER.price}원입니다. 어떤 트랙이 맞을지는 무료 상담에서 함께 찾아드립니다.
            </p>
          </div>
          <nav aria-label="다음 단계 클래스 바로가기" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/meisner-technique-class" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
              마이즈너 테크닉 정규 클래스 →
            </Link>
            <Link href="/classes" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
              전체 클래스 보기 →
            </Link>
          </nav>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="자주 묻는 질문" style={{ padding: 'clamp(48px, 9vw, 80px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow" lang="en">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={BASIC_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section id="form" aria-label="무료 상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                베이직 클래스 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      {/* 관련 페이지 크로스링크 */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '32px 24px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            <span aria-hidden="true">← </span>전체 클래스 보기
          </Link>
          <Link href="/meisner-technique-class" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            마이즈너 테크닉 정규 클래스 <span aria-hidden="true">→</span>
          </Link>
          <Link href="/sinchon-acting-academy" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            신촌 스튜디오 오시는 길
          </Link>
          <Link href="/faq" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            자주 묻는 질문
          </Link>
        </div>
      </section>
    </div>
  )
}
