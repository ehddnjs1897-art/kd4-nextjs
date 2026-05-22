export default function DashboardLoading() {
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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 헤더 스켈레톤 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ ...pulse, height: 12, width: 60, marginBottom: 10 }} />
          <div style={{ ...pulse, height: 28, width: 160 }} />
        </div>

        {/* 계정 카드 스켈레톤 */}
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ ...pulse, width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...pulse, height: 18, width: 100, marginBottom: 8 }} />
              <div style={{ ...pulse, height: 14, width: 80 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[120, 90, 160, 100].map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ ...pulse, height: 10, width: 60 }} />
                <div style={{ ...pulse, height: 16, width: w }} />
              </div>
            ))}
          </div>
        </section>

        {/* 수강 내역 카드 스켈레톤 */}
        <section style={card}>
          <div style={{ ...pulse, height: 16, width: 80, marginBottom: 20 }} />
          {[1, 2].map((i) => (
            <div key={i} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ ...pulse, height: 16, width: '60%', marginBottom: 8 }} />
              <div style={{ ...pulse, height: 12, width: '40%' }} />
            </div>
          ))}
        </section>

      </div>
    </div>
  )
}
