import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getActorCardThumbUrl, shouldOptimize } from '@/lib/actor-photo'
import ActorCardImage from '@/components/actors/ActorCardImage'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildFaqPage } from '@/lib/seo-schemas'

/**
 * /directors — 감독·조감독·캐스팅 담당자(영화과 학생 감독 포함)용 배우 DB 안내 한 장.
 * 2026-11-12 대표 지시: 배우 DB(/actors)를 영화과·제작 현장에 알릴 때 모든 링크를 이 페이지로 모은다.
 * 정책(대표 확정): 영상 전체 재생은 가입 후, 연락처는 디렉터 회원 당일 승인 후.
 */

const PAGE_URL = `${SITE_URL}/directors`
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_ximxdqn'
const SIGNUP_HREF = '/auth/signup?type=director&next=%2Factors'

export const metadata: Metadata = {
  title: '감독·영화과를 위한 배우 캐스팅 안내 — 단편·졸업영화 배우 찾기',
  description:
    '단편영화·졸업영화·독립영화·웹드라마 캐스팅용 배우 DB 안내. 프로필과 출연영상을 보고, 디렉터 회원 가입 후 당일 승인을 받으면 배우에게 직접 연락할 수 있습니다. 학생 작품도 환영합니다.',
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  keywords: ['단편영화 배우 캐스팅', '졸업영화 배우 구하기', '독립영화 배우 섭외', '배우 DB', '배우 프로필 출연영상', '영화과 캐스팅'],
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: '감독·영화과를 위한 배우 캐스팅 안내 | KD4 액팅 스튜디오',
    description: '프로필과 출연영상을 보고 배우에게 직접 연락하세요. 가입·열람 무료, 신청 당일 승인. 학생 작품도 환영합니다.',
    locale: 'ko_KR',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
  },
}

/* ───────────── 데이터 ───────────── */

type ShowcaseActor = {
  id: string
  name: string
  gender: string | null
  age_group: string | null
  photoSrc: string
  unoptimized: boolean
}

const SHOWCASE_COUNT = 8

/** 공개 배우 수 + 앞쪽 8명. 순서는 /actors와 같은 규칙(상단 고정 → 리더 → 조회수). */
async function fetchShowcase(): Promise<{ total: number; actors: ShowcaseActor[] }> {
  type Row = {
    id: string
    name: string | null
    gender: string | null
    age_group: string | null
    profile_photo: string | null
    storage_photo_path: string | null
    view_count?: number | null
    is_leader_featured?: boolean | null
    is_pinned_top?: boolean | null
  }
  const base = 'id, name, gender, age_group, profile_photo, storage_photo_path'
  let rows: Row[] = []
  const full = await supabaseAdmin
    .from('actors')
    .select(`${base}, view_count, is_leader_featured, is_pinned_top`)
    .eq('is_public', true)
    .limit(500)
  if (full.error) {
    // 정렬용 컬럼이 없는 환경 — 기본 컬럼만으로 재시도. 그래도 실패하면 throw(빈 결과를 캐시에 남기지 않는다).
    const basic = await supabaseAdmin.from('actors').select(base).eq('is_public', true).limit(500)
    if (basic.error) throw new Error(`[DirectorsPage] Supabase 오류: ${basic.error.message}`)
    rows = (basic.data ?? []) as unknown as Row[]
  } else {
    rows = (full.data ?? []) as unknown as Row[]
  }

  const sorted = [...rows].sort((a, b) => {
    const pa = a.is_pinned_top ? 1 : 0
    const pb = b.is_pinned_top ? 1 : 0
    if (pa !== pb) return pb - pa
    const fa = a.is_leader_featured ? 1 : 0
    const fb = b.is_leader_featured ? 1 : 0
    if (fa !== fb) return fb - fa
    return (b.view_count ?? 0) - (a.view_count ?? 0)
  })

  const actors: ShowcaseActor[] = sorted
    .filter((r) => !!(r.profile_photo || r.storage_photo_path))
    .slice(0, SHOWCASE_COUNT)
    .map((r) => ({
      id: r.id,
      name: r.name ?? '',
      gender: r.gender,
      age_group: r.age_group,
      photoSrc: getActorCardThumbUrl(r),
      unoptimized: !shouldOptimize(r),
    }))

  return { total: rows.length, actors }
}

const getShowcaseCached = unstable_cache(fetchShowcase, ['directors-showcase-v1'], {
  revalidate: 300,
  tags: ['actors'],
})

const TIERS: { when: string; what: string; note?: string }[] = [
  { when: '가입 없이', what: '프로필 사진 · 나이대 · 필모그래피 · 일부 출연영상' },
  { when: '가입하면', what: '모든 출연영상 재생' },
  { when: '승인되면', what: '배우 연락처(전화·이메일) · 프로필과 영상 내려받기 · 숏리스트', note: '신청 당일 승인' },
]

