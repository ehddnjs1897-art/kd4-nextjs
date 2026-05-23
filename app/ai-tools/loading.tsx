export default function AiToolsLoading() {
  const pulse: React.CSSProperties = {
    background: 'var(--bg3)',
    borderRadius: 6,
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  return (
    <div role="status" aria-label="로딩 중" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100, paddingBottom: 80 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
        {/* 제목 스켈레톤 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...pulse, height: 10, width: 80, marginBottom: 12 }} />
          <div style={{ ...pulse, height: 30, width: 240, marginBottom: 8 }} />
          <div style={{ ...pulse, height: 14, width: 320 }} />
        </div>
        {/* 입력 폼 스켈레톤 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ ...pulse, height: 14, width: 100, marginBottom: 16 }} />
          <div style={{ ...pulse, height: 120, width: '100%', marginBottom: 16 }} />
          <div style={{ ...pulse, height: 42, width: 160 }} />
        </div>
      </div>
    </div>
  )
}
