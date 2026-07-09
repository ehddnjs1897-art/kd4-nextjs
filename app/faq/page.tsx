import type { Metadata } from 'next'
import Link from 'next/link'
import FaqAccordion from '@/components/ui/FaqAccordion'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { serializeJsonLd } from '@/lib/seo'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  // layout.tsx 템플릿('%s | KD4 액팅 스튜디오')이 사이트명을 붙이므로 여기엔 페이지명만
  // — 'FAQ | KD4 액팅 스튜디오'로 넣으면 사이트명이 2번 붙음 (7/10 점검 발견·수정)
  title: '자주 묻는 질문 (FAQ)',
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
    a: '연기 경험이 없어도 괜찮습니다. 마이즈너 테크닉은 \'반응\'을 훈련하는 방식이라, 기존에 배운 습관이 없는 분이 오히려 더 빠르게 체화되는 경우가 많습니다. 취미로 가볍게 시작하고 싶은 분을 위해 베이직 클래스도 별도로 운영하고 있습니다. 상담에서 본인 상황에 맞는 트랙을 함께 찾아드립니다.',
  },
  {
    q: '다른 연기학원과 KD4의 차이는 무엇인가요?',
    a: '정원, 수업 시간, 피드백 밀도가 다릅니다. 일반 학원 평균 정원이 15~25명인 반면 KD4는 6~8명 소수정예입니다. 수업 시간도 4시간으로 일반 학원 평균(1.5~2시간)보다 길고, 1인 피드백 시간이 회당 30분 이상입니다. 또한 현역 배우·전문 액팅 코치가 직접 지도합니다. 수업 외에도 출연영상 제작, 캐스팅 연계까지 하나의 시스템으로 운영합니다.',
  },
  {
    q: '마이즈너 테크닉이 카메라 연기에 왜 유리한가요?',
    a: '마이즈너 테크닉은 과장 없이 미세한 반응으로 진실을 담는 방식입니다. 무대 연기와 달리 클로즈업 카메라 앞에서 오히려 더 강력합니다. 상대에게 정직하게 반응하는 훈련을 통해 가짜 감정 습관을 해체하고, 억지로 짜내는 감정 없이 살아있는 연기를 만들어냅니다.',
  },
  {
    q: '수업료는 얼마인가요?',
    a: '클래스별로 다릅니다. 베이직 클래스 월 250,000원, 마이즈너 테크닉 정규 클래스 월 350,000원(4개월 코스), 출연영상 클래스 월 400,000원(3개월 코스)입니다. 일시납 패키지 선택 시 10만원 추가 할인이 있으며, 재수강·앰배서더 등 다양한 할인 혜택도 운영합니다. 상담 시 자세히 안내드립니다.',
  },
  {
    q: '체험할 수 있는 방법이 있나요?',
    a: '무료 상담을 신청하면 클래스 커리큘럼·가격·일정을 상세히 안내받으실 수 있습니다. 또한 첫 수업 이후 만족하지 않으시면 전액 환불됩니다. 상담 후 가셔도 괜찮습니다.',
  },
  {
    q: '오디션 준비를 도와주나요?',
    a: '네. 오디션 테크닉 클래스를 별도로 운영하며, 독백 만들기·오디션 테크닉 코칭과 함께 독백 영상 촬영도 제공합니다. 방진원·이상원 캐스팅 디렉터와의 공식 협업을 통한 정기 오디션 연계도 진행합니다.',
  },
  {
    q: '출연영상 제작도 해주나요?',
    a: '네. 출연영상 클래스는 KD4의 시그니처 클래스로, 현직 배우 100여 명이 거쳐간 프로그램입니다. 맞춤형 시나리오와 전문 영화팀이 투입되어 실제 영화 현장 수준의 포트폴리오를 제작합니다. 완성된 출연영상은 캐스팅 연계에 직접 활용됩니다.',
  },
  {
    q: '나이 제한이 있나요?',
    a: '연령 제한은 없습니다. 지망생부터 직장인, 경력 배우까지 다양한 연령대가 함께 훈련합니다.',
  },
  {
    q: '직장인도 수강 가능한가요?',
    a: '수강 가능합니다. 스케줄 조율은 상담 시 안내드립니다.',
  },
  {
    q: '레피티션이란 무엇인가요?',
    a: '마이즈너 테크닉의 핵심 훈련법입니다. 두 명이 짧은 대사를 반복하며 상대의 미세한 변화에 반응하는 훈련으로, 머리로 연기하는 습관을 벗고 본능을 회복하는 7단계로 구성됩니다. 감정을 혼자 만들지 않고 상대에게서 촉발된 충동에 반응하는 것이 핵심입니다.',
  },
  {
    q: '수업 수료 후 배우 DB 등록은 어떻게 되나요?',
    a: '클래스를 성실히 수료한 멤버에게 배우 DB 등록 자격이 주어집니다. 사진·필모그래피·출연영상을 포함한 프로필이 kd4.club 배우 DB에 등록되며, 캐스팅팀이 실제로 조회합니다.',
  },
  {
    q: '촬영 경험이 없어도 되나요?',
    a: '물론입니다. 카메라 앞에서 자연스러운 연기를 만들어가는 것 자체가 KD4 훈련의 목적입니다. 연기 경험 없이 처음부터 함께 시작합니다.',
  },
  {
    q: '독백은 어떤 것을 준비해야 하나요?',
    a: '오디션 목적에 따라 달라집니다. KD4에서는 개인 분석 후 적합한 독백 선택을 함께 도와드립니다. 억지로 감정을 짜내는 독백보다 상황에 집중하는 방식이 카메라에 더 잘 담깁니다.',
  },
  {
    q: '감정 연기를 잘하려면 어떻게 해야 하나요?',
    a: '마이즈너 테크닉의 핵심은 감정을 혼자 만들어내는 것이 아니라 상대방에게 집중하여 순간의 충동에 반응하는 것입니다. 억지로 짜내는 감정이 아니라 상대방과의 관계 속에서 살아나는 연기를 훈련합니다.',
  },
  {
    q: '캐스팅 디렉터와 연결해주나요?',
    a: '네. 방진원·이상원 캐스팅 디렉터와 공식 협업하며 정기 오디션 및 캐스팅을 연계합니다. 지금까지 60건 이상의 캐스팅이 이뤄졌습니다. kd4.club 배우 DB를 통해 캐스팅팀이 직접 배우를 조회합니다.',
  },
  {
    q: '입시 준비생도 다닐 수 있나요?',
    a: 'KD4는 입시 전문 학원이 아닙니다. 배우로서의 장기적 성장을 원하는 분, 실제 현장에서 통하는 연기를 배우고 싶은 분에게 맞습니다.',
  },
  {
    q: '마이즈너 테크닉 훈련은 어떻게 구성되나요?',
    a: '마이즈너 테크닉은 Repetition(반복 훈련) 7단계를 기반으로 합니다. KD4 클래스 구조는 STEP1(베이직·마이즈너 정규·출연영상) → STEP2(출연영상 심화) → STEP3(액터스 리더·오디션 테크닉)으로 이어집니다. Repetition 외에도 Activity & Door, Emotional Preparation 등을 단계별로 훈련합니다.',
  },
  {
    q: 'KD4에 다닌 배우들이 실제로 캐스팅된 사례가 있나요?',
    a: '네. KD4 멤버들이 Disney+ 무빙, Netflix 중증외상센터, tvN 금쪽같은 내 스타 등 드라마·영화·CF에 실제 출연했습니다. 지금까지 60건 이상의 캐스팅 연계 실적이 있으며, kd4.club 배우 DB에서 필모그래피를 직접 확인할 수 있습니다.',
  },
  {
    q: '수업은 몇 명이 함께 하나요?',
    a: '클래스별로 다르지만 소수정예로 운영합니다. 마이즈너 테크닉 정규 클래스·출연영상 클래스는 정원 8명, 베이직 클래스는 정원 6명입니다. 일반 학원 평균(15~25명)과 달리 1인 피드백 시간이 회당 30분 이상입니다.',
  },
  {
    q: '등록하려면 어떻게 하면 되나요?',
    a: 'kd4.club/join에서 클래스를 선택하고 연락처를 남기면 24시간 이내 SMS로 연락드립니다. 카카오 채널(pf.kakao.com/_ximxdqn) 또는 인스타그램(@kd4actingstudio) DM으로 문의하셔도 됩니다.',
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
