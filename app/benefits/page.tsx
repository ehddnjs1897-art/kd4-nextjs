import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '멤버 혜택 | KD4 액팅 스튜디오',
  description:
    'KD4 멤버가 누리는 혜택과 커뮤니티 — 보강제도, 출연영상·프로필 편집 서비스, 레피티션 스터디, 굿무비 굿액팅, 크리스쳔 액터스.',
}

/* ───────────── 데이터 ───────────── */

const LEARNING_SUPPORT = [
  {
    title: '보강 신청 안내',
    desc: '부득이하게 결석하시는 경우, 스케줄표에 있는 다른 수업 클래스에서 보강 가능. 수업 3일 전까지 미리 신청해 주세요. 자세한 규정은 카카오채널 문의.',
  },
]

const CAREER_SERVICES = [
  {
    title: '출연영상 편집 서비스',
    desc: '촬영한 출연영상을 캐스팅 디렉터에게 보낼 수 있도록, 업계 문법에 맞게 편집해 드립니다.',
    price: '50,000원',
  },
  {
    title: '프로필 편집 서비스',
    desc: '오디션 또는 캐스팅 디렉터 제출 시 바로 사용할 수 있도록, 업계 문법에 맞게 제작해 드립니다.',
    price: '30,000원',
  },
]

interface CommunityItem {
  title: string
  leader: string
  desc: string
  fee?: string
}

const COMMUNITIES: CommunityItem[] = [
  {
    title: '레피티션 스터디',
    leader: '홍수민 리더',
    desc: '자율적으로 모여 마이즈너 테크닉 레피티션을 훈련합니다. KD4 멤버가 아니어도 누구나 참여 가능',
    fee: '월 회비 100,000원 · KD4 멤버 무료',
  },
  {
    title: '굿무비 굿액팅',
    leader: '박우진 리더',
    desc: '함께 영화를 보고 토론하는 모임. 연기와 영화를 보는 눈을 함께 키우는 시간',
  },
  {
    title: '크리스쳔 액터스',
    leader: '권동원 리더',
    desc: '신앙을 가진 배우들이 작품·삶·진로를 함께 나누는 커뮤니티',
  },
]

const DISCOUNTS = [
  { tag: '신규 멤버 웰컴', title: '첫 달 10만원 할인', desc: '또는 무료 오픈클래스 중 택1 · 신규 등록 시 적용' },
  { tag: '휴면 멤버 웰컴백', title: '첫 달 5만원 할인', desc: '6개월 이상 휴면 후 복귀 시 적용' },
  { tag: '출연영상 1달 할인', title: '출연영상 클래스 1달 30% 할인', desc: '출연영상 2회 이상 수강 배우 · 1달간 적용' },
  { tag: '지인 동반 할인', title: '함께 등록 시 1+1 · 두 분 모두 5만원 할인', desc: '지인과 동반 등록 시 두 분 각각 5만원씩 할인' },
  { tag: '출연영상 재수강 할인', title: '2회차부터 각 3만원 할인', desc: '회차당 40만원 → 37만원 · 3개월 간 (총 9만원 할인)' },
]

/* ───────────── 섹션 헤더 ───────────── */

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: '36px', textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--font-display), Oswald, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.25em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 700,
          color: 'var(--white)',
          marginBottom: desc ? '12px' : 0,
          lineHeight: 1.35,
        }}
      >
        {title}
      </h2>
      {desc && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.92rem',
            color: 'var(--secondary)',
            lineHeight: 1.8,
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          {desc}
        </p>
      )}
    </div>
  )
}

/* ───────────── 페이지 ───────────── */

