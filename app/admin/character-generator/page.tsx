/**
 * 배우 캐릭터셋 프로필 생성기 (관리자 전용)
 * - 정면/우측면/좌측면 사진 3장 + 출연작 텍스트 → 캐스팅 프로필 카드 PNG 생성
 * - auth/role은 app/admin/layout.tsx에서 처리
 *
 * ⚠️ 데이터 입력 룰(CLAUDE.md): 방송사/출연작은 사람이 직접 입력. AI 추측 입력 금지.
 *    이 도구는 입력 폼만 제공하며 텍스트를 자동 생성/추론하지 않는다.
 */
import type { Metadata } from 'next'
import CharacterGenerator from './CharacterGenerator'

export const metadata: Metadata = {
  title: '캐릭터셋 생성기',
  description: 'KD4 배우 캐릭터셋 프로필 생성기',
  robots: { index: false, follow: false },
}

export default function CharacterGeneratorPage() {
  return <CharacterGenerator />
}
