import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, Lock, Sparkles } from 'lucide-react'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

const PAGE_PATH = '/benefits/move1-dance-studio'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const SPACECLOUD_URL = 'https://www.spacecloud.kr/space/81160'

/**
 * 무브원 댄스스튜디오 제휴 안내.
 *
 * ⚠️ 예약 연락처·예약 멘트는 무브원 요청으로 외부 공개 금지(위반 시 패널티 청구) →
 *    로그인한 멤버에게만 서버에서 렌더한다. 공개 영역에는 절대 넣지 말 것.
 */
export const metadata: Metadata = {
  title: '무브원 댄스스튜디오 제휴',
  description:
    'KD4 액팅 스튜디오 × 무브원 댄스스튜디오 공식 제휴 — KD4 멤버는 스튜디오 바로 지하의 댄스 연습실을 시간당 10,000원(정가 15,000원)에 대관할 수 있습니다. 거울과 컨디션을 갖춘 연습실에서 수업 외 시간에도 연습하세요.',
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  keywords: ['무브원 댄스스튜디오', 'KD4 멤버 혜택', '신촌 연습실', '이대역 연습실', '배우 연습실 대관', 'KD4 제휴'],
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '무브원 댄스스튜디오 제휴 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 전용 — 스튜디오 바로 지하 연습실 시간당 10,000원 (정가 15,000원)',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 × 무브원 댄스스튜디오' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '무브원 댄스스튜디오 제휴 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 전용 — 스튜디오 바로 지하 연습실 시간당 10,000원 (정가 15,000원)',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 × 무브원 댄스스튜디오' }],
  },
}

/** 멤버 전용 — 무브원 요청으로 비로그인 노출 금지 */
const MEMBER_ONLY = {
  phoneDisplay: '010-5905-9805',
  phoneTel: 'tel:01059059805',
  keyword: 'KD4 멤버입니다',
}

const GUIDE = [
  { label: '위치', desc: 'KD4 액팅 스튜디오 바로 지하 (무브원 댄스스튜디오)' },
  { label: '대상', desc: 'KD4 액팅 스튜디오 멤버' },
  { label: '연습실', desc: '거울이 있는 단독 연습실. 컨디션이 좋아 수업 외 개인 연습·리허설에 적합합니다.' },
]

const CAUTIONS = [
  '사용 후 깨끗이 정리해 주세요.',
  '이 할인은 KD4 멤버만 받을 수 있습니다. 예약 연락처와 이용 방법을 외부에 공유하지 말아 주세요. 확인될 경우 패널티 금액이 청구됩니다.',
]

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display), Oswald, sans-serif',
  fontSize: '0.7rem',
  letterSpacing: '0.25em',
  color: 'var(--gold)',
  textTransform: 'uppercase',
  marginBottom: '14px',
}

const proseStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.92rem',
  color: 'var(--secondary)',
  lineHeight: 1.8,
  wordBreak: 'keep-all',
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: '28px', textAlign: 'center' }}>
      <p style={eyebrowStyle}><span lang="en">{eyebrow}</span></p>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 3.6vw, 1.85rem)', fontWeight: 700, color: 'var(--white)', marginBottom: desc ? '12px' : 0, lineHeight: 1.35 }}>
        {title}
      </h2>
      {desc && <p style={{ ...proseStyle, maxWidth: 520, margin: '0 auto' }}>{desc}</p>}
    </div>
  )
}

/** 워드마크 — 무브원 로고 파일이 없어 텍스트 마크로 대체 */
function Move1Mark({ px = 72 }: { px?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: px, height: px, flexShrink: 0, borderRadius: 8, background: 'var(--navy)', color: '#fff',
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
        fontFamily: 'var(--font-display), Oswald, sans-serif', letterSpacing: '0.08em', lineHeight: 1,
      }}
    >
      <span style={{ fontSize: px * 0.24, fontWeight: 700 }}>MOVE1</span>
      <span style={{ fontSize: px * 0.12, opacity: 0.75 }}>DANCE</span>
    </span>
  )
}

