import { Repeat2, DoorOpen, Heart, Eye, Film } from 'lucide-react'
import { CLASSES } from '@/lib/classes'
import type { FaqItem } from '@/lib/landing-faqs'

/**
 * 클래스 페이지 본문 데이터 — 클래스 페이지(/basic-acting-class 등)와 광고 전용 랜딩(/ad/[cls])이 같이 쓴다.
 * 2026-10-19 각 page.tsx에서 그대로 옮김(내용 변경 없음). 여기 한 곳만 고치면 두 페이지에 같이 반영된다.
 * 가격·정원·시간은 여전히 lib/classes.ts가 원본.
 */

export type CurriculumSession = { title: string; detail: string | null; highlight?: boolean }
export type CurriculumMonth = { month: string; emoji: string; goal: string | null; sessions: CurriculumSession[] }

const AUDITION = CLASSES.find((c) => c.nameKo === '오디션 테크닉 클래스')!

/* ━━ basic-acting-class ━━ */
/** 베이직 클래스 3개월 커리큘럼 — 노션 「🎭 베이직 클래스 커리큘럼 (3개월 과정)」(3d571cf4…607f) 원문을 그대로 옮김.
 *  2026-09-23 대표 지시: 문자·사이트에서 노션 링크 대신 이 페이지에 기록. 내용 수정 시 노션과 이 배열을 함께 고칠 것. */
export const BASIC_CURRICULUM: { month: string; theme: string; lead: string; items: string[] }[] = [
  {
    month: 'MONTH 1',
    theme: 'PLAY',
    lead: '놀면서 연기와 친해진다.',
    items: [
      '1주차 · 어색함 깨기 — 핑거태그 · 코미디임프라브 · 거울놀이 · 마피아',
      '2주차 · 표현하고 받아들이기 — 핑거태그 · 코미디임프라브 · 감정해방 · Yes, And Then...',
      '3주차 · 상황과 목적을 가지고 놀기 — 의자 빼앗기 (처음 만난 사이)',
      '4주차 · 관계를 가지고 놀기 — 관계가 있는 의자 빼앗기',
    ],
  },
  {
    month: 'MONTH 2',
    theme: 'PARTNER',
    lead: '상대방과 실제로 연기해본다. 실제 대본을 사용합니다.',
    items: [
      '실제 2인 대본 사용',
      '상대방을 보며 연기하기',
      '대사를 혼자 준비해서 보여주는 방식에서 벗어나기',
      '상대에 따라 연기가 달라지는 경험하기',
      '짧은 장면을 반복해서 경험하기',
    ],
  },
  {
    month: 'MONTH 3',
    theme: 'SCENE',
    lead: '하나의 장면을 만들어 완성한다.',
    items: [
      '실제 대본 선택',
      '관계와 상황 이해',
      '상대와 장면 맞추기',
      '동선과 행동 만들기',
      '반복 연습',
      '촬영 또는 발표',
    ],
  },
]

/** 이 페이지 전용 FAQ — 답변은 /faq 기존 답변을 요약해 재사용 (새 사실 추가 금지) */
export const BASIC_FAQ: FaqItem[] = [
  {
    q: '연기 경험이 전혀 없어도 되나요?',
    a: '괜찮습니다. 베이직 클래스는 연기 경험 없어도 OK · 취미 참여 환영인 입문 트랙입니다. 마이즈너 테크닉은 "반응"을 훈련하는 방식이라 기존에 배운 습관이 없는 분이 오히려 더 빠르게 체화되는 경우가 많습니다.',
  },
  {
    q: '나이 제한이 있나요?',
    a: '연령 제한은 없습니다. 성인 취미 연기부터 지망생·직장인·경력 배우까지 다양한 연령대가 함께 훈련합니다.',
  },
  {
    q: '직장인도 병행할 수 있나요?',
    a: '가능합니다. 베이직 클래스는 매주 토요일, 회당 3시간 진행되어 평일 일정이 있는 직장인도 부담 없이 병행할 수 있습니다.',
  },
]

