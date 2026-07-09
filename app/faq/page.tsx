import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/ui/FaqAccordion'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { serializeJsonLd } from '@/lib/seo'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'FAQ | KD4 액팅 스튜디오',
  description:
    '연기 훈련, 배우 되는 법, KD4 수업에 대해 자주 묻는 질문과 답변입니다. 마이즈너 테크닉, 오디션 준비, 수업료, 체험 수업까지 한 번에 확인하세요.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/faq` },
  keywords: [
    'KD4 FAQ', '연기학원 자주묻는질문', '마이즈너 테크닉 설명', '연기 수업료',
    '무료 체험 수업', '배우 되는 법', '오디션 준비', '연기 초보', '카메라 연기',
    '신촌 연기학원 FAQ', '레피티션이란', '출연영상 제작',
  ],
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/faq`,
    title: 'FAQ | KD4 액팅 스튜디오',
    description: '연기 훈련, 배우 되는 법, KD4 수업에 대해 자주 묻는 질문과 답변입니다.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | KD4 액팅 스튜디오',
    description: '연기 훈련, 배우 되는 법, KD4 수업에 대해 자주 묻는 질문과 답변입니다.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
}

const faqs = [
  {
    q: '진짜 생초보인데 배우가 될 수 있나요?',
    a: 'KD4는 연기 경험이 전혀 없는 분도 환영합니다. 오히려 잘못된 습관이 없어 마이즈너 테크닉을 더 빠르게 체화하는 경우가 많습니다. 무료 오픈 클래스에서 직접 경험해보세요.',
  },
  {
    q: '다른 연기학원과 KD4의 차이는 무엇인가요?',
    a: '일반 연기학원은 기술을 가르치지만 KD4는 배우의 성장을 운영합니다. 수업 외에도 출연영상 제작, 오디션 코칭, 캐스팅 연결까지 하나의 시스템으로 지원합니다.',
  },
  {
    q: '마이즈너 테크닉이 카메라 연기에 왜 유리한가요?',
    a: '마이즈너 테크닉은 상대방의 실제 반응에 집중하는 훈련입니다. 카메라는 거짓을 잡아냅니다. 계산된 감정이 아닌 진짜 반응을 만들어내는 마이즈너 훈련이 카메라 앞에서 가장 자연스러운 연기를 가능하게 합니다.',
  },
  {
    q: '수업료는 얼마인가요?',
    a: '정규 수업은 월 15만 원(마이즈너 Step 1 기준)입니다. 첫 체험은 10만 원 상당의 무료 오픈 클래스 1회를 통해 부담 없이 시작할 수 있습니다.',
  },
  {
    q: '무료 체험 수업이 있나요?',
    a: '네, 오픈 클래스를 무료로 1회 참여할 수 있습니다. 실제 수업 방식을 직접 경험한 후 등록 여부를 결정하시면 됩니다.',
  },
  {
    q: '오디션 준비를 도와주나요?',
    a: '네. 독백 선택부터 장면 분석, 실전 오디션 대응까지 코칭합니다. 실제 캐스팅 디렉터와의 네트워크도 지원합니다.',
  },
  {
    q: '출연영상 제작도 해주나요?',
    a: '네, KD4의 5레이어 시스템 중 \'실행\' 레이어에 출연영상 제작이 포함됩니다. 촬영 → 편집 → 포트폴리오 활용까지 지원합니다.',
  },
  {
    q: '나이 제한이 있나요?',
    a: '연령 제한은 없습니다. 20대 지망생부터 직장인, 경력 배우까지 다양한 연령대가 함께 훈련합니다.',
  },
  {
    q: '직장인도 수강 가능한가요?',
    a: '네. 주말반 및 저녁 수업이 있어 직장인도 병행 가능합니다. 상담 시 스케줄을 맞춰드립니다.',
  },
  {
    q: '레피티션이란 무엇인가요?',
    a: '마이즈너 테크닉의 핵심 훈련법입니다. 두 사람이 서로를 관찰하고 즉각적으로 반응하는 반복 훈련으로, 계산 없이 진짜로 반응하는 능력을 기릅니다.',
  },
  {
    q: '배우 프로필 사진은 어떻게 해야 하나요?',
    a: 'KD4 회원은 kd4.club 배우 프로필 DB에 등록됩니다. 가로 촬영 사진이 카톡/SNS 공유 썸네일에 최적화됩니다. 촬영 안내는 스튜디오에서 제공합니다.',
  },
  {
    q: '촬영 경험이 없어도 되나요?',
    a: '물론입니다. 카메라 앞에서 자연스러운 연기를 만들어가는 것 자체가 KD4 훈련의 목적입니다. 처음부터 함께 시작합니다.',
  },
  {
    q: '독백은 어떤 것을 준비해야 하나요?',
    a: '오디션 목적에 따라 달라집니다. KD4에서는 개인 분석 후 적합한 독백 선택을 함께 도와드립니다. 억지로 감정을 쥐어짜는 독백보다, 상황에 집중하는 독백이 카메라에 더 잘 담깁니다.',
  },
  {
    q: '감정 연기를 잘하려면 어떻게 해야 하나요?',
    a: '감정을 만들려 하면 연기가 됩니다. KD4 마이즈너 훈련의 핵심은 감정을 짜내는 것이 아니라 상대와 상황에 집중하는 것입니다. 진짜 집중이 진짜 감정을 만들어냅니다.',
  },
  {
    q: '캐스팅 디렉터와 연결해주나요?',
    a: '네. KD4는 캐스팅 디렉터와 조감독 네트워크를 보유하고 있으며, kd4.club 배우 DB를 통해 캐스팅 관계자에게 직접 노출될 수 있습니다.',
  },
  {
    q: '입시 준비생도 다닐 수 있나요?',
    a: '다닐 수는 있지만, KD4는 입시 전문 학원이 아닙니다. 배우로서의 장기적 성장을 원하는 분, 실제 현장에서 쓰이는 연기를 배우고 싶은 분에게 맞습니다.',
  },
  {
    q: '마이즈너 테크닉은 몇 단계로 구성되나요?',
    a: 'KD4 커리큘럼 기준으로 Step 1(레피티션·기초), Step 2(즉흥·장면), Step 3(고급 장면·오디션 실전)으로 구성됩니다. 각 단계는 월 단위로 진행됩니다.',
  },
  {
    q: 'KD4에 다닌 배우들이 실제로 캐스팅된 사례가 있나요?',
    a: '네. KD4 출신 배우들이 드라마, 영화, 광고에 실제 출연한 사례가 있습니다. kd4.club 배우 프로필에서 필모그래피를 직접 확인할 수 있습니다.',
  },
  {
    q: '수업은 몇 명이 함께 하나요?',
    a: '소수 정예로 운영합니다. 마이즈너 레피티션 특성상 2인 1조 훈련이 기본이며, 전체 수업 인원은 강사가 각자에게 충분히 집중할 수 있는 수준으로 유지합니다.',
  },
  {
    q: '등록하려면 어떻게 하면 되나요?',
    a: 'kd4.club에서 무료 오픈 클래스를 신청하거나, 카카오 채널 또는 인스타그램 DM으로 상담을 신청하시면 됩니다. 먼저 직접 경험해보시는 것을 추천드립니다.',
  },
]

// Schema.org FAQPage JSON-LD
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/faq#faqpage`,
  url: `${SITE_URL}/faq`,
  name: 'KD4 액팅 스튜디오 자주 묻는 질문',
  inLanguage: 'ko',
  isPartOf: { '@type': 'WebSite', url: SITE_URL },
  mainEntity: faqs.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

