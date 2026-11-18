// KD4 캐스팅현황 사진 목록
// public/casting/ 로컬 정적 파일 서빙 (Supabase Storage 대신)
//
// 방송사·작품·역할은 각 카드 이미지에 적힌 글자를 그대로 옮긴 값이다 (2026-11-19).
// 추측으로 채우지 말 것 — 카드에 없는 값은 비워 둔다. 새 카드를 넣을 때도 카드 글자 그대로.
// 대표(권동원) 카드 2장(kwondongwon-1 · kwondongwon-moving1)은 멤버 목록에서 뺐다 —
// 대표 출연작은 홈 «대표 소개» 구간에 따로 있다. 이미지 파일은 public/casting/ 에 그대로 남아 있다.

const BASE = `/casting`

export interface CastingPhoto {
  url: string
  name: string
  /** 방송사·플랫폼 — 카드 표기 그대로 */
  platform?: string
  /** 작품명 — 카드 표기 그대로 */
  title?: string
  /** 역할 — 카드에 적혀 있을 때만 */
  role?: string
}

export const CASTING_PHOTOS: CastingPhoto[] = [
  { url: `${BASE}/yoonjiwon-1.webp`, name: '윤지원', platform: 'MBC', title: '가족관계증명서', role: '조연 전정아 역' },
  { url: `${BASE}/leechaeil-1.webp`, name: '이차일', platform: 'MBC', title: '첫 번째 남자' },
  { url: `${BASE}/kimiyoung-1.webp`, name: '김이영', platform: 'MBC', title: '첫 번째 남자' },
  { url: `${BASE}/pakwoojin-1.webp`, name: '박우진', platform: 'ENA', title: '존버 닥터' },
  { url: `${BASE}/kangseunghyun-1.webp`, name: '강승현', platform: 'MBC', title: '첫 번째 남자' },
  { url: `${BASE}/kimsinyul-1.webp`, name: '김신율', platform: 'MBC', title: '첫 번째 남자' },
  { url: `${BASE}/myungseungho-1.webp`, name: '명승호', platform: 'NETFLIX', title: '천천히 강렬하게' },
  { url: `${BASE}/baesunghun-1.webp`, name: '배승헌', platform: 'NETFLIX', title: '천천히 강렬하게' },
  { url: `${BASE}/myungseungho-crash2.webp`, name: '명승호', platform: 'ENA', title: '크래시2' },
  { url: `${BASE}/leehoon-1.webp`, name: '이훈', platform: '비글루', title: '국가권력급 상속자가 돌아왔다', role: '조연' },
  { url: `${BASE}/jangseohoo-1.webp`, name: '장서후', platform: '릴숏', title: '후회까지 168시간', role: '조연' },
  { url: `${BASE}/jungdawoon-1.webp`, name: '정다운', platform: 'MBC', title: '첫 번째 남자' },
  { url: `${BASE}/chaebiyungwook-1.webp`, name: '채병욱', platform: 'NETFLIX', title: '천천히 강렬하게' },
]

/** «MBC 〈첫 번째 남자〉» / «비글루 〈…〉 · 조연» — 카드에 적힌 것만 이어 붙인다 */
export function castingWork(p: CastingPhoto): string {
  const work = [p.platform, p.title ? `〈${p.title}〉` : ''].filter(Boolean).join(' ')
  return [work, p.role].filter(Boolean).join(' · ')
}