export const BASIC_AUDIENCE = [
  {
    title: '연기를 처음 접하는 성인',
    desc: '연기 경험 없어도 OK · 취미 참여 환영. 카메라 앞이 처음이어도 처음부터 함께 시작합니다.',
  },
  {
    title: '취미로 가볍게 시작하고 싶은 분',
    desc: '취미 클래스 · 연기 입문 트랙입니다. KD4는 입시 전문 학원이 아닙니다.',
  },
  {
    title: '주말에 시간을 내는 직장인',
    desc: '베이직 클래스는 매주 토요일에 진행됩니다. 평일 일정과 겹치지 않습니다.',
  },
]

/* ━━ audition-technique-class ━━ */
/** 추천 대상 — 노션 「KD4 오디션 테크닉 정규 클래스 · 모집」 원문 그대로 */
export const AUDITION_AUDIENCE = [
  '준비한 게 오디션에서 실제로 나오지 않는 배우',
  '카메라 앞에서 긴장이 풀리지 않는 배우',
  '자신의 매력을 아직 모르는 배우',
  '오디션 에티튜드가 부족하다고 느끼는 배우',
  '캐스팅 디렉터의 시선을 배우고 싶은 배우',
  '오디션 보러 가는 독백 레퍼토리가 없는 배우',
]

/** 3개월 커리큘럼 — 노션 「오디션 테크닉」(7. 커리큘럼 안내) 원문 요약. 원본 수정은 노션에서만 */
export const AUDITION_CURRICULUM = [
  {
    month: '1개월 차',
    title: '이미지 브랜딩 및 독백 선정',
    goal: '본인의 정확한 배우 포지셔닝을 확립하고, 이에 맞는 최적의 독백을 무기로 만들기',
    weeks: [
      { w: '1주차', h: '오리엔테이션 · 이미지 프리즘', d: '내가 밀고 있는 이미지와 남이 보는 첫인상을 맞춰 보고, 프로필 사진을 진단해 이미지 방향을 정합니다.' },
      { w: '2주차', h: '배우 포지셔닝 · 1차 독백 매칭', d: '지금 드라마·영화 시장에서 나와 비슷한 포지션의 기성 배우를 분석하고, 준비해 온 독백이 내 이미지에 맞는지 1차로 걸러냅니다.' },
      { w: '3주차', h: '독백 확정 · 텍스트 분석', d: '각자의 «인생 독백»을 확정하고 서사·서브텍스트·목적을 분석해 캐릭터를 구체화합니다.' },
      { w: '4주차', h: '1차 중간 점검 (카메라 테스트)', d: '확정한 독백을 카메라 앞에서 읽고, 모니터링으로 시선 처리·톤·습관을 1차 교정합니다.' },
    ],
  },
  {
    month: '2개월 차',
    title: '연기 고도화 및 오디션 테크닉',
    goal: '독백의 완성도를 끌어올리고, 오디션장에서 벌어지는 변수(지정 대사·디렉션 변경)에 대응하는 훈련',
    weeks: [
      { w: '5주차', h: '디테일 연기 훈련', d: '대사의 맛을 살리는 화술(포즈·호흡·장단음)을 교정하고, 매체 연기에 맞는 미세한 표정과 신체 활용을 다룹니다.' },
      { w: '6주차', h: '오디션 에티튜드 · 멘탈 브랜딩', d: '문을 열고 들어와 나가기까지의 태도(워킹·인사·아이컨택), 긴장 완화와 자신감 연출법을 훈련합니다.' },
      { w: '7~8주차', h: '실전 변수 대응 (2차 카메라 테스트)', d: '10분 전에 받은 대본을 빠르게 분석하는 법, 심사위원의 갑작스러운 디렉션에 대처하는 훈련을 합니다.' },
    ],
  },
  {
    month: '3개월 차',
    title: '모의 오디션 및 실전 마스터',
    goal: '실제 오디션 환경을 그대로 재현하고, 최종 피드백으로 현장에 바로 들어갈 준비를 마치기',
    weeks: [
      { w: '9주차', h: '심화 — 2차 독백 개발', d: '기존 독백과 상반되는, 또는 특정 무기로 쓸 수 있는 2차 독백을 완성합니다. (사투리·사극 독백 등)' },
      { w: '10주차', h: '1차 종합 시뮬레이션 (전 과정 녹화)', d: '입장 → 자기소개 → 자유 독백 → 지정 대사 → Q&A → 퇴장 전 과정을 롤플레잉하고 블라인드 피드백을 받습니다.' },
      { w: '11주차', h: '최종 파이널 디렉팅 · 모니터링', d: '녹화본을 프레임 단위로 수정하고, 메이크업·의상 팁을 포함한 개인별 오디션 가이드라인을 점검합니다.' },
      { w: '12주차', h: '최종 모의 오디션', d: '실제 오디션장과 거의 같은 환경에서 최종 모의 오디션을 치르고, 개인별 최종 피드백 리포트를 받습니다.' },
    ],
  },
]

