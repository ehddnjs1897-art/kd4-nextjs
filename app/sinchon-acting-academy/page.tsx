import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Train, Clock, Navigation, Map as MapIcon } from 'lucide-react'
import { SINCHON_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildWebPage } from '@/lib/seo-schemas'
import { SITE_URL } from '@/lib/constants'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const PAGE_URL = `${SITE_URL}/sinchon-acting-academy`

// 위치 / 길찾기 (구글 지도 임베드 제거 — 약도가 메인)
const ADDRESS_FULL = '서울시 서대문구 이화여대1안길 12 아리움3차 1층 101호'
const PLACE_Q = encodeURIComponent('KD4 액팅 스튜디오')
// 길찾기 버튼은 상호명으로 검색 (주소로 하면 '아리움3차오피스텔'이 떠서)
const NAVER_MAP = `https://map.naver.com/p/search/${PLACE_Q}`
const KAKAO_MAP = `https://map.kakao.com/?q=${PLACE_Q}`

const ACCESS_ITEMS = [
  { Icon: Train, title: '지하철 2호선 이대역', desc: '5번 출구에서 도보 약 3분' },
  { Icon: Train, title: '경의중앙선 신촌역', desc: '도보 약 5분' },
  { Icon: Clock, title: '운영시간', desc: '월~토 10:00–22:00 · 일요일 휴무' },
]

export const metadata: Metadata = {
  title: '신촌 연기학원 — 서대문·이대·아현 마이즈너 테크닉',
  description:
    '서대문구 이화여대1안길, 이대역 도보 3분. KD4 액팅 스튜디오는 마이즈너 테크닉 정규반과 출연영상 클래스 등 9개 클래스를 소수정예로 운영하는 신촌 연기학원입니다. 무료 상담 가능.',
  keywords: ['신촌 연기학원', '서대문 연기학원', '이대 연기학원', '아현 연기학원', '충정로 연기학원', 'KD4 액팅 스튜디오'],
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '신촌 연기학원 — KD4 액팅 스튜디오',
    description: '이대역 도보 3분. 마이즈너 테크닉 정규반·출연영상·오디션 클래스 9종. 소수정예 연기 훈련, 무료 상담.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — 신촌 연기학원', type: 'image/jpeg' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '신촌 연기학원 — KD4 액팅 스튜디오',
    description: '이대역 도보 3분. 마이즈너 테크닉 정규반·출연영상·오디션 클래스 9종. 소수정예 연기 훈련, 무료 상담.',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오 — 신촌 연기학원', type: 'image/jpeg' }],
  },
}

