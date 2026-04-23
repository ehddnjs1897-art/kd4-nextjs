/** KD4 폼 공용 선택지 — JoinForm · ContactForm 에서 공유 */

export const SOURCE_VALUES = [
  '인스타그램',
  '네이버 블로그',
  '액터길드',
  '필름메이커스',
  'OTR',
  '네이버·구글 검색',
  'AI 추천',
  '지인소개',
  '리플레이 단톡방',
  '기타',
] as const

export const MEISNER_OPTIONS = [
  { value: '', label: '마이즈너 경험 선택' },
  { value: '처음이다.', label: '처음이다.' },
  { value: '몇 번 해봤다.', label: '몇 번 해봤다.' },
  { value: '6개월 이상 훈련 했다.', label: '6개월 이상 훈련 했다.' },
] as const

export const INQUIRY_OPTIONS = [
  { value: '방문 상담',                          label: '방문 상담',          icon: '😊', desc: '자세한 상담' },
  { value: '바로 수강신청 (첫 달 10만원 할인)', label: '봄 맞이, 웰컴 할인', icon: '🌸', desc: '(마이즈너 정규, 출연영상)' },
  { value: '무료 오픈클래스',                    label: '오픈클래스',          icon: '🎁', desc: '무료 체험 클래스\n(대기 신청)' },
] as const