/** 참여 배우 후기 — 노션 원문 그대로 인용 */
export const AUDITION_REVIEWS = [
  {
    body: '솔직함을 어떻게 잘 전달할지 고민하게 해주는 수업이었습니다. 하루 100명 넘게 오디션 보는 사람의 입장에서 다시 생각해보게 됐고, 객관적으로 마이너스 요인이 될 수 있는 디테일을 정확히 잡아주셨습니다.',
    who: '채병욱 배우',
  },
  {
    body: '입장하는 태도부터 자기소개까지, 어떤 말과 태도가 유리한지 불리한지 설명이 매우 설득력 있었습니다. 각 배우마다 코멘트가 정확하고 섬세해서 도움이 되었습니다.',
    who: '김마고 배우',
  },
  {
    body: '오디션에 임하는 자세부터 어떤 독백을 준비해야 하는지, 인터뷰, 오디션 마무리까지. 그동안 갈피를 못 잡던 부분들을 경험 많은 배우님을 통해 해결할 수 있었습니다.',
    who: '배승헌 배우',
  },
]

/** 이 페이지 전용 FAQ — 노션 모집 페이지 FAQ + 기존 보강 규정(멤버 혜택)에서만 가져온다 */
export const AUDITION_FAQ: FaqItem[] = [
  {
    q: '이미 다른 클래스를 듣고 있는데 같이 들을 수 있나요?',
    a: '가능합니다. 같은 달에 두 개 이상의 클래스를 함께 수강하면 추가하는 클래스 수강료를 15% 할인해 드립니다.',
  },
  {
    q: '결석하면 보강을 받을 수 있나요?',
    a: '부득이하게 결석하시는 경우 스케줄표에 있는 다른 수업 클래스에서 보강을 받으실 수 있습니다. 보강은 수업 3일 전까지 카카오채널로 신청해 주세요.',
  },
  {
    q: '독백을 미리 준비해 가야 하나요?',
    a: '첫 주에는 프로필과 출연영상만 준비해 오시면 됩니다. 독백은 2주차에 함께 읽어 보고 3주차에 본인에게 맞는 «인생 독백»으로 확정합니다.',
  },
  {
    // 질문형 답변 보강 (2026-10-11 AEO B3⑥) — 이 페이지 3개월 커리큘럼·수업 정보 그대로. 첫 항목 기본 펼침을 바꾸지 않게 맨 뒤
    q: '오디션 준비 수업에서는 무엇을 하나요?',
    a: `KD4 오디션 테크닉 클래스는 3개월 과정입니다. 1개월 차에 배우 포지셔닝과 독백을 정하고, 2개월 차에 독백 완성도와 지정 대사·디렉션 변경 대응을 훈련하며, 3개월 차에 실제 오디션 환경을 재현한 모의 오디션을 봅니다. 매주 화요일 12:00~16:00 수업${AUDITION.instructor ? `이며 ${AUDITION.instructor}가 지도합니다` : '입니다'}.`,
  },
]

/* ━━ meisner-technique-class ━━ */
export const MEISNER_PILLARS = [
  {
    Icon: Repeat2,
    title: 'Repetition',
    desc: '두 명이 짧은 대사를 반복하며 상대의 미세한 변화에 반응하는 훈련. 머리로 연기하는 습관을 벗고 본능을 회복합니다. 레피티션 3단계로 시작해 Activity & Door로 확장합니다.',
  },
  {
    Icon: DoorOpen,
    title: 'Activity & Door',
    desc: '주어진 활동에 몰입한 상태에서 상대의 갑작스러운 등장에 반응하는 훈련. 계산이 아니라 지금 이 순간의 진짜 반응.',
  },
  {
    Icon: Heart,
    title: 'Emotional Preparation',
    desc: '장면 직전 상상력으로 필요한 감정을 미리 준비하는 법. 억지 감정이 아니라 자기 안에서 솟아나는 정직한 감정.',
  },
]

