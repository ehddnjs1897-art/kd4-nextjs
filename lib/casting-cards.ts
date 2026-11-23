// ⚠️ 자동 생성 파일 — 직접 고치지 말 것. 새 카드를 만든 뒤 `node scripts/sync-casting-cards.mjs` 를 실행한다.
// «캐스팅 현황»(/casting) 전체 목록. 홈 화면의 고른 목록(lib/casting-photos.ts)과는 별개다.
// 방송사·작품·역할 = 카드에 적힌 글자 그대로 (다른 건은 스크립트의 OVERRIDES).

export interface CastingCard {
  /** 썸네일 경로 (public/casting/cards) */
  img: string
  name: string
  /** 방송사·플랫폼 — 카드 표기 그대로 */
  platform: string
  /** 작품명 — 카드 표기 그대로 */
  title: string
  /** 역할 — 카드에 적혀 있을 때만 */
  role?: string
  /** 카드 만든 날 (정렬용, 화면에 표시하지 않음) */
  madeAt: string
}

/** 최신순 */
export const CASTING_CARDS: CastingCard[] = [
  { img: '/casting/cards/3d8bb9431f.webp', name: '박우진', platform: 'KBS', title: '욕망의 덫', madeAt: '2026-11-23' },
  { img: '/casting/cards/cb5d01ea9d.webp', name: '권동원', platform: 'ENA', title: '그녀는 취급주의', madeAt: '2026-11-17' },
  { img: '/casting/cards/a4dd9d66d9.webp', name: '명승호', platform: 'tvN', title: '언내추럴', madeAt: '2026-11-17' },
  { img: '/casting/cards/048ea83a94.webp', name: '박우진', platform: 'MBC', title: '가족관계증명서', madeAt: '2026-10-15' },
  { img: '/casting/cards/41c55ecbfd.webp', name: '김이영', platform: 'TVING', title: '여고생왕후', madeAt: '2026-10-08' },
  { img: '/casting/cards/825ce35911.webp', name: '김이영', platform: 'KBS2', title: '욕망의 덫', madeAt: '2026-10-08' },
  { img: '/casting/cards/21c8c3897a.webp', name: '김이영', platform: 'SBS', title: '풀카운트', madeAt: '2026-10-08' },
  { img: '/casting/cards/7f22bcd2b0.webp', name: '김이영', platform: 'MBC', title: '하얀 스캔들', madeAt: '2026-10-08' },
  { img: '/casting/cards/29b14a9edc.webp', name: '명승호', platform: 'MBC', title: '라이어', madeAt: '2026-07-30' },
  { img: '/casting/cards/465bc9d8fb.webp', name: '장서후', platform: 'SBS', title: '굿 파트너2', madeAt: '2026-07-30' },
  { img: '/casting/cards/33f26935c8.webp', name: '육군길', platform: '숏폼', title: 'Your my destiny', madeAt: '2026-07-22' },
  { img: '/casting/cards/1696b21793.webp', name: '권동원', platform: 'KBS2', title: '기쁜 우리 좋은날', madeAt: '2026-07-20' },
  { img: '/casting/cards/27623530b6.webp', name: '김이영', platform: '숏폼', title: '추락한 kpop센터가 돌아왔다', madeAt: '2026-07-20' },
  { img: '/casting/cards/dd269ec10c.webp', name: '최지훈', platform: '숏폼', title: 'Your my destiny', madeAt: '2026-07-20' },
  { img: '/casting/cards/49760d78a9.webp', name: '심려진', platform: 'TV-CF', title: 'SC제일은행', madeAt: '2026-07-07' },
  { img: '/casting/cards/594239ca8a.webp', name: '윤지원', platform: 'MBC', title: '가족관계증명서', role: '조연 전정아 역', madeAt: '2026-07-07' },
  { img: '/casting/cards/0237eacd2e.webp', name: '이다은', platform: 'MBC', title: '가족관계증명서', madeAt: '2026-07-07' },
  { img: '/casting/cards/b5f072e279.webp', name: '채병욱', platform: 'KBS2', title: '문무', madeAt: '2026-06-23' },
  { img: '/casting/cards/80fa0d6f43.webp', name: '채병욱', platform: 'TV-CF', title: '테라 제로', madeAt: '2026-06-23' },
  { img: '/casting/cards/dce2d7b963.webp', name: '이훈', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-06-07' },
  { img: '/casting/cards/d66b7584ce.webp', name: '심려진', platform: 'SBS', title: '굿 파트너2', madeAt: '2026-05-31' },
  { img: '/casting/cards/c33bb33c6a.webp', name: '임세찬', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-05-31' },
  { img: '/casting/cards/9aee74e466.webp', name: '채병욱', platform: '상업영화', title: '칼 고두막한의 검', madeAt: '2026-05-31' },
  { img: '/casting/cards/0fa039f1af.webp', name: '최지훈', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-05-31' },
  { img: '/casting/cards/cd8c061ccf.webp', name: '권동원', platform: 'JTBC', title: '파이널 테이블', madeAt: '2026-05-30' },
  { img: '/casting/cards/993499df5a.webp', name: '명승호', platform: '릴숏', title: '뒤바뀐 아들, 스트라이커의 귀환', madeAt: '2026-05-29' },
  { img: '/casting/cards/6d4dc9d0ba.webp', name: '장서후', platform: '35만 유튜브', title: '또오숏', madeAt: '2026-05-29' },
  { img: '/casting/cards/18c480a774.webp', name: '채병욱', platform: '릴숏', title: '뒤바뀐 아들, 스트라이커의 귀환', madeAt: '2026-05-29' },
  { img: '/casting/cards/80a234182d.webp', name: '채병욱', platform: '350만 유튜브', title: '치즈필름', madeAt: '2026-05-29' },
  { img: '/casting/cards/062826bfd9.webp', name: '박우진', platform: '영화', title: '독자적 사고', madeAt: '2026-05-21' },
  { img: '/casting/cards/3413667b50.webp', name: '박우진', platform: 'ENA', title: '혹하는 로맨스', madeAt: '2026-05-21' },
  { img: '/casting/cards/cb46fa2414.webp', name: '김이영', platform: '비글루', title: '아이돌 센터의 컴백', madeAt: '2026-05-14' },
  { img: '/casting/cards/97bbffae19.webp', name: '설진수', platform: 'Netflix', title: '괸당', madeAt: '2026-05-14' },
  { img: '/casting/cards/2dcb92295b.webp', name: '채병욱', platform: 'tvN', title: '은퇴요원+관리팀', madeAt: '2026-05-14' },
  { img: '/casting/cards/ef6ac2bcbf.webp', name: '강승현', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-04-23' },
  { img: '/casting/cards/a5c14a54bd.webp', name: '권동원', platform: 'KBS2', title: '붉은진주', madeAt: '2026-04-23' },
  { img: '/casting/cards/9a791fd9a6.webp', name: '전금주', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-04-23' },
  { img: '/casting/cards/7fa9dd8c07.webp', name: '채병욱', platform: 'Netflix', title: '버라이어티', madeAt: '2026-04-23' },
  { img: '/casting/cards/25dfdb6d23.webp', name: '명승호', platform: 'ENA', title: '크래시2', madeAt: '2026-04-08' },
  { img: '/casting/cards/7bab89087c.webp', name: '김신율', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-03-31' },
  { img: '/casting/cards/731eb1a8dd.webp', name: '권동원', platform: 'tvN', title: '나의 유죄 인간', madeAt: '2026-03-24' },
  { img: '/casting/cards/73c571be21.webp', name: '권동원', platform: '디즈니+', title: '무빙2 : 지니어스', madeAt: '2026-03-24' },
  { img: '/casting/cards/72ca927506.webp', name: '김이영', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-03-24' },
  { img: '/casting/cards/3fbc13ac16.webp', name: '명승호', platform: '상업영화', title: '몽유도원도', madeAt: '2026-03-24' },
  { img: '/casting/cards/56c4b3aeec.webp', name: '명승호', platform: '상업영화', title: '와일드 씽', madeAt: '2026-03-24' },
  { img: '/casting/cards/cbd382a60e.webp', name: '명승호', platform: 'NETFLIX', title: '천천히 강렬하게', madeAt: '2026-03-24' },
  { img: '/casting/cards/babcef7a16.webp', name: '박우진', platform: 'ENA', title: '존버 닥터', madeAt: '2026-03-24' },
  { img: '/casting/cards/7b51b5394d.webp', name: '배승헌', platform: 'NETFLIX', title: '천천히 강렬하게', madeAt: '2026-03-24' },
  { img: '/casting/cards/25ba3bf586.webp', name: '이차일', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-03-24' },
  { img: '/casting/cards/69d02ea3e7.webp', name: '이훈', platform: '비글루', title: '국가권력급 상속자가 돌아왔다', role: '조연', madeAt: '2026-03-24' },
  { img: '/casting/cards/3c30f918f0.webp', name: '장서후', platform: '릴숏', title: '후회까지 168시간', role: '조연', madeAt: '2026-03-24' },
  { img: '/casting/cards/43c95f2ef6.webp', name: '정다운', platform: 'MBC', title: '첫 번째 남자', madeAt: '2026-03-24' },
]

/** «MBC 〈첫 번째 남자〉 · 조연» — 카드에 적힌 것만 이어 붙인다 */
export function castingCardWork(c: CastingCard): string {
  const work = [c.platform, c.title ? `〈${c.title}〉` : ''].filter(Boolean).join(' ')
  return [work, c.role].filter(Boolean).join(' · ')
}
