import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Clapperboard, UserRound, Video } from 'lucide-react'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
import type { FaqItem } from '@/lib/landing-faqs'
import { CLASSES } from '@/lib/classes'
import { wonOf } from '@/lib/class-price'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))

const PAGE_URL = `${SITE_URL}/actor-reel-guide`
const CLASS_URL = '/reel-production-class'

/**
 * 정보형 가이드: "출연영상이란 / 프로필 영상·셀프테이프 차이 / 만드는 법" 검색 의도에 답한다 (2026-10 AEO B6②).
 * 거래형(수강 전환)은 /reel-production-class 가 담당하므로 제목·canonical 에 "클래스"를 넣지 않는다(카니발 방지).
 * 기간·횟수·시간·정원·코치·수강료는 lib/classes.ts 에서만 읽는다(손으로 옮겨 적지 않음).
 * 업계 기준 문장의 출처는 KD4-HUB/04-ops/website-uplift/AEO_GEO_감사_2026-10-11/round2/R6 문서 §2.
 * 미확인 문장(원문 미열람 근거·영상 길이·참여 인원 수)과 대표 확인 전 문구(독백 영상 촬영 제공)는 넣지 않는다.
 */
const findClass = (nameKo: string) => {
  const c = CLASSES.find((x) => x.nameKo === nameKo)
  if (!c) throw new Error(`actor-reel-guide: lib/classes.ts에 «${nameKo}» 없음`)
  return c
}
const REEL = findClass('출연영상 클래스')
const ADVANCED = findClass('출연영상 심화 클래스')
const REEL_COURSE = REEL.course ?? '3개월 코스'
const REEL_MONTHS = REEL_COURSE.replace(' 코스', '')
const ADVANCED_MONTHS = ADVANCED.course ?? '2개월'

const TITLE = '배우 출연영상이란: 프로필 영상·셀프테이프 차이와 만드는 법'
const DEFINITION =
  '출연영상은 배우가 드라마나 영화 같은 작품의 한 장면 안에서 연기하는 모습을 담은 영상입니다. 캐스팅 디렉터는 프로필 사진과 함께 이 영상을 보고 오디션에 부를 배우를 고릅니다.'

