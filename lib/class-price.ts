/**
 * 수강료 문구 단일 출처 — 본문·FAQ·메타 설명·JSON-LD에 가격을 손으로 적지 말고 여기서 가져온다.
 * 값은 lib/classes.ts(CLASSES)만 따른다. 인상 때 lib/classes.ts 한 곳만 고치면
 * FAQ·클래스 페이지 설명·마이즈너 가이드·LocalBusiness priceRange·/llms.txt가 함께 바뀐다
 * (2026-10-11 AEO 감사: 하드코딩 여러 곳이 인상 체크리스트 밖이었음).
 *
 * ⚠️ 가격을 바꾸면 lib/last-updated.ts의 faq·basic·meisner·reel·audition·advancedReel·
 *    oneMonthReel·meisnerGuide 날짜도 같은 날로 올릴 것 — 답변 문장이 바뀌었는데
 *    dateModified·sitemap 날짜가 그대로면 검색엔진에 «안 바뀜» 신호가 간다.
 */
import { CLASSES } from './classes'

/** 예: wonOf('마이즈너 테크닉 정규 클래스') → '350,000원' */
export function wonOf(nameKo: string): string {
  const c = CLASSES.find((x) => x.nameKo === nameKo)
  if (!c) throw new Error(`class-price: lib/classes.ts에 «${nameKo}» 없음`)
  return `${c.price}원`
}

/** 월 수강료 범위 — 서비스(편집 등 10만 원 이하)는 빼고 클래스만. 예: '₩150,000 ~ ₩450,000' */
export function priceRangeKRW(): string {
  const prices = CLASSES.map((c) => Number(c.price.replace(/,/g, ''))).filter((n) => n > 100000)
  const fmt = (n: number) => `₩${n.toLocaleString('en-US')}`
  return `${fmt(Math.min(...prices))} ~ ${fmt(Math.max(...prices))}`
}
