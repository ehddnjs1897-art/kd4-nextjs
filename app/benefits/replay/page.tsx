import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'

export const metadata: Metadata = {
  title: '리플레이 프로필 투어 제휴',
  description:
    'KD4 액팅 스튜디오 × 리플레이 공식 제휴 — 배우 프로필 투어 서비스. KD4 멤버 전용 혜택: 40장 3만원 (일반가 4만원, 25% 할인).',
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/benefits/replay`,
    title: '리플레이 프로필 투어 제휴 | KD4 액팅 스튜디오',
    description: 'KD4 액팅 스튜디오 × 리플레이 공식 제휴 — 배우 프로필 투어. KD4 멤버 전용 혜택.',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 × 리플레이 제휴' }],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '리플레이 프로필 투어 제휴 | KD4 액팅 스튜디오',
    description: 'KD4 멤버 전용 배우 프로필 투어 혜택',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'KD4 × 리플레이 제휴' }],
  },
}

const GUIDE = [
  {
    label: '리플레이',
    desc: '배우 프로필을 캐스팅 에이전시·디렉터에게 직접 배포하는 프로필 투어 서비스입니다.',
  },
  { label: '투어 기준', desc: '40장 기준 (약 30~50일 분량)' },
  { label: '출력 방식', desc: '고화질 잡지 출력 프린트 · 양면 인쇄 · 슬라이드 최대 2장' },
  { label: '대상', desc: 'KD4 액팅 스튜디오 멤버 (공식 제휴업체 코디방 참여)' },
]

const STEPS = [
  '아래 신청하기 버튼으로 수강 신청 페이지에서 프로필 투어 서비스를 선택해 주세요.',
  '리플레이 코디방(카카오톡)에 KD4 멤버 자격으로 초대됩니다.',
  '프로필 PPT 파일을 규격에 맞게 준비해 구글드라이브에 업로드하세요.',
  '리플레이 담당자가 검토 후 캐스팅 에이전시·디렉터에게 배포합니다.',
]

const FILE_GUIDE = [
  'PPT 파일 형식 (PDF ❌)',
  '슬라이드 크기: 가로 30.1×21.4 / 세로 21.4×30.1',
  '텍스트 하이퍼링크 모두 해제',
  '페이지 가장자리에서 최소 5mm 이상 여백',
  '기본 폰트: 맑은 고딕 (최우선) / Arial',
  '파일명: 성별_연생_성함_코디방 (예: 여_1987년_김가은_코디방)',
]

// 신청 URL: 퍼스널 브랜딩 서비스 + 프로필 투어 서비스 자동 선택
const ENROLL_URL = '/enroll?type=퍼스널 브랜딩 서비스&select=프로필 투어 서비스'

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: '36px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '14px' }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--white)', marginBottom: desc ? '12px' : 0, lineHeight: 1.35 }}>
        {title}
      </h2>
      {desc && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.92rem', color: 'var(--secondary)', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto' }}>
          {desc}
        </p>
      )}
    </div>
  )
}

export default function ReplayPartnershipPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--white)', minHeight: '100vh', paddingTop: '64px' }}>
      <PageJsonLd schemas={[buildBreadcrumb([
        { name: '홈', url: SITE_URL },
        { name: '멤버 혜택', url: `${SITE_URL}/benefits` },
        { name: '리플레이 프로필 투어 제휴', url: `${SITE_URL}/benefits/replay` },
      ])]} />

      {/* HERO */}
      <section aria-label="KD4 × 리플레이 배우 프로필 투어 소개" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(56px, 9vw, 104px) 24px clamp(40px, 6vw, 64px)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.75rem', letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '28px' }}>
          KD4 OFFICIAL PARTNERSHIP
        </p>

        {/* 로고 × 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 4vw, 32px)', flexWrap: 'wrap', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 120, height: 120, borderRadius: 12, background: '#ffffff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
              <Image src="/partners/replay-logo.webp" alt="REPLAY" width={96} height={96} style={{ objectFit: 'contain' }} priority />
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.05em' }}>REPLAY</span>
          </div>
          <span aria-hidden style={{ fontSize: '1.4rem', color: 'var(--gray)', fontWeight: 300 }}>×</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Image src="/heart-logo.png" alt="KD4 액팅 스튜디오" width={120} height={120} style={{ objectFit: 'contain' }} priority />
            <span style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.58rem', letterSpacing: '0.22em', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
              KD4 ACTING STUDIO
            </span>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem, 6vw, 3rem)', fontWeight: 700, lineHeight: 1.3, marginBottom: '20px', wordBreak: 'keep-all' }}>
          배우 프로필 투어 제휴
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: 'var(--secondary)', lineHeight: 1.9, maxWidth: '520px', margin: '0 auto', wordBreak: 'keep-all' }}>
          내 프로필을 직접 캐스팅 에이전시·디렉터에게 전달하는<br />
          배우 커뮤니티 리플레이 공식 제휴
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 멤버 전용 혜택 */}
      <section aria-label="KD4 멤버 전용 혜택" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader eyebrow="MEMBER BENEFIT" title="KD4 멤버 전용 혜택" desc="KD4 멤버는 25% 할인된 가격으로 이용하실 수 있습니다." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, maxWidth: 520, margin: '0 auto' }}>
          {/* 일반가 */}
          <div style={{ background: 'rgba(60,60,60,0.05)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray)', marginBottom: 6, letterSpacing: '0.05em', textDecoration: 'line-through' }}>일반가</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--gray)', lineHeight: 1 }}>40,000원</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gray)', marginTop: 8 }}>40장 기준</p>
          </div>
          {/* KD4 멤버가 */}
          <div style={{ background: '#ffffff', border: '2px solid var(--navy)', borderRadius: 12, padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
            <p style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: 700, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              KD4 멤버 · 25% 할인
            </p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem, 6vw, 2.6rem)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>30,000원</p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gray)', marginTop: 8 }}>40장 기준 · VAT 별도</p>
          </div>
        </div>

        {/* 신청 CTA */}
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <Link
            href={ENROLL_URL}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 52, padding: '14px 32px',
              background: 'var(--navy)', color: '#ffffff',
              fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700,
              borderRadius: 12, letterSpacing: '0.03em', textDecoration: 'none',
            }}
          >
            멤버 할인가로 신청하기 →
          </Link>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', color: 'var(--gray)', marginTop: 10 }}>
            로그인 후 퍼스널 브랜딩 서비스 탭에서 자동으로 선택됩니다
          </p>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 서비스 안내 */}
      <section aria-label="서비스 안내" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader eyebrow="ABOUT" title="서비스 안내" />
        <div style={{ maxWidth: 640, margin: '0 auto', background: '#ffffff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {GUIDE.map((g, i) => (
            <div key={g.label} style={{ display: 'flex', gap: 'clamp(12px, 3vw, 28px)', padding: 'clamp(18px, 3vw, 24px)', borderTop: i === 0 ? 'none' : '1px solid var(--border)', alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, width: 'clamp(72px, 18vw, 96px)', fontFamily: 'var(--font-sans)', fontSize: '0.92rem', fontWeight: 700, color: 'var(--gold)', paddingTop: 1, wordBreak: 'keep-all' }}>{g.label}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.92rem', color: 'var(--secondary)', lineHeight: 1.7, wordBreak: 'keep-all' }}>{g.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 이용 절차 */}
      <section aria-label="이용 절차" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader eyebrow="HOW IT WORKS" title="이용 절차" />
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 auto', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STEPS.map((step, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'rgba(21,72,138,0.12)', border: '1px solid rgba(21,72,138,0.3)', color: 'var(--gold)', fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--white)', lineHeight: 1.6, wordBreak: 'keep-all', paddingTop: 3 }}>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 파일 제출 규격 */}
      <section aria-label="파일 제출 규격" style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader eyebrow="FILE GUIDE" title="파일 제출 규격" desc="고화질 잡지 출력을 위해 규격을 꼭 지켜주세요." />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FILE_GUIDE.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', marginTop: 8 }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.92rem', color: 'var(--secondary)', lineHeight: 1.6, wordBreak: 'keep-all' }}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 하단 CTA */}
      <section aria-label="프로필 투어 신청하기" style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(56px, 9vw, 96px) 24px clamp(48px, 7vw, 80px)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', fontWeight: 700, lineHeight: 1.4, margin: '0 0 12px' }}>
          지금 바로 신청하세요
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: 1.8, marginBottom: '28px' }}>
          KD4 멤버 전용 30,000원 (VAT 별도) · 40장 기준
        </p>
        <Link
          href={ENROLL_URL}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 52, padding: '15px 36px',
            background: 'var(--navy)', color: '#ffffff',
            fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700,
            borderRadius: 12, letterSpacing: '0.03em', textDecoration: 'none',
          }}
        >
          프로필 투어 신청하기 →
        </Link>
        <div style={{ marginTop: '40px' }}>
          <Link href="/benefits" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--secondary)', textDecoration: 'none' }}>
            ← 멤버 혜택으로 돌아가기
          </Link>
        </div>
      </section>

    </div>
  )
}
