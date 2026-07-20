export interface ClassItem {
  step: string;
  nameKo: string;
  nameEn: string;
  quote: string;
  subtitle?: string;
  note?: string;
  bullets: string[];
  schedule: string;
  duration: string;
  capacity: string;
  course?: string;
  price: string;
  originalPrice?: string;       // 할인 전 원가 (할인 중일 때만, 2026-05-30 봄맞이 종료로 모두 제거)
  promoLabel?: string;           // 프로모션 라벨 (현재 미사용, 다음 프로모션 시 부활 가능)
  lumpSumDiscount?: number;      // 전체 수강료 일시납 시 추가 할인액
  remainingSeats?: number;       // (2026-05-30 비활성) 잔여석 수치 — UI 미표시, HOT 뱃지로 대체
  hot?: boolean;                 // 🔥 HOT 뱃지 (인기 클래스)
  instructor?: string;
  highlight?: boolean;
  isNewMemberOpen?: boolean;    // 신규 신청 가능 클래스
  isHobby?: boolean;            // 취미반 딱지
  category?: "step2" | "step3" | "extra"; // 이후 클래스 분류
}

/** 프로모션 마감일 — 다음 프로모션 시작 시 미래 시각으로 갱신 (2026-05-30 봄맞이 종료)
 * ⚠️ 현재 과거 날짜(2026-05-31) — 사용 클래스 없음(originalPrice 모두 미설정)이므로 무해.
 *    다음 프로모션 시 미래 날짜로 반드시 업데이트할 것 (과거 priceValidUntil → Google 경고) */
export const PROMO_DEADLINE = '2026-05-31T23:59:59'

