export default function ActorDetailLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 6,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 100 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px clamp(20px,4vw,32px) 40px' }}>
        {/* 브레드크럼 스켈레톤 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ ...pulse, height: 14, width: 24, borderRadius: 3 }} />
          <div style={{ ...pulse, height: 10, width: 8, borderRadius: 2 }} />
          <div style={{ ...pulse, height: 14, width: 52, borderRadius: 3 }} />
          <div style={{ ...pulse, height: 10, width: 8, borderRadius: 2 }} />
          <div style={{ ...pulse, height: 14, width: 60, borderRadius: 3 }} />
        </div>

        {/* 프로필 이미지 스켈레톤 — 실제 max-width 680px, 자연 비율 */}
        <div style={{ maxWidth: 680, margin: '0 auto 16px', borderRadius: 10, overflow: 'hidden', aspectRatio: '3/2', ...pulse }} />

        {/* 공유 버튼 영역 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ ...pulse, height: 38, width: 80, borderRadius: 6 }} />
        </div>

        {/* 캐스팅 태그 */}
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 6, marginBottom: 18 }}>
          {[54, 46, 62].map((w, i) => (
            <div key={i} style={{ ...pulse, height: 22, width: w, borderRadius: 3 }} />
          ))}
        </div>

        {/* 이름 */}
        <div style={{ maxWidth: 680, margin: '0 auto 10px' }}>
          <div style={{ ...pulse, height: 44, width: 120 }} />
        </div>

        {/* 서브라인 */}
        <div style={{ maxWidth: 680, margin: '0 auto 28px' }}>
          <div style={{ ...pulse, height: 14, width: 140, borderRadius: 3 }} />
        </div>

        {/* 한줄소개 */}
        <div style={{ maxWidth: 680, margin: '0 auto 28px' }}>
          {[95, 80].map((pct, i) => (
            <div key={i} style={{ ...pulse, height: 14, width: `${pct}%`, borderRadius: 3, marginBottom: 8 }} />
          ))}
        </div>

        {/* 탭 */}
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 8, marginBottom: 24 }}>
          {[64, 64, 64].map((w, i) => (
            <div key={i} style={{ ...pulse, height: 34, width: w, borderRadius: 20 }} />
          ))}
        </div>

        {/* 사진 그리드 */}
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ ...pulse, aspectRatio: '3/4', borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
