# KD4 액팅 스튜디오 — 개발 가이드

> ⚠️ **AI 작업자 룰**: 이 문서의 "미완료" 항목은 시간이 지나면 stale될 수 있다.
> 사용자에게 "미완료"라고 보고하기 전에 **반드시 라이브 검증** 후에 말할 것.
> (DNS TXT 조회·라이브 자산 헤더·코드 grep 등으로 1분 안에 확인 가능한 항목들임)

## 🚨 2026-05-06 기준 현황 (새 채팅 시작 시 반드시 읽기)

### 완료된 성능 최적화 (main 브랜치 반영됨)
1. **CSS @import 4개 제거** — globals.css 렌더 블로킹 5,690ms 해소
2. **KoPub 폰트 서브셋 자가 서빙** — 원본 CDN 13MB → 로컬 535KB (-96%)
   - public/fonts/ 에 woff2 6개 (Dotum Light/Medium/Bold, Batang Light/Medium/Bold)
   - pyftsubset으로 실제 사용 글자 835자만 추출
   - layout.tsx에 Medium 2종 preload 추가
3. **이미지 압축** — meisner 11MB→276KB, kwon-dongwon 1.6MB→56KB, heart-logo 5.5MB→215KB
4. **next.config.ts 개선** — AVIF/WebP 포맷, URL 대소문자 리다이렉트, 정적 자산 캐시 헤더
5. **CSS 분리** — 메인 페이지 hero 전용 CSS → app/page-hero.css (globals.css에서 제거)
6. **JS 지연로딩** — JoinPageView dynamic import 전환

### 폰트 구조 (디자인 변경 금지 — 임의 수정 절대 금지)
| CSS 변수 | 사용 폰트 | 파일 위치 |
|---|---|---|
| `--font-serif` | KoPubWorld Batang → Noto Serif KR | public/fonts/KoPubWorldBatang-*.woff2 |
| `--font-sans` | KoPubWorld Dotum → Noto Sans KR | public/fonts/KoPubWorldDotum-*.woff2 |
| `--font-display` | KoPubWorld Dotum → Oswald → Noto Sans KR | 동일 |

### /join vs kd4.club 역할 구분
- **kd4.club** (`app/page.tsx`): SEO 검색 노출 홈페이지 — Three.js HeroScene + GSAP
- **kd4.club/join** (`app/join/page.tsx`): 광고 직접 유입 전용 랜딩 페이지

### 추가 정리 (2026-05-01)
- public/reviews/ 19MB 삭제 (불러오는 페이지 없음 — 죽은 컴포넌트 ReviewGrid/ReviewLightbox도 함께 제거)
- public/kd4-mascot.PNG, "kdddd acting studio.ai", .DS_Store 제거 (사용처 0)
- public/heart logo.png(공백) → public/heart-logo.png(하이픈)으로 통일, Navbar src 업데이트
- 캐스팅 마퀴·대표 사진 `<img>` → `next/image` 변환은 이전 작업에서 이미 완료됨
- public/casting/캐스팅.zip, KD4_캐스팅_한글*.png, public/textures/ 도 이전 작업에서 이미 정리됨
- public/ 총 용량 ~46MB → 27MB

### ✅ 2026-05-06 검증 완료 (이전 "미완료" 였던 것)

| 항목 | 검증 방법 | 결과 |
|---|---|---|
| **Meta 도메인 인증** | `dig kd4.club TXT` | ✅ `facebook-domain-verification=10h6ugh4jd1l7fp2szm7lushh2m5lj` 정상 등록 |
| **GA4 측정 ID 박혀있음** | curl 라이브 HTML grep | ✅ `gtag('config', 'G-8122KKQZ99')` 정상 (개행 fix 후) |
| **Meta Pixel 픽셀 박혀있음** | curl 라이브 HTML grep | ✅ `id=1272652704844114` noscript fallback 노출 + JS 인라인 hydration 정상 |
| **이미지 최적화** | curl HEAD 라이브 자산 | ✅ meisner 276KB, director 148KB, heart-logo 215KB |
| **폰트 서브셋** | next.config.ts + public/fonts | ✅ KoPub Dotum/Batang 6종 woff2 (64~122KB) |
| **TTFB** | curl 3회 측정 | ✅ /join 평균 130~400ms, / 평균 150~220ms (Vercel edge) |

### 🔴 남은 미완료 작업

