import Link from 'next/link'
import type { Metadata } from 'next'
import { getMonologues, GENRE_OPTIONS, MEDIUM_OPTIONS } from '@/lib/monologues'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'

export const revalidate = 300 // 5분 ISR — 크롤러 파이프라인이 새 카드를 계속 추가하므로 적당히 신선하게

type SearchParams = Promise<{ gender?: string; genre?: string; medium?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams
  const parts: string[] = []
  if (params.gender) parts.push(params.gender)
  if (params.genre) parts.push(params.genre)
  if (params.medium) parts.push(params.medium)
  const suffix = parts.length ? ` — ${parts.join(' · ')}` : ''
  const title = `독백 대본 아카이브${suffix}`
  const desc = '오디션·연습용 독백 대본을 배역·작품·장르·감정선별로 모아둔 KD4 독백 아카이브. 실제 영화·드라마 대사부터 연습용 창작 대본까지.'
  const canonicalUrl = `${SITE_URL}/monologues`

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: `${title} | KD4 액팅 스튜디오`,
      description: desc,
      locale: 'ko_KR',
      siteName: 'KD4 액팅 스튜디오',
    },
  }
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: '0.82rem',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
        background: active ? 'var(--navy)' : 'transparent',
        color: active ? '#fff' : 'var(--gray)',
        transition: 'var(--transition)',
      }}
    >
      {label}
    </Link>
  )
}

function buildHref(base: Record<string, string | undefined>, key: string, value: string | undefined) {
  const next = { ...base, [key]: value }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) {
    if (v) qs.set(k, v)
  }
  const s = qs.toString()
  return s ? `/monologues?${s}` : '/monologues'
}

export default async function MonologuesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const gender = params.gender && ['남성', '여성'].includes(params.gender) ? params.gender : undefined
  const genre = params.genre && GENRE_OPTIONS.includes(params.genre) ? params.genre : undefined
  const medium = params.medium && MEDIUM_OPTIONS.includes(params.medium) ? params.medium : undefined

  const monologues = await getMonologues({ gender, genre, medium })
  const current = { gender, genre, medium }

  return (
    <main style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '48px 20px 80px' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '독백 아카이브', url: `${SITE_URL}/monologues` },
          ]),
        ]}
      />

      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 700,
            color: 'var(--navy-deep)',
            marginBottom: 8,
          }}
        >
          독백 대본 아카이브
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-warm)', fontSize: '0.95rem' }}>
          오디션·연습용 독백 {monologues.length}편 — 배역·작품·장르·감정선으로 찾아보세요.
        </p>
      </header>

      {/* 성별 필터 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <FilterPill label="전체" href={buildHref(current, 'gender', undefined)} active={!gender} />
        <FilterPill label="여성" href={buildHref(current, 'gender', '여성')} active={gender === '여성'} />
        <FilterPill label="남성" href={buildHref(current, 'gender', '남성')} active={gender === '남성'} />
      </div>

      {/* 미디어 필터 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, overflowX: 'auto' }}>
        <FilterPill label="전체 미디어" href={buildHref(current, 'medium', undefined)} active={!medium} />
        {MEDIUM_OPTIONS.map((m) => (
          <FilterPill key={m} label={m} href={buildHref(current, 'medium', m)} active={medium === m} />
        ))}
      </div>

      {/* 장르 필터 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, overflowX: 'auto' }}>
        <FilterPill label="전체 장르" href={buildHref(current, 'genre', undefined)} active={!genre} />
        {GENRE_OPTIONS.map((g) => (
          <FilterPill key={g} label={g} href={buildHref(current, 'genre', g)} active={genre === g} />
        ))}
      </div>

      {monologues.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--gray)', padding: '60px 0', textAlign: 'center' }}>
          조건에 맞는 독백이 아직 없습니다. 다른 필터를 시도해보세요.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          {monologues.map((m) => (
            <Link
              key={m.id}
              href={`/monologues/${m.id}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#fff',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--bg3)' }}>
                {m.card_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.card_image_url}
                    alt={`${m.role} - ${m.work} 독백 카드`}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-serif)',
                      color: 'var(--navy)',
                      opacity: 0.3,
                      fontSize: '1.4rem',
                    }}
                  >
                    {m.role}
                  </div>
                )}
                {m.grade === 'S' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'var(--navy)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    S
                  </span>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--black)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.role} · {m.work}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--gray)', marginTop: 2 }}>
                  {m.medium} · {m.genre} · {m.target}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
