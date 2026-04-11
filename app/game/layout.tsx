import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OFF THE PLASTIC | KD4 게임',
  description: '가면을 벗어라. 무대 위로, 더 높이. KD4 액팅 스튜디오 3D 아케이드 게임.',
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#020202',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  )
}