export default function SinchonPage() {
  return (
    <div style={{ paddingTop: '64px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '신촌 연기학원', url: PAGE_URL },
          ]),
          buildWebPage({
            type: 'AboutPage',
            idPath: '/sinchon-acting-academy#webpage',
            url: PAGE_URL,
            name: '신촌 연기학원 — KD4 액팅 스튜디오',
            description: '이대역 도보 3분. 마이즈너 테크닉 정규반·출연영상·오디션 클래스. 소수정예 연기 훈련.',
            about: { '@id': `${SITE_URL}#school` },
            mainEntity: { '@id': `${SITE_URL}#local` },
            speakableCssSelectors: ['h1', '.section-desc', '.faq-answer'],
            dateModified: '2026-06-11',
          }),
          buildFaqPage(SINCHON_FAQ, PAGE_URL),
        ]}
      />

      {/* ===== HERO ===== */}
      <section aria-label="신촌 연기학원 히어로" style={{ padding: 'clamp(64px, 11vw, 104px) 24px clamp(48px, 9vw, 80px)', background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 60%, #133f78 100%)', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-110px', right: '-70px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.2), transparent 70%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.82)', marginBottom: '16px' }}>
            <span lang="en">NEIGHBORHOOD</span> · 신촌 / 서대문 / 이대
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            이대역 도보 3분,<br />신촌 마이즈너 테크닉 연기학원
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px', wordBreak: 'keep-all' }}>
            서대문구 이화여대1안길, 권동원 리더 직강. 마이즈너 테크닉 정규반과 출연영상 클래스를 운영합니다.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink href="#form" location="sinchon-hero" label="무료 상담 신청" className="btn-primary" style={{ background: '#fff', color: 'var(--navy)' }}>
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink href="https://pf.kakao.com/_ximxdqn" kind="external" channel="kakao" location="sinchon-hero" label="카카오 채널 문의" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}>
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* ===== LOCATION — 약도 메인 ===== */}
      <section aria-label="찾아오시는 길" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">01 — LOCATION</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>찾아오시는 길</h2>
            <p className="section-desc">이대역 5번 출구 → 예스APM·가인볼링장 코너에서 이화여대1길로, 도보 약 3분.</p>
          </div>

          {/* 약도(메인) + 번호 길안내 */}
          <div className="sinchon-route-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 440px) 1fr', gap: '28px', maxWidth: '960px', margin: '0 auto', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '8px', boxShadow: '0 18px 48px -28px rgba(15,51,100,0.5)', overflow: 'hidden' }}>
              <Image
                src="/sinchon-route-map.webp"
                alt="이대역 5번 출구에서 KD4 액팅 스튜디오(아리움3차)까지 도보 약도 — 성산로 → 예스APM·가인볼링장 코너 → 이화여대1길"
                width={1122}
                height={1402}
                sizes="(max-width: 760px) 100vw, 440px"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }}
              />
            </div>
            <ol role="list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { t: '이대역(2호선) 5번 출구', d: '출구로 나와 성산로 방향으로' },
                { t: '예스APM·가인볼링장 코너', d: '포레스트 공원 옆에서 이화여대1길로 진입' },
                { t: '이화여대1길 직진 (약 480m)', d: '오피스텔촌 따라 북서쪽으로' },
                { t: 'KD4 액팅 스튜디오 도착', d: '아리움3차 1층 101호' },
              ].map((s, i, arr) => (
                <li key={s.t} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%', background: i === arr.length - 1 ? 'var(--accent-red)' : 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '2px', wordBreak: 'keep-all' }}>{s.t}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.5, wordBreak: 'keep-all' }}>{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 주소 · 교통 · 길찾기 */}
          <div className="sinchon-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '960px', margin: '32px auto 0', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: '14px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <MapPin aria-hidden={true} size={18} strokeWidth={2} />
                  <span lang="en" style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.82)' }}>ADDRESS</span>
                </div>
                {/* address: 조직 연락처 시맨틱 마크업 — WCAG 1.3.1 / HTML semantics */}
                <address style={{ fontStyle: 'normal' }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.5, wordBreak: 'keep-all' }}>{ADDRESS_FULL}</p>
                </address>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <a href={NAVER_MAP} target="_blank" rel="noopener noreferrer" aria-label="네이버 지도로 길찾기 (새 탭에서 열림)" style={mapBtn}>
                  <Navigation aria-hidden={true} size={15} strokeWidth={2} /> 네이버 지도
                </a>
                <a href={KAKAO_MAP} target="_blank" rel="noopener noreferrer" aria-label="카카오맵으로 길찾기 (새 탭에서 열림)" style={mapBtn}>
                  <MapIcon aria-hidden={true} size={15} strokeWidth={2} /> 카카오맵
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ACCESS_ITEMS.map(({ Icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '8px', background: 'var(--navy-tint-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon aria-hidden={true} size={16} color="var(--navy)" strokeWidth={1.9} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px' }}>{title}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--gray-light)', lineHeight: 1.5, wordBreak: 'keep-all' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STUDIO — 외관·연습실·라운지 (미니멀 3장) ===== */}
      <section aria-label="스튜디오" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">02 — STUDIO</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>스튜디오</h2>
            <p className="section-desc" style={{ textAlign: 'center', margin: '0 auto' }}>배우를 위한 최적의 공간. 1층, 공조시설 완비. 대도구·소도구를 활용한 씬 액팅에 최적화.</p>
          </div>
          <div className="sinchon-studio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '1080px', margin: '0 auto' }}>
            {[
              { src: '/sinchon/exterior.webp', alt: 'KD4 액팅 스튜디오 외관 — 통유리 입구와 파란 사인', w: 1280, h: 996 },
              { src: '/sinchon/studio.webp',   alt: 'KD4 액팅 스튜디오 연습실 — 탁 트인 넓은 공간과 원목 바닥', w: 1280, h: 720 },
              { src: '/sinchon/lounge.webp',   alt: 'KD4 액팅 스튜디오 — 씬 액팅 공간과 소파 라운지', w: 1280, h: 720 },
            ].map((img) => (
              <div key={img.src} style={{ aspectRatio: '4 / 3', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg2)' }}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.w}
                  height={img.h}
                  sizes="(max-width: 760px) 100vw, 360px"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <style>{`
        @media (max-width: 760px) {
          .sinchon-studio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ===== RELATED CLASSES — 내부 교차 링크 ===== */}
      <section aria-label="신촌에서 배울 수 있는 클래스" style={{ padding: 'clamp(40px, 7vw, 64px) 0', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">CLASSES</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '20px' }}>신촌에서 배울 수 있는 클래스</h2>
            <nav aria-label="클래스 페이지 바로가기" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/meisner-technique-class" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                마이즈너 테크닉 정규 클래스 →
              </Link>
              <Link href="/reel-production-class" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                출연영상 클래스 →
              </Link>
              <Link href="/acting-coach-dongwon-kwon" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                권동원 액팅코치 소개 →
              </Link>
              <Link href="/about" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                KD4 소개 →
              </Link>
              <Link href="/benefits" style={{ display: 'inline-block', padding: '11px 22px', background: 'var(--bg2)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                멤버 혜택 →
              </Link>
            </nav>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section aria-label="위치·교통 자주 묻는 질문" style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow"><span lang="en">FAQ</span></p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>위치·교통 자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={SINCHON_FAQ} />
        </div>
      </section>

      {/* ===== FORM ===== */}
      <section id="form" aria-label="무료 상담 신청" style={{ scrollMarginTop: '80px', padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2 className="section-title-serif" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '8px' }}>
                30초만에 신청 완료
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .sinchon-route-grid { grid-template-columns: 1fr !important; }
          .sinchon-info-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const mapBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  background: 'var(--bg)',
  border: '1px solid var(--border-strong)',
  borderRadius: '10px',
  padding: '11px 12px',
  minHeight: 44,
  fontSize: '0.84rem',
  fontWeight: 600,
  color: 'var(--navy)',
  textDecoration: 'none',
}
