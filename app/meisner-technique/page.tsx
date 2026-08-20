import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Repeat2, DoorOpen, Heart } from 'lucide-react'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
import type { FaqItem } from '@/lib/landing-faqs'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))

const PAGE_URL = `${SITE_URL}/meisner-technique`
const CLASS_URL = '/meisner-technique-class'

/**
 * 정보형 가이드 페이지 — "마이즈너 테크닉" 검색 의도(정의·훈련법·차이)에 답한다.
 * 거래형(수강 전환)은 /meisner-technique-class 가 담당하므로
 * 제목·canonical 에 "정규 클래스" 키워드를 넣지 않는다(카니발 방지).
 */
export const metadata: Metadata = {
  title: '마이즈너 테크닉이란 — 레피티션·훈련법·메소드와의 차이',
  description:
    '마이즈너 테크닉은 샌포드 마이즈너가 정립한 배우 훈련법으로, 감정을 혼자 만들지 않고 상대에게 진짜로 반응하는 것이 핵심입니다. 레피티션·Activity & Door·Emotional Preparation 3대 훈련과 메소드 연기와의 차이를 정리했습니다.',
  keywords: [
    '마이즈너 테크닉',
    '마이즈너 테크닉이란',
    '레피티션',
    'Repetition 훈련',
    '샌포드 마이즈너',
    '메소드 연기 차이',
    '연기하지 않는 연기',
    '연기 훈련법',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    url: PAGE_URL,
    title: '마이즈너 테크닉이란 — 레피티션·훈련법·메소드와의 차이',
    description: '샌포드 마이즈너가 정립한 연기 훈련법. 상대에게 진짜로 반응하는 원리와 3대 훈련, 메소드 연기와의 차이를 정리했습니다.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '마이즈너 테크닉이란 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '마이즈너 테크닉이란 — 레피티션·훈련법·메소드와의 차이',
    description: '샌포드 마이즈너가 정립한 연기 훈련법. 상대에게 진짜로 반응하는 원리와 3대 훈련, 메소드 연기와의 차이.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '마이즈너 테크닉이란 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

/** 3대 훈련 — /meisner-technique-class PILLARS 를 가이드용으로 확장 서술 */
const DRILLS = [
  {
    Icon: Repeat2,
    title: 'Repetition',
    titleKo: '레피티션 — 상대에게 주의를 옮기는 훈련',
    body: [
      '두 배우가 마주 앉아 상대에게서 관찰한 사실을 짧은 문장으로 주고받으며 반복하는 훈련입니다.',
      '처음에는 “너 팔짱 꼈다” 같은 눈에 보이는 사실을 기계적으로 반복합니다. 다음 단계에서 관점이 “나”에서 “너”로 옮겨가고, 마지막에는 반복 도중 올라오는 충동과 감정 변화를 그대로 허용합니다.',
      '목적은 대화가 아니라 주의의 방향을 바꾸는 것입니다. 자기 머릿속이 아니라 상대에게 100% 붙어 있게 만드는 것이죠.',
      '배우가 자기 연기를 스스로 감시하는 습관을 내려놓게 하는, 마이즈너 훈련의 출발점이자 뼈대입니다.',
    ],
  },
  {
    Icon: DoorOpen,
    title: 'Activity & Door',
    titleKo: '액티비티 & 도어 — 가상의 상황에서 실제로 하기',
    body: [
      '한 배우는 정해진 시간 안에 반드시 끝내야 하는 어려운 활동에 몰입해 있고, 다른 배우가 문을 두드리고 들어옵니다.',
      '활동은 카드로 탑 쌓기처럼 진짜로 집중해야만 되는 것이어야 하고, 두 사람에게는 각자 분명한 이유(관계와 목적)가 주어집니다.',
      '배우는 활동에 실제로 매달린 상태에서 예상 못 한 방해를 만나고, 그 순간의 반응은 계산할 틈 없이 튀어나옵니다.',
      '이 훈련으로 배우는 “가상의 상황 속에서 실제로 무언가를 하는” 능력을 얻습니다. 장면 연기의 기초 체력이 여기서 만들어집니다.',
    ],
  },
  {
    Icon: Heart,
    title: 'Emotional Preparation',
    titleKo: '이모셔널 프리퍼레이션 — 감정은 연료일 뿐',
    body: [
      '장면 직전에 필요한 감정 상태를 상상력으로 미리 데워두는 준비법입니다.',
      '마이즈너는 지나간 실제 사건을 억지로 되새기기보다, 지금 배우를 실제로 흔드는 상상을 쓰라고 가르쳤습니다.',
      '준비는 장면이 시작되기 전까지만 유효합니다. 문이 열리는 순간부터는 준비한 감정을 지키는 것이 아니라 상대에게 반응해야 합니다.',
      '그래서 마이즈너 훈련에서 감정 준비는 연료일 뿐 목표가 아닙니다. 이 구분을 놓치면 다시 혼자 감정을 만들어내는 연기로 돌아갑니다.',
    ],
  },
]

/** 누구에게 맞나 */
const AUDIENCE = [
  {
    label: '연기를 처음 배우는 사람',
    body: '외워야 할 이론이 아니라 상대를 보고 반응하는 훈련부터 시작하기 때문에, 입문자에게 오히려 진입이 쉽습니다. 대사 처리나 발성 습관이 굳지 않은 상태에서 배우면 “보여주는 연기”로 빠지는 시간을 아낄 수 있습니다.',
  },
  {
    label: '경력이 쌓인 배우',
    body: '늘 하던 톤과 표정, 리듬이 레피티션 안에서는 통하지 않습니다. 상대가 매번 다르게 반응하니 준비한 대로 갈 수가 없습니다. 매너리즘이나 억지로 짜내는 감정 때문에 막혀 있다면 점검해볼 만한 훈련입니다.',
  },
]

/** 가이드 전용 FAQ — 정규 클래스 페이지 MEISNER_FAQ 와 질문이 겹치지 않게 구성 */
const GUIDE_FAQ: FaqItem[] = [
  {
    q: '마이즈너 테크닉은 익히는 데 얼마나 걸리나요?',
    a: '마이즈너가 이끌던 네이버후드 플레이하우스의 연기 과정이 2년 단위였을 만큼, 원래 시간을 들이는 훈련입니다. 레피티션의 기본 감각은 몇 주 안에 잡히지만 장면 연기까지 이어 붙이려면 몇 달의 반복이 필요합니다. KD4는 레피티션부터 장면 연기 완성까지를 4개월 코스로 설계해 운영합니다.',
  },
  {
    q: '레피티션을 혼자 연습할 수 있나요?',
    a: '레피티션은 상대의 반응을 재료로 쓰는 훈련이라 혼자서는 성립하지 않습니다. 최소 두 명이 마주 앉아야 하고, 잘못된 습관이 굳지 않도록 지도자가 관찰해 주는 편이 안전합니다. 혼자 할 수 있는 것은 관찰·이완·상상 훈련 정도입니다.',
  },
  {
    q: '메소드 연기와 병행해도 괜찮나요?',
    a: '두 방법 모두 스타니슬랍스키 계보에서 갈라져 나왔기 때문에 원리상 충돌하지는 않습니다. 다만 초반에는 한 가지 기준으로 훈련해야 감각이 흐려지지 않습니다. 마이즈너로 반응하는 기본기를 잡은 뒤 다른 접근을 얹는 순서를 권합니다.',
  },
]

const proseStyle: React.CSSProperties = {
  fontSize: 'clamp(0.92rem, 2.2vw, 1rem)',
  color: 'var(--gray-light)',
  lineHeight: 1.9,
  wordBreak: 'keep-all',
}

export default function MeisnerTechniqueGuidePage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            '@id': `${PAGE_URL}#article`,
            headline: '마이즈너 테크닉이란 — 레피티션·훈련법·메소드와의 차이',
            description:
              '샌포드 마이즈너가 정립한 배우 훈련법. 감정을 혼자 만들지 않고 상대에게 진짜로 반응하는 원리, 레피티션·Activity & Door·Emotional Preparation 3대 훈련, 메소드 연기와의 차이를 정리한 가이드.',
            url: PAGE_URL,
            mainEntityOfPage: PAGE_URL,
            inLanguage: 'ko',
            isAccessibleForFree: true,
            image: `${SITE_URL}/og-heart.jpg`,
            // @id 참조만 두면 일부 검사기가 Organization 이름을 못 붙인다 — 인라인으로 명시
            author: { '@type': 'Organization', '@id': `${SITE_URL}#org`, name: 'KD4 액팅 스튜디오' },
            publisher: { '@id': `${SITE_URL}#org` },
            datePublished: LAST_UPDATED.meisnerGuide,
            dateModified: LAST_UPDATED.meisnerGuide,
            isPartOf: { '@id': `${SITE_URL}#website` },
            // 용어 정의는 클래스 페이지의 DefinedTerm 을 참조 — 중복 정의 금지
            about: { '@id': `${SITE_URL}/meisner-technique-class#term-meisner` },
            mentions: [{ '@id': `${SITE_URL}/meisner-technique-class#course-meisner-technique-class` }],
          },
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '마이즈너 테크닉이란', url: PAGE_URL },
          ]),
          buildFaqPage(GUIDE_FAQ, PAGE_URL),
        ]}
      />

      {/* ===== HERO — 첫 문단이 직답(AEO) ===== */}
      <section aria-label="마이즈너 테크닉 개요" style={{ padding: 'clamp(64px, 11vw, 100px) 24px clamp(48px, 9vw, 76px)', background: 'var(--navy)', color: '#fff' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            <span lang="en">GUIDE</span> · 연기 훈련법
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)', lineHeight: 1.35, marginBottom: '20px', wordBreak: 'keep-all' }}>
            마이즈너 테크닉이란 무엇인가
          </h1>
          <p className="section-desc" style={{ color: 'rgba(255,255,255,0.88)', maxWidth: '720px' }}>
            마이즈너 테크닉은 미국의 연기 교육자 샌포드 마이즈너(Sanford Meisner)가 정립한 배우 훈련법입니다. 핵심 원리는 하나입니다 — 감정을 혼자 만들어내지 말고, 지금 눈앞의 상대에게 진짜로 반응하라. 마이즈너는 연기를 &ldquo;상상의 상황 속에서 진실하게 행동하는 것&rdquo;이라고 정의했고, 그 진실을 만드는 방법으로 레피티션·Activity &amp; Door·Emotional Preparation 훈련을 남겼습니다.
          </p>
        </div>
      </section>

      {/* ===== 01 — 정의와 역사 ===== */}
      <section aria-label="마이즈너 테크닉의 정의와 역사" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">01 — ORIGIN</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>마이즈너 테크닉이란</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={proseStyle}>
              샌포드 마이즈너(1905~1997)는 1930년대 뉴욕 그룹 시어터(Group Theatre)의 창단 멤버였고, 이후 네이버후드 플레이하우스(Neighborhood Playhouse)에서 오랫동안 연기 교육을 이끌었습니다.
            </p>
            <p style={proseStyle}>
              그룹 시어터는 스타니슬랍스키의 연기 시스템을 미국으로 옮겨온 집단이었고, 그 안에서 리 스트라스버그·스텔라 애들러·샌포드 마이즈너가 각자 다른 갈래로 뻗어 나갔습니다. 마이즈너가 붙잡은 지점은 &ldquo;실제로 하는 것의 진실(the reality of doing)&rdquo;이었습니다.
            </p>
            <p style={proseStyle}>
              말하는 척, 듣는 척, 느끼는 척하지 말고 실제로 듣고 실제로 반응하라는 뜻입니다. 그래서 이 훈련은 흔히 &ldquo;연기하지 않는 연기&rdquo;라고 불립니다. 배우가 미리 정해둔 감정을 재현하는 대신, 상대에게서 촉발된 충동을 따라가게 만드는 방식이기 때문입니다.
            </p>
            <p style={proseStyle}>
              그의 원리는 저서 『Sanford Meisner on Acting』으로 정리되어 오늘날까지 미국 연기 교육의 큰 축으로 이어지고 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 02 — 핵심 훈련 3가지 ===== */}
      <section aria-label="마이즈너 테크닉 핵심 훈련 3가지" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">02 — DRILLS</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '20px' }}>핵심 훈련 3가지</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {DRILLS.map(({ Icon, title, titleKo, body }) => (
              <article key={title} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(20px, 3.5vw, 28px)' }}>
                <Icon aria-hidden={true} size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', wordBreak: 'keep-all' }}>{titleKo}</h3>
                <p lang="en" style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--gray)', marginBottom: '12px' }}>{title.toUpperCase()}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {body.map((para, i) => (
                    <p key={i} style={proseStyle}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 03 — 메소드 연기와의 차이 ===== */}
      <section aria-label="메소드 연기와의 차이" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">03 — DIFFERENCE</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>메소드 연기와 뭐가 다른가</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={proseStyle}>
              둘 다 스타니슬랍스키 시스템에서 갈라져 나온 미국식 계보라 뿌리는 같습니다. 리 스트라스버그로 대표되는 메소드는 배우 자신의 과거 경험과 정서적 기억을 감정의 원천으로 삼아 안쪽으로 파고듭니다.
            </p>
            <p style={proseStyle}>
              마이즈너는 반대로 주의를 배우 바깥, 즉 상대에게 돌립니다. 감정을 혼자 준비하는 대신 두 사람 사이에서 생기게 하는 것입니다. 그래서 메소드가 &ldquo;무엇을 느낄 것인가&rdquo;를 준비한다면, 마이즈너는 &ldquo;무엇을 들을 것인가&rdquo;를 훈련한다고 말하기도 합니다.
            </p>
            <p style={proseStyle}>
              마이즈너도 Emotional Preparation을 쓰기 때문에 두 접근이 완전히 대립하는 것은 아닙니다. 다만 카메라 앞처럼 반응 속도가 중요한 현장에서 마이즈너식 훈련이 자주 선택되는 이유가 여기에 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 04 — 누구에게 맞나 ===== */}
      <section aria-label="마이즈너 테크닉은 누구에게 맞나" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">04 — WHO</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '20px' }}>누구에게 맞나</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {AUDIENCE.map(({ label, body }) => (
              <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(20px, 3.5vw, 26px)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700, marginBottom: '10px', wordBreak: 'keep-all' }}>{label}</h3>
                <p style={proseStyle}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 05 — KD4에서 배우기 ===== */}
      <section aria-label="KD4에서 마이즈너 테크닉 배우기" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">05 — KD4</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>KD4에서 배우기</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={proseStyle}>
              KD4 액팅 스튜디오는 서울 신촌에서 마이즈너 테크닉 정규 클래스를 4개월 코스로 운영합니다. 정원 8명 소수정예이며, 월 수강료는 350,000원입니다.
            </p>
            <p style={proseStyle}>
              진행 순서는 위에서 설명한 훈련 그대로입니다. 첫째 달에 레피티션 3단계로 상대에게 주의를 옮기고, 둘째·셋째 달에 Activity &amp; Door로 가상의 상황에서 실제로 하는 감각을 쌓은 뒤, 넷째 달에 장면 연기로 완성합니다. 회차별 커리큘럼과 일정은 정규 클래스 페이지에서 확인할 수 있습니다.
            </p>
            <p style={proseStyle}>
              어느 클래스가 맞을지 모르겠다면 무료 상담에서 지금 상태에 맞는 트랙을 안내받을 수 있습니다. 이름과 연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
            <Link href={CLASS_URL} className="btn-primary">
              정규 클래스 자세히 보기
            </Link>
            <Link href="/join" className="btn-outline">
              무료 상담 신청
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section aria-label="마이즈너 테크닉 자주 묻는 질문" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">FAQ</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={GUIDE_FAQ} />
        </div>
      </section>

      {/* ===== 관련 페이지 크로스링크 ===== */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '32px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href={CLASS_URL} style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            마이즈너 테크닉 정규 클래스 <span aria-hidden="true">→</span>
          </Link>
          <Link href="/acting-coaches" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            액팅 코치 소개
          </Link>
          <Link href="/sinchon-acting-academy" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            신촌 스튜디오 오시는 길
          </Link>
          <Link href="/faq" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            전체 FAQ
          </Link>
        </div>
      </section>
    </div>
  )
}
