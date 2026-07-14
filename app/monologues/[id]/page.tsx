import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getMonologueById } from '@/lib/monologues'
import { SITE_URL } from '@/lib/constants'
import PageJsonLd from '@/components/seo/PageJsonLd'
import { buildBreadcrumb } from '@/lib/seo-schemas'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

type Params = Promise<{ id: string }>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// generateMetadata와 페이지 컴포넌트 둘 다 같은 요청 안에서 실행되므로 cache()로 중복 조회 방지
const fetchMonologue = cache(async (id: string) => {
  if (!UUID_RE.test(id)) return null
  return getMonologueById(id)
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params
  const m = await fetchMonologue(id)
  if (!m) return { title: '독백을 찾을 수 없습니다 | KD4 액팅 스튜디오' }

  const title = `${m.role} - ${m.work} 독백 대사`
  const desc = m.body.slice(0, 100)
  const canonicalUrl = `${SITE_URL}/monologues/${m.id}`

  return {
    title: `${title} | KD4 액팅 스튜디오`,
    description: desc,
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

  const fullText = m.full_body && m.full_body.length > m.body.length ? m.full_body : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const downloadHref = user ? `/api/monologues/${m.id}/download` : `/auth/login?next=${encodeURIComponent(`/monologues/${m.id}`)}`

  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}>
      <PageJsonLd
        schemas={[
          buildBreadcrumb([
            { name: '홈', url: SITE_URL },
            { name: '독백 아카이브', url: `${SITE_URL}/monologues` },
            { name: `${m.role} - ${m.work}`, url: `${SITE_URL}/monologues/${m.id}` },
          ]),
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
          {m.role} · {m.work}
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
              alt={`${m.role} - ${m.work} 독백 카드`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <a
            href={downloadHref}
            download={user ? true : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 20,
              padding: '10px 24px',
              borderRadius: 999,
              background: 'var(--navy)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ↓ 독백 다운로드
          </a>
        </div>
      )}

      {fullText && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--navy)',
              marginBottom: 12,
              borderBottom: '2px solid var(--navy)',
              paddingBottom: 6,
            }}
          >
            전체 대사
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1rem',
              lineHeight: 1.9,
              color: 'var(--black)',
              whiteSpace: 'pre-line',
            }}
          >
            {fullText}
          </p>
        </section>
      )}

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
