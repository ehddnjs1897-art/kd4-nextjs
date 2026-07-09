'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Review } from './page'

// 과정 뱃지 색상
const COURSE_COLORS: Record<string, string> = {
  '오픈클래스': 'var(--gold)',
  '마이즈너 정규 Step1': 'var(--navy)',
  '마이즈너 정규 Step2': '#1a3d7c',
  '출연영상 클래스': '#5b6d8a',
  '액터길드': '#7a5c2e',
}

function getCourseColor(course: string) {
  return COURSE_COLORS[course] ?? 'var(--navy)'
}

// ── 별점 SVG ──
function Stars({ count = 5 }: { count?: number }) {
  return (
    <span aria-label={`별점 ${count}점`} style={{ color: 'var(--gold)', fontSize: '0.9rem', letterSpacing: '1px' }}>
      {'★'.repeat(count)}
    </span>
  )
}

// ── 텍스트 후기 카드 ──
function TextReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false)
  const text = review.review_text ?? ''
  const isLong = text.length > 150
  const displayed = isLong && !expanded ? text.slice(0, 150) + '…' : text

  return (
    <article
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(21,72,138,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* 뱃지 */}
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: getCourseColor(review.course_type),
          color: '#fff',
          borderRadius: '100px',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          alignSelf: 'flex-start',
        }}
      >
        {review.course_type}
      </span>

      {/* 별점 */}
      <Stars />

      {/* 후기 텍스트 */}
      <p
        style={{
          color: 'var(--text)',
          fontSize: '0.92rem',
          lineHeight: '1.7',
          margin: 0,
          flex: 1,
        }}
      >
        &ldquo;{displayed}&rdquo;
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--navy)',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: 0,
            alignSelf: 'flex-start',
          }}
        >
          {expanded ? '접기 ▲' : '더 보기 ▼'}
        </button>
      )}

      {/* 리뷰어 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <span
          style={{
            color: 'var(--text-muted, #888)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}
        >
          — {review.reviewer_name}
        </span>
        {review.review_year && (
          <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.75rem' }}>
            {review.review_year}
          </span>
        )}
      </div>
    </article>
  )
}

// ── 이미지 후기 카드 ──
function ImageReviewCard({ review }: { review: Review }) {
  const [imgError, setImgError] = useState(false)

  return (
    <article
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '4/5',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(21,72,138,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {review.image_url && !imgError ? (
        <Image
          src={review.image_url}
          alt={`${review.reviewer_name} 수강 후기`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        // 이미지 없을 때 플레이스홀더
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-muted, #888)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>💬</span>
          <span style={{ fontSize: '0.8rem' }}>후기 이미지</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>업로드 예정</span>
        </div>
      )}

      {/* 오버레이 뱃지 */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          padding: '2px 8px',
          background: getCourseColor(review.course_type),
          color: '#fff',
          borderRadius: '100px',
          fontSize: '0.67rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
        }}
      >
        {review.course_type}
      </div>
    </article>
  )
}

// ── Empty State ──
function EmptyState() {
  return (
    <div
      style={{
        gridColumn: '1 / -1',
        padding: '80px 24px',
        textAlign: 'center',
        color: 'var(--text-muted, #888)',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
      <p style={{ fontSize: '1rem', fontWeight: 500 }}>후기를 불러오는 중입니다.</p>
    </div>
  )
}

// ── Main Client Component ──
export default function ReviewsClient({ reviews }: { reviews: Review[] }) {
  const textReviews = reviews.filter((r) => r.review_text)
  const imageReviews = reviews.filter((r) => !r.review_text)

  // 전체 후기 수 (DB 없을 때도 64로 표시)
  const totalCount = reviews.length > 0 ? reviews.length : 64

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: '80px' }}>
      {/* ── Hero 헤더 ── */}
      <section
        style={{
          background: 'var(--navy)',
          color: '#fff',
          padding: '72px 24px 56px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--gold)',
            marginBottom: '16px',
            textTransform: 'uppercase',
          }}
        >
          Real Voices
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display), Oswald, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            letterSpacing: '0.03em',
            margin: '0 0 16px',
          }}
        >
          {totalCount}명+ 배우의 실제 후기
        </h1>
        <p
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: 'rgba(255,255,255,0.8)',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          마이즈너 테크닉으로 연기의 방법을 바꾼 배우들의 솔직한 이야기.
          <br />
          수치가 아닌 현장 언어로 전합니다.
        </p>

        {/* 별점 요약 */}
        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Stars />
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', fontWeight: 600 }}>
            5.0 / 5.0 — {totalCount}개 후기
          </span>
        </div>
      </section>

      {/* ── 컨텐츠 영역 ── */}
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* 텍스트 후기 섹션 */}
        {textReviews.length > 0 && (
          <section style={{ marginBottom: '56px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '1.2rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--navy)',
                textTransform: 'uppercase',
                marginBottom: '24px',
              }}
            >
              직접 쓴 후기
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {textReviews.map((r) => (
                <TextReviewCard key={r.id} review={r} />
              ))}
            </div>
          </section>
        )}

        {/* 이미지 후기 섹션 */}
        {imageReviews.length > 0 ? (
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-display), Oswald, sans-serif',
                fontSize: '1.2rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--navy)',
                textTransform: 'uppercase',
                marginBottom: '24px',
              }}
            >
              카카오·문자 후기
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {imageReviews.map((r) => (
                <ImageReviewCard key={r.id} review={r} />
              ))}
            </div>
          </section>
        ) : (
          reviews.length === 0 && <EmptyState />
        )}

        {/* DB 비어있을 때 안내 (개발 환경) */}
        {reviews.length === 0 && (
          <div
            style={{
              marginTop: '48px',
              padding: '32px',
              background: 'var(--bg2)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              color: 'var(--text-muted, #888)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              📋 Supabase <code>actor_reviews</code> 테이블에 데이터가 없습니다.
              <br />
              <code>supabase/migrations/2026-07-10_actor_reviews.sql</code> 을 실행하세요.
            </p>
          </div>
        )}

        {/* ── CTA ── */}
        <div
          style={{
            marginTop: '72px',
            padding: '48px 32px',
            background: 'var(--navy)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            다음은 당신의 이야기
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display), Oswald, sans-serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 700,
              letterSpacing: '0.03em',
              margin: '0 0 12px',
            }}
          >
            무료 오픈클래스로 직접 경험하세요
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', margin: '0 0 28px', lineHeight: 1.6 }}>
            등록 부담 없이 한 번의 수업으로 마이즈너 테크닉을 체험하고<br />
            당신에게 맞는 훈련인지 확인하세요.
          </p>
          <a
            href="/join"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px 32px',
              background: 'var(--gold)',
              color: '#fff',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light, #c9a227)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
          >
            무료 상담 신청 →
          </a>
        </div>
      </div>
    </div>
  )
}
