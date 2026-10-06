import JoinCTALink from '@/components/join/JoinCTALink'
import { CLASSES } from '@/lib/classes'
import { KD4_STATS } from '@/lib/stats'

/**
 * 독백 아카이브 포스터 광고 (2026-10-06 대표 지시 — «무료상담 CTA가 중간에 하나뿐, 포스터처럼 상담·클래스 신청을 띄워라»).
 * - 디자인 = 8월 모집 크림 포스터 문법(상단 네이비 바 · KD4 ACTING STUDIO · 영문 아이브로 · 2줄 헤드라인 · 무료 상담 신청 →).
 *   PNG 포스터는 «2026.08 모집»·옛 숫자가 박혀 있어 쓰지 않고 코드로 그린다(날짜 없음 → 낡지 않음).
 * - 클래스 사실(강사·기간·정원)은 lib/classes.ts, 숫자는 lib/stats.ts에서만 읽는다. 가격·요일은 바뀌므로 넣지 않는다.
 * - 독백 본문은 가리지 않는다 — 목록 칸 사이·본문 아래에만 끼운다.
 */

export type PosterKey = 'consult' | 'meisner' | 'reel' | 'basic' | 'casting'

/** 목록·상세에서 돌려 쓰는 순서 */
export const POSTER_ROTATION: PosterKey[] = ['consult', 'meisner', 'reel', 'basic', 'casting']

interface Poster {
  eyebrow: string
  tag: string
  headline: [string, string]
  sub: string
  /** 목록 칸(좁음)용 짧은 설명 — 없으면 sub */
  cellSub?: string
  /** 보조 버튼 — 클래스 페이지 신청 폼(#form) 또는 전체 클래스 */
  secondary: { href: string; label: string }
  stats?: boolean
}

function cls(nameKo: string) {
  return CLASSES.find((c) => c.nameKo === nameKo)
}

function buildPosters(): Record<PosterKey, Poster> {
  const meisner = cls('마이즈너 테크닉 정규 클래스')
  const reel = cls('출연영상 클래스')
  const basic = cls('베이직 클래스')
  const join = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' · ')
  return {
    consult: {
      eyebrow: 'OFF THE PLASTIC',
      tag: '무료 상담',
      headline: ['뻔한 연기,', '이제 방법을 바꿀 때'],
      sub: '카메라 앞에서 통하는 ‘연기하지 않는 연기’를 배웁니다. 마이즈너 테크닉 · 출연영상 제작 · 캐스팅 연계',
      cellSub: '카메라 앞에서 통하는 ‘연기하지 않는 연기’를 배웁니다.',
      secondary: { href: '/classes', label: '클래스 둘러보기' },
    },
    meisner: {
      eyebrow: 'MEISNER TECHNIQUE',
      tag: meisner?.capacity ? `정원 ${meisner.capacity}` : '정규 클래스',
      headline: ['막혀있던 감정의 둑을', '터뜨리는 수업'],
      sub: join(meisner?.instructor && `${meisner.instructor} 직강`, meisner?.course, meisner?.capacity && `정원 ${meisner.capacity} 소수정예`),
      secondary: { href: '/meisner-technique-class#form', label: '마이즈너 클래스 신청' },
    },
    reel: {
      eyebrow: 'REEL PRODUCTION',
      tag: '포트폴리오',
      headline: ['영화 현장 퀄리티로', '출연영상을 만듭니다'],
      sub: join('전문 영화팀 + 맞춤 시나리오', reel?.course, reel?.capacity && `정원 ${reel.capacity}`),
      secondary: { href: '/reel-production-class#form', label: '출연영상 클래스 신청' },
    },
    basic: {
      eyebrow: 'BASIC CLASS',
      tag: '취미 · 입문',
      headline: ['취미로 가볍게', '시작하는 연기'],
      sub: join(basic?.note ?? '연기 경험 없어도 OK', basic?.capacity && `정원 ${basic.capacity} 소수정예`),
      secondary: { href: '/basic-acting-class#form', label: '베이직 클래스 신청' },
    },
    casting: {
      eyebrow: 'CLASS TO CASTING',
      tag: '캐스팅 연계',
      headline: ['수업이 끝이 아닙니다.', '캐스팅까지 연결합니다.'],
      sub: '연기 훈련 → 포트폴리오 제작 → 캐스팅 연계',
      secondary: { href: '/classes', label: '클래스 둘러보기' },
      stats: true,
    },
  }
}

