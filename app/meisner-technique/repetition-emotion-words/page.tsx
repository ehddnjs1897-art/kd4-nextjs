import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Download, Eye, Quote } from 'lucide-react'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { LAST_UPDATED } from '@/lib/last-updated'
import { buildBreadcrumb } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
import { EMOTION_GROUPS, REPETITION_IMAGE_PATH, REPETITION_INTRO, USAGE_TIPS } from '@/lib/repetition-emotion-words'

const PAGE_PATH = '/meisner-technique/repetition-emotion-words'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const GUIDE_URL = '/meisner-technique'
const CLASS_URL = '/meisner-technique-class'
/** 공유용 이미지 — `npx tsx scripts/render-repetition-words.ts` 로 생성 (1080×2340). 페이지 파일은 추가 export 불가라 lib 상수 사용 */
const IMAGE_PATH = REPETITION_IMAGE_PATH

const TITLE = '레피티션 감정 어휘 정리 — 12가지 감정의 약함→강함 단계와 관찰 문장'
const DESC =
  '마이즈너 레피티션 훈련용 감정 어휘표. 기쁨·슬픔·분노·두려움 등 12가지 감정을 약한 단계에서 강한 단계로 정리하고, 해석 대신 "본 것"을 말하는 신체 관찰 문장을 함께 실었습니다. 카톡·인스타 공유용 이미지 제공.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: ['레피티션', '레피티션 감정 어휘', '감정 단어 정리', '마이즈너 레피티션', '레피티션 연습', '감정 표현 단어', '연기 감정 어휘', '마이즈너 테크닉'],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'article',
    url: PAGE_URL,
    title: TITLE,
    description: DESC,
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '레피티션 감정 어휘 정리 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: '12가지 감정을 약함→강함 단계로, 해석 대신 본 것을 말하는 관찰 문장과 함께 정리한 레피티션 훈련 자료.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: '레피티션 감정 어휘 정리 — KD4 액팅 스튜디오', type: 'image/jpeg' }],
  },
}

const proseStyle: React.CSSProperties = {
  fontSize: 'clamp(0.92rem, 2.2vw, 1rem)',
  color: 'var(--gray-light)',
  lineHeight: 1.9,
  wordBreak: 'keep-all',
}