export const metadata: Metadata = {
  title: TITLE,
  description:
    '출연영상은 배우가 작품 속 한 장면에서 연기하는 모습을 담은 영상으로, 캐스팅 디렉터가 프로필 사진과 함께 봅니다. 프로필 영상·셀프테이프와의 차이, 캐스팅 디렉터가 영상에서 보는 것, KD4 출연영상 클래스가 만드는 과정을 정리했습니다.',
  keywords: [
    '배우 출연영상',
    '출연영상이란',
    '출연영상 만드는 방법',
    '배우 프로필 영상',
    '프로필 영상 차이',
    '셀프테이프',
    '쇼릴',
    '데모릴',
    '배우 포트폴리오 영상',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    url: PAGE_URL,
    title: TITLE,
    description: '작품 속 한 장면을 담은 배우 출연영상. 프로필 영상·셀프테이프와의 차이와 캐스팅 디렉터가 보는 것, 만드는 과정을 정리했습니다.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '배우 출연영상이란: KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: '작품 속 한 장면을 담은 배우 출연영상. 프로필 영상·셀프테이프와의 차이와 캐스팅 디렉터가 보는 것.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '배우 출연영상이란: KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

/** 02: 세 영상의 차이 (마이즈너 가이드 DRILLS 카드 틀) */
const KINDS = [
  {
    Icon: Clapperboard,
    title: 'Reel',
    titleKo: '출연영상: 작품 속 한 장면',
    body: [
      '작품 속 한 장면입니다. 상대역과 대사를 주고받으며 인물로서 반응하는 모습을 담습니다.',
      '프로필과 함께 캐스팅 디렉터나 제작사에 보내는 기본 자료입니다. 특정 오디션을 위해 찍은 영상이 아니라서 여러 곳에 계속 쓸 수 있습니다.',
      '실제 출연작 장면을 편집하거나, 출연작이 없으면 맞춤 시나리오로 장면을 새로 찍어 만듭니다.',
    ],
  },
  {
    Icon: UserRound,
    title: 'Profile Video',
    titleKo: '프로필 영상: 자기소개와 독백',
    body: [
      '카메라 앞에서 하는 자기소개와 독백을 촬영한 짧은 영상입니다. 얼굴과 목소리, 말투와 분위기를 보여줍니다.',
      '혼자 하는 연기라서 상대에게 반응하는 장면 연기는 담기지 않습니다. 그래서 프로필 영상만으로는 장면 속에서 어떤 배우인지 보여주기 어렵습니다.',
    ],
  },
  {
    Icon: Video,
    title: 'Self-tape',
    titleKo: '셀프테이프: 특정 오디션을 위한 영상',
    body: [
      '특정 오디션에서 받은 대본으로 배우가 직접 찍어 보내는 오디션 영상입니다. 상대 대사는 카메라 밖에서 다른 사람이 읽어 줍니다.',
      '캐스팅 측이 요청할 때 찍고, 촬영 방법과 길이, 파일 형식은 그 안내를 따릅니다. 비대면 오디션이 늘면서 셀프테이프로 오디션을 진행하는 경우도 많아졌습니다.',
      '아직 공개되지 않은 작품의 대본일 수 있어서, 오디션이 끝난 뒤에도 출연영상이나 SNS에 다시 쓰지 않는 편이 안전합니다.',
    ],
  },
]

/** 03: 캐스팅 디렉터가 보는 것 (마이즈너 가이드 AUDIENCE 카드 틀). 원문 확인된 해외 가이드 근거만 */
const CASTING_POINTS = [
  { label: '가장 좋은 장면이 맨 앞에', body: '캐스팅 디렉터는 많은 영상을 빠르게 넘겨 봅니다. 가장 좋은 장면을 끝에 아껴 두면 그 장면까지 보지 않을 수 있습니다.' },
  { label: '짧게, 2~3분 안에', body: '2분이면 충분하고 3분이면 넉넉하다는 것이 흔히 권하는 길이입니다. 좋은 장면이 하나뿐이라면 그 한 장면으로도 충분합니다.' },
  { label: '누가 주인공인지 분명하게', body: '화면에 여러 사람이 나오면 누구를 봐야 할지 알기 어렵습니다. 상대역 한 명과 주고받는 장면처럼 배우가 화면의 중심에 있는 장면이 좋습니다.' },
  { label: '잘 보이고 잘 들리게', body: '얼굴 앞쪽에서 비추는 조명, 잡음 없는 소리, 가로 화면이 기본입니다. 소리가 묻히거나 화면이 흔들리면 연기보다 그 문제가 먼저 눈에 띕니다.' },
  { label: '음악과 몽타주보다 장면', body: '배경음악을 깐 몽타주 편집은 피하라는 조언이 많습니다. 편집 솜씨가 아니라 상대와 대사를 주고받는 배우를 보고 싶기 때문입니다.' },
  { label: '최근 모습, 만족스러운 장면만', body: '지금 모습과 많이 다른 오래된 영상이나 스스로 만족스럽지 않은 장면은 빼는 편이 낫습니다.' },
]

/** 04: 셀프테이프 기본 (작업 순서대로) */
const SELF_TAPE_TIPS = [
  '대사는 외워서 찍습니다. 대본을 보느라 시선이 자주 내려가면 상대와 주고받는 모습이 보이지 않습니다.',
  '상대 대사는 카메라 바로 옆에 앉은 사람이 읽어 줍니다. 혼자 대사를 하고 상대 대사 자리를 비워 두는 방식은 피합니다.',
  '렌즈를 정면으로 보지 말고 카메라 옆의 상대를 봅니다. 화면은 머리 위부터 어깨 조금 아래까지 들어오게 잡습니다.',
  '조용한 방, 단색 벽 앞에서 가로 화면으로 찍고, 빛은 얼굴 앞쪽에서 오게 합니다.',
  '자기소개를 넣을지, 몇 장면을 찍을지는 안내문을 따르고 요청한 장면은 빠짐없이 찍습니다.',
  '가장 좋은 테이크 한두 개만 보내고, 파일 이름에 이름과 배역, 작품명을 적습니다.',
]

/** 가이드 전용 FAQ: 클래스 페이지 REEL_FAQ 와 질문이 겹치지 않게 구성 */
const GUIDE_FAQ: FaqItem[] = [
  {
    q: '출연작이 없어도 출연영상을 만들 수 있나요?',
    a: '만들 수 있습니다. 출연작이 없는 배우는 장면을 새로 찍어 출연영상을 만듭니다. KD4 출연영상 클래스는 본인 레퍼런스로 맞춤 시나리오를 쓰고, 마이즈너 훈련을 병행한 뒤 전문 영화팀이 촬영해 단편 출연영상 1편을 납품합니다. 연기 경험이 적다면 상담에서 순서를 함께 정합니다.',
  },
  {
    q: '출연영상은 몇 분이 적당한가요?',
    a: '해외 캐스팅 디렉터들은 대체로 2분이면 충분하고 3분이면 넉넉하다고 말합니다. 길이보다 중요한 것은 순서입니다. 가장 좋은 장면을 맨 앞에 두고, 스스로 만족스럽지 않은 장면은 빼는 편이 낫습니다.',
  },
  {
    q: '셀프테이프로 찍은 영상을 출연영상에 넣어도 되나요?',
    a: '피하는 편이 안전합니다. 셀프테이프 대본은 아직 공개되지 않은 작품의 것일 수 있어서, 오디션 밖에서 다시 쓰면 문제가 될 수 있습니다. 출연영상에는 사용해도 되는 대본으로 따로 찍은 장면을 넣으세요.',
  },
  {
    q: 'KD4 출연영상 클래스 3가지는 어떻게 다른가요?',
    a: `처음이라면 마이즈너 훈련과 촬영을 함께 하는 ${REEL_MONTHS} 과정 출연영상 클래스로 시작합니다. 이 클래스를 수료하면 롱테이크로 찍는 ${ADVANCED_MONTHS} 과정 출연영상 심화 클래스를, 마이즈너 정규와 출연영상 클래스를 모두 수료했다면 수업 없이 촬영만 하는 1달 완성 클래스를 신청할 수 있습니다.`,
  },
]

const proseStyle: React.CSSProperties = {
  fontSize: 'clamp(0.92rem, 2.2vw, 1rem)',
  color: 'var(--gray-light)',
  lineHeight: 1.9,
  wordBreak: 'keep-all',
}

export default function ActorReelGuidePage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            '@id': `${PAGE_URL}#article`,
            headline: TITLE,
            description:
              '배우 출연영상의 정의, 프로필 영상·셀프테이프와의 차이, 캐스팅 디렉터가 출연영상에서 보는 것, 셀프테이프 기본, KD4 출연영상 클래스의 제작 과정을 정리한 가이드.',
            url: PAGE_URL,
            mainEntityOfPage: PAGE_URL,
            inLanguage: 'ko',
            isAccessibleForFree: true,
            image: `${SITE_URL}/og-heart.jpg`,
            // 저자 = 기관(대표 집필·감수 확인 전에는 Person 금지, 07 감사 A8·B6). @id만 두면 이름이 안 붙어 인라인 명시
            author: { '@type': 'Organization', '@id': `${SITE_URL}#org`, name: 'KD4 액팅 스튜디오' },
            publisher: { '@id': `${SITE_URL}#org` },
            datePublished: LAST_UPDATED.reelGuide,
            dateModified: LAST_UPDATED.reelGuide,
            isPartOf: { '@id': `${SITE_URL}#website` },
            // 출연영상 용어는 다른 페이지에서 정의하지 않으므로 여기서 한 번만 정의
            about: {
              '@type': 'DefinedTerm',
              '@id': `${PAGE_URL}#term-reel`,
              name: '출연영상',
              alternateName: ['쇼릴', '데모릴'],
              description: DEFINITION,
            },
            mentions: [
              { '@id': `${SITE_URL}/reel-production-class#course-reel-production-class` },
              { '@id': `${SITE_URL}/advanced-reel-class#course-advanced-class` },
              { '@id': `${SITE_URL}/one-month-reel-class#course-1-month-film-class` },
            ],
          },
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '배우 출연영상이란', url: PAGE_URL },
          ]),
          buildFaqPage(GUIDE_FAQ, PAGE_URL),
        ]}
      />

      {/* ===== HERO: 첫 문단이 직답(정의 2문장) ===== */}
      <section aria-label="배우 출연영상 개요" style={{ padding: 'clamp(64px, 11vw, 100px) 24px clamp(48px, 9vw, 76px)', background: 'var(--navy)', color: '#fff' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            <span lang="en">GUIDE</span> · 배우 포트폴리오
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)', lineHeight: 1.35, marginBottom: '20px', wordBreak: 'keep-all' }}>
            배우 출연영상이란 무엇인가
          </h1>
          <p className="section-desc" style={{ color: 'rgba(255,255,255,0.88)', maxWidth: '720px' }}>
            {DEFINITION}
          </p>
        </div>
      </section>

      {/* ===== 01: 정의 ===== */}
      <section aria-label="출연영상의 정의" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">01 · DEFINITION</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>출연영상이란</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={proseStyle}>출연영상은 배우 포트폴리오에서 연기를 보여주는 부분입니다. 영어권에서는 쇼릴 또는 데모릴이라고 부릅니다.</p>
            <p style={proseStyle}>프로필 사진으로는 연기가 보이지 않습니다. 캐스팅 디렉터는 영상으로 배우의 표정과 호흡, 상대 대사에 어떻게 반응하는지를 확인합니다.</p>
            <p style={proseStyle}>출연작이 쌓인 배우는 출연한 작품에서 좋은 장면을 골라 편집해 만듭니다. 출연작이 아직 없거나 적은 배우는 시나리오를 따로 준비해 장면을 새로 촬영하는 방식으로 만듭니다.</p>
            <p style={proseStyle}>어느 쪽이든 기준은 같습니다. 화면 속 배우가 누구인지 분명해야 하고, 그 배우의 연기가 잘 보이고 잘 들려야 합니다.</p>
          </div>
        </div>
      </section>

      {/* ===== 02: 세 영상의 차이 ===== */}
      <section aria-label="출연영상, 프로필 영상, 셀프테이프의 차이" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">02 · DIFFERENCE</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>출연영상, 프로필 영상, 셀프테이프는 어떻게 다른가</h2>
          <p style={{ ...proseStyle, marginBottom: '20px' }}>셋 다 배우가 카메라 앞에 선 영상이지만, 담는 것과 쓰는 때가 다릅니다.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {KINDS.map(({ Icon, title, titleKo, body }) => (
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

      {/* ===== 03: 캐스팅 디렉터가 보는 것 ===== */}
      <section aria-label="캐스팅 디렉터가 출연영상에서 보는 것" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">03 · CASTING</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>캐스팅 디렉터가 출연영상에서 보는 것</h2>
          <p style={{ ...proseStyle, marginBottom: '20px' }}>
            아래는 해외 캐스팅 디렉터 협회와 현업 캐스팅 디렉터들이 공개한 가이드에 공통으로 나오는 기준입니다. 국내 오디션은 공고마다 요구가 다르니, 안내문이 있으면 안내문을 먼저 따르세요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {CASTING_POINTS.map(({ label, body }) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(20px, 3.5vw, 26px)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700, marginBottom: '10px', wordBreak: 'keep-all' }}>{label}</h3>
                <p style={proseStyle}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 04: 셀프테이프 기본 ===== */}
      <section aria-label="셀프테이프를 찍을 때 기본" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">04 · SELF-TAPE</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>셀프테이프를 찍을 때 기본</h2>
          <p style={{ ...proseStyle, marginBottom: '20px' }}>
            셀프테이프는 캐스팅 측 안내문이 가장 먼저입니다. 안내가 따로 없을 때 캐스팅 디렉터들이 공통으로 권하는 기본은 이렇습니다.
          </p>
          <ol role="list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none' }}>
            {SELF_TAPE_TIPS.map((tip, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', alignItems: 'start', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', background: 'var(--navy-tint-1)', borderRadius: '999px', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </span>
                <span style={proseStyle}>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== 05: KD4에서 만들기 ===== */}
      <section aria-label="KD4에서 출연영상 만들기" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">05 · KD4</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>KD4에서 출연영상 만들기</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={proseStyle}>
              KD4 액팅 스튜디오는 출연영상 클래스를 {REEL_COURSE}로 운영합니다. {REEL.schedule}, 회당 {REEL.duration}, 정원 {REEL.capacity}
              {REEL.instructor ? `이며 ${REEL.instructor}가 지도합니다.` : '입니다.'} 월 수강료는 {wonOf('출연영상 클래스')}입니다.
            </p>
            <p style={proseStyle}>
              제작은 네 단계입니다. 본인 톤에 맞는 레퍼런스를 함께 모으고, 그 레퍼런스로 본인 전용 시나리오를 쓰고, 전문 영화팀이 카메라·조명·사운드를 갖춰 촬영하고, 컬러 그레이딩과 사운드 디자인까지 마쳐 납품합니다. 상대역과 함께하는 2인 장면을 찍습니다.
            </p>
            <p style={proseStyle}>
              석 달 동안 마이즈너 테크닉 훈련을 함께 하며 촬영을 준비합니다. 첫째 달에는 감정 해방 훈련과 레피티션으로 상대에게 반응하는 기본기를 다지고 레퍼런스를 모읍니다. 둘째 달에는 대본을 받아 리딩과 캐릭터 작업을 하고, 셋째 달에는 감독이 참관하는 테스트 촬영과 장면 디벨롭을 거쳐 본 촬영을 합니다.
            </p>
            <p style={proseStyle}>
              결과물은 단편 출연영상 1편이 기본입니다. 영상 소유권은 KD4가 갖되, 멤버는 오디션 제출과 SNS, 포트폴리오 등 캐스팅 활동에 자유롭게 쓸 수 있습니다. 추가 촬영 회차나 재편집은 별도 견적입니다.
            </p>
            <p style={proseStyle}>
              출연영상 클래스를 수료한 멤버는 롱테이크로 찍는 {ADVANCED_MONTHS} 과정의 출연영상 심화 클래스로 이어갈 수 있습니다. 마이즈너 테크닉 정규 클래스와 출연영상 클래스를 모두 수료했다면, 수업 없이 촬영만 하는 출연영상 1달 완성 클래스도 신청할 수 있습니다.
            </p>
            <p style={proseStyle}>
              오디션 독백을 따로 준비하고 싶다면 <Link href="/audition-technique-class" style={{ color: 'var(--navy)', fontWeight: 600 }}>오디션 테크닉 클래스</Link>도 있습니다.
            </p>
            <p style={proseStyle}>
              완성된 출연영상은 KD4의 캐스팅 연계에 쓰입니다. 다만 캐스팅은 작품과 배역에 따라 정해지는 것이라 결과는 사람마다 다릅니다. 파트너와 함께 촬영하는 과정이라 2회차 수업 이후에는 중도 하차가 원칙적으로 어렵습니다.
            </p>
            <p style={proseStyle}>
              어떤 클래스부터 시작할지 모르겠다면 무료 상담에서 지금 상태에 맞는 순서를 안내받을 수 있습니다. 이름과 연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
            <Link href={CLASS_URL} className="btn-primary">
              출연영상 클래스 자세히 보기
            </Link>
            <Link href={`${CLASS_URL}#form`} className="btn-outline">
              무료 상담 신청
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section aria-label="출연영상 자주 묻는 질문" style={{ padding: 'clamp(56px, 9vw, 88px) 0', background: 'var(--bg2)' }}>
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
          {[
            { href: CLASS_URL, label: '출연영상 클래스' },
            { href: '/advanced-reel-class', label: '출연영상 심화 클래스' },
            { href: '/one-month-reel-class', label: '출연영상 1달 완성 클래스' },
            { href: '/audition-technique-class', label: '오디션 테크닉 클래스' },
            { href: '/meisner-technique', label: '마이즈너 테크닉이란' },
            { href: '/faq', label: '전체 FAQ' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