export default async function Move1PartnershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isMember = Boolean(user)

  return (
    <div style={{ paddingTop: '64px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--white)' }}>
      <PageJsonLd
        schemas={[
          buildWebPage({
            idPath: `${PAGE_PATH}#webpage`,
            url: PAGE_URL,
            name: '무브원 댄스스튜디오 제휴 | KD4 액팅 스튜디오',
            description: 'KD4 멤버 전용 — 스튜디오 바로 지하 댄스 연습실 시간당 10,000원 대관 (정가 15,000원).',
            dateModified: '2026-09-08',
            speakableCssSelectors: ['h1', 'h2'],
          }),
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '멤버 혜택', url: `${SITE_URL}/benefits` },
            { name: '무브원 댄스스튜디오 제휴', url: PAGE_URL },
          ]),
        ]}
      />

      {/* ===== HERO ===== */}
      <section aria-label="무브원 댄스스튜디오 제휴 개요" style={{ background: 'var(--navy)', color: '#fff', padding: 'clamp(56px, 10vw, 88px) 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <Move1Mark px={104} />
          <p style={{ ...eyebrowStyle, color: 'rgba(255,255,255,0.75)', marginBottom: 0 }}><span lang="en">OFFICIAL PARTNERSHIP</span></p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4.2vw, 2.3rem)', fontWeight: 700, lineHeight: 1.35, wordBreak: 'keep-all' }}>
            무브원 댄스스튜디오 제휴
          </h1>
          <p style={{ ...proseStyle, color: 'rgba(255,255,255,0.88)', maxWidth: 560 }}>
            KD4 액팅 스튜디오 바로 지하에 있는 무브원 댄스스튜디오와 제휴를 맺었습니다. 수업이 없는 시간에도 가까운 연습실에서 편하게 연습하세요.
          </p>
        </div>
      </section>

      {/* ===== 혜택 ===== */}
      <section aria-label="KD4 멤버 전용 대관 할인" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 76px) 24px' }}>
        <SectionHeader eyebrow="MEMBER BENEFIT" title="KD4 멤버 전용 대관 할인" desc="KD4 멤버임을 밝히면 아래 단가로 이용할 수 있습니다." />
        <div style={{ maxWidth: 420, margin: '0 auto', background: '#ffffff', border: '1.5px solid rgba(21,72,138,0.18)', borderRadius: 12, padding: 'clamp(24px, 4vw, 32px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: 'var(--gold)' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: 10 }}>연습실 대관</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--gray)', textDecoration: 'line-through', marginBottom: 4 }}>
            시간당 15,000원
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem, 5vw, 2.4rem)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
            시간당 10,000원
          </p>
        </div>
      </section>

      {/* ===== 연습실 안내 ===== */}
      <section aria-label="연습실 안내" style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px clamp(48px, 8vw, 76px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GUIDE.map((g) => (
            <div key={g.label} style={{ display: 'flex', gap: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)', minWidth: 56, flexShrink: 0 }}>{g.label}</span>
              <span style={{ ...proseStyle, flex: 1, minWidth: 180 }}>{g.desc}</span>
            </div>
          ))}
          <a
            href={SPACECLOUD_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', textDecoration: 'none', border: '1.5px solid rgba(21,72,138,0.25)', borderRadius: 10, padding: '13px 18px' }}
          >
            <Sparkles aria-hidden={true} size={16} strokeWidth={2} />
            연습실 사진·시설 보기
            <ExternalLink aria-hidden={true} size={14} strokeWidth={2} />
          </a>
        </div>
      </section>

      {/* ===== 예약 방법 — 멤버 전용 ===== */}
      <section aria-label="예약 방법" style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px clamp(48px, 8vw, 76px)' }}>
        <SectionHeader eyebrow="HOW TO BOOK" title="예약 방법" />
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {isMember ? (
            <div style={{ background: '#ffffff', border: '1.5px solid rgba(21,72,138,0.18)', borderRadius: 12, padding: 'clamp(22px, 4vw, 30px)' }}>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <li style={{ display: 'flex', gap: 14 }}>
                  <span aria-hidden style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', paddingTop: 3 }}>01</span>
                  <span style={proseStyle}>
                    문자로 예약하세요 —{' '}
                    <a href={MEMBER_ONLY.phoneTel} style={{ color: 'var(--navy)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                      {MEMBER_ONLY.phoneDisplay}
                    </a>
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 14 }}>
                  <span aria-hidden style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', paddingTop: 3 }}>02</span>
                  <span style={proseStyle}>
                    예약할 때 <strong style={{ color: 'var(--white)', fontWeight: 700 }}>&ldquo;{MEMBER_ONLY.keyword}&rdquo;</strong>라고 꼭 말씀해 주세요. 이 한마디로 할인 단가가 적용됩니다.
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px dashed rgba(21,72,138,0.35)', borderRadius: 12, padding: 'clamp(24px, 4vw, 32px)', textAlign: 'center' }}>
              <Lock aria-hidden={true} size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
                예약 연락처는 KD4 멤버에게만 공개됩니다
              </p>
              <p style={{ ...proseStyle, maxWidth: 420, margin: '0 auto 20px' }}>
                무브원 요청에 따라 예약 연락처와 이용 방법은 외부에 공개하지 않습니다. 로그인하시면 바로 확인할 수 있습니다.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href={`/auth/login?next=${PAGE_PATH}`} className="btn-primary" style={{ background: 'var(--navy)', color: '#fff' }}>
                  로그인하고 확인하기
                </Link>
                <Link href="/join" className="btn-outline">수강 상담 신청</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== 유의사항 ===== */}
      <section aria-label="이용 시 유의사항" style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px clamp(56px, 9vw, 88px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 'clamp(20px, 3.5vw, 28px)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)', marginBottom: 14 }}>꼭 지켜주세요</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CAUTIONS.map((c, i) => (
              <li key={i} style={{ display: 'flex', gap: 10 }}>
                <span aria-hidden style={{ color: 'var(--navy)', fontWeight: 700, flexShrink: 0 }}>·</span>
                <span style={proseStyle}>{c}</span>
              </li>
            ))}
          </ul>
          <p style={{ ...proseStyle, fontSize: '0.85rem', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            좋은 조건을 만들어 주신 무브원 댄스스튜디오에 감사드립니다.
          </p>
        </div>
      </section>

      {/* ===== 크로스링크 ===== */}
      <section aria-label="관련 페이지 바로가기" style={{ padding: '28px 24px 48px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/benefits" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            <span aria-hidden="true">← </span>전체 멤버 혜택
          </Link>
          <Link href="/benefits/mom-pt-pilates" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            재활PT · 필라테스 제휴
          </Link>
          <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>
            전체 클래스 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