export const MEISNER_GOALS = [
  '“연기는 하는 것이 아니라 반응하는 것이다”라는 철학 아래, 자의식을 넘어 상대에게 온전히 집중하는 법을 배웁니다.',
  '레피티션 3단계와 Activity & Door 훈련을 통해 가상의 상황 속에서도 ‘실제로 존재하는’ 생생한 감각을 체득합니다.',
  '4개월의 정교한 과정을 거쳐 분석이 아닌 충동으로 움직이는 가장 본질적이고 진실한 장면 연기를 완성합니다.',
]

/** 월별 커리큘럼 — highlight: true 인 회차는 레피티션 3단계(강조 카드로 렌더) */
export const MEISNER_CURRICULUM: CurriculumMonth[] = [
  {
    month: '첫째 달',
    emoji: '🌒',
    goal: '자의식(Self-consciousness)을 뒤로하고, 상대방에게서 연기의 근거를 찾는 법',
    sessions: [
      { title: 'OT · 억압된 감정으로부터 해방되기 1', detail: 'Finger tag, comedy improve, pinch & ouch, liberation of emotions' },
      { title: 'Meisner Technique — Repetition 1', detail: '기계적 반복 — 상대의 외적 사실을 그대로 반복, 100% 집중', highlight: true },
      { title: 'Meisner Technique — Repetition 2', detail: '관점의 변화 — 주관적 느낌 포함, “I” to “You”', highlight: true },
      { title: 'Meisner Technique — Repetition 3', detail: '충동의 수용 — 감정 변화 허용, 상대에 의해 변화되는 경험', highlight: true },
    ],
  },
  {
    month: '둘째 달',
    emoji: '🌓',
    goal: '가상의 상황 속에서 ‘실제로 무언가를 하는’ 능력과 집중력',
    sessions: [
      { title: 'Activity & Door Presentation 1', detail: '카드쌓기' },
      { title: 'Activity & Door Presentation 2', detail: '개인적 오브제' },
      { title: 'Activity & Door Presentation 3', detail: '룸메이트' },
      { title: 'Activity & Door Presentation 4', detail: '관계' },
    ],
  },
  {
    month: '셋째 달',
    emoji: '🌔',
    goal: null,
    sessions: [
      { title: 'Activity & Door Presentation 5', detail: '오랜만에 만난 사이' },
      { title: 'Activity & Door Presentation 6', detail: '모르는 사이' },
      { title: '억압된 감정으로부터 해방되기 2', detail: 'Repetition, liberation of emotions' },
      { title: 'Activity & Door Presentation 7', detail: '장애' },
    ],
  },
  {
    month: '넷째 달',
    emoji: '🌕',
    goal: '장면 연기 완성',
    sessions: [
      { title: '대본 선정, 콜드리딩', detail: null },
      { title: '대본 분석', detail: 'Perspective Repetition, Actor’s paraphrase' },
      { title: 'Scene Acting Technique', detail: null },
      { title: 'Scene Acting Presentation', detail: null },
    ],
  },
]

export const MEISNER_NOTICE = [
  '마이즈너 정규 클래스는 4개월간 원팀으로 진행됩니다.',
  '원팀 과정의 특성상 협의되지 않은 중도 하차는 원칙적으로 불가하며, 불가피한 경우 규정에 따라 패널티가 부과됩니다.',
  '일정이 생겨 참여가 어려우시다면, 수업 3일 전까지 미리 말씀해 주세요.',
  '원활한 학습을 돕기 위한 보강 제도가 준비되어 있으니 관련 규정을 확인 후 편하게 문의해 주시기 바랍니다.',
]

/**
 * 오픈클래스 후기 인용 — Supabase actor_reviews(is_public·course_type='오픈클래스')에서 발췌.
 * 원문 그대로 인용하며 줄바꿈만 공백으로 합쳤다. 발췌 구간은 앞뒤에 …로 표시.
 * ⚠️ 정규 클래스 후기가 아니라 오픈클래스(마이즈너 맛보기) 후기 — 출처 표기를 바꾸지 말 것.
 * ⚠️ Review/AggregateRating JSON-LD 금지 (자사 페이지 자체 후기 = 구글 정책 위반).
 */
