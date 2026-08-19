import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cleanBodyLead, getMonologueById, getRelatedMonologues, normalizeTarget } from '@/lib/monologues'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb, buildMonologueArticle } from '@/lib/seo-schemas'
import CopyTextButton from '@/components/monologues/CopyTextButton'
import DownloadButton from '@/components/monologues/DownloadButton'

export const revalidate = 300
// cookies/headers/searchParams 미사용 → 정적 생성 강제(라이브에서 매 요청 dynamic으로 떨어지던 문제 복구)
export const dynamic = 'force-static'

type Params = Promise<{ id: string }>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// generateMetadata와 페이지 컴포넌트 둘 다 같은 요청 안에서 실행되므로 cache()로 중복 조회 방지
const fetchMonologue = cache(async (id: string) => {
  if (!UUID_RE.test(id)) return null
  return getMonologueById(id)
})

/** 검색결과에 잘리지 않는 title 길이 상한 */
const TITLE_MAX = 60

function firstSentence(lead: string): string {
  const hit = lead.match(/^[^.!?？。…\n]+[.!?？。…]?/)
  return (hit ? hit[0] : lead).trim()
}

/** title 훅 — 정리된 본문 첫 문장 18~24자(남은 예산 안에서만) */
function buildHook(lead: string, max: number): string {
  if (!lead || max < 10) return ''
  const limit = Math.min(24, max)
  let hook = firstSentence(lead)
  // 첫 문장이 너무 짧으면(예: "왜?") 뒤 문장까지 이어 붙여 18자 이상 확보
  if (hook.length < 18 && lead.length > hook.length) hook = lead.slice(0, limit)
  if (hook.length > limit) hook = hook.slice(0, limit)
  hook = hook.replace(/[\s,·]+$/, '').trim()
  // 문장 중간에서 잘렸으면 말줄임표로 마감(전체 길이는 limit 이내 유지)
  if (hook.length < lead.length && !/[.!?？。…]$/.test(hook)) {
    hook = `${hook.slice(0, limit - 1).replace(/[\s,·]+$/, '')}…`
  }
  return hook
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const m = await fetchMonologue(id)
  // 루트 layout의 title template(%s | KD4 액팅 스튜디오)이 사이트명을 붙이므로 여기선 붙이지 않는다
  // (기존 수동 접미사 + template 이중 적용으로 라이브 364페이지 title에 사이트명 2회 중복 — 2026-07-16 수정)
  if (!m) return { title: '독백을 찾을 수 없습니다' }

  // 작품+배역을 title 맨 앞에 두고(검색어 정확 일치) 뒤에 본문 한 조각 — 중복 title 193페이지 분기
  const target = normalizeTarget(m.target)
  const targetSuffix = target.label ? ` (${target.label})` : ''
  const stem = `${m.work} ${m.role} 독백`
  const lead = cleanBodyLead(m.body)
  const hook = buildHook(lead, TITLE_MAX - (stem.length + 5 + targetSuffix.length))
  const title = hook ? `${stem} — "${hook}"${targetSuffix}` : `${stem} 대사${targetSuffix}`

  const descHead = [m.role, target.label].filter(Boolean).join(' ')
  const lead70 = lead.slice(0, 70)
  const desc = lead70
    ? `"${lead70}" — 〈${m.work}〉 ${descHead} 독백 대본·전문 복사/다운로드`
    : `〈${m.work}〉 ${descHead} 독백 대본·전문 복사/다운로드`
  const canonicalUrl = `${SITE_URL}/monologues/${m.id}`

  return {
    title,
    description: desc,
    keywords: [
      `${m.work} 독백`, `${m.role} 독백`, `${m.work} 대사`,
      ...(target.gender ? [target.gender === '남성' ? '남자독백대본' : '여자독백대본'] : []),
      '오디션 독백', '독백 대본', `${m.medium} 독백`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title,
      description: desc,
      locale: 'ko_KR',
      siteName: 'KD4 액팅 스튜디오',
      images: m.card_image_url ? [{ url: m.card_image_url, width: 1400, height: 1400, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: m.card_image_url ? [m.card_image_url] : undefined,
    },
  }
}

export default async function MonologueDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const m = await fetchMonologue(id)
  if (!m) notFound()

  // full_body가 body보다 짧거나 같은 경우(대다수 — 크롤러가 동일 텍스트를 양쪽에 채움)가 많아
  // "더 길 때만" 조건이면 대부분 텍스트 섹션 자체가 안 뜸(2026-07-14 발견, 364건 중 251건 영향).
  // 둘 중 더 긴 쪽(같으면 body) — 이미지 하단에 복사 가능한 텍스트가 항상 뜨도록 보장.
  const displayText = m.full_body && m.full_body.length > m.body.length ? m.full_body : m.body

  // 상세 439편이 인바운드 링크 0인 고아 페이지였다 — 같은 작품(없으면 같은 장르·성별)으로 서로 잇는다.
  // 이미 캐시된 목록에서 고르므로 추가 DB 쿼리는 없다.
  const related = await getRelatedMonologues(m)
  const relatedIsSameWork = related.length > 0 && related.every((r) => r.work === m.work)

  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '독백 아카이브', url: `${SITE_URL}/monologues` },
            { name: `${m.work} ${m.role} 독백`, url: `${SITE_URL}/monologues/${m.id}` },
          ]),
          buildMonologueArticle(m),
        ]}
      />

      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700,
            color: 'var(--navy-deep)',
            marginBottom: 8,
          }}
        >
          {m.work} {m.role} 독백
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--gray)' }}>
          {m.medium} · {m.genre} · {m.target} · 감정선 {m.emotion}
        </p>
      </header>

      {m.card_image_url && (
        <div style={{ margin: '0 auto 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.card_image_url}
              alt={`${m.work} ${m.role} 독백`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <DownloadButton monologueId={m.id} />
        </div>
      )}

      {displayText && (
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 12,
              borderBottom: '2px solid var(--navy)',
              paddingBottom: 6,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--navy)',
                margin: 0,
              }}
            >
              전체 대사
            </h2>
            <CopyTextButton text={displayText} />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              lineHeight: 1.9,
              color: 'var(--black)',
              whiteSpace: 'pre-line',
              userSelect: 'text',
            }}
          >
            {displayText}
          </p>
        </section>
      )}

      {related.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 12,
              borderBottom: '2px solid var(--navy)',
              paddingBottom: 6,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--navy)',
                margin: 0,
              }}
            >
              {relatedIsSameWork ? `〈${m.work}〉의 다른 독백` : '비슷한 독백 더 보기'}
            </h2>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {related.map((r) => (
              <li key={r.id} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.9 }}>
                <Link href={`/monologues/${r.id}`} style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                  {r.work} {r.role} 독백 ({r.medium})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1rem',
          lineHeight: 1.9,
          color: 'var(--black)',
        }}
      >
        이 독백으로 오디션을 준비한다면 —{' '}
        <Link href="/meisner-technique-class" style={{ color: 'var(--navy)', fontWeight: 600 }}>
          마이즈너 테크닉 정규 클래스
        </Link>
        에서 레피티션으로 장면을 살리고,{' '}
        <Link href="/reel-production-class" style={{ color: 'var(--navy)', fontWeight: 600 }}>
          출연영상 제작
        </Link>
        으로 포트폴리오를 남깁니다.{' '}
        <Link href="/sinchon-acting-academy" style={{ color: 'var(--navy)', fontWeight: 600 }}>
          신촌 연기학원 KD4
        </Link>{' '}
        무료 상담.
      </p>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Link
          href="/monologues"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            color: 'var(--navy)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← 독백 아카이브로
        </Link>
      </div>
    </main>
  )
}
