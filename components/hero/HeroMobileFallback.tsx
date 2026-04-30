'use client'

/**
 * 모바일 전용 Hero 정적 fallback.
 * Three.js HeroScene 대신 베이지 배경 + 마룻바닥 grad + 천장 조명 점 표현.
 * 디자인은 데스크톱 3D 첫 프레임을 정적 흉내.
 */
export default function HeroMobileFallback() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        // 베이지 배경 (HeroScene scene.background = 0xE8E4D8)
        background: '#E8E4D8',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* 마룻바닥 perspective gradient — 아래에서 위로 부드럽게 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '52%',
          background:
            'linear-gradient(to top, rgba(193,166,124,0.55) 0%, rgba(212,191,158,0.32) 35%, rgba(232,228,216,0) 100%)',
        }}
      />

      {/* 마룻바닥 텍스처 라인들 (perspective 느낌) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: '120%',
          height: '40%',
          background:
            'repeating-linear-gradient(90deg, transparent 0, transparent 24px, rgba(146,108,72,0.06) 24px, rgba(146,108,72,0.06) 25px)',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }}
      />

      {/* 천장 조명 점 4개 (희미한 점) */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: 0,
          right: 0,
          height: '4px',
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(255, 245, 220, 0.85)',
              boxShadow: '0 0 18px 6px rgba(255, 235, 180, 0.4)',
            }}
          />
        ))}
      </div>

      {/* 천장 조명 아래 흐릿한 빛 풀(pool) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '20%',
          height: '50%',
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,240,205,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