// BreadcrumbList JSON-LD
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${SITE_URL}/faq` },
  ],
}

export default function FaqPage() {
  return (
    <>
      {/* JSON-LD: FAQPage + BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />

      <main id="main-content" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        {/* 헤더 섹션 */}
        <section
          style={{
            paddingTop: '120px',
            paddingBottom: '64px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          {/* 브레드크럼 */}
          <nav aria-label="브레드크럼" style={{ marginBottom: '32px' }}>
            <ol
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              <li>
                <Link
                  href="/"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    color: 'var(--gray)',
                    textDecoration: 'none',
                  }}
                >
                  홈
                </Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>›</li>
              <li>
                <span
                  aria-current="page"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                    color: 'var(--navy)',
                    fontWeight: 600,
                  }}
                >
                  FAQ
                </span>
              </li>
            </ol>
          </nav>

          {/* 타이틀 */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: 'var(--navy)',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            FAQ
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 700,
              color: 'var(--black)',
              lineHeight: 1.25,
              marginBottom: '20px',
            }}
          >
            자주 묻는 질문
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1rem',
              color: 'var(--secondary)',
              lineHeight: 1.75,
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            연기 훈련, 배우 되는 법, KD4 수업에 대한 궁금증을 정리했습니다.
            <br />
            더 궁금한 점은 무료 상담으로 직접 물어보세요.
          </p>
        </section>

        {/* FAQ 아코디언 */}
        <section
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            padding: '0 24px 80px',
          }}
        >
          <FaqAccordion faqs={faqs} />
        </section>

        {/* 하단 CTA */}
        <section
          style={{
            background: 'var(--bg2)',
            borderTop: '1px solid var(--border)',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 700,
              color: 'var(--black)',
              marginBottom: '12px',
            }}
          >
            직접 경험해보는 것이 가장 빠릅니다
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              color: 'var(--secondary)',
              marginBottom: '32px',
              lineHeight: 1.7,
            }}
          >
            무료 오픈 클래스 1회로 KD4 마이즈너 훈련을 직접 체험해보세요.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/join"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 32px',
                background: 'var(--navy)',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                letterSpacing: '0.05em',
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
            >
              무료 상담 신청
            </Link>
            <Link
              href="/classes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 32px',
                background: 'transparent',
                color: 'var(--navy)',
                border: '1px solid var(--navy)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                letterSpacing: '0.05em',
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              클래스 소개 보기
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
