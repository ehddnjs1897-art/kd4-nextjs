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
  title: '멤버 후기',
  description:
    'KD4 액팅 스튜디오에서 마이즈너 테크닉을 훈련한 실제 배우들의 생생한 후기입니다. 오픈클래스부터 정규 4개월 과정까지, 현역 배우들의 솔직한 경험을 확인하세요.',
  keywords: [
    '연기학원 후기', '마이즈너 테크닉 후기', '신촌 연기학원 후기',
    'KD4 후기', '오픈클래스 후기', '배우 훈련 후기',
    '출연영상 클래스 후기', '연기 수업 후기',
  ],
  alternates: { canonical: `${SITE_URL}/reviews` },
  openGraph: {
    title: '멤버 후기 | KD4 액팅 스튜디오',
    description: 'KD4에서 훈련한 실제 배우들의 생생한 후기를 확인하세요.',
    url: `${SITE_URL}/reviews`,
    type: 'website',
    siteName: 'KD4 액팅 스튜디오',
    images: [{ url: `${SITE_URL}/og-heart.jpg`, width: 1200, height: 630, alt: 'KD4 액팅 스튜디오' }],
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
// 자사 페이지에 우리 후기를 Review로 싣는 것(self-serving review)은 구글 리치결과 정책 위반 —
// 평점(aggregateRating)에 이어 review 배열까지 제거하고, 이 페이지는 "후기를 모은 웹페이지"로만 선언한다.
// 학원 엔티티(EducationalOrganization)는 전역 JsonLd.tsx의 #school 하나뿐이므로 여기선 @id로 참조만 한다(중복 정의 금지).
function buildReviewSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}/reviews#webpage`,
    name: '멤버 후기',
    about: { '@id': `${SITE_URL}#school` },
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
    // 작성자 미기재('수강생' 기본값)는 브랜드 워딩 정책에 따라 '멤버'로 표기
    return ((data as Review[]) ?? []).map((r) => ({
      ...r,
      reviewer_name:
        !r.reviewer_name?.trim() || r.reviewer_name.trim() === '수강생' ? '멤버' : r.reviewer_name,
    }))
  } catch (err) {
    console.error('[reviews] fetch failed:', err)
    return []
  }
}

// ── Page (Server Component) ──
export default async function ReviewsPage() {
  const reviews = await getReviews()
  const schema = buildReviewSchema()

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
