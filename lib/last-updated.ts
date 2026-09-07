/**
 * 페이지별 "마지막 콘텐츠 수정일" 단일 출처.
 *
 * JSON-LD dateModified 와 app/sitemap.ts 의 lastModified 가 서로 다른 날짜를 말하면
 * 검색엔진에 모순 신호가 되므로(예: /reel-production-class JSON-LD 07-20 vs sitemap 06-11)
 * 양쪽 모두 이 상수를 import 해서 쓴다. 값은 `git log -1 --format=%cs -- <파일>` 실측(2026-08-19).
 *
 * 페이지 콘텐츠를 실제로 고칠 때만 갱신할 것 — 배포일·오늘 날짜를 넣으면
 * "매일 변경됨" 거짓 신호가 되어 신뢰도가 떨어진다.
 */
// 2026-08-30 텍스트 감사 일괄 수정 (캐스팅 80건·프로그램 명칭·문구 정합화)
export const LAST_UPDATED = {
  home: '2026-08-30',
  about: '2026-08-30',
  classes: '2026-08-30',
  basic: '2026-08-30',
  meisner: '2026-08-30',
  // /meisner-technique — 정보형 가이드 (2026-08-20 신설)
  meisnerGuide: '2026-08-20',
  // /meisner-technique/repetition-emotion-words — 레피티션 감정 어휘표 (2026-09-08 신설)
  repetitionWords: '2026-09-08',
  reel: '2026-08-30',
  sinchon: '2026-08-20',
  coaches: '2026-08-30',
  join: '2026-08-30',
} as const