- [ ] **GA4 데이터 누적 검증** — 5/6 trim fix 후 1~2일 누적되면 GA4 콘솔에서 활성 사용자 1+ 잡혀야. 안 잡히면 다른 원인 추가 점검
- [ ] **PSI 모바일 점수 직접 측정** — 자동 PSI API는 일일 quota 초과 상태(공유 IP). pagespeed.web.dev 사용자 직접 1회 측정 권장
- [x] **`director.jpg` / `heart-logo.png` Cache-Control** — 해결됨 (commit af90b1e, max-age=2592000 라이브 확인 2026-05-11)
- [x] **자동 일일 트래픽 리포트 재가동** — 4/27 이후 14일치 누락됐으나 RemoteTrigger `trig_018ENRkD9xeDByXnnGKX5oHw` 등록 완료 (매일 00:00 UTC = 09:00 KST, 첫 실행 2026-05-12). ⚠️ GA4 API 자격증명 미설정 → 실행 시 Notion에 "수동 확인 필요" 페이지만 생성됨 (실제 데이터는 Google 서비스계정 키 설정 필요)
- [x] **app/api/notify/route.ts Meta CAPI** — 커밋 완료 (ba8f4ed). `META_CAPI_TOKEN` + `NEXT_PUBLIC_META_PIXEL_ID` Vercel env 추가 시 즉시 작동 (env 없으면 silent skip)
- [ ] **/actors Drive 썸네일** — Drive URL 캐싱·신뢰성 약함. Supabase Storage 또는 next/image 캐시 마이그레이션 검토

### 🔬 분석/관측 (2026-05-06)
- **Meta Pixel 28일 깔때기** (4/27 시점): PageView 1,700 → ViewContent 85(5%) → DeepScroll 44 → InitiateCheckout 1 → CTAClick 1
- **상담 전환율 0.06%** — 정상 광고는 1~3%. 폼 필수 필드 7개(이름·연락처·이메일·희망클래스·마이즈너경험·유입경로·동의)가 강한 마찰 지점으로 의심
- **GA4 수치는 신뢰 불가** (5/6 trim fix 전까지) — Meta 1,700 vs GA 28일 89PV 격차 → fix 적용 후 재진단 필요

### Supabase 상태 (2026-05-01 기준)
- 결제 완료 → 프로젝트 정상 가동 (HTTP 200)
- `actors` 테이블 공개 배우 51명 정상 조회됨
- 캐스팅 마퀴 사진은 여전히 `public/casting/` 로컬 정적 서빙 (PageSpeed상 더 빠름 — 유지)
- middleware.ts의 "Supabase 격리" 코드는 장애 대비 안전장치 — 유지

## 스택
- Next.js 16.2.2 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS + CSS Variables (styles/globals.css)
- Vercel 배포

## 브랜드 규칙 (절대 준수)
- "수강생" 절대 금지 → "**멤버**", "**KD4 멤버**" (2026-05-08 변경: 이전 "동료 배우" 표현도 "멤버"로 통일)
- "수강생 후기" 금지 → "**멤버 이야기**"
- "KD4 동료 배우" 금지 → "**KD4 멤버**"
- 클래스 명칭은 lib/classes.ts의 데이터 그대로 사용
- 베이직 클래스 = 입문자/취미 대상, "연기 경험 없어도 OK" 명시 필수

## 환경변수 설정 (.env.local)
Supabase 대시보드 → Settings → API에서:
- NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
- SUPABASE_SERVICE_ROLE_KEY=[service_role key]

카카오 Developers → 앱 설정:
- NEXT_PUBLIC_KAKAO_JS_KEY=[JS Key]
- KAKAO_CLIENT_ID=[REST API Key]
- KAKAO_CLIENT_SECRET=[Client Secret]

Gemini:
- NEXT_PUBLIC_GEMINI_KEY=[API Key]

SMS 알림 (Solapi — console.solapi.com):
- SOLAPI_API_KEY=[API Key]
- SOLAPI_API_SECRET=[API Secret]
- SOLAPI_FROM_NUMBER=[발신번호, 예: 01012345678]  ← 사전 등록 필수
- ADMIN_PHONE_NUMBER=[대표 수신번호]              ← 신규 상담 알림 수신

Make.com 웹훅:
- MAKE_WEBHOOK_URL=[Make 시나리오 웹훅 URL]      ← 구글시트 연동

⚠️ Vercel 배포 시 위 4개 Solapi 변수 반드시 Environment Variables에 추가할 것
   Settings → Environment Variables → Production에 입력 → Redeploy 필요

## DB 초기화
1. Supabase 대시보드 → SQL Editor
2. supabase/schema.sql 전체 복사 붙여넣기 → Run

## 첫 관리자 계정 만들기
1. `/auth/signup` 에서 회원가입
2. Supabase 대시보드 → Table Editor → profiles
3. 본인 row의 role 컬럼을 'admin' 으로 변경

