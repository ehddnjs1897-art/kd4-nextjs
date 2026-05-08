---
version: alpha
name: KD4 Acting Studio
description: A warm-gray editorial canvas with deep navy as the singular interactive accent. KoPubWorld Korean serif & sans set the studio voice — quiet confidence, pre-stage stillness. The site reads like a printed program book for a small theater: paper-toned surfaces, generous whitespace, navy reserved for action. Off-the-plastic — no gradients, no glassmorphism, no decorative shadows. Type carries the weight; navy points the way.

colors:
  primary: "#15488A"
  primary-light: "#1E5BA8"
  primary-deep: "#0F3364"
  primary-tint-soft: "rgba(21,72,138,0.06)"
  primary-tint-fill: "rgba(21,72,138,0.1)"
  primary-tint-border: "rgba(21,72,138,0.2)"

  ink: "#111111"
  ink-soft: "rgba(17,17,17,0.85)"
  ink-mute: "#6B6660"
  ink-quiet: "#4A4A4A"

  canvas: "#F0F0E8"
  canvas-recessed: "#E8E8DF"
  canvas-deep: "#DEDED4"
  surface-night: "#2A2F3A"

  border-soft: "#D2D2C8"
  border-strong: "#B8B8AC"

  accent-red: "#C73E3E"
  accent-red-soft: "rgba(199,62,62,0.08)"

  diagnostic-beginner: "#7BC97B"
  diagnostic-training: "#E89A3C"
  diagnostic-portfolio: "#E55353"

  on-primary: "#FFFFFF"

typography:
  hero-display:
    fontFamily: "KoPubWorld Batang, Noto Serif KR, Georgia, serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  display-lg:
    fontFamily: "KoPubWorld Batang, Noto Serif KR, Georgia, serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  display-md:
    fontFamily: "KoPubWorld Batang, Noto Serif KR, Georgia, serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  section-title:
    fontFamily: "KoPubWorld Batang, Noto Serif KR, Georgia, serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  body-lead:
    fontFamily: "KoPubWorld Dotum, Noto Sans KR, Helvetica, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0.02em
  body:
    fontFamily: "KoPubWorld Dotum, Noto Sans KR, Helvetica, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0.02em
  body-small:
    fontFamily: "KoPubWorld Dotum, Noto Sans KR, Helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0.02em
  caption:
    fontFamily: "KoPubWorld Dotum, Noto Sans KR, Helvetica, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0.02em
  eyebrow:
    fontFamily: "KoPubWorld Dotum, Oswald, Noto Sans KR, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.3em
    textTransform: uppercase
  stat-numeric:
    fontFamily: "KoPubWorld Dotum, Oswald, Noto Sans KR, sans-serif"
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.02em
  button:
    fontFamily: "KoPubWorld Dotum, Noto Sans KR, Helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.05em

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
  5xl: 96px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 999px

container:
  max: 1200px
  prose: 720px
  card-min-sm: 240px
  card-min-md: 280px

motion:
  transition-fast: "0.15s ease"
  transition-base: "0.25s ease"
  transition-slow: "0.4s ease"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "12px 28px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "11px 28px"
    border: "1px solid {colors.border-strong}"
  card-default:
    backgroundColor: "{colors.canvas-recessed}"
    border: "1px solid {colors.border-soft}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  card-emphasis:
    backgroundColor: "{colors.canvas-recessed}"
    border: "1.5px solid {colors.primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  stat-card:
    backgroundColor: "{colors.canvas-recessed}"
    border: "1px solid {colors.border-soft}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    statNumber: "{typography.stat-numeric}"
    statNumberColor: "{colors.primary}"
    statLabel: "{typography.caption}"
  section-eyebrow:
    typography: "{typography.eyebrow}"
    textColor: "{colors.primary}"
  divider:
    color: "{colors.border-soft}"
    thickness: 1px
  badge-tag:
    backgroundColor: "{colors.primary-tint-soft}"
    textColor: "{colors.primary}"
    border: "1px solid {colors.primary-tint-border}"
    rounded: "{rounded.sm}"
    padding: "3px 10px"
    typography: "{typography.caption}"
---

# KD4 Acting Studio — Design System

## Overview

KD4의 디자인은 **무대 직전의 정적**을 시각화한다. 화려함도, 장식도 없다. 종이 같은 웜 그레이 캔버스 위에 검정 텍스트가 놓이고, 단 하나의 인터랙션 컬러 — 네이비 `#15488A` — 가 길을 안내한다. 폰트가 무게를 진다(KoPubWorld). 색은 그저 *어디로 가야 하는지* 가리킨다.

