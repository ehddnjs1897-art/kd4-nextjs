// KD4 캐스팅현황 사진 목록
// Supabase Storage: casting 버킷 사용

const BASE = 'https://qudyncopszvcbnwgrwbd.supabase.co/storage/v1/object/public/casting'

export const CASTING_PHOTOS: { url: string; name: string; work?: string }[] = [
  { url: `${BASE}/kwondongwon-1.png`, name: '권동원' },
  { url: `${BASE}/myungseungho-1.png`, name: '명승호' },
  { url: `${BASE}/kangseunghyun-1.png`, name: '강승현' },
  { url: `${BASE}/pakwoojin-1.png`, name: '박우진' },
  { url: `${BASE}/kwondongwon-moving1.png`, name: '권동원', work: '무빙' },
  { url: `${BASE}/baesunghun-1.png`, name: '배승헌' },
  { url: `${BASE}/yoonjiwon-1.png`, name: '윤지원' },
  { url: `${BASE}/myungseungho-crash2.png`, name: '명승호', work: '크래시' },
  { url: `${BASE}/leechaeil-1.png`, name: '이차일' },
  { url: `${BASE}/leehoon-1.png`, name: '이훈' },
  { url: `${BASE}/jangseohoo-1.png`, name: '장서후' },
  { url: `${BASE}/jungdawoon-1.png`, name: '정다운' },
  { url: `${BASE}/chaebiyungwook-1.png`, name: '채병욱' },
  { url: `${BASE}/kimsinyul-1.png`, name: '김신율' },
  { url: `${BASE}/kimiyoung-1.png`, name: '김이영' },
]
