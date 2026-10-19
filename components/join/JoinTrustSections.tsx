import Image from 'next/image'
import { Users, FileText, Film, Handshake, ArrowRight, HeartHandshake } from 'lucide-react'
import { DIRECTOR } from '@/lib/classes'
import DirectorFilmography from '@/components/director/DirectorFilmography'
import JoinCTALink from '@/components/join/JoinCTALink'

/**
 * /join 신뢰 구간 4개 — /join과 광고 전용 랜딩(/ad/[cls])이 같이 쓴다 (2026-10-19 대표 «광고 페이지에 /join 형식 붙여»).
 * 문구·숫자를 고치면 두 페이지에 동시에 반영된다. 마크업은 /join에서 그대로 옮김.
 */

/* ── 후기 마퀴 (2행 교차) ── */
const REVIEW_MARQUEE_ROW1 = [
  { text: '내 의지로 만들어진 연기가 아니라 의식 깊은 곳에서 건드려진 감정이 자연스럽게 뱉어지는 경험을 했습니다.', author: '강*경' },
  { text: '카메라 앞에서든 무대 위에서든 진짜로 숨쉴 수 있는 방법의 물꼬를 터준 수업.', author: '김*일' },
  { text: '안 보이던 업계의 길이 보였습니다. 현역 배우가 현실적으로 설명해주는 곳.', author: '한*윤' },
]

/* ── Risk Reversal 보장 (2026-08-30 대표 확정: 전액 환불 항목 삭제) ── */
const GUARANTEES = [
  {
    Icon: HeartHandshake,
    title: '상담 후 바로 가셔도 돼요',
    desc: '30분 부담 없는 대화. 본인에게 맞는지 확인만 하고 가세요.',
  },
  {
    Icon: FileText,
    title: '상담만 받아도 영업기밀 공개',
    desc: '프로필·출연영상·캐스팅디렉터·에이전시 자료 전부 제공.',
  },
]