export const MEISNER_QUOTES = [
  {
    text: '…이 오픈클래스를 통해 짧은 시간이었지만 마이즈너 테크닉이 현재 배우에게 어떤 무기가 될 수 있는지 이해하게 되었다. 충분히 가치있는 시간이었고, 무엇보다 배우님이 오픈클래스라고 힘을 빼서 하시는 것이 아니라 선배 배우로서 후배에게 진심으로 다가와 주신다고 느꼈다.',
    author: '멤버',
  },
  {
    text: '…단순히 자유독백 피드백으로 그치는 것이 아니라 이게 어떻게 계획적인 연기가 아닌 "되어지는"연기가 될 수 있는지 스스로 체험하게 해주셨습니다. 틀에박힌 연기가 늘 걱정이었던 제게 새로운 경험이었고, 또다른 도전에의 불씨를 다시 지피는 계기가 되었습니다.',
    author: '멤버',
  },
  {
    text: '…연기를 시도할 때마다 매번 달라야 하고 연기하는 매 순간 계획한 것을 다 버릴 용기로 현실에 존재해야 한다는, 단순하면서 중요한 내용을 가져가게 된 것이 가장 좋았습니다…',
    author: '이OO 멤버',
  },
]

/* ━━ reel-production-class ━━ */
export const REEL_WHY = [
  {
    Icon: Eye,
    title: '캐스팅 디렉터의 시선',
    desc: '프로필 사진으로는 연기력이 보이지 않습니다. 캐스팅 디렉터는 영상으로 배우의 연기·표정·호흡을 한 번에 확인합니다. 배우 프로필 영상(자기소개·독백 촬영본)과 달리 출연영상은 맞춤 시나리오로 찍은 \'작품 속 연기\'입니다.',
  },
  {
    Icon: Film,
    title: '실제 영화 현장의 퀄리티',
    desc: '핸드폰이나 학원 자체 영상이 아닌 실제 영화팀(촬영감독·조명·사운드) 셋업으로 제작. 그대로 오디션 제출 가능.',
  },
]

export const REEL_PROCESS = [
  { num: '01', title: '레퍼런스 취합', desc: '본인 톤·매력에 맞는 영상 레퍼런스를 함께 큐레이션.' },
  { num: '02', title: '시나리오 작성', desc: '레퍼런스 기반 본인 전용 시나리오. 단순 독백이 아닌 임팩트 장면.' },
  { num: '03', title: '전문 영화팀 촬영', desc: '영화 현장의 카메라·조명·사운드 셋업. 마이즈너 훈련 병행.' },
  { num: '04', title: '편집·납품', desc: '컬러 그레이딩·사운드 디자인 완료. 오디션 제출에 바로 사용.' },
]

export const REEL_INCLUDES = [
  { yes: true, text: '시나리오 작성 (본인 톤 맞춤)' },
  { yes: true, text: '전문 영화팀 촬영 (카메라·조명·사운드)' },
  { yes: true, text: '편집·컬러 그레이딩·사운드 디자인' },
  { yes: true, text: '캐스팅·오디션 제출용 영상 납품' },
]

/** 월별 커리큘럼 — 노션 원본("출연영상 클래스 안내") 그대로. 3개월 코스 월 4회.
 *  goal(월별 목표 문구)은 원본에 없어 임의 작성하지 않고 null. highlight: true = 촬영 회차. */