브랜드 철학 **OFF THE PLASTIC** — 만들어진 감정·만들어진 표면을 거부한다. 디자인도 같은 원칙. 그라데이션, 글래스모피즘, 장식 그림자 모두 금지. 콘텐츠가 먼저, 시스템은 뒤로 물러난다.

소극장 프로그램 북, 인디 영화 포스터, 1970년대 출판물의 톤. 빠른 변환보다 *읽히는 것*. 클릭보다 *멈추는 것*.

## Colors

### Brand Primary
**Navy `#15488A`** — KD4의 단일 인터랙션 컬러. CTA, 링크, 강조 숫자, STEP 라벨에 사용. 다른 액센트 컬러를 추가로 쓰지 않는다 (단 — 자가진단 섹션의 3색 도식 예외).

```
primary         #15488A   메인 CTA, 링크, 강조 텍스트
primary-light   #1E5BA8   hover, 보조 강조
primary-deep    #0F3364   pressed, 진한 배경 위 강조
```

Tints — 배경·아이콘 박스·border 용 (rgba):
```
soft     6%   가벼운 fill (배지 배경)
fill    10%   아이콘 박스 배경
border  20%   strong 보더
```

### Canvas
모든 페이지 기본 배경은 **웜 그레이**. 다크 모드 사용 안 함. 카드·셀은 한 단계 진한 톤으로 깊이 표현.

```
canvas           #F0F0E8   페이지 기본 배경
canvas-recessed  #E8E8DF   카드, 인용, 인풋 배경
canvas-deep      #DEDED4   더 진한 셀 (활성 상태 등)
surface-night    #2A2F3A   드물게 — 풋터 등 어두운 영역
```

### Ink (텍스트)
```
ink         #111111            본문 기본
ink-soft    rgba(17,17,17,.85) 보조 텍스트
ink-mute    #6B6660            메타 정보, 캡션
ink-quiet   #4A4A4A            서브타이틀
```

### Diagnostic Trio (예외)
`/classes` 자가진단 섹션의 3-tier 시각화에만 사용. 일반 UI에 도입 금지.
```
beginner   #7BC97B   취미 / 입문
training   #E89A3C   훈련 / 중급
portfolio  #E55353   포트폴리오 / 실전
```

## Typography

### Font Stack
- **Serif (제목, 인용)**: KoPubWorld Batang → Noto Serif KR → Georgia
- **Sans (본문, UI)**: KoPubWorld Dotum → Noto Sans KR → Helvetica
- **Display (eyebrow, 숫자)**: KoPubWorld Dotum → Oswald

KoPub 서브셋이 `public/fonts/`에서 직서빙된다 (총 6 woff2, 535KB). 절대 변경 금지 — 브랜드 정체성의 핵심.

### Scale
```
hero-display   56px / Batang 700  / 영웅 카피
display-lg     40px / Batang 700  / H2 메인
display-md     32px / Batang 700  / H2 보조
section-title  24px / Batang 700  / H3
body-lead      18px / Dotum 400   / 인트로 단락
body           16px / Dotum 400   / 본문 표준
body-small     14px / Dotum 400   / 카드 디스크립션
caption        13px / Dotum 400   / 메타
eyebrow        11px / Dotum 600 / 0.3em / UPPERCASE  / 섹션 라벨
stat-numeric   44px / Dotum 700  / 0.02em  / 숫자 지표
button         14px / Dotum 700  / 0.05em  / CTA
```

## Layout

### Container
- 최대 너비: **1200px** — 일반 콘텐츠
- 본문 폭: **720px** — 긴 문장 (about, 칼럼)
- 카드 최소: 240px (sm) / 280px (md)

### Spacing Scale
4-8-12-16-24-32-48-64-96 (px). 임의 값 금지. 위 스케일 외에는 토큰 추가 후 사용.

### 섹션 패딩 (반응형)
```
모바일  56px → 80px (vertical)
데스크탑 80px → 120px
좌우     24px (모바일) → auto (데스크탑, container 안)
```

## Elevation & Depth

**그림자 사용 최소화.** 카드 hover 외에는 elevation 없음.

```
hover-lift   0 8px 24px <primary-tint-fill>   카드 hover 시
focus-ring   0 0 0 2px <primary>              키보드 focus
```

drop-shadow, blur, glassmorphism 모두 **금지**.

## Shapes

```
rounded.none  0px       편집 컴포넌트, 풀블리드 영역
rounded.sm    4px       기본 (button, badge, input)  ← 가장 자주 사용
rounded.md    8px       작은 카드, 칩
rounded.lg    12px      표준 카드
rounded.xl    16px      대형 hero 카드 (자가진단 등)
rounded.pill  999px     필터 버튼
```

