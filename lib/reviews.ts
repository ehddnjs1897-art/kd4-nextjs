/**
 * KD4 멤버 후기 데이터 — /reviews 페이지 및 메인 페이지 마퀴에서 사용
 *
 * 가명 처리 완료. 익명 동의 받은 후기만 수록.
 */

export interface ReviewItem {
  text: string
  author: string
  emoji?: string
}

export const REVIEW_ITEMS: ReviewItem[] = [
  { text: '연기를 다시 즐길 수 있게 되었습니다', author: '조*솔', emoji: '😊' },
  { text: '마이즈너 테크닉을 처음 접했습니다. 진짜 연기가 뭔지 발견했습니다', author: '김*현', emoji: '😲' },
  { text: '단순한 클래스 이상의 경험, 연기에 대한 마음을 다시 채울 수 있는 소중한 시간', author: '이*정', emoji: '🥹' },
  { text: '형식적으로 흘러가기 쉬운데, KD4는 정말 달랐습니다', author: '박*우', emoji: '😤' },
  { text: '막 시작해서 방향을 찾고 있는 분들께 꼭 추천드리고 싶습니다', author: '최*민', emoji: '😄' },
  { text: '긴장 없이 연기를 순수하게 느낄 수 있었고, 그 시간이 저에게 큰 위로가 되었습니다', author: '한*아', emoji: '😌' },
  { text: '한 사람 한 사람에게 디테일한 피드백을 주신다는 점이 가장 좋았습니다', author: '정*석', emoji: '😍' },
  { text: '처음 만난 분들과도 자연스럽게 이야기를 나눌 수 있었고, 서로의 경험을 공유하는 느낌', author: '김*안', emoji: '🤗' },
  { text: '이런 좋은 프로그램을 받을 수 있게 해주셔서 감사드립니다', author: '윤*호', emoji: '😭' },
  { text: '지금 이 순간, 진짜 감정에 솔직하게 느끼는 것. 그게 마이즈너의 핵심이었습니다', author: '서*린', emoji: '🥺' },
]