const POSTERS = buildPosters()

/** id 같은 고정 문자열 → 포스터 하나 (ISR 캐시에서도 페이지마다 같은 포스터) */
export function posterForSeed(seed: string): PosterKey {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return POSTER_ROTATION[h % POSTER_ROTATION.length]
}

interface Props {
  posterKey: PosterKey
  /** cell = 목록 격자 한 칸 / banner = 상세 본문 아래 가로 배너 */
  layout: 'cell' | 'banner'
  /** 클릭 추적용 위치 이름 */
  placement: string
}

export default function PosterAd({ posterKey, layout, placement }: Props) {
  const p = POSTERS[posterKey]
  const banner = layout === 'banner'
  const location = `monologue_poster_${posterKey}_${placement}`

  return (
    <aside
      aria-label="KD4 액팅 스튜디오 클래스 안내"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderTop: '5px solid var(--navy)',
        borderRadius: 'var(--radius)',
        padding: banner ? 'clamp(20px, 4vw, 30px)' : '16px 18px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          paddingBottom: banner ? 12 : 10,
          borderBottom: '1px solid var(--border-strong)',
          fontFamily: 'var(--font-sans)',
          fontSize: banner ? '0.72rem' : '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--navy)',
        }}
      >
        <span>KD4 ACTING STUDIO</span>
        <span style={{ letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{p.tag}</span>
      </div>

      <div style={{ flex: 1, paddingTop: banner ? 18 : 14 }}>
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-sans)',
            fontSize: banner ? '0.7rem' : '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--navy)',
            marginBottom: banner ? 10 : 8,
          }}
        >
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--navy)', flexShrink: 0 }} />
          {p.eyebrow}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: banner ? 'clamp(1.35rem, 4.2vw, 1.75rem)' : '1.22rem',
            lineHeight: 1.35,
            color: 'var(--black)',
            marginBottom: banner ? 12 : 10,
            wordBreak: 'keep-all',
          }}
        >
          {p.headline[0]}
          <br />
          <span style={{ color: 'var(--navy)' }}>{p.headline[1]}</span>
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: banner ? '0.88rem' : '0.76rem',
            lineHeight: 1.65,
            color: 'var(--text-warm)',
            wordBreak: 'keep-all',
          }}
        >
          {banner ? p.sub : p.cellSub ?? p.sub}
        </p>
        {p.stats && (
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: banner ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
              gap: banner ? 12 : '8px 10px',
              marginTop: banner ? 16 : 12,
            }}
          >
            {(banner ? KD4_STATS : KD4_STATS.slice(0, 2)).map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <dt style={{ fontFamily: 'var(--font-sans)', fontSize: banner ? '0.74rem' : '0.64rem', color: 'var(--gray)' }}>{s.label}</dt>
                <dd style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: banner ? '1.4rem' : '1.05rem', color: 'var(--navy)', margin: 0, order: -1 }}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: banner ? 'row' : 'column',
          flexWrap: 'wrap',
          alignItems: banner ? 'center' : 'stretch',
          gap: banner ? 10 : 6,
          marginTop: banner ? 20 : 14,
        }}
      >
        <JoinCTALink
          href="/join"
          location={location}
          label="무료 상담 신청"
          fireLead
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minHeight: 44,
            padding: banner ? '0 26px' : '0 14px',
            background: 'var(--navy)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: banner ? '0.95rem' : '0.88rem',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
          }}
        >
          무료 상담 신청 <span aria-hidden="true">→</span>
        </JoinCTALink>
        <JoinCTALink
          href={p.secondary.href}
          location={location}
          label={p.secondary.label}
          fireLead
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            padding: banner ? '0 22px' : '0 10px',
            border: banner ? '1px solid var(--navy)' : 'none',
            color: 'var(--navy)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: banner ? '0.9rem' : '0.8rem',
            borderRadius: 'var(--radius)',
            textDecoration: banner ? 'none' : 'underline',
            textUnderlineOffset: 3,
          }}
        >
          {p.secondary.label}
        </JoinCTALink>
      </div>
    </aside>
  )
}