const STEPS: { title: string; desc: string }[] = [
  { title: '배우를 고릅니다', desc: '성별·나이대로 좁히고 출연영상을 확인하세요. 여기까지는 가입 없이 됩니다.' },
  { title: '디렉터 회원으로 가입합니다', desc: '소속과 작품을 적어 주세요. 소속 칸에는 학교·학과를 적으셔도 됩니다.' },
  { title: '승인 후 배우에게 직접 연락합니다', desc: '신청 당일 승인해 드리고 문자로 알려드립니다. 그때부터 연락처가 열립니다.' },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: '학생 작품도 되나요?',
    a: '됩니다. 졸업영화·워크숍 작품도 환영합니다. 가입할 때 소속 칸에 학교와 학과를 적어 주세요.',
  },
  {
    q: '비용이 드나요?',
    a: '배우 DB 열람과 연락은 무료입니다. 출연 조건은 배우와 직접 정하시면 됩니다.',
  },
  {
    q: '승인은 얼마나 걸리나요?',
    a: '신청한 당일에 승인해 드립니다. 밤늦게 신청하시면 다음 날 오전에 처리됩니다.',
  },
  {
    q: '연락처가 왜 바로 보이지 않나요?',
    a: '배우의 개인정보라서, 어떤 작품인지 확인한 뒤에 열어 드립니다. 열람한 연락처는 캐스팅 목적으로만 쓸 수 있습니다.',
  },
  {
    q: '맞는 배우를 찾기 어려우면요?',
    a: '카카오 채널로 문의해 주세요.',
  },
]

const FILTER_LINKS: { label: string; href: string }[] = [
  { label: '여자 배우', href: '/actors?gender=%EC%97%AC' },
  { label: '남자 배우', href: '/actors?gender=%EB%82%A8' },
  { label: '20대', href: '/actors?ageGroup=20%EB%8C%80' },
  { label: '30대', href: '/actors?ageGroup=30%EB%8C%80' },
  { label: '40대', href: '/actors?ageGroup=40%EB%8C%80' },
  { label: '50대', href: '/actors?ageGroup=50%EB%8C%80' },
]

/* ───────────── 스타일 ───────────── */

const sectionWrap: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 'clamp(44px, 7vw, 72px) 24px',
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display), Oswald, sans-serif',
  fontSize: '0.7rem',
  letterSpacing: '0.25em',
  color: 'var(--gold)',
  textTransform: 'uppercase',
  marginBottom: 14,
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
  fontWeight: 700,
  color: 'var(--white)',
  lineHeight: 1.35,
  margin: 0,
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
  padding: '0 28px',
  background: 'var(--navy)',
  color: '#ffffff',
  borderRadius: 4,
  fontFamily: 'var(--font-display)',
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textDecoration: 'none',
}

const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent',
  color: 'var(--navy)',
  border: '1.5px solid var(--navy)',
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 28, textAlign: 'center' }}>
      <p style={eyebrowStyle}><span lang="en">{eyebrow}</span></p>
      <h2 style={h2Style}>{title}</h2>
    </div>
  )
}

/* ───────────── 페이지 ───────────── */

