/**
 * 배우 프로필 완성도 계산 — 순수 함수 (서버/클라이언트 공용)
 *
 * 배경: 배우 DB가 "사진첩"에서 멈춰 있음(사진 92% vs 한줄소개 6%·영상 42%).
 *       배우 본인이 마이페이지에서 빈칸을 스스로 채우도록 유도하기 위한 계산 로직.
 *       (분석가 리포트 2026-06-08: 평균 완성도 1.40/3 → 세일즈 포인트(소개·영상)가 비어있음)
 *
 * 원칙:
 *  - prod DB write 없음. 이미 불러온 값으로 "계산·표시"만.
 *  - dialects 등 신규 컬럼은 존재하지 않을 수 있음(42703) → hasDialectsColumn=false면 항목 자체 제외 후 정규화.
 *  - 가중치는 캐스팅 담당자 관점의 중요도 순. 한줄소개·영상에 비중을 둠(가장 큰 공백이라 채우면 효과 큼).
 */

export interface CompletenessInput {
  /** 대표사진(is_profile) 존재 여부 — 없으면 일반 사진 1장+로도 인정하려면 photoCount로 보강 */
  hasProfilePhoto: boolean
  /** 전체 사진 수 (대표 포함) */
  photoCount: number
  /** 출연영상(youtube + 업로드) 합산 개수 */
  videoCount: number
  /** 한줄소개(casting_summary)가 비어있지 않은지 */
  hasCastingSummary: boolean
  /** 필모그래피 건수 */
  filmographyCount: number
  /** 특기(skills) 개수 */
  skillsCount: number
  /** 사투리(dialects) 개수 */
  dialectsCount: number
  /**
   * dialects 컬럼이 DB에 실제 존재하는지(마이그레이션 적용 여부).
   * false면 사투리 항목을 완성도 계산에서 통째로 제외(남은 항목으로 100% 정규화).
   */
  hasDialectsColumn: boolean
}

export interface CompletenessItem {
  /** 안정적 식별 키 */
  key: 'photo' | 'extraHeadshots' | 'video' | 'summary' | 'filmography' | 'skills' | 'dialects'
  /** 사람이 읽는 짧은 라벨 */
  label: string
  /** 이모지 아이콘 (장식용) */
  icon: string
  /** 채워졌는지 */
  done: boolean
  /** 가중치(점수) */
  weight: number
  /** 빈칸일 때 배우에게 보여줄 행동 유도 문구(짧게) */
  hint: string
}

export interface CompletenessResult {
  /** 0~100 정수 퍼센트 */
  pct: number
  /** 항목 배열(표시 순서대로) */
  items: CompletenessItem[]
  /** 채워진 항목 수 */
  doneCount: number
  /** 전체 항목 수 */
  totalCount: number
  /** 아직 비어있는 항목들(가중치 큰 순) */
  missing: CompletenessItem[]
}

/**
 * 가중치 설계 (합계 100, 사투리 포함 시):
 *  - 대표사진 20 : 캐스팅의 첫인상. 없으면 목록에서 placeholder.
 *  - 한줄소개 20 : 담당자가 5초 안에 제일 먼저 읽는 정보 (현재 6%로 최대 공백).
 *  - 출연영상 20 : 연기를 실제로 보여주는 핵심 자료 (현재 42%).
 *  - 필모    15 : 경력 (이미 강점 영역이지만 신규 멤버 유도용).
 *  - 추가헤드샷 10: 2장 이상 — 다양한 각도/표정.
 *  - 특기     8 : 검색·매칭 보조.
 *  - 사투리   7 : 한국 공고에서 자주 찾는 조건 (컬럼 없으면 제외).
 */
export function computeProfileCompleteness(input: CompletenessInput): CompletenessResult {
  const items: CompletenessItem[] = [
    {
      key: 'photo',
      label: '대표사진',
      icon: '📸',
      // 대표사진 플래그가 없어도 사진이 1장이라도 있으면 인정(대표 미지정 케이스 구제)
      done: input.hasProfilePhoto || input.photoCount > 0,
      weight: 20,
      hint: '대표사진 한 장',
    },
    {
      key: 'summary',
      label: '한줄소개',
      icon: '✍️',
      done: input.hasCastingSummary,
      weight: 20,
      hint: '나를 한 줄로 소개',
    },
    {
      key: 'video',
      label: '출연영상',
      icon: '🎬',
      done: input.videoCount > 0,
      weight: 20,
      hint: '출연영상 1개',
    },
    {
      key: 'filmography',
      label: '필모그래피',
      icon: '📋',
      done: input.filmographyCount > 0,
      weight: 15,
      hint: '경력 1건',
    },
    {
      key: 'extraHeadshots',
      label: '추가 헤드샷',
      icon: '🖼️',
      done: input.photoCount >= 2,
      weight: 10,
      hint: '사진 2장 이상',
    },
    {
      key: 'skills',
      label: '특기',
      icon: '⭐',
      done: input.skillsCount > 0,
      weight: 8,
      hint: '특기 입력',
    },
  ]

  // 사투리 컬럼이 실제 존재할 때만 항목으로 포함 (없으면 남은 항목으로 100% 정규화)
  if (input.hasDialectsColumn) {
    items.push({
      key: 'dialects',
      label: '사투리',
      icon: '🗣️',
      done: input.dialectsCount > 0,
      weight: 7,
      hint: '가능한 사투리',
    })
  }

  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  const doneWeight = items.reduce((sum, i) => (i.done ? sum + i.weight : sum), 0)
  // totalWeight는 항상 > 0 이지만 방어적으로 0 가드
  const pct = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0

  const doneCount = items.filter((i) => i.done).length
  const missing = items.filter((i) => !i.done).sort((a, b) => b.weight - a.weight)

  return {
    pct,
    items,
    doneCount,
    totalCount: items.length,
    missing,
  }
}
