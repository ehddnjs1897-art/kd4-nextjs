// KD4 캐스팅현황 사진 목록
// 추가 방법: public/casting/ 폴더에 파일 넣고 아래 배열에 파일명 추가
// Supabase 연결 후 → Storage로 마이그레이션 예정

// 동일인물 사진이 연속으로 붙지 않도록 인터리브 배치
export const CASTING_PHOTOS: { file: string; name: string; work?: string }[] = [
  { file: 'KD4_캐스팅_권동원_1.png', name: '권동원' },
  { file: 'KD4_캐스팅_명승호_1.png', name: '명승호' },
  { file: 'KD4_캐스팅_강승현_1.png', name: '강승현' },
  { file: 'KD4_캐스팅_박우진_1.png', name: '박우진' },
  { file: 'KD4_캐스팅_권동원_무빙1.png', name: '권동원', work: '무빙' },
  { file: 'KD4_캐스팅_배승헌_1.png', name: '배승헌' },
  { file: 'KD4_캐스팅_윤지원_1.png', name: '윤지원' },
  { file: 'KD4_캐스팅_명승호_크래시2.png', name: '명승호', work: '크래시' },
  { file: 'KD4_캐스팅_이차일_1.png', name: '이차일' },
  { file: 'KD4_캐스팅_이훈_1.png', name: '이훈' },
  { file: 'KD4_캐스팅_장서후_1.png', name: '장서후' },
  { file: 'KD4_캐스팅_정다운_1 (1).png', name: '정다운' },
  { file: 'KD4_캐스팅_채병욱_1.png', name: '채병욱' },
  { file: 'KD4_캐스팅_김신율_1.png', name: '김신율' },
  { file: 'KD4_캐스팅_김이영_1.png', name: '김이영' },
]