export default async function DirectorsPage() {
  // 배우 데이터를 못 불러와도 안내문은 그대로 보인다 (숫자·사진 구간만 숨김).
  let total = 0
  let actors: ShowcaseActor[] = []
  try {
    const res = await getShowcaseCached()
    total = res.total
    actors = res.actors
  } catch (e) {
    console.error('[DirectorsPage] 배우 조회 실패:', e instanceof Error ? e.message : String(e))
  }
  const countLabel = total > 0 ? `현역 배우 ${total}명` : '현역 배우들'

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--white)', minHeight: '100vh', paddingTop: 64 }}>
      <style>{`
        .dir-actor-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; list-style: none; margin: 0; padding: 0; }
        .dir-step-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; list-style: none; margin: 0; padding: 0; }
        .dir-tier-row { display: grid; grid-template-columns: 110px 1fr; gap: 16px; align-items: baseline; }
        @media (max-width: 700px) {
          .dir-actor-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .dir-actor-grid li:nth-child(n+7) { display: none; }
          .dir-step-grid { grid-template-columns: 1fr; }
          .dir-tier-row { grid-template-columns: 1fr; gap: 4px; }
        }
      `}</style>
      <PageJsonLd schemas={[
        buildBreadcrumb([
          { name: '홈', url: SITE_URL },
          { name: '배우 DB', url: `${SITE_URL}/actors` },
          { name: '감독·캐스팅 담당자 안내', url: PAGE_URL },
        ]),
        buildFaqPage(FAQS, PAGE_URL),
      ]} />

      {/* HERO — 단일 초점: 배우 둘러보기 */}
      <section aria-label="감독·캐스팅 담당자 안내" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(56px, 10vw, 104px) 24px clamp(48px, 8vw, 80px)', textAlign: 'center' }}>
          <p style={eyebrowStyle}>감독 · 조감독 · 캐스팅 담당자용</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.9rem, 6.4vw, 3rem)',
              fontWeight: 700,
              lineHeight: 1.3,
              color: 'var(--white)',
              margin: '0 0 20px',
              wordBreak: 'keep-all',
            }}
          >
            배우를 찾고 계신가요?
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.98rem, 2.6vw, 1.08rem)',
              color: 'var(--secondary)',
              lineHeight: 1.85,
              margin: '0 auto 30px',
              maxWidth: 680,
              wordBreak: 'keep-all',
            }}
          >
            KD4에서 훈련한 <strong style={{ color: 'var(--navy)' }}>{countLabel}</strong>의 프로필과 출연영상을 한곳에서 볼 수 있습니다.
            <br />
            졸업영화·단편·독립영화·웹드라마, 학생 작품도 환영합니다.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/actors" style={btnPrimary}>배우 둘러보기 →</Link>
            <Link href={SIGNUP_HREF} style={btnSecondary}>디렉터 회원 가입</Link>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--gray)', marginTop: 18 }}>
            가입·열람 무료 · 신청 당일 승인
          </p>
        </div>
      </section>

      {/* 배우 미리보기 */}
      {actors.length > 0 && (
        <section aria-label="배우 미리보기" style={sectionWrap}>
          <SectionHeader eyebrow="Actors" title="지금 볼 수 있는 배우" />
          <ul className="dir-actor-grid">
            {actors.map((actor) => (
              <li
                key={actor.id}
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'var(--bg3)',
                }}
              >
                <Link
                  href={`/actors/${actor.id}`}
                  aria-label={`${actor.name} 배우 프로필 보기`}
                  style={{ display: 'block', position: 'absolute', inset: 0, textDecoration: 'none' }}
                >
                  <ActorCardImage src={actor.photoSrc} alt={actor.name} unoptimized={actor.unoptimized} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '36px 14px 12px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                      {actor.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>
                      {actor.gender ?? ''}{actor.gender && actor.age_group ? ' · ' : ''}{actor.age_group ?? ''}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
            {FILTER_LINKS.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 40,
                  padding: '0 16px',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 999,
                  background: '#fff',
                  color: 'var(--white)',
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                }}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/actors" style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
              {total > 0 ? `${total}명 전체 보기 →` : '전체 보기 →'}
            </Link>
          </p>
        </section>
      )}

      {/* 어디까지 볼 수 있나 */}
      <section aria-label="열람 범위" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={sectionWrap}>
          <SectionHeader eyebrow="Access" title="어디까지 볼 수 있나요" />
          <div style={{ maxWidth: 640, margin: '0 auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {TIERS.map((t, i) => (
              <div
                key={t.when}
                className="dir-tier-row"
                style={{ padding: '18px 22px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)', fontSize: '0.92rem' }}>{t.when}</span>
                <span style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--white)', wordBreak: 'keep-all' }}>
                  {t.what}
                  {t.note && (
                    <span style={{ display: 'inline-block', marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: 'var(--navy-tint-2)', color: 'var(--navy)', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {t.note}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3단계 */}
      <section aria-label="이용 방법" style={sectionWrap}>
        <SectionHeader eyebrow="How it works" title="연락까지 3단계" />
        <ol className="dir-step-grid">
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '22px 20px' }}>
              <span lang="en" style={{ fontFamily: 'var(--font-display), Oswald, sans-serif', fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--navy)' }}>
                STEP {i + 1}
              </span>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.02rem', fontWeight: 700, color: 'var(--white)', margin: '8px 0 8px', lineHeight: 1.45, wordBreak: 'keep-all' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-warm)', lineHeight: 1.75, margin: 0, wordBreak: 'keep-all' }}>{s.desc}</p>
            </li>
          ))}
        </ol>
        <p style={{ textAlign: 'center', marginTop: 26 }}>
          <Link href={SIGNUP_HREF} style={btnPrimary}>디렉터 회원 가입 →</Link>
        </p>
      </section>

      {/* 자주 묻는 것 */}
      <section aria-label="자주 묻는 질문" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div style={sectionWrap}>
          <SectionHeader eyebrow="FAQ" title="자주 묻는 것" />
          <dl style={{ maxWidth: 640, margin: '0 auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {FAQS.map((f, i) => (
              <div key={f.q} style={{ padding: '18px 22px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <dt style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--white)', marginBottom: 6, wordBreak: 'keep-all' }}>{f.q}</dt>
                <dd style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-warm)', lineHeight: 1.75, wordBreak: 'keep-all' }}>{f.a}</dd>
              </div>
            ))}
          </dl>
          <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--gray)', lineHeight: 1.8, margin: '26px auto 0', maxWidth: 520, wordBreak: 'keep-all' }}>
            KD4 액팅 스튜디오는 서울 신촌의 연기 스튜디오입니다.{' '}
            <Link href="/about" style={{ color: 'var(--navy)' }}>스튜디오 소개</Link>
          </p>
        </div>
      </section>

      {/* 마지막 CTA */}
      <section aria-label="배우 찾기 시작" style={{ background: 'var(--navy)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(44px, 7vw, 68px) 24px', textAlign: 'center' }}>
          <h2 style={{ ...h2Style, color: '#ffffff', marginBottom: 22 }}>지금 배우를 찾아보세요</h2>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/actors" style={{ ...btnPrimary, background: '#ffffff', color: 'var(--navy)' }}>배우 둘러보기 →</Link>
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btnPrimary, background: 'transparent', border: '1.5px solid rgba(255,255,255,0.7)' }}
            >
              카카오 채널 문의
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
