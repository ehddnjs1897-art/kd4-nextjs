import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Camera, Film, Eye, FileText, Check, X } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import { REEL_FAQ } from '@/lib/landing-faqs'
import PageJsonLd from '@/components/seo/PageJsonLd'
import JoinCTALink from '@/components/join/JoinCTALink'
import { buildBreadcrumb, buildFaqPage, buildCourseFromClass } from '@/lib/seo-schemas'

const FaqAccordion = dynamic(() => import('@/components/join/FaqAccordion'))
const JoinForm = dynamic(() => import('@/components/contact/JoinForm'))
const YouTubeFacade = dynamic(() => import('@/components/youtube/YouTubeFacade'))

const SITE_URL = 'https://kd4.club'
const PAGE_URL = `${SITE_URL}/reel-production-class`

const FILM_CLASS = CLASSES.find((c) => c.nameKo === '출연영상 클래스')!

export const metadata: Metadata = {
  title: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4',
  description:
    '전문 영화팀과 함께 만드는 출연영상 포트폴리오. 마이즈너 테크닉 + 맞춤 시나리오 + 현장 촬영. 현직 배우 100명+ 참여한 시그니처 클래스.',
  keywords: [
    '출연영상 제작',
    '배우 포트폴리오',
    '연기 포트폴리오',
    '배우 프로필 영상',
    '오디션 영상',
    '연기 영상 촬영',
    'KD4 출연영상 클래스',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '출연영상 클래스 — 배우 포트폴리오 제작 | KD4',
    description: '전문 영화팀과 함께 만드는 캐스팅용 출연영상 포트폴리오.',
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
  },
  twitter: {
    card: 'summary_large_image',
    title: '출연영상 클래스 — KD4',
    description: '전문 영화팀과 함께 만드는 배우 포트폴리오.',
    images: ['/og-image.jpg'],
  },
}

const WHY_REEL = [
  {
    Icon: Eye,
    title: '캐스팅 디렉터의 시선',
    desc: '프로필 사진만으로는 연기력이 보이지 않습니다. 캐스팅 디렉터는 영상으로 배우의 연기·표정·호흡을 한 번에 확인합니다. 출연영상 한 편이 수십 통의 프로필보다 강력한 캐스팅 자산이 됩니다.',
  },
  {
    Icon: Film,
    title: '실제 영화 현장의 퀄리티',
    desc: '핸드폰 촬영이나 학원 자체 영상이 아닌 실제 영화팀(촬영감독·조명·사운드)이 참여한 현장 셋업에서 제작합니다. 결과물은 그대로 오디션 제출이나 에이전시 자료에 사용할 수 있는 수준입니다.',
  },
  {
    Icon: Camera,
    title: '재사용 가능한 자산',
    desc: '한 번 만든 출연영상은 캐스팅 활동 내내 사용할 수 있는 영구 자산입니다. 오디션 영상·SNS 콘텐츠·에이전시 프로필·포트폴리오 사이트 등 다양한 채널에서 활용 가능합니다.',
  },
]

const PROCESS = [
  {
    num: '01',
    title: '레퍼런스 취합',
    desc: '본인의 톤·매력·강점에 맞는 영상 레퍼런스를 함께 큐레이션합니다. 어떤 캐릭터로 보여주고 싶은지 방향을 잡는 단계.',
  },
  {
    num: '02',
    title: '시나리오 작성',
    desc: '레퍼런스를 토대로 본인 전용 시나리오를 작성합니다. 단순 독백이 아닌 캐스팅 디렉터에게 임팩트를 줄 장면 구성.',
  },
  {
    num: '03',
    title: '전문 영화팀 촬영',
    desc: '실제 영화 현장의 카메라·조명·사운드 셋업으로 촬영합니다. 마이즈너 테크닉 훈련을 병행해 자연스러운 연기 캡처.',
  },
  {
    num: '04',
    title: '편집·납품',
    desc: '컬러 그레이딩·사운드 디자인까지 마친 완성도 높은 영상으로 납품합니다. 캐스팅·오디션 제출에 바로 사용 가능.',
  },
]