KD4 표준 라운드는 **4px (rounded.sm)**. 너무 둥글게 만들면 아동·캐주얼 톤이 되어 브랜드와 어긋남.

## Components

### Button — Primary
배경 `primary` / 텍스트 `on-primary` / 라운드 `sm` / 패딩 12px×28px.
hover: `primary-light`로 배경 전환.

### Button — Secondary
투명 배경 / 텍스트 `ink` / 1px `border-strong` 보더 / 라운드 `sm`.
"클래스 살펴보기" 같은 보조 액션.

### Card — Default
배경 `canvas-recessed` / 1px `border-soft` 보더 / 라운드 `lg` / 패딩 24px.
hover 시 보더만 `primary`로 전환 (transform 없음).

### Card — Emphasis (선택된 클래스 등)
1.5px `primary` 보더로 강조. 내부 콘텐츠는 동일.

### Stat Card
숫자는 `stat-numeric` 타이포 + `primary` 컬러. 라벨은 `caption` + `ink-mute`.
4-column 그리드 (모바일 2x2).

### Section Eyebrow
모든 섹션 위 작은 영문 라벨. uppercase + `0.3em` letter-spacing + `primary` 컬러.
예: `KD4 BY THE NUMBERS`, `MEMBER BENEFITS`, `FIND YOUR CLASS`.

### Divider
1px `border-soft` 수평선. 섹션 구분.

### Badge / Tag
`primary-tint-soft` 배경 + `primary` 텍스트 + `primary-tint-border` 보더 + 라운드 `sm`.
스킬 태그, STEP 라벨 등.

## Motion

```
transition-fast   0.15s ease   호버 색 전환
transition-base   0.25s ease   카드, 버튼
transition-slow   0.4s ease    섹션 인터섹션 reveal
```

`prefers-reduced-motion: reduce` 사용자에게는 모든 motion → `auto` 또는 instant.
GSAP `ScrollTrigger.batch + gsap.from`은 **핵심 콘텐츠에 절대 사용 금지** (5/6 카드 통째 사라짐 사고).

## Do's and Don'ts

### ✅ Do
- 폰트는 항상 KoPubWorld + 폴백
- CTA·링크·강조에는 `primary` 네이비만 사용
- 카드 hover는 보더 색만 변경 (그림자, 큰 transform X)
- 섹션 위에 영문 eyebrow → 한글 헤드라인 → 본문 구조 유지
- 캔버스 톤(F0F0E8) 유지 — 다크 모드 도입 안 함
- "멤버", "KD4 멤버" 호칭 (수강생/학생 절대 금지)

### ❌ Don't
- 그라데이션, 글래스모피즘, 장식 그림자 X
- 키컬러 추가 (네이비 1색 원칙) — 빨강은 critical alert에만
- 폰트 변경 (KoPub 절대 유지)
- 카드 라운드 16px 초과 (xl 한정)
- 폼 필수 필드 늘리기 (광고 funnel 마찰)
- 카카오채널 CTA 추가 (SMS만 사용)
- next.config.ts에 redirects (대소문자는 middleware.ts에서만)
- ScrollTrigger.batch + gsap.from 핵심 콘텐츠 (5/6 사고)

## Voice Hierarchy

브랜드 메시지 위계:
1. **OFF THE PLASTIC** ⭐ (Hero 메인)
2. **연기하지 않는 연기** (서브)
3. **마이즈너 테크닉** (방법론)
4. **배우들의 아지트** (커뮤니티 톤)
5. **Actor Accelerating System** (시스템 강조용)

각 페이지에서 모든 카피를 다 쓰지 말고, 페이지 목적에 맞는 1~2개만 위계대로 노출.

## File / Page Map

```
/                메인 — Hero + Stats + Director + About + Classes 요약 + Casting + Reviews + CTA
/about           철학·메소드·대표 소개
/classes         8개 클래스 + 자가진단 가이드 (3-tier 시각화)
/join            광고 직접 유입 랜딩 — Hero에 폼 직접 노출
/benefits        멤버 혜택 — 보강·편집 서비스·커뮤니티·할인
/board           멤버 전용 커뮤니티 (비로그인 시 PublicLanding)
/actors          배우 DB — 필터 + 카드 그리드
/actors/[id]     캐스팅 카드형 상세 + Person/VideoObject JSON-LD
/ai-tools        대본 분석 (로그인 후)
/admin           관리자 전용
/dashboard       마이페이지
```

---

**Maintenance:** 디자인 토큰을 변경할 때는 이 파일을 먼저 업데이트하고, `styles/globals.css`의 CSS 변수와 동기화한다. 두 곳이 어긋나면 이 DESIGN.md가 진실의 원천(source of truth).

**Last updated:** 2026-05-08