export const REEL_CURRICULUM: CurriculumMonth[] = [
  {
    month: '첫째 달',
    emoji: '🌒',
    goal: null,
    sessions: [
      { title: 'OT · 억압된 감정으로부터 해방되기', detail: 'Finger tag · Comedy improv · Pinch & ouch · Liberation of emotions' },
      { title: '맞춤형 시나리오 작성을 위한 전략 컨설팅', detail: '레퍼런스 취합 · 자유연기' },
      { title: '마이즈너 테크닉 훈련', detail: 'Repetition · Presentation 1 — 카드 쌓기' },
      { title: '마이즈너 테크닉 훈련', detail: 'Repetition · Presentation 2 — 카드 쌓기' },
    ],
  },
  {
    month: '둘째 달',
    emoji: '🌓',
    goal: null,
    sessions: [
      { title: '마이즈너 테크닉 훈련', detail: 'Repetition · Presentation 2 — 개인적 오브제' },
      { title: '1차 대본 배부 및 리딩', detail: '스탠딩 리딩 훈련 · Repetition · Cold reading' },
      { title: '캐릭터 라이징', detail: '마이즈너 테크닉 분석 훈련' },
      { title: '마이즈너 테크닉 훈련', detail: 'Perspective Repetition · Text Repetition' },
    ],
  },
  {
    month: '셋째 달',
    emoji: '🌔',
    goal: null,
    sessions: [
      { title: '감독 참관 테스트 촬영 및 리허설', detail: 'Test shooting', highlight: true },
      { title: '장면 디벨롭', detail: "Actor's paraphrase · Perspective repetition · Text repetition · Rehearsal" },
      { title: '장면 디벨롭', detail: null },
      { title: '촬영', detail: null, highlight: true },
    ],
  },
]

// 수강 유의사항 — 출연영상 동의서(개인정보·초상권·수강 규정 확인서) 내용 기준 (2026-07-28)
export const REEL_NOTICE = [
  '출연영상 클래스는 3개월 코스이며, 파트너와의 협업으로 진행됩니다.',
  '협업 과정의 특성상 2회차 수업 이후에는 중도 하차가 원칙적으로 불가하며, 부득이한 경우 규정에 따라 패널티가 부과됩니다.',
  '수업 중 촬영되는 사진·영상은 홍보 목적으로 활용될 수 있습니다. 자세한 내용은 아래 동의서를 확인해 주세요.',
]

// 출연영상 포트폴리오 — 클래스 페이지(/reel-production-class)·광고 전용 랜딩(/ad/reel) 공용
export const REEL_PORTFOLIO_VIDEOS = [
  // 2026-10-06 대표 추가 3편 — 제목·uploadDate는 유튜브 실측
  { id: 'AMcMn4UgJp4', title: '저 혼자 뒤집어쓸 줄 아셨어요?', uploadDate: '2026-10-05T03:00:13-07:00' },
  { id: '4Cc3L2IGRu8', title: '사건 덮고 얼마 받았어?', uploadDate: '2026-10-01T03:00:17-07:00' },
  { id: 'RV1yvKguTy4', title: '오늘 많이 까불더라?', uploadDate: '2026-08-21T16:00:39-07:00' },
  { id: 's_AE-Vy0Ka0', title: '출연영상 대표 샘플', uploadDate: '2026-05-21T00:17:11-07:00' },
  { id: '7Q62XeyVLbc', title: '출연영상 샘플 1', uploadDate: '2026-08-08T06:48:27-07:00' },
  { id: 'IWL6hlOrU-w', title: '출연영상 샘플 2', uploadDate: '2026-05-13T20:42:36-07:00' },
  { id: 'PUlrhjOkvjA', title: '출연영상 샘플 3', uploadDate: '2026-04-29T23:55:02-07:00' },
  { id: 'qwD63hTNQLs', title: '출연영상 샘플 4', uploadDate: '2026-07-10T17:00:21-07:00' },
  { id: 'tLAZZOGd3FA', title: '출연영상 샘플 5', uploadDate: '2026-05-29T01:00:29-07:00' },
  { id: 'zoDJtGT3aQM', title: '출연영상 샘플 6', uploadDate: '2026-05-25T05:00:30-07:00' },
]

export const REEL_PORTFOLIO_PLAYLIST = 'https://www.youtube.com/playlist?list=PLMbZlnkLfP7iaE41p_g9dzGKp5eU9VZk2'

// 마이즈너 정규 쇼케이스 영상 — 2026-10-19 대표 «마이즈너 정규 클래스 소개에는 이 링크도 넣어», 제목은 유튜브 실측
export const MEISNER_SHOWCASE_VIDEO = { id: 'SOpMlunkY94', title: '마이즈너 테크닉 정규 2기 쇼케이스' }
