export default function ActorDetailLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 6,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* 히어로 사진 스켈레톤 */}
      <div style={{ ...pulse, width: '100%', height: 'clamp(300px, 55vw, 520px)', borderRadius: 0 }} />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* 이름 + 메타 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ ...pulse, height: 36, width: 140, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[80, 60, 100].map((w, i) => (
              <div key={i} style={{ ...pulse, height: 22, width: w, borderRadius: 20 }} />
            ))}
          </div>
        </div>

        {/* 소개 텍스트 */}
        <div style={{ marginBottom: 32 }}>
          {[100, 90, 70].map((pct, i) => (
            <div key={i} style={{ ...pulse, height: 14, width: `${pct}%`, marginBottom: 8 }} />
          ))}
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[60, 60, 60].map((w, i) => (
            <div key={i} style={{ ...pulse, height: 32, width: w, borderRadius: 20 }} />
          ))}
        </div>

        {/* 사진 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ ...pulse, height: 160, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
