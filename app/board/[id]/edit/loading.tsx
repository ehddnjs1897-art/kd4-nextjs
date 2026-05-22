export default function EditPostLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '80px 0 120px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        {/* 헤더 스켈레톤 */}
        <div style={{ marginBottom: '40px' }}>
          <div style={sk(80, 10, '0 0 12px')} />
          <div style={sk(100, 32)} />
        </div>

        {/* 카테고리 버튼 스켈레톤 */}
        <div style={{ marginBottom: '18px' }}>
          <div style={sk(60, 12, '0 0 8px')} />
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={sk(58, 34)} />
            ))}
          </div>
        </div>

        {/* 제목 입력 스켈레톤 */}
        <div style={{ marginBottom: '18px' }}>
          <div style={sk(30, 12, '0 0 8px')} />
          <div style={sk('100%', 44)} />
        </div>

        {/* 내용 textarea 스켈레톤 */}
        <div style={{ marginBottom: '28px' }}>
          <div style={sk(30, 12, '0 0 8px')} />
          <div style={sk('100%', 220)} />
        </div>

        {/* 버튼 스켈레톤 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <div style={sk(70, 40)} />
          <div style={sk(70, 40)} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

function sk(width: number | string, height: number, margin?: string): React.CSSProperties {
  return {
    width,
    height,
    margin: margin ?? 0,
    borderRadius: 6,
    background: 'var(--bg3)',
    animation: 'pulse 1.5s ease-in-out infinite',
  }
}