/** numbered=false → 광고 전용 랜딩처럼 /join 순서 번호(01·03…)가 맞지 않는 곳 */
export function WhyKD4Section({ numbered = true }: { numbered?: boolean } = {}) {
  return (
    <section
      aria-label="KD4 고유 자산 — 캐스팅 연계 시스템"
      style={{
        padding: 'clamp(64px, 12vw, 100px) 0',
        background: 'var(--bg2)',
      }}
    >
      <div className="container">
        <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
          <p className="section-eyebrow"><span lang="en">{numbered ? "01 — KD4 ONLY" : "KD4 ONLY"}</span></p>
          {/* 섹션 번호(2026-10-15 줄이기 후): 01 KD4 ONLY · 02 METHOD · 03 LEADER · 04 REVIEWS · 05 PROMISE · 06 CONTACT */}
          <h2
            className="section-title-serif"
            style={{
              fontSize: 'clamp(1.4rem, 3.6vw, 2.2rem)',
              lineHeight: 1.45,
              marginBottom: '14px',
              wordBreak: 'keep-all',
            }}
          >
            KD4를 선택해야 하는 이유
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
            3년간 만들어온 KD4만의 캐스팅 연계 시스템
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            maxWidth: '880px',
            margin: '0 auto',
          }}
        >
          {([
            {
              Icon: Handshake,
              title: '캐스팅 디렉터 공식 협업',
              desc: '방진원·이상원 캐스팅 디렉터와 정기 오디션·캐스팅 연계.',
            },
            {
              Icon: Film,
              title: '전문 영화팀 출연영상',
              desc: '현직 배우들이 거쳐간 시그니처 클래스. 완성된 출연영상 한 편이 실제 캐스팅으로 연결됩니다.',
            },
            {
              Icon: Users,
              title: '배우 DB 시스템',
              desc: 'kd4.club 배우 데이터베이스. 수료 후 자동 등록되며 캐스팅팀이 실제로 조회합니다.',
            },
          ] as const).map(({ Icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '26px 22px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(21,72,138,0.08)',
                  border: '1px solid rgba(21,72,138,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Icon size={20} color="var(--navy)" strokeWidth={1.8} />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  lineHeight: 1.4,
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-light)', lineHeight: 1.7 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DirectorSection({ numbered = true }: { numbered?: boolean } = {}) {
  return (
    <section aria-label="강사 권동원 소개" className="section" style={{ background: 'var(--bg)', padding: 'clamp(56px, 10vw, 88px) 0' }}>
      <div className="container">
        <div style={{ maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center' }}>
          <p className="section-eyebrow"><span lang="en">{numbered ? "03 — THE LEADER" : "THE LEADER"}</span></p>
          <h2
            className="section-title-serif"
            style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)', marginBottom: '10px' }}
          >
            배우의 성장을 가이드합니다
          </h2>
          {/* 부제 «건명원(建明苑) 창의인재 출신 배우» — 2026-10-19 대표 «빼»로 제거 */}
        </div>

        <div className="director-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="director-photo" style={{ position: 'relative' }}>
            <Image
              src={DIRECTOR.photo}
              alt={`${DIRECTOR.name} 대표`}
              fill
              sizes="(max-width: 768px) 100vw, 260px"
              style={{
                objectFit: 'cover',
                objectPosition: 'center 15%',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="director-name">{DIRECTOR.name}</div>
            <div className="director-role">{DIRECTOR.title}</div>

            {/* PROFILE — 풀 이력 9개 */}
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                color: 'var(--navy)',
                marginTop: '20px',
                marginBottom: '12px',
                fontWeight: 700,
              }}
            >
              <span lang="en">PROFILE</span>
            </p>
            {/* role="list": listStyle:none 시 Safari VoiceOver가 리스트 의미 제거하는 버그 방지 (WCAG 1.3.1) */}
            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px', listStyle: 'none', padding: 0 }}>
              {DIRECTOR.profileFlat.map((item) => (
                <li
                  key={item}
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--gray-light)',
                    paddingLeft: '14px',
                    position: 'relative',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '0.6em',
                      width: '6px',
                      height: '1px',
                      background: 'var(--navy)',
                      display: 'inline-block',
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>

            {/* FILMOGRAPHY — DirectorFilmography 공용 컴포넌트 (스펙 2-F) */}
            <DirectorFilmography labelColor="var(--navy)" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function ReviewsSection({ ctaHref = '#form-hero', numbered = true }: { ctaHref?: string; numbered?: boolean } = {}) {
  return (
    <section aria-label="멤버 후기" className="section" style={{ background: 'var(--bg2)', padding: 'clamp(56px, 10vw, 88px) 0' }}>
      <div className="container">
        <div style={{ maxWidth: '720px', margin: '0 auto 28px', textAlign: 'center' }}>
          <p className="section-eyebrow"><span lang="en">{numbered ? "04 — REAL REVIEWS" : "REAL REVIEWS"}</span></p>
          <h2
            className="section-title-serif"
            style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)', marginBottom: 0 }}
          >
            배우들의 솔직한 후기
          </h2>
        </div>

        {/* 마퀴 1행만 (압축) — 애니메이션 요소이므로 AT에서 숨김 */}
        <div className="review-marquee" aria-hidden="true">
          <div className="review-marquee-track">
            {[...REVIEW_MARQUEE_ROW1, ...REVIEW_MARQUEE_ROW1].map((r, i) => (
              <div key={`${r.author}-${i}`} style={{ flex: '0 0 auto', width: 'clamp(240px, 78vw, 320px)', padding: '20px 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', marginRight: '14px' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--white)', lineHeight: 1.7, marginBottom: '10px' }}>&ldquo;{r.text}&rdquo;</p>
                <span style={{ fontSize: '0.76rem', color: 'var(--gray)' }}>— {r.author}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 스크린리더 전용 후기 목록 (마퀴는 aria-hidden이므로 텍스트 대안 제공) */}
        <ul role="list" className="sr-only">
          {REVIEW_MARQUEE_ROW1.map((r) => (
            <li key={r.author}>&ldquo;{r.text}&rdquo; — {r.author}</li>
          ))}
        </ul>

        {/* 인라인 CTA */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <JoinCTALink
            href={ctaHref}
            location="inline_proof"
            label="나도 진짜 배우로 · 무료 상담 신청"
            fireLead
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--navy)',
              borderBottom: '1px solid var(--navy)',
              padding: '4px 0',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            나도 진짜 배우로 · 무료 상담 신청
            <ArrowRight aria-hidden={true} size={14} strokeWidth={2.2} />
          </JoinCTALink>
        </div>
      </div>
    </section>
  )
}

export function PromiseSection({ numbered = true }: { numbered?: boolean } = {}) {
  return (
    <section aria-label="KD4 약속" className="section" style={{ background: 'var(--bg)', padding: 'clamp(64px, 12vw, 100px) 0' }}>
      <div className="container">
        <div style={{ maxWidth: '720px', margin: '0 auto 40px', textAlign: 'center' }}>
          <p className="section-eyebrow"><span lang="en">{numbered ? "05 — OUR PROMISE" : "OUR PROMISE"}</span></p>
          <h2
            className="section-title-serif"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: 0 }}
          >
            상담만 받아도 괜찮아요
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            /* 모바일 1열 (세로) · 태블릿 이상 3열 — 카드는 컴팩트 */
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '12px',
            maxWidth: '880px',
            margin: '0 auto',
          }}
        >
          {GUARANTEES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(21,72,138,0.08)',
                  border: '1px solid rgba(21,72,138,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color="var(--navy)" strokeWidth={1.8} aria-hidden={true} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(0.88rem, 2.3vw, 1rem)',
                  fontWeight: 700,
                  marginBottom: '4px',
                  lineHeight: 1.35,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontSize: 'clamp(0.68rem, 1.85vw, 0.85rem)',
                  color: 'var(--gray-light)',
                  lineHeight: 1.6,
                }}
              >
                {desc}
              </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