export const CLASSES: ClassItem[] = [
  {
    step: "STEP 1",
    nameKo: "베이직 클래스",
    nameEn: "Basic Class",
    quote: "취미로 가볍게 시작하는 연기",
    subtitle: "취미 클래스 · 연기 입문",
    note: "연기 경험 없어도 OK · 취미 참여 환영",
    bullets: [
      "감정 해방 훈련 / 충동·본능 회복",
      "마이즈너 테크닉 기초 / 이바나 처벅 테크닉 입문",
      "독백 / 장면연기",
      "소수정예"
    ],
    schedule: "월 4회",
    duration: "3시간",
    capacity: "6명",
    price: "250,000",
    instructor: "박우진 리더",
    isNewMemberOpen: true,
    isHobby: true,
  },
  {
    step: "STEP 1",
    nameKo: "마이즈너 테크닉 정규 클래스",
    nameEn: "Meisner Technique Class",
    quote: "막혀있던 감정의 둑을 터뜨리는 수업, 배우로 다시 태어나는 시간",
    subtitle: "마이즈너 테크닉 / 장면연기",
    bullets: [
      "Repetition · Activity&door 7단계 실습",
      "메모라이징 / 마이즈너식 텍스트 분석",
      "감정 해방 / 충동·본능 회복 / 연기하지 않는 연기"
    ],
    schedule: "월 4회",
    duration: "4시간",
    capacity: "8명",
    course: "4개월 코스",
    price: "350,000",
    instructor: "권동원 대표",
    highlight: true,
    isNewMemberOpen: true,
    lumpSumDiscount: 100000,
    hot: true,
  },
  {
    step: "STEP 1",
    nameKo: "출연영상 클래스",
    nameEn: "Intensive Class",
    quote: "실제 영화 현장의 퀄리티로 당신의 포트폴리오를 만듭니다.",
    subtitle: "마이즈너 테크닉 / 포트폴리오 제작",
    bullets: [
      "마이즈너 / 이바나 처벅 테크닉",
      "맞춤형 시나리오 / 전문 영화팀 제작",
      "현직 배우 100여명 참여한 시그니처 클래스",
      "완성된 출연영상으로 캐스팅 연계"
    ],
    schedule: "월 4회",
    duration: "4시간",
    capacity: "8명",
    course: "3개월 코스",
    price: "400,000",
    instructor: "권동원 대표",
    highlight: true,
    isNewMemberOpen: true,
    lumpSumDiscount: 100000,
    hot: true,
  },
  {
    step: "STEP 2",
    nameKo: "출연영상 심화 클래스",
    category: "step2",
    nameEn: "Advanced Class",
    quote: "수료자만 선택할 수 있는 두 가지 트랙",
    bullets: [
      "고급 장면 연기",
      "이바나 처벅 테크닉 심화",
      "맞춤형 시나리오 / 전문 영화팀 제작",
      "캐스팅 연계"
    ],
    schedule: "월 4회",
    duration: "4시간",
    capacity: "6명",
    course: "2개월",
    price: "450,000"
  },
  {
    step: "STEP 2",
    nameKo: "출연영상 1달 완성 클래스",
    category: "step2",
    nameEn: "1 Month Film Class",
    quote: "수업 없이 영상만 — 1개월 완성",
    subtitle: "1month · 영상만 제작",
    bullets: [
      "수업 없이 영상만 제작",
      "레퍼런스 취합",
      "시나리오 전달",
      "현장 촬영"
    ],
    schedule: "상시",
    duration: "영상 제작 전용",
    capacity: "소수정예",
    price: "400,000"
  },
  {
    step: "STEP 3",
    nameKo: "액터스 리더 클래스",
    category: "step3",
    nameEn: "Actor's Leader Class",
    quote: "KD4가 엄선한 정예 멤버 10명, 캐스팅 전폭 지원",
    bullets: [
      "선별된 인원 참여 / 장면연기 Competition",
      "캐스팅 디렉터·조감독 비공식 오디션",
      "지속적 성장 지원"
    ],
    schedule: "월 4회",
    duration: "3시간",
    capacity: "10명",
    course: "5개월 시즌제",
    price: "200,000"
  },
  {
    step: "STEP 3",
    nameKo: "오디션 테크닉 클래스",
    category: "step3",
    nameEn: "Audition Technique Class",
    quote: "캐스팅 디렉터의 시선을 멈추게 할 독백 만들기",
    bullets: [
      "오디션 독백 만들기 / 오디션 테크닉",
      "캐스팅 연계",
      "독백 영상 촬영 제공"
    ],
    schedule: "월 4회",
    duration: "3시간",
    capacity: "6명",
    price: "250,000",
    instructor: "주세빈 강사"
  },
  {
    step: "별도",
    nameKo: "움직임 클래스",
    category: "extra",
    nameEn: "Movement Class",
    quote: "몸과 마음의 연동",
    bullets: [
      "바디컨디셔닝 / 이완된 몸",
      "감정 해방 / 마음과 몸의 연동"
    ],
    schedule: "월 3회",
    duration: "3시간",
    capacity: "8명",
    price: "150,000",
    instructor: "고서현 리더"
  },
  {
    step: "별도",
    nameKo: "개인 레슨",
    category: "extra",
    nameEn: "Personal Class",
    quote: "나만을 위한 집중 훈련",
    bullets: [
      "오디션 준비 / 감정의 해방",
      "집중 연기 훈련 / 완전한 1:1 맞춤 지도"
    ],
    schedule: "월 4회",
    duration: "2시간 (1:1)",
    capacity: "1:1",
    price: "400,000"
  }
];

/* ──────────────────────────────────────────────────────────────
 * 권동원 대표 이력 템플릿
 *  - kd4.club 메인(app/page.tsx L661-751)을 정답지로 삼음
 *  - 필요할 때 언제든 DIRECTOR.xxx 로 참조
 *    · profileFlat: 메인 PROFILE 섹션과 동일한 9줄 평탄 배열
 *    · credentials: 그룹별 분류 (career/awards/channels/education)
 *    · filmography: 드라마/영화/CF 분류
 *    · highlights: Join 등 짧은 랜딩용 5줄 요약
 *    · quote: 강사 인용문 (이탤릭 표시용)
 *    · photo: public/director.jpg 로컬 경로
 * ────────────────────────────────────────────────────────────── */

export interface DirectorProfile {
  name: string;
  title: string;
  photo: string;
  quote: string;
  credentials: {
    career: string[];
    awards: string[];
    channels: string[];
    education: string[];
  };
  filmography: {
    drama: string[];
    film: string[];
    cf: string[];
  };
  profileFlat: string[];
  highlights: string[];
}

