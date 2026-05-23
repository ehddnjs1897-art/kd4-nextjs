export default function JoinLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 6,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div role="status" aria-label="로딩 중" style={{ background: '#ffffff', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      {/* Hero area skeleton */}
      <div style={{ background: '#f8f6f0', padding: 'clamp(60px,10vw,100px) 24px clamp(40px,6vw,60px)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ ...pulse, background: '#e8e4da', height: 14, width: 120, borderRadius: 4, margin: '0 auto 20px' }} />
          <div style={{ ...pulse, background: '#e8e4da', height: 44, width: '80%', borderRadius: 6, margin: '0 auto 12px' }} />
          <div style={{ ...pulse, background: '#e8e4da', height: 28, width: '60%', borderRadius: 6, margin: '0 auto 32px' }} />
          {/* CTA form skeleton */}
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '28px 24px', border: '1px solid #e8e4da' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ ...pulse, background: '#e8e4da', height: 52, borderRadius: 12, marginBottom: 12 }} />
            ))}
            <div style={{ ...pulse, background: '#c4c0b8', height: 56, borderRadius: 12, marginTop: 8 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
