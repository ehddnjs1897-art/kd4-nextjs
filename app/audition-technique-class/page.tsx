import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CLASSES } from '@/lib/classes'
import type { FaqItem } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/audition-technique-class`

/** 데이터 원본은 lib/classes.ts 하나 — 가격·정원·시간을 이 파일에 다시 적지 않는다 */
const AUDITION = CLASSES.find((c) => c.nameKo === '오디션 테크닉 클래스')!

export const metadata: Metadata = {
  title: '오디션 테크닉 클래스 — 오디션 독백·에티튜드·모의 오디션 3개월',
  description:
    '오디션에서 통하는 나만의 독백을 만들고, 오디션 현장 에티튜드와 실전 변수 대응까지 훈련하는 3개월 클래스. 이미지 브랜딩 → 연기 고도화 → 모의 오디션. 정원 6명 소수정예, 월 4회·회당 4시간, 월 250,000원. 서울 신촌 이대역 도보 3분 KD4 액팅 스튜디오.',
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
    description: '오디션 독백 만들기 · 현장 에티튜드 · 모의 오디션까지 3개월. 정원 6명 소수정예, 월 4회·회당 4시간, 월 250,000원.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '오디션 테크닉 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '오디션 테크닉 클래스 | KD4 액팅 스튜디오',
    description: '오디션 독백 만들기 · 현장 에티튜드 · 모의 오디션까지 3개월. 정원 6명 소수정예, 월 250,000원.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '오디션 테크닉 클래스 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

/** 추천 대상 — 노션 「KD4 오디션 테크닉 정규 클래스 · 모집」 원문 그대로 */
const AUDIENCE = [
  '준비한 게 오디션에서 실제로 나오지 않는 배우',
  '카메라 앞에서 긴장이 풀리지 않는 배우',
  '자신의 매력을 아직 모르는 배우',
  '오디션 에티튜드가 부족하다고 느끼는 배우',
  '캐스팅 디렉터의 시선을 배우고 싶은 배우',
  '오디션 보러 가는 독백 레퍼토리가 없는 배우',
]

/** 3개월 커리큘럼 — 노션 「오디션 테크닉」(7. 커리큘럼 안내) 원문 요약. 원본 수정은 노션에서만 */
const CURRICULUM = [
  {
    month: '1개월 차',
    title: '이미지 브랜딩 및 독백 선정',
    goal: '본인의 정확한 배우 포지셔닝을 확립하고, 이에 맞는 최적의 독백을 무기로 만들기',
    weeks: [
      { w: '1주차', h: '오리엔테이션 · 이미지 프리즘', d: '내가 밀고 있는 이미지와 남이 보는 첫인상을 맞춰 보고, 프로필 사진을 진단해 이미지 방향을 정합니다.' },
      { w: '2주차', h: '배우 포지셔닝 · 1차 독백 매칭', d: '지금 드라마·영화 시장에서 나와 비슷한 포지션의 기성 배우를 분석하고, 준비해 온 독백이 내 이미지에 맞는지 1차로 걸러냅니다.' },
      { w: '3주차', h: '독백 확정 · 텍스트 분석', d: '각자의 «인생 독백»을 확정하고 서사·서브텍스트·목적을 분석해 캐릭터를 구체화합니다.' },
      { w: '4주차', h: '1차 중간 점검 (카메라 테스트)', d: '확정한 독백을 카메라 앞에서 읽고, 모니터링으로 시선 처리·톤·습관을 1차 교정합니다.' },
    ],
  },
  {
    month: '2개월 차',
    title: '연기 고도화 및 오디션 테크닉',
    goal: '독백의 완성도를 끌어올리고, 오디션장에서 벌어지는 변수(지정 대사·디렉션 변경)에 대응하는 훈련',
    weeks: [
      { w: '5주차', h: '디테일 연기 훈련', d: '대사의 맛을 살리는 화술(포즈·호흡·장단음)을 교정하고, 매체 연기에 맞는 미세한 표정과 신체 활용을 다룹니다.' },
      { w: '6주차', h: '오디션 에티튜드 · 멘탈 브랜딩', d: '문을 열고 들어와 나가기까지의 태도(워킹·인사·아이컨택), 긴장 완화와 자신감 연출법을 훈련합니다.' },
      { w: '7~8주차', h: '실전 변수 대응 (2차 카메라 테스트)', d: '10분 전에 받은 대본을 빠르게 분석하는 법, 심사위원의 갑작스러운 디렉션에 대처하는 훈련을 합니다.' },
    ],
  },
  {
    month: '3개월 차',
    title: '모의 오디션 및 실전 마스터',
    goal: '실제 오디션 환경을 그대로 재현하고, 최종 피드백으로 현장에 바로 들어갈 준비를 마치기',
    weeks: [
      { w: '9주차', h: '심화 — 2차 독백 개발', d: '기존 독백과 상반되는, 또는 특정 무기로 쓸 수 있는 2차 독백을 완성합니다. (사투리·사극 독백 등)' },
      { w: '10주차', h: '1차 종합 시뮬레이션 (전 과정 녹화)', d: '입장 → 자기소개 → 자유 독백 → 지정 대사 → Q&A → 퇴장 전 과정을 롤플레잉하고 블라인드 피드백을 받습니다.' },
      { w: '11주차', h: '최종 파이널 디렉팅 · 모니터링', d: '녹화본을 프레임 단위로 수정하고, 메이크업·의상 팁을 포함한 개인별 오디션 가이드라인을 점검합니다.' },
      { w: '12주차', h: '최종 모의 오디션', d: '실제 오디션장과 거의 같은 환경에서 최종 모의 오디션을 치르고, 개인별 최종 피드백 리포트를 받습니다.' },
    ],
  },
]

/** 참여 배우 후기 — 노션 원문 그대로 인용 */
const REVIEWS = [
  {
    body: '솔직함을 어떻게 잘 전달할지 고민하게 해주는 수업이었습니다. 하루 100명 넘게 오디션 보는 사람의 입장에서 다시 생각해보게 됐고, 객관적으로 마이너스 요인이 될 수 있는 디테일을 정확히 잡아주셨습니다.',
    who: '채병욱 배우',
  },
  {
    body: '입장하는 태도부터 자기소개까지, 어떤 말과 태도가 유리한지 불리한지 설명이 매우 설득력 있었습니다. 각 배우마다 코멘트가 정확하고 섬세해서 도움이 되었습니다.',
    who: '김마고 배우',
  },
  {
    body: '오디션에 임하는 자세부터 어떤 독백을 준비해야 하는지, 인터뷰, 오디션 마무리까지. 그동안 갈피를 못 잡던 부분들을 경험 많은 배우님을 통해 해결할 수 있었습니다.',
    who: '배승헌 배우',
  },
]

/** 이 페이지 전용 FAQ — 노션 모집 페이지 FAQ + 기존 보강 규정(멤버 혜택)에서만 가져온다 */
const AUDITION_FAQ: FaqItem[] = [
  {
    q: '이미 다른 클래스를 듣고 있는데 같이 들을 수 있나요?',
    a: '가능합니다. 같은 달에 두 개 이상의 클래스를 함께 수강하면 추가하는 클래스 수강료를 15% 할인해 드립니다.',
  },
  {
    q: '결석하면 보강을 받을 수 있나요?',
    a: '부득이하게 결석하시는 경우 스케줄표에 있는 다른 수업 클래스에서 보강을 받으실 수 있습니다. 보강은 수업 3일 전까지 카카오채널로 신청해 주세요.',
  },
  {
    q: '독백을 미리 준비해 가야 하나요?',
    a: '첫 주에는 프로필과 출연영상만 준비해 오시면 됩니다. 독백은 2주차에 함께 읽어 보고 3주차에 본인에게 맞는 «인생 독백»으로 확정합니다.',
  },
]

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
          <div style={cardStyle}>
            <p style={proseStyle}>
              오디션 테크닉 클래스는 <strong style={{ color: '#111' }}>{AUDITION.instructor}</strong>가 진행합니다. 심사하는 자리와 오디션을 보는 자리를 모두 겪은 현역 배우가, 캐스팅 관계자에게 실제로 어떻게 보이는지를 기준으로 코멘트합니다.
            </p>
            <Link href="/acting-coaches#sebin" className="btn-outline" style={{ display: 'inline-block', marginTop: '18px' }}>
              액팅 코치 이력 보기
            </Link>
          </div>
        </div>
      </section>

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
