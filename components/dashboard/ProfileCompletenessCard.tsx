import Link from 'next/link'
import { computeProfileCompleteness, type CompletenessInput } from '@/lib/profile-completeness'

/**
 * 배우 마이페이지(대시보드) — 프로필 완성도 카드 (서버 컴포넌트, 표시 전용)
 *
 * - 진행바 + "프로필 X% 완성" + 아직 비어있는 항목 콕 집기 + /dashboard/edit 버튼
 * - 색 가드레일: 크림 배경(--bg) + 네이비/거의검정 텍스트. (CSS 변수명이 헷갈리므로 실제 톤 기준)
 *   --white=#111(메인 텍스트), --gold/--navy=#15488A(네이비), --gray=#6B6660(서브)
 * - prod write 없음. computeProfileCompleteness 순수계산만.
 */
export default function ProfileCompletenessCard(props: CompletenessInput) {
  const { pct, doneCount, totalCount, items, missing } = computeProfileCompleteness(props)
  const complete = pct === 100

  // 빈칸 안내 문구: 가중치 큰 순 최대 3개를 콕 집어 보여줌
  const topMissing = missing.slice(0, 3)
  const missingLabels = topMissing.map((m) => m.label).join(' · ')

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '16px 18px',
      }}
    >
      {/* 헤더: 라벨 + % */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.68rem',
            letterSpacing: '0.22em',
            color: 'var(--navy)',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          <span lang="en">Profile Completion</span>
        </p>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--navy)',
          }}
        >
          {pct}<span style={{ fontSize: '0.7rem' }}>%</span>
        </span>
      </div>

      {/* 진행바 */}
      <div
        style={{
          height: 6,
          borderRadius: 6,
          background: 'var(--bg3)',
          marginBottom: 12,
          overflow: 'hidden',
        }}
      >
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`프로필 완성도 ${pct}퍼센트`}
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 6,
            background: 'var(--navy)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* 본문 안내 */}
      {complete ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--navy)', lineHeight: 1.6, margin: '0 0 12px' }}>
          <span aria-hidden="true">✨</span> 프로필을 모두 채웠어요. 캐스팅 담당자에게 잘 보입니다.
        </p>
      ) : (
        <p style={{ fontSize: '0.82rem', color: 'var(--white)', lineHeight: 1.65, margin: '0 0 12px' }}>
          <strong style={{ color: 'var(--navy)' }}>{doneCount}/{totalCount}</strong> 항목 완료 ·{' '}
          아직 비어있어요:{' '}
          <strong style={{ color: 'var(--white)', fontWeight: 700 }}>{missingLabels}</strong>
          {missing.length > topMissing.length && (
            <span style={{ color: 'var(--gray)' }}> 외 {missing.length - topMissing.length}개</span>
          )}
        </p>
      )}

      {/* 항목별 칩 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {items.map((item) => (
          <span
            key={item.key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 20,
              fontSize: '0.72rem',
              fontWeight: 600,
              background: item.done ? 'var(--navy-tint-2)' : 'transparent',
              border: `1px solid ${item.done ? 'var(--navy-tint-3)' : 'var(--border)'}`,
              color: item.done ? 'var(--navy)' : 'var(--gray)',
            }}
          >
            <span aria-hidden="true">{item.done ? '✓' : '○'}</span>
            <span>
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </span>
          </span>
        ))}
      </div>

      {/* 편집 페이지로 이동 */}
      <Link
        href="/dashboard/edit"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: complete ? 'transparent' : 'var(--navy)',
          color: complete ? 'var(--navy)' : '#ffffff',
          border: complete ? '1px solid var(--navy)' : 'none',
          borderRadius: 7,
          padding: '10px 18px',
          minHeight: 44,
          fontSize: '0.84rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.03em',
          textDecoration: 'none',
        }}
      >
        {complete ? '프로필 관리' : '빈칸 채우러 가기'} <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