## 주요 파일 구조
```
app/
  page.tsx          # 랜딩 (11섹션)
  actors/           # 배우 목록, 갤러리
  board/            # 커뮤니티 게시판
  ai-tools/         # AI 대본분석
  admin/            # 관리자 (role=admin 전용)
  dashboard/        # 마이페이지 + 편집
  auth/             # 로그인/회원가입
  api/              # API routes
    notify/         # 신규 상담 접수 알림 (SMS + Make 웹훅 동시 발송)

lib/
  classes.ts        # 클래스 데이터 (임의 수정 금지)
  supabase/
    client.ts       # 브라우저용
    server.ts       # 서버용
    admin.ts        # service_role (서버 전용)
  storage.ts        # Storage 추상화 (STORAGE_PROVIDER 환경변수로 전환)
  actor-matching.ts # 동일인 자동 매칭
  sms.ts           # Solapi SMS 발송 유틸 (서버 전용)

components/
  layout/           # Navbar, Footer
  hero/             # HeroScene (Three.js, SSR:false)
  actors/           # ActorTabs, ShareButton
  upload/           # PhotoUpload (9:16 crop), VideoLinkInput
  board/            # CommentSection
  dashboard/        # GalleryEditForm

styles/
  globals.css       # CSS 변수 (--gold, --bg, etc.)
```

## Supabase Auth 설정
대시보드 → Authentication → Providers:
- Google: OAuth Client ID/Secret 입력
- Email: 활성화, Email Confirm 옵션 설정

Redirect URLs:
- https://[도메인]/api/auth/callback
- http://localhost:3000/api/auth/callback (개발)

## 배우 DB 드라이브 임포트
scripts/import-drive.ts 참고 (별도 1회성 스크립트)
Google Sheets ID: 1XfatoR0V4DoTVpQrujG8kpMd1Soaaw86C2qVKnd5IZI

## Storage Phase A → B 전환
.env.local에서: STORAGE_PROVIDER=r2
lib/storage.ts에 R2 구현 추가 (TODO 표시됨)

## 브랜드 이미지 자산 (Google Drive)
> 아래 링크를 코드에 직접 사용할 것. 임의로 다른 이미지 사용 금지.

| 용도 | 직접 링크 (img src용) | 원본 Drive |
|------|----------------------|-----------|
| 대표(권동원) 사진 | `https://drive.google.com/uc?export=view&id=1WfyN6x21sRLNzzNNYB-dBschGRzdEzUP` | [Drive](https://drive.google.com/file/d/1WfyN6x21sRLNzzNNYB-dBschGRzdEzUP/view) |
| KD4 로고 | `https://drive.google.com/uc?export=view&id=1rLVpClYzhnIq-GGzuwJK2ISxLdpGPC5b` | [Drive](https://drive.google.com/file/d/1rLVpClYzhnIq-GGzuwJK2ISxLdpGPC5b/view) |
| 스튜디오 사진 | `https://drive.google.com/uc?export=view&id=1by0ZDO3J5yS-44McKbmAPixjPtI3xWNr` | [Drive](https://drive.google.com/file/d/1by0ZDO3J5yS-44McKbmAPixjPtI3xWNr/view) |

## 외부 링크 (코드에서 재사용)
| 용도 | URL |
|------|-----|
| 수강신청 구글폼 | `https://forms.gle/68E7yFFFoDiPCRwD9` |
| 카카오채널 상담 | `https://pf.kakao.com/_ximxdqn` |
| 인스타그램 | `https://www.instagram.com/kd4actingstudio` |
| 네이버 블로그 | `https://blog.naver.com/kd4actingstudio` |

## 코드 규칙
- supabaseAdmin(service_role)은 서버 전용 (client.ts에서 절대 import 금지)
- Three.js HeroScene: dynamic(import, {ssr: false}) 필수
- 이미지 업로드: 클라이언트에서 5MB 사전 체크
- 배우 편집: server에서 actor_id 본인 여부 반드시 검증

## 브라우저/크롬 사용 규칙 (절대 준수)
- 크롬 또는 브라우저 창을 열기 전에 **반드시** 이미 열려 있는 창/탭 먼저 확인
- 동일한 URL 또는 같은 목적의 탭이 이미 열려 있으면 새로 열지 말고 기존 탭 사용
- 중복 탭/창 절대 금지 — 확인 없이 새 창 열지 않기
- 맥OS 기준: `osascript` 또는 `chrome-cli` 로 기존 탭 목록 조회 후 판단

## AI 워크플로 규칙 (Sonnet + Opus)
- 기본 작업: Sonnet으로 진행
- 아래 상황에서는 Opus 서브에이전트를 스폰해서 검토 후 진행:
  - 새로운 DB 스키마 설계 / 기존 스키마 변경
  - 인증·권한 관련 로직 (auth, RLS, role 체계)
  - 배포 전략 / 환경변수 구조 변경
  - 기존 코드 대규모 리팩토링
  - 사용자가 "opus 검토해줘" 요청 시
- Opus 검토 결과를 사용자에게 보여준 후 승인받고 진행
