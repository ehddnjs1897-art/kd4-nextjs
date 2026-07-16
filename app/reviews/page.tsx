import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants'
import ReviewsClient from './ReviewsClient'

// 공개 후기(비회원 열람 가능, 인증 불요)라 쿠키 기반 클라이언트 대신 supabaseAdmin 사용 +
// ISR 캐싱 — 기존엔 revalidate 자체가 없어(쿠키 클라이언트라 항상 dynamic) 방문마다 DB를
// 새로 조회해 TTFB 1.2~1.5초로 느렸음(2026-07-14 실측). /actors·/monologues와 동일 패턴으로 통일.
export const revalidate = 300

// ── Metadata (SSR — SEO/GEO 최적화) ──
export const metadata: Metadata = {
  title: '수강생 후기',
  description:
    'KD4 액팅 스튜디오에서 마이즈너 테크닉을 훈련한 실제 배우들의 생생한 후기입니다. 오픈클래스부터 정규 4개월 과정까지, 현역 배우들의 솔직한 경험을 확인하세요.',
  keywords: [
    '연기학원 후기', '마이즈너 테크닉 후기', '신촌 연기학원 후기',
    'KD4 후기', '오픈클래스 후기', '배우 훈련 후기',
    '출연영상 클래스 후기', '연기 수업 후기',
  ],
  alternates: { canonical: `${SITE_URL}/reviews` },
  openGraph: {
    title: '수강생 후기 | KD4 액팅 스튜디오',
    description: 'KD4에서 훈련한 실제 배우들의 생생한 후기를 확인하세요.',
    url: `${SITE_URL}/reviews`,
    type: 'website',
  },
}

// ── 타입 ──
export type Review = {
  id: string
  reviewer_name: string
  course_type: string
  review_text: string | null
  image_url: string | null
  notion_filename: string | null
  review_year: number | null
  sort_weight: number
}

// ── Schema.org JSON-LD ──
function buildReviewSchema(reviews: Review[]) {
  const textReviews = reviews.filter((r) => r.review_text)
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'KD4 액팅 스튜디오',
    url: SITE_URL,
    description: '서울 신촌 마이즈너 테크닉 기반 연기학원. 배우의 성장을 운영하는 Actor Operating System.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(reviews.length > 0 ? reviews.length : 64),
    },
    review: textReviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.reviewer_name },
      reviewBody: r.review_text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
      datePublished: r.review_year ? `${r.review_year}-01-01` : '2025-01-01',
    })),
  }
}

// ── SSR 데이터 패칭 ──
async function getReviews(): Promise<Review[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('actor_reviews')
      .select(
        'id, reviewer_name, course_type, review_text, image_url, notion_filename, review_year, sort_weight'
      )
      .eq('is_public', true)
      .order('sort_weight', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[reviews] Supabase error:', error.message)
      return []
    }
    return (data as Review[]) ?? []
  } catch (err) {
    console.error('[reviews] fetch failed:', err)
    return []
  }
}

// ── Page (Server Component) ──
export default async function ReviewsPage() {
  const reviews = await getReviews()
  const schema = buildReviewSchema(reviews)

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ReviewsClient reviews={reviews} />
    </>
  )
}