export const DIRECTOR: DirectorProfile = {
  name: "권동원",
  title: "KD4 액팅 코치 (리더) · 현역 배우",
  photo: "/director.jpg",
  quote:
    "같이 현장에서 일하는 동료로서 훈련을 리드합니다. 이론만이 아니라 지금 촬영장에서 통하는 연기와 노하우를 공유합니다.",

  credentials: {
    career: ["유익액터스 대표", "경계선 제작·주연", "프로 배우 400명+ 액팅 코칭"],
    awards: ["K-웹드라마 어워드 연기상 수상", "LG 크리에이터 특별상"],
    channels: ["Youtube 2000만뷰+"],
    education: [
      "LA Meisner Workshop 수료",
      "한국 마이즈너 테크닉 아카데미 수료",
      "건명원 / The Chora 졸업",
    ],
  },

  filmography: {
    drama: [
      "Disney+ 무빙2 (2026)",
      "나의 유죄 인간 (2026)",
      "금쪽같은 내 스타 (2025)",
      "Netflix 중증외상센터 (2025)",
      "세작 (2024)",
    ],
    film: ["경계선 (2025, 제작·주연)", "강철비2 (2021)"],
    cf: ["MSD 제약 키트루다 (2025)", "현대 인증중고차 (2024)"],
  },

  // 메인 페이지 PROFILE 섹션 원본 순서 (평탄)
  profileFlat: [
    "프로 배우 400명+ 액팅 코칭",
    "유익액터스 대표",
    "경계선 제작·주연",
    "K-웹드라마 어워드 연기상 수상",
    "LG 크리에이터 특별상",
    "YouTube 2000만뷰+",
    "건명원 / The Chora 졸업",
    "LA Meisner Workshop 수료",
    "한국 마이즈너 테크닉 아카데미 수료",
  ],

  // Join 등 짧은 랜딩용 하이라이트 5줄 (메인 이력을 축약·그룹핑)
  highlights: [
    "Disney+ 무빙2 (2026) · Netflix 중증외상센터 (2025)",
    "LA Meisner Workshop 수료 · 한국 마이즈너 테크닉 아카데미 수료",
    "유익액터스 대표 · 영화 경계선 제작·주연",
    "K-웹드라마 어워드 연기상 수상 · LG 크리에이터 특별상",
    "프로 배우 400명+ 액팅 코칭 · Youtube 2000만뷰+",
  ],
};

/* ──────────────────────────────────────────────────────────────
 * 오디션 테크닉 클래스 강사 프로필 (acting-coach-sebin-joo 페이지 전용)
 * 출처: 주세빈 프로필.pdf(2026-07-21 대표 전달) + 채팅 명시 값(주연/조연 표기)
 *    · photo: public/sebin-joo.jpg (프로필 PDF 원본 사진, 소속 AINOK)
 * ────────────────────────────────────────────────────────────── */

export interface InstructorProfile {
  name: string;
  nameEn: string;
  title: string;
  photo: string;
  birth: string;
  height: string;
  weight: string;
  talent: string[];
  education: string[];
  filmography: {
    drama: string[];
    play: string[];
    cf: string[];
    movie: string[];
  };
}

export const SEBIN: InstructorProfile = {
  name: "주세빈",
  nameEn: "Joo Se Bin",
  title: "KD4 오디션 테크닉 클래스 강사",
  photo: "/sebin-joo.jpg",
  birth: "1997.10.09",
  height: "164cm",
  weight: "41kg",
  talent: ["영어 (고급)", "승마", "춤", "노래", "발레"],
  education: ["동국대학교 연극영화과 졸업", "동국대학교 MFA 재학중"],

  filmography: {
    drama: [
      "TV조선 \"닥터신\" 주연",
      "JTBC \"디 엠파이어: 법의제국\" 조연",
      "카카오TV \"다시, 플라이\"",
      "tvN \"여신강림\"",
      "OCN \"미스터 기간제\"",
    ],
    play: [
      "연극 \"찔레꽃\"",
      "연극 \"밑바닥에서\"",
      "연극 \"꽃의 비밀\"",
      "연극 \"순우삼촌\"",
    ],
    cf: ["아모레퍼시픽 프리메라", "아리얼", "LG OLED TV", "Ulkin(얼킨) 외 다수"],
    movie: ["상업영화 \"무무무\" 개봉 예정"],
  },
};
