import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { MapPin, Train, Clock, Navigation, Map as MapIcon } from 'lucide-react'
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
const PLACE_Q = encodeURIComponent('KD4 액팅 스튜디오')
const MAP_EMBED = `https://maps.google.com/maps?q=${Q}&z=17&hl=ko&output=embed`
// 길찾기 버튼은 상호명으로 검색 (주소로 하면 '아리움3차오피스텔'이 떠서)
const NAVER_MAP = `https://map.naver.com/p/search/${PLACE_Q}`
const KAKAO_MAP = `https://map.kakao.com/?q=${PLACE_Q}`
const GOOGLE_MAP = `https://www.google.com/maps/search/?api=1&query=${PLACE_Q}`

const ACCESS_ITEMS = [
  { Icon: Train, title: '지하철 2호선 이대역', desc: '5번 출구에서 도보 약 3분' },
  { Icon: Train, title: '경의중앙선 신촌역', desc: '도보 약 5분' },
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
            <p className="section-desc">이대역 5번 출구 → YES apM·가인볼링장 코너에서 이화여대1길로, 도보 약 3분.</p>
          </div>
          <div className="sinchon-route-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '24px', maxWidth: '880px', margin: '0 auto', alignItems: 'center' }}>
            {/* SVG 약도 (실제 도보 경로 기반) */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '10px', boxShadow: '0 14px 40px -28px rgba(15,51,100,0.5)' }}>
              <svg viewBox="0 0 380 480" width="100%" style={{ display: 'block', fontFamily: "'Nanum Pen Script', cursive" }} role="img" aria-label="이대역 5번 출구에서 KD4 액팅 스튜디오까지 도보 약도">
                <defs>
                  <filter id="ink" x="-6%" y="-6%" width="112%" height="112%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="4" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <pattern id="dt" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#E5DEC9" />
                  </pattern>
                </defs>

                {/* 종이 배경 */}
                <rect x="0" y="0" width="380" height="480" rx="16" fill="#F5F1E6" />
                <rect x="0" y="0" width="380" height="480" rx="16" fill="url(#dt)" />

                {/* 손그림 도식 (단색 네이비 잉크, 은은한 손맛) */}
                <g filter="url(#ink)">
                  {/* 포레스트 공원 */}
                  <ellipse cx="252" cy="356" rx="38" ry="22" fill="#dfeac8" stroke="#9bb377" strokeWidth="1.4" />
                  <g fill="#cfe0b0" stroke="#7d9a58" strokeWidth="1.6">
                    <circle cx="240" cy="350" r="9" />
                    <circle cx="264" cy="354" r="8" />
                  </g>
                  <g stroke="#7d9a58" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M240,359 L240,367" />
                    <path d="M264,362 L264,369" />
                  </g>
                  {/* 도보 경로 (실선 + 화살표) */}
                  <path d="M298,430 C 268,418 212,360 170,310 C 162,250 160,176 148,108" fill="none" stroke="#15488A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="170" cy="310" r="3.2" fill="#15488A" />
                  <path d="M232,372 l9,-5 l-1,7" fill="none" stroke="#15488A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M156,206 l-4,-9 l8,3" fill="none" stroke="#15488A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  {/* 이대역 5번출구 (지하철 마커) */}
                  <rect x="283" y="416" width="32" height="28" rx="6" fill="#15488A" />
                  <rect x="290" y="423" width="18" height="11" rx="2" fill="#ffffff" />
                  <rect x="292" y="425" width="5" height="5" fill="#15488A" />
                  <rect x="301" y="425" width="5" height="5" fill="#15488A" />
                  {/* YES apM·가인볼링장 건물 */}
                  <rect x="190" y="286" width="64" height="46" rx="3" fill="rgba(21,72,138,0.06)" stroke="#15488A" strokeWidth="1.8" />
                  <g fill="#15488A">
                    <rect x="198" y="296" width="6" height="6" />
                    <rect x="212" y="296" width="6" height="6" />
                    <rect x="226" y="296" width="6" height="6" />
                    <rect x="198" y="310" width="6" height="6" />
                    <rect x="212" y="310" width="6" height="6" />
                    <rect x="226" y="310" width="6" height="6" />
                  </g>
                  <path d="M243,299 q-3,4 0,11 q3,-7 0,-11 z" fill="#ffffff" stroke="#15488A" strokeWidth="1.1" />
                  {/* 아리움3차 (목적지 건물) */}
                  <rect x="126" y="84" width="44" height="56" rx="2" fill="rgba(21,72,138,0.07)" stroke="#15488A" strokeWidth="1.8" />
                  <g fill="#15488A">
                    <rect x="133" y="94" width="7" height="7" />
                    <rect x="145" y="94" width="7" height="7" />
                    <rect x="157" y="94" width="7" height="7" />
                    <rect x="133" y="106" width="7" height="7" />
                    <rect x="145" y="106" width="7" height="7" />
                    <rect x="157" y="106" width="7" height="7" />
                    <rect x="133" y="118" width="7" height="7" />
                    <rect x="145" y="118" width="7" height="7" />
                    <rect x="157" y="118" width="7" height="7" />
                  </g>
                  {/* 나침반 */}
                  <circle cx="352" cy="40" r="13" fill="none" stroke="#b6ad98" strokeWidth="1.5" />
                  <path d="M352,33 L348,45 L352,42 L356,45 Z" fill="#b6ad98" />
                </g>

                {/* 목적지 레드 핀 (선명) */}
                <path d="M137,67 q11,17 11,22 q0,-5 11,-22 a11,11 0 1,0 -22,0 z" fill="#C73E3E" />
                <circle cx="148" cy="66" r="4.2" fill="#ffffff" />

                {/* 라벨 (손글씨 + 칩) */}
                <g><rect x="88" y="149" width="116" height="19" rx="9" fill="rgba(255,255,255,0.86)" /><text x="146" y="164" textAnchor="middle" fontSize="15" fill="#15488A">아리움3차 1층 · KD4</text></g>
                <g><rect x="249" y="449" width="98" height="19" rx="9" fill="rgba(255,255,255,0.86)" /><text x="298" y="464" textAnchor="middle" fontSize="15" fill="#2A2F3A">이대역 5번 출구</text></g>
                <g><rect x="164" y="263" width="116" height="19" rx="9" fill="rgba(255,255,255,0.86)" /><text x="222" y="278" textAnchor="middle" fontSize="13" fill="#2A2F3A">YES apM · 가인볼링장</text></g>
                <g><rect x="213" y="379" width="78" height="19" rx="9" fill="rgba(255,255,255,0.86)" /><text x="252" y="394" textAnchor="middle" fontSize="13" fill="#4a7a3a">포레스트 공원</text></g>
                <g transform="rotate(-84 112 210)"><rect x="69" y="197" width="86" height="19" rx="9" fill="rgba(255,255,255,0.86)" /><text x="112" y="212" textAnchor="middle" fontSize="13" fill="#15488A">이화여대1길</text></g>
                <g><rect x="207" y="405" width="74" height="19" rx="9" fill="rgba(255,255,255,0.86)" /><text x="244" y="420" textAnchor="middle" fontSize="15" fill="#15488A">도보 약 3분</text></g>
                <text x="352" y="45" textAnchor="middle" fontSize="12" fill="#8a8270">N</text>
              </svg>
            </div>
            {/* 단계 안내 */}
            <ol style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { t: '이대역(2호선) 5번 출구', d: '출구로 나와 성산로 방향으로' },
                { t: 'YES apM·가인볼링장 코너', d: '포레스트 공원 옆에서 이화여대1길로 진입' },
                { t: '이화여대1길 직진 (약 480m)', d: '오피스텔촌 따라 북서쪽으로' },
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