const INCLUDES = [
  { yes: true, text: '시나리오 작성 (본인 톤 맞춤)' },
  { yes: true, text: '전문 영화팀 촬영 (카메라·조명·사운드)' },
  { yes: true, text: '편집·컬러 그레이딩·사운드 디자인' },
  { yes: true, text: '캐스팅·오디션 제출용 영상 납품' },
  { yes: false, text: '추가 촬영 회차 (별도 견적)' },
  { yes: false, text: '해외 송출용 자막·재편집 (별도 견적)' },
  { yes: false, text: '상업적 재판매·타 학원 홍보 사용' },
]

const PORTFOLIO_VIDEOS = [
  { id: '7Q62XeyVLbc', title: '출연영상 샘플 1' },
  { id: 'IWL6hlOrU-w', title: '출연영상 샘플 2' },
  { id: 'PUlrhjOkvjA', title: '출연영상 샘플 3' },
]

export default function ReelPage() {
  return (
    <main style={{ paddingTop: '80px', background: 'var(--bg)', minHeight: '100vh', color: '#111111' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '클래스', url: `${SITE_URL}/classes` },
            { name: '출연영상 클래스', url: PAGE_URL },
          ]),
          buildCourseFromClass(FILM_CLASS, { url: PAGE_URL }),
          buildFaqPage(REEL_FAQ),
        ]}
      />

      {/* HERO */}
      <section
        style={{
          padding: 'clamp(72px, 12vw, 110px) 24px clamp(48px, 9vw, 80px)',
          background: 'var(--navy)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <p className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '18px' }}>
            STEP 01 · REEL PRODUCTION
          </p>
          <h1
            className="section-title-serif"
            style={{
              color: '#fff',
              fontSize: 'clamp(1.7rem, 4.5vw, 2.8rem)',
              lineHeight: 1.35,
              marginBottom: '20px',
              maxWidth: '720px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
            }}
          >
            출연영상 클래스
          </h1>
          <p
            style={{
              fontSize: 'clamp(0.95rem, 2.6vw, 1.05rem)',
              color: 'rgba(255,255,255,0.86)',
              lineHeight: 1.7,
              marginBottom: '12px',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              wordBreak: 'keep-all',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{FILM_CLASS.quote}&rdquo;
          </p>
          <p
            style={{
              fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '32px',
              letterSpacing: '0.03em',
            }}
          >
            3개월 코스 · 정원 6명 · 전문 영화팀 촬영 · 현직 배우 100명+ 참여
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <JoinCTALink
              href="#form"
              location="reel-hero"
              label="무료 상담 신청"
              className="btn-primary"
              style={{ background: '#fff', color: 'var(--navy)' }}
            >
              무료 상담 신청
            </JoinCTALink>
            <JoinCTALink
              href="https://pf.kakao.com/_ximxdqn"
              kind="external"
              channel="kakao"
              location="reel-hero"
              label="카카오 채널 문의"
              className="btn-outline"
              style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.95)' }}
            >
              카카오 채널 문의
            </JoinCTALink>
          </div>
        </div>
      </section>

      {/* WHY REEL */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">01 — WHY REEL</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              왜 출연영상이 필요한가
            </h2>
            <p className="section-desc">
              현직 배우 100명 이상이 거쳐간 KD4 출연영상 클래스. 한 편의 완성된 출연영상이 수많은
              오디션·캐스팅으로 연결되어 왔습니다.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {WHY_REEL.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '26px 24px',
                }}
              >
                <Icon size={22} color="var(--navy)" strokeWidth={1.8} style={{ marginBottom: '12px' }} />
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.75,
                    wordBreak: 'keep-all',
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO SAMPLES */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">02 — PORTFOLIO</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              실제 결과물 샘플
            </h2>
            <p className="section-desc">KD4 멤버들이 만든 출연영상 포트폴리오</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
              maxWidth: '1040px',
              margin: '0 auto',
            }}
          >
            {PORTFOLIO_VIDEOS.map((v) => (
              <div
                key={v.id}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <YouTubeFacade videoId={v.id} title={v.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
            <p className="section-eyebrow">03 — PROCESS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              제작 4단계
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              maxWidth: '1040px',
              margin: '0 auto',
            }}
          >
            {PROCESS.map(({ num, title, desc }) => (
              <div
                key={num}
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px 22px',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.4rem',
                    fontWeight: 300,
                    color: 'var(--navy-tint-3)',
                    lineHeight: 1,
                    display: 'block',
                    marginBottom: '14px',
                  }}
                >
                  {num}
                </span>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: '0.86rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.7,
                    wordBreak: 'keep-all',
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASS DETAILS */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 36px', textAlign: 'center' }}>
            <p className="section-eyebrow">04 — DETAILS</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              클래스 정보
            </h2>
          </div>
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              background: 'var(--bg)',
              border: '1.5px solid var(--navy)',
              borderRadius: '12px',
              padding: '28px 26px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              {FILM_CLASS.nameKo}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--gray)', letterSpacing: '0.08em', marginBottom: '20px' }}>
              {FILM_CLASS.nameEn}
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              {FILM_CLASS.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--gray-light)',
                    lineHeight: 1.7,
                    paddingLeft: '18px',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '0.55em',
                      width: '8px',
                      height: '1px',
                      background: 'var(--navy)',
                    }}
                  />
                  {b}
                </li>
              ))}
            </ul>
            <div
              style={{
                display: 'flex',
                gap: '18px',
                flexWrap: 'wrap',
                paddingTop: '18px',
                borderTop: '1px solid var(--border)',
              }}
            >
              {[
                { label: '일정', value: FILM_CLASS.schedule },
                { label: '시간', value: FILM_CLASS.duration },
                { label: '정원', value: FILM_CLASS.capacity },
                { label: '코스', value: FILM_CLASS.course ?? '3개월 코스' },
                { label: '월 수강료', value: `₩${FILM_CLASS.price}` },
              ].map((info) => (
                <div key={info.label}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray)', display: 'block' }}>
                    {info.label}
                  </span>
                  <span style={{ fontSize: '0.92rem', color: '#111', fontWeight: 600 }}>
                    {info.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INCLUDES */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">05 — INCLUDES</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              포함 사항 / 별도 사항
            </h2>
            <p className="section-desc">
              영상 소유권은 KD4가 보유하며 멤버는 자신의 캐스팅 활동(오디션 제출·SNS·포트폴리오)에
              자유롭게 사용할 수 있습니다.
            </p>
          </div>
          <ul
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {INCLUDES.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                }}
              >
                {item.yes ? (
                  <Check size={18} color="var(--navy)" strokeWidth={2.2} />
                ) : (
                  <X size={18} color="var(--gray)" strokeWidth={2.2} />
                )}
                <span
                  style={{
                    fontSize: '0.92rem',
                    color: item.yes ? '#111' : 'var(--gray)',
                    fontWeight: item.yes ? 600 : 400,
                  }}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(64px, 10vw, 96px) 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title-serif" style={{ marginBottom: '14px' }}>
              자주 묻는 질문
            </h2>
          </div>
          <FaqAccordion items={REEL_FAQ} />
        </div>
      </section>

      {/* FORM */}
      <section
        id="form"
        style={{
          padding: 'clamp(56px, 9vw, 80px) 0',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(21,72,138,0.08) 0%, var(--bg) 70%)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p className="section-eyebrow">무료 상담 신청</p>
              <h2
                className="section-title-serif"
                style={{ fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)', marginBottom: '10px' }}
              >
                출연영상 클래스 상담
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                이름·연락처만 남기시면 24시간 이내 SMS로 연락드립니다.
              </p>
            </div>
            <JoinForm />
          </div>
        </div>
      </section>

      <section style={{ padding: '24px', background: 'var(--bg)', textAlign: 'center' }}>
        <Link href="/classes" style={{ fontSize: '0.88rem', color: 'var(--navy)' }}>
          전체 클래스 보기 →
        </Link>
        <Link
          href="/meisner-technique-class"
          style={{ marginLeft: '20px', fontSize: '0.88rem', color: 'var(--navy)' }}
        >
          마이즈너 정규 클래스 →
        </Link>
      </section>
    </main>
  )
}
