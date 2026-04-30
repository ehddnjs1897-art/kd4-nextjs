// KD4 캐스팅현황 사진 목록
// public/casting/ 로컬 정적 파일 서빙 (Supabase Storage 대신)

const BASE = `/casting`

export const CASTING_PHOTOS: { url: string; name: string; work?: string }[] = [
  // ── 고정 앞 7명 ──
  { url: `${BASE}/kwondongwon-1.png`, name: '권동원' },
  { url: `${BASE}/yoonjiwon-1.png`, name: '윤지원' },
  { url: `${BASE}/leechaeil-1.png`, name: '이차일' },
  { url: `${BASE}/kimiyoung-1.png`, name: '김이영' },
  { url: `${BASE}/pakwoojin-1.png`, name: '박우진' },
  { url: `${BASE}/kangseunghyun-1.png`, name: '강승현' },
  { url: `${BASE}/kimsinyul-1.png`, name: '김신율' },
  // ── 나머지 기존 순서 ──
  { url: `${BASE}/myungseungho-1.png`, name: '명승호' },
  { url: `${BASE}/kwondongwon-moving1.png`, name: '권동원', work: '무빙' },
  { url: `${BASE}/baesunghun-1.png`, name: '배승헌' },
  { url: `${BASE}/myungseungho-crash2.png`, name: '명승호', work: '크래시' },
  { url: `${BASE}/leehoon-1.png`, name: '이훈' },
  { url: `${BASE}/jangseohoo-1.png`, name: '장서후' },
  { url: `${BASE}/jungdawoon-1.png`, name: '정다운' },
  { url: `${BASE}/chaebiyungwook-1.png`, name: '채병욱' },
]