export default function BenefitsPage() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: 'var(--white)',
        minHeight: '100vh',
        paddingTop: '64px',
      }}
    >
      {/* HERO */}
      <section
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(64px, 10vw, 120px) 24px clamp(40px, 6vw, 64px)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display), Oswald, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.3em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          MEMBER BENEFITS
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 6vw, 3.4rem)',
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: '24px',
          }}
        >
          KD4는<br />혼자 성장하지 않습니다
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: 'var(--secondary)',
            lineHeight: 1.9,
            maxWidth: '560px',
            margin: '0 auto',
            letterSpacing: '0.02em',
          }}
        >
          수업 시간 외에도 훈련을 이어갈 수 있도록,<br />
          KD4가 운영하는 학습 보강 · 커리어 지원 · 동료 커뮤니티 · 할인 혜택을 모두 모았습니다.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 학습 보강 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="LEARNING SUPPORT"
          title="KD4의 보강제도"
          desc="훈련의 흐름이 끊기지 않도록 KD4가 끝까지 함께합니다."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {LEARNING_SUPPORT.map((item) => (
            <div
              className="kd4-card-hover"
              key={item.title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  background: 'rgba(21,72,138,0.1)',
                  border: '1px solid rgba(21,72,138,0.25)',
                  borderRadius: 3,
                  padding: '3px 9px',
                }}>학습 보강</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                marginTop: 6,
              }}>{item.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 커리어 지원 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="CAREER SERVICES"
          title="커리어 지원 서비스"
          desc="훈련만큼 중요한 건 보여주는 방식입니다. KD4가 직접 손봐 드립니다."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {CAREER_SERVICES.map((item) => (
            <div
              className="kd4-card-hover"
              key={item.title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  background: 'rgba(21,72,138,0.1)',
                  border: '1px solid rgba(21,72,138,0.25)',
                  borderRadius: 3,
                  padding: '3px 9px',
                }}>편집 서비스</span>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}>{item.price}</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                marginTop: 6,
              }}>{item.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* 카카오채널 문의 버튼 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '28px',
          }}
        >
          <a
            href="https://pf.kakao.com/_ximxdqn"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              background: '#FEE500',
              color: '#191919',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.03em',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/kakao.png" alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
            카카오채널로 편집 서비스 문의
          </a>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 멤버 커뮤니티 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="COMMUNITY"
          title="멤버 커뮤니티"
          desc="배우는 혼자 크지 않습니다. 같은 길을 가는 동료와 함께 성장합니다."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {COMMUNITIES.map((item) => (
            <div
              className="kd4-card-hover"
              key={item.title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  background: 'rgba(21,72,138,0.1)',
                  border: '1px solid rgba(21,72,138,0.25)',
                  borderRadius: 3,
                  padding: '3px 9px',
                }}>커뮤니티</span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--white)',
                  letterSpacing: '0.02em',
                }}>{item.leader}</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                marginTop: 6,
              }}>{item.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{item.desc}{item.fee ? ` · ${item.fee}` : ''}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* 할인 혜택 */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <SectionHeader
          eyebrow="DISCOUNTS"
          title="할인 혜택"
          desc="신규/복귀/지인 동반/재수강까지 — 누가 와도 부담을 덜 수 있게."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {DISCOUNTS.map((d, i) => (
            <div
              className="kd4-card-hover"
              key={d.title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  background: 'rgba(21,72,138,0.1)',
                  border: '1px solid rgba(21,72,138,0.25)',
                  borderRadius: 3,
                  padding: '3px 9px',
                }}>{d.tag}</span>
                <span aria-hidden style={{
                  fontFamily: 'var(--font-display), Oswald, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: 300,
                  color: 'var(--gray)',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                marginTop: 6,
              }}>{d.title}</h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                lineHeight: 1.7,
              }}>{d.desc}</p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.82rem',
            color: 'var(--secondary)',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          ※ 자세한 클래스별 가격과 할인 적용은{' '}
          <Link href="/join" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
            수강신청 페이지
          </Link>
          에서 확인하실 수 있습니다.
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 24px' }} />

      {/* CTA */}
      <section
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: 'clamp(56px, 9vw, 96px) 24px clamp(72px, 10vw, 120px)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.4rem, 3.6vw, 1.9rem)',
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: '16px',
          }}
        >
          이 모든 혜택은<br />KD4 멤버에게 제공됩니다
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--secondary)',
            lineHeight: 1.85,
            marginBottom: '32px',
          }}
        >
          무료 상담 받아보세요.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/join"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'var(--gold)',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              letterSpacing: '0.05em',
              textDecoration: 'none',
            }}
          >
            무료 상담 신청
          </Link>
          <Link
            href="/classes"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'transparent',
              color: 'var(--white)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              letterSpacing: '0.05em',
              textDecoration: 'none',
            }}
          >
            클래스 살펴보기
          </Link>
        </div>
      </section>
    </div>
  )
}
