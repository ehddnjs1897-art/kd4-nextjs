import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Train, Clock, Navigation, Map as MapIcon } from 'lucide-react'
import { CLASSES, DIRECTOR } from '@/lib/classes'
import { SINCHON_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/sinchon-acting-academy`

// 위치 / 지도
const ADDRESS = '서울특별시 서대문구 대현동 90-7 아리움3차'
const ADDRESS_FULL = '서울시 서대문구 대현동 90-7 아리움3차 1층 101호'
const Q = encodeURIComponent(ADDRESS)
const MAP_EMBED = `https://maps.google.com/maps?q=${Q}&z=17&hl=ko&output=embed`
const NAVER_MAP = `https://map.naver.com/p/search/${Q}`
const KAKAO_MAP = `https://map.kakao.com/?q=${Q}`
const GOOGLE_MAP = `https://www.google.com/maps/search/?api=1&query=${Q}`

// SEO 랜딩은 정가(첫달 할인 전) 표시
const priceOf = (c: { price: string; originalPrice?: string }) => c.originalPrice ?? c.price
const CLASS_LINK: Record<string, string> = {
  '마이즈너 테크닉 정규 클래스': '/meisner-technique-class',
  '출연영상 클래스': '/reel-production-class',
}

const ACCESS_ITEMS = [
  { Icon: Train, title: '지하철 2호선 이대역', desc: '5번 출구 도보 3분 · 신촌역 10분' },
  { Icon: Train, title: '5호선 충정로역', desc: '도보 12분 · 강북·종로 방면 접근 용이' },
  { Icon: Clock, title: '운영시간', desc: '월~토 10:00–22:00 · 일요일 휴무' },
]

export const metadata: Metadata = {
  title: '신촌 연기학원 — 서대문·이대·아현 마이즈너 테크닉 액팅 스튜디오',
  description:
    '서대문구 대현동, 이대역 도보 3분. KD4 액팅 스튜디오는 마이즈너 테크닉 정규반과 출연영상 클래스 등 9개 클래스를 운영합니다.',
  keywords: ['신촌 연기학원', '서대문 연기학원', '이대 연기학원', '아현 연기학원', '충정로 연기학원', 'KD4 액팅 스튜디오'],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '신촌 연기학원 — KD4 액팅 스튜디오',
    description: '이대역 도보 3분, 마이즈너 테크닉 정규 클래스 운영.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '신촌 연기학원 — KD4 액팅 스튜디오',
    description: '이대역 도보 3분, 마이즈너 테크닉 정규 클래스 운영.',
    images: ['/og-image.jpg'],
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
          buildFaqPage(SINCHON_FAQ),
        ]}
      />

      {/* ===== HERO ===== */}
      <section style={{ padding: 'clamp(64px, 11vw, 104px) 24px clamp(48px, 9vw, 80px)', background: 'linear-gradient(160deg, var(--navy-deep) 0%, var(--navy) 60%, #133f78 100%)', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-110px', right: '-70px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,62,62,0.2), transparent 70%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <p className="section-eyebrow" style={{ color: '#F0A8A8', marginBottom: '16px' }}>
            NEIGHBORHOOD · 신촌 / 서대문 / 이대
          </p>
          <h1 className="section-title-serif" style={{ color: '#fff', fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)', lineHeight: 1.35, marginBottom: '16px', maxWidth: '720px', margin: '0 auto 16px', wordBreak: 'keep-all' }}>
            이대역 도보 3분,<br />신촌 마이즈너 테크닉 연기학원
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px', wordBreak: 'keep-all' }}>
            서대문구 대현동, 권동원 리더 직강. 마이즈너 테크닉 정규반과 출연영상 클래스를 운영합니다.
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

      {/* ===== LOCATION — 지도 + 길찾기 ===== */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — LOCATION</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>찾아오시는 길</h2>
            <p className="section-desc">
              이대역 5번 출구 도보 3분. 이대 상권 안이라 수업 전후 시간을 보내기 좋습니다.
            </p>
          </div>

          <div className="sinchon-map-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', maxWidth: '1040px', margin: '0 auto', alignItems: 'stretch' }}>
            {/* 지도 임베드 */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', minHeight: '340px', boxShadow: '0 18px 48px -28px rgba(15,51,100,0.5)' }}>
              <iframe
                title="KD4 액팅 스튜디오 위치 지도"
                src={MAP_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block', minHeight: '340px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {/* 주소 + 길찾기 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: '14px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <MapPin size={18} strokeWidth={2} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.12em', color: '#F0A8A8' }}>ADDRESS</span>
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.5, wordBreak: 'keep-all' }}>{ADDRESS_FULL}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <a href={NAVER_MAP} target="_blank" rel="noopener noreferrer" style={mapBtn}>
                  <Navigation size={15} strokeWidth={2} /> 네이버 지도
                </a>
                <a href={KAKAO_MAP} target="_blank" rel="noopener noreferrer" style={mapBtn}>
                  <MapIcon size={15} strokeWidth={2} /> 카카오맵
                </a>
                <a href={GOOGLE_MAP} target="_blank" rel="noopener noreferrer" style={{ ...mapBtn, gridColumn: '1 / -1' }}>
                  <Navigation size={15} strokeWidth={2} /> 구글 지도 · 로드뷰로 외관 보기
                </a>
              </div>

              {/* 교통 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                {ACCESS_ITEMS.map(({ Icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '8px', background: 'var(--navy-tint-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="var(--navy)" strokeWidth={1.9} />
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
        </div>
      </section>

      {/* ===== 오시는 길 약도 ===== */}
      <section style={{ padding: 'clamp(48px, 8vw, 72px) 0', background: 'var(--bg2)' }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" />
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 28px', textAlign: 'center' }}>
            <p className="section-eyebrow">길찾기 약도</p>
            <h2 className="section-title-serif" style={{ marginBottom: '8px' }}>이대역에서 걸어오는 길</h2>
            <p className="section-desc">5번 출구에서 이화여대길 따라 북쪽으로, 도보 약 3분.</p>
          </div>
          <div className="sinchon-route-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px', maxWidth: '880px', margin: '0 auto', alignItems: 'center' }}>
            {/* SVG 약도 (실제 도보 경로 기반) */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '10px', boxShadow: '0 14px 40px -28px rgba(15,51,100,0.5)' }}>
              <svg viewBox="0 0 380 480" width="100%" style={{ display: 'block', fontFamily: "'Nanum Pen Script', cursive" }} role="img" aria-label="이대역 5번 출구에서 KD4 액팅 스튜디오까지 도보 약도">
                <defs>
                  <filter id="sketch" x="-6%" y="-6%" width="112%" height="112%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#E4DDC8" />
                  </pattern>
                </defs>

                {/* 종이 배경 */}
                <rect x="0" y="0" width="380" height="480" rx="16" fill="#F5F1E5" />
                <rect x="0" y="0" width="380" height="480" rx="16" fill="url(#dots)" />

                {/* 손그림 도식 (삐뚤빼뚤 필터) */}
                <g filter="url(#sketch)" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {/* 도보 경로 */}
                  <path d="M288,408 C 250,402 236,372 230,332 C 222,280 226,238 214,188 C 205,150 196,120 176,104 C 160,91 134,92 120,98" stroke="#ffffff" strokeWidth="9" />
                  <path d="M288,408 C 250,402 236,372 230,332 C 222,280 226,238 214,188 C 205,150 196,120 176,104 C 160,91 134,92 120,98" stroke="#15488A" strokeWidth="4" strokeDasharray="1.5 12" />
                  {/* 이대역 동그라미 */}
                  <circle cx="288" cy="408" r="19" fill="#00A84D" stroke="#0a7d3a" strokeWidth="2.5" />
                  {/* KD4 건물 */}
                  <path d="M86,60 L108,40 L130,60 Z" fill="#C73E3E" stroke="#C73E3E" strokeWidth="2" />
                  <rect x="90" y="60" width="36" height="32" rx="2" fill="#ffffff" stroke="#15488A" strokeWidth="2.5" />
                  <rect x="101" y="76" width="14" height="16" rx="1" fill="#15488A" stroke="#15488A" strokeWidth="1" />
                  {/* 이화여대 정문(아치) */}
                  <path d="M236,264 L236,240 Q252,226 268,240 L268,264" stroke="#a59f8c" strokeWidth="3" />
                  {/* 나무 두 그루 */}
                  <g stroke="#7d9a58">
                    <circle cx="46" cy="186" r="13" fill="#d2e1ba" strokeWidth="2" />
                    <path d="M46,199 L46,214" strokeWidth="3" />
                    <circle cx="332" cy="318" r="11" fill="#d2e1ba" strokeWidth="2" />
                    <path d="M332,329 L332,343" strokeWidth="3" />
                  </g>
                  {/* 나침반 화살표 */}
                  <path d="M348,52 L348,28 M348,28 L343,37 M348,28 L353,37" stroke="#b6ad98" strokeWidth="2.5" />
                </g>

                {/* 손글씨 라벨 (선명) */}
                <text x="288" y="415" textAnchor="middle" fontSize="21" fill="#ffffff">2</text>
                <text x="288" y="446" textAnchor="middle" fontSize="20" fill="#2A2F3A">이대역 5번 출구</text>
                <text x="108" y="120" textAnchor="middle" fontSize="22" fill="#15488A">KD4 액팅 스튜디오</text>
                <text x="252" y="284" textAnchor="middle" fontSize="17" fill="#a59f8c">이화여대</text>
                <text x="348" y="64" textAnchor="middle" fontSize="16" fill="#b6ad98">N</text>
                <g transform="rotate(-7 138 300)">
                  <text x="138" y="300" textAnchor="middle" fontSize="25" fill="#C73E3E">도보 약 3분</text>
                </g>
              </svg>
            </div>
            {/* 단계 안내 */}
            <ol style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { t: '이대역(2호선) 5번 출구', d: '출구로 나와 신촌로 방향으로' },
                { t: '이화여대길로 진입', d: '신촌로에서 이화여대길로 들어섭니다' },
                { t: '북쪽으로 직진 (약 480m)', d: '이화여대길 따라 쭉 올라옵니다' },
                { t: 'KD4 액팅 스튜디오 도착', d: '아리움3차 1층 101호' },
              ].map((s, i, arr) => (
                <li key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
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
        </div>
      </section>

      {/* ===== CLASSES — 전체 라인업 ===== */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — CLASSES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>신촌 스튜디오 클래스 라인업</h2>
            <p className="section-desc">입문부터 캐스팅 연계까지, 단계별로 운영하는 전체 클래스입니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', maxWidth: '1040px', margin: '0 auto' }}>
            {CLASSES.map((c) => {
              const href = CLASS_LINK[c.nameKo]
              const inner = (
                <>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', letterSpacing: '0.12em', color: 'var(--navy)', background: 'var(--navy-tint-1)', border: '1px solid var(--navy-tint-3)', borderRadius: '4px', padding: '3px 7px' }}>{c.step}</span>
                    {c.isNewMemberOpen && (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', letterSpacing: '0.06em', color: 'var(--accent-red)', background: 'var(--accent-red-soft)', borderRadius: '4px', padding: '3px 7px' }}>신규 모집</span>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{c.nameKo}</p>
                  <p style={{ fontSize: '0.84rem', color: 'var(--gray-light)', lineHeight: 1.55, marginBottom: '14px', wordBreak: 'keep-all' }}>{c.quote}</p>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>{c.course ?? c.schedule}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>월 ₩{priceOf(c)}</span>
                  </div>
                  {href && <span style={{ fontSize: '0.8rem', color: 'var(--navy)', fontWeight: 600, marginTop: '10px' }}>상세 보기 →</span>}
                </>
              )
              const cardStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textDecoration: 'none', color: '#111', minHeight: '160px' }
              return href ? <Link key={c.nameKo} href={href} style={cardStyle}>{inner}</Link> : <div key={c.nameKo} style={cardStyle}>{inner}</div>
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href="/classes" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'underline' }}>전체 클래스 자세히 보기 →</Link>
          </div>
        </div>
      </section>

      {/* ===== DIRECTOR MINI ===== */}
      <section style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p className="section-eyebrow">03 — LEADER</p>
          <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>{DIRECTOR.name} — 액팅 코치 (리더)</h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-light)', lineHeight: 1.7, marginBottom: '16px', wordBreak: 'keep-all' }}>
            Disney+ 무빙2 · Netflix 중증외상센터 출연 중. LA Meisner Workshop 수료.
          </p>
          <Link href="/acting-coach-dongwon-kwon" style={{ fontSize: '0.9rem', color: 'var(--navy)', textDecoration: 'underline' }}>
            리더 프로필 자세히 보기 →
          </Link>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '12px' }}>위치·교통 자주 묻는 질문</h2>
          </div>
          <FaqAccordion items={SINCHON_FAQ} />
        </div>
      </section>

      {/* ===== FORM ===== */}
      <section id="form" style={{ padding: 'clamp(56px, 9vw, 80px) 0', background: 'var(--bg)' }}>
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
          .sinchon-map-grid { grid-template-columns: 1fr !important; }
          .sinchon-route-grid { grid-template-columns: 1fr !important; }
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
  fontSize: '0.84rem',
  fontWeight: 600,
  color: 'var(--navy)',
  textDecoration: 'none',
}
