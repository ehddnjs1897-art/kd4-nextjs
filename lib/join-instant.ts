/**
 * /join 「클래스 고르면 바로 상담」 화면용 데이터 (2026-11-18 대표 브리프)
 *
 * 공통 광고로 들어온 방문자가 첫 화면에서 클래스를 한 번 누르면 그 클래스 상담창이 열린다.
 * 수강료·기간·수업 내용은 전부 lib/classes.ts 정본에서 그대로 가져온다 — 여기서 숫자를 새로 적지 않는다.
 * 타일 이름(짧은 표기)·한 줄 설명만 이 파일에 있다. 접수에 넘기는 클래스명은 정식 명칭(nameKo) 그대로.
 */
import { CLASSES } from '@/lib/classes'

export type InstantKey = 'basic' | 'meisner' | 'reel' | 'audition' | 'private' | 'recommend'

export interface InstantClass {
  key: InstantKey
  /** 타일·상담창 제목에 쓰는 짧은 이름 */
  label: string
  /** 타일 아래 한 줄 */
  sub: string
  /** 접수(/api/notify)에 넘기는 클래스명 — 기존 폼과 같은 값 */
  className: string
  /** 자바스크립트가 아직 안 켜졌을 때 타일이 가는 곳 = 그 클래스 소개 페이지 */
  href: string
  nameKo?: string
  photo?: string
  photoAlt?: string
  quote?: string
  /** 대상 안내 한 줄 (베이직: 연기 경험 없어도 OK) */
  note?: string
  bullets?: string[]
  /** "400,000" 형식 — 화면에서 「월 …원」으로 표시 */
  price?: string
  course?: string
  /** 월 4회 · 회당 4시간 · 정원 8명 */
  facts?: string[]
  instructor?: string
  /** 가격 아래 예고 문구 (2027 수강료 조정) — 바뀌는 시각이 지나면 정본에서 자동으로 사라진다 */
  priceNote?: string
  /** 수강료에 포함되는 것 (출연영상만) */
  includes?: string[]
  /** 상세소개에서 눌러서 보는 영상 (출연영상만) */
  videos?: { id: string; title: string }[]
}

/* 신규 멤버 상담 대상 5개 — 순서·대상은 기존 상담 폼 카드와 같다 (심화·1달·리더는 폼에 넣지 않음) */
const TILE_DEFS: { key: Exclude<InstantKey, 'recommend'>; label: string; sub: string; nameKo: string; href: string }[] = [
  { key: 'basic', label: '베이직', sub: '취미로 가볍게 시작하고 싶다면', nameKo: '베이직 클래스', href: '/basic-acting-class' },
  { key: 'meisner', label: '마이즈너 테크닉', sub: '연기하지 않는 연기를 훈련하고 싶다면', nameKo: '마이즈너 테크닉 정규 클래스', href: '/meisner-technique-class' },
  { key: 'reel', label: '출연영상', sub: '오디션에 보낼 내 장면을 만들고 싶다면', nameKo: '출연영상 클래스', href: '/reel-production-class' },
  { key: 'audition', label: '오디션 테크닉', sub: '시선을 멈추게 할 독백을 준비한다면', nameKo: '오디션 테크닉 클래스', href: '/audition-technique-class' },
  { key: 'private', label: '개인 레슨', sub: '1:1로 집중해서 훈련하고 싶다면', nameKo: '개인 레슨', href: '/acting-coaches' },
]

/** 「추천받기」가 접수에 넘기는 값 — 기존 폼의 「기타 / 상담 후 결정」과 같은 값(노션 «❓ 미정»으로 들어감) */
export const RECOMMEND_CLASS_NAME = '기타 / 상담 후 결정'

export function buildInstantClasses(extra: {
  reelVideos?: { id: string; title: string }[]
  reelIncludes?: string[]
} = {}): InstantClass[] {
  const list: InstantClass[] = TILE_DEFS.flatMap((d) => {
    const cls = CLASSES.find((c) => c.nameKo === d.nameKo)
    if (!cls) return []
    const facts = [
      cls.schedule,
      `회당 ${cls.duration}`,
      cls.capacity === '1:1' ? null : `정원 ${cls.capacity}`,
    ].filter((v): v is string => Boolean(v))
    const item: InstantClass = {
      key: d.key,
      label: d.label,
      sub: d.sub,
      className: cls.nameKo,
      href: d.href,
      nameKo: cls.nameKo,
      photo: cls.photo,
      photoAlt: cls.photoAlt,
      quote: cls.quote,
      note: cls.note,
      bullets: cls.bullets,
      price: cls.price,
      course: cls.course,
      facts,
      instructor: cls.instructor,
      priceNote: cls.priceChangeNote,
    }
    if (d.key === 'reel') {
      item.videos = extra.reelVideos
      item.includes = extra.reelIncludes
    }
    return [item]
  })

  list.push({
    key: 'recommend',
    label: '어떤 반이 맞을지 추천받기',
    sub: '상담에서 같이 정해요',
    className: RECOMMEND_CLASS_NAME,
    href: '/classes',
  })
  return list
}
