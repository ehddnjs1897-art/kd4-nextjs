export default function DashboardEditLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 6,
    animation: 'pulse 1.5s ease-in-out infinite',
  }
  const card: React.CSSProperties = {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '24px 20px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80, paddingBottom: 80 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...pulse, height: 12, width: 60, marginBottom: 10 }} />
          <div style={{ ...pulse, height: 28, width: 200 }} />
        </div>

        {/* 기본 정보 카드 */}
        <section style={{ ...card, marginBottom: 16 }}>
          <div style={{ ...pulse, height: 16, width: 80, marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div style={{ ...pulse, height: 10, width: 60, marginBottom: 8 }} />
                <div style={{ ...pulse, height: 36, width: '100%' }} />
              </div>
            ))}
          </div>
        </section>

        {/* 사진 카드 */}
        <section style={{ ...card, marginBottom: 16 }}>
          <div style={{ ...pulse, height: 16, width: 80, marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ ...pulse, height: 160, borderRadius: 8 }} />
            ))}
          </div>
        </section>

        {/* 영상 카드 */}
        <section style={card}>
          <div style={{ ...pulse, height: 16, width: 80, marginBottom: 20 }} />
          {[1, 2].map((i) => (
            <div key={i} style={{ ...pulse, height: 48, marginBottom: 12, borderRadius: 8 }} />
          ))}
        </section>
      </div>
    </div>
  )
}