/** 약함→강함을 네이비 농도로 표현. 앞쪽은 옅은 배경+네이비 글자, 뒤쪽은 진한 배경+흰 글자 */
function chipStyle(i: number, n: number): React.CSSProperties {
  const t = n <= 1 ? 1 : i / (n - 1)
  const alpha = 0.07 + t * 0.85
  const dark = alpha > 0.45
  return {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '999px',
    background: `rgba(21,72,138,${alpha.toFixed(2)})`,
    color: dark ? '#fff' : 'var(--navy)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    fontWeight: dark ? 600 : 500,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  }
}

export default function RepetitionEmotionWordsPage() {
  return (
    <div style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            '@id': `${PAGE_URL}#article`,
            headline: TITLE,
            description: DESC,
            url: PAGE_URL,
            mainEntityOfPage: PAGE_URL,
            inLanguage: 'ko',
            isAccessibleForFree: true,
            image: `${SITE_URL}${IMAGE_PATH}`,
            author: { '@type': 'Organization', '@id': `${SITE_URL}#org`, name: 'KD4 액팅 스튜디오' },
            publisher: { '@id': `${SITE_URL}#org` },
            datePublished: LAST_UPDATED.repetitionWords,
            dateModified: LAST_UPDATED.repetitionWords,
            isPartOf: { '@id': `${SITE_URL}#website` },
            about: { '@id': `${SITE_URL}/meisner-technique-class#term-meisner` },
            mentions: [{ '@id': `${SITE_URL}/meisner-technique-class#course-meisner-technique-class` }],
          },
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '마이즈너 테크닉이란', url: `${SITE_URL}${GUIDE_URL}` },
            { name: '레피티션 감정 어휘 정리', url: PAGE_URL },
          ]),
        ]}
      />

      {/* ===== HERO ===== */}
      <section aria-label="레피티션 감정 어휘 개요" style={{ padding: 'clamp(64px, 11vw, 100px) 24px clamp(48px, 9vw, 76px)', background: 'var(--navy)', color: '#fff' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            <span lang="en">GUIDE</span> · 레피티션 훈련 자료
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)', lineHeight: 1.35, marginBottom: '20px', wordBreak: 'keep-all' }}>
            레피티션 감정 어휘 정리
          </h1>
          <p className="section-desc" style={{ color: 'rgba(255,255,255,0.88)', maxWidth: '720px' }}>
            {REPETITION_INTRO.what} &ldquo;너 지금 ○○하네&rdquo; / &ldquo;○○해 보이네&rdquo; 형태로 사용합니다. 12가지 감정을 약한 단계에서 강한 단계로 정리했고, 감정 단어 대신 쓸 수 있는 신체 관찰 문장을 함께 실었습니다.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
            <a href="#words" className="btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
              어휘표 바로 보기
            </a>
            <a href={IMAGE_PATH} download="KD4_레피티션_감정어휘.png" className="btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Download aria-hidden={true} size={16} strokeWidth={2} /> 이미지로 저장
            </a>
          </div>
        </div>
      </section>

      {/* ===== 01 — 사용 원칙 ===== */}
      <section aria-label="레피티션 어휘 사용 원칙" style={{ padding: 'clamp(48px, 8vw, 72px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <p className="section-eyebrow"><span lang="en">01 — RULES</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '20px' }}>먼저, 네 가지 원칙</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {USAGE_TIPS.map((tip, i) => (
              <div key={tip.head} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--navy)', fontWeight: 700, paddingTop: '4px', flexShrink: 0 }}>
                  0{i + 1}
                </span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '6px', wordBreak: 'keep-all' }}>{tip.head}</h3>
                  <p style={{ ...proseStyle, fontSize: '0.88rem', lineHeight: 1.7 }}>{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 02 — 12가지 감정 어휘표 ===== */}
      <section id="words" aria-label="12가지 감정 어휘표" style={{ scrollMarginTop: '80px', padding: 'clamp(48px, 8vw, 72px) 0 clamp(56px, 9vw, 88px)', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <p className="section-eyebrow"><span lang="en">02 — WORDS</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '10px' }}>12가지 감정, 약함에서 강함으로</h2>
          <p style={{ ...proseStyle, marginBottom: '24px' }}>
            {REPETITION_INTRO.order} 색이 짙어질수록 강한 상태입니다. 아래 두 줄은 감정 이름을 붙이기 전에 먼저 말할 수 있는 &ldquo;본 것&rdquo;의 예시입니다.
          </p>
          <div className="rep-words-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            {EMOTION_GROUPS.map((g) => (
              <article key={g.no} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(18px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <header style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.1em', color: 'var(--navy)', fontWeight: 700 }}>
                    {String(g.no).padStart(2, '0')}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', fontWeight: 700, wordBreak: 'keep-all' }}>{g.title}</h3>
                </header>
                <ol aria-label={`${g.title} 감정 단계, 약함에서 강함 순`} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {g.scale.map((w, i) => (
                    <li key={w} style={chipStyle(i, g.scale.length)}>{w}</li>
                  ))}
                </ol>
                <ul aria-label="본 것을 말하는 예시" style={{ listStyle: 'none', padding: '12px 0 0', margin: 0, borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {g.cues.map((c) => (
                    <li key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: '#111', wordBreak: 'keep-all' }}>
                      <Quote aria-hidden={true} size={13} color="var(--navy)" strokeWidth={2} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span>&ldquo;{c}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 03 — 이미지로 저장 ===== */}
      <section aria-label="어휘표 이미지 저장" style={{ padding: 'clamp(48px, 8vw, 72px) 0', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="rep-save-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 'clamp(20px, 4vw, 36px)', alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(20px, 3.5vw, 32px)' }}>
            <div>
              <p className="section-eyebrow"><span lang="en">03 — SAVE</span></p>
              <h2 className="section-title-serif" style={{ marginBottom: '12px', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>폰에 넣어 두고 쓰는 한 장</h2>
              <p style={{ ...proseStyle, marginBottom: '20px' }}>
                같은 내용을 한 장의 이미지로 만들었습니다. 저장해 두면 레피티션 스터디나 연습 전에 바로 꺼내 볼 수 있고, 카카오톡·인스타그램으로 파트너에게 공유하기도 편합니다.
              </p>
              <a href={IMAGE_PATH} download="KD4_레피티션_감정어휘.png" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Download aria-hidden={true} size={16} strokeWidth={2} /> 이미지 저장하기
              </a>
            </div>
            <a href={IMAGE_PATH} target="_blank" rel="noopener" aria-label="어휘표 이미지 크게 보기" style={{ display: 'block', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', background: '#fff', justifySelf: 'center', width: '100%', maxWidth: '220px' }}>
              <Image src={IMAGE_PATH} alt="레피티션 감정 어휘 정리 이미지 미리보기" width={1080} height={2340} sizes="220px" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== 04 — 어디서 훈련하나 ===== */}
      <section aria-label="레피티션 훈련 안내" style={{ padding: 'clamp(48px, 8vw, 72px) 0', background: 'var(--bg2)' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <p className="section-eyebrow"><span lang="en">04 — PRACTICE</span></p>
          <h2 className="section-title-serif" style={{ marginBottom: '16px' }}>어휘는 재료, 훈련은 둘이서</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={proseStyle}>
              <Eye aria-hidden={true} size={15} color="var(--navy)" strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
              레피티션은 상대의 반응을 재료로 쓰는 훈련이라 혼자서는 성립하지 않습니다. 이 표는 단어를 외우라고 만든 것이 아니라, 상대를 보다가 말이 막힐 때 꺼내 쓰는 보조 도구입니다.
            </p>
            <p style={proseStyle}>
              KD4 마이즈너 테크닉 정규 클래스는 첫째 달에 레피티션 3단계로 시작하고, 멤버 커뮤니티 &ldquo;레피티션 스터디&rdquo;에서는 KD4 멤버가 아니어도 자율적으로 모여 훈련할 수 있습니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
            <Link href={CLASS_URL} className="btn-primary">마이즈너 정규 클래스 보기</Link>
            <Link href="/benefits" className="btn-outline">레피티션 스터디 안내</Link>
          </div>
        </div>
      </section>

      {/* ===== 관련 페이지 크로스링크 ===== */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '32px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href={GUIDE_URL} style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            <span aria-hidden="true">← </span>마이즈너 테크닉이란
          </Link>
          <Link href={CLASS_URL} style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            마이즈너 테크닉 정규 클래스 <span aria-hidden="true">→</span>
          </Link>
          <Link href="/monologues" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            독백 대본 모음
          </Link>
          <Link href="/faq" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            전체 FAQ
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 720px) {
          .rep-words-grid { grid-template-columns: 1fr !important; }
          .rep-save-card { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
