# KD4 액팅 스튜디오 — 개발 가이드

> ⚠️ **AI 작업자 룰**: 이 문서의 "미완료" 항목은 시간이 지나면 stale될 수 있다.
> 사용자에게 "미완료"라고 보고하기 전에 **반드시 라이브 검증** 후에 말할 것.
> (DNS TXT 조회·라이브 자산 헤더·코드 grep 등으로 1분 안에 확인 가능한 항목들임)

## 🚨 배우 프로필 데이터 입력 룰 (2026-05-23, 사고 후 확정)

**배우 필모그래피(방송사·플랫폼·영화구분 등)는 공식 이력서 공문서다.**
AI가 학습 기억으로 방송사·플랫폼을 추측 입력하면 사고 → 절대 금지.

### 허용되는 데이터 소스 (우선순위 순)
1. **공식 프로필 문서 파싱** — actor-docs 버킷의 PPTX/PDF 텍스트에서 추출
2. **사용자(대표/배우)가 직접 알려준 값** — 채팅에서 명시적으로 말한 것만
3. **관리자 대시보드 직접 입력** — /dashboard/edit에서 입력한 값

### 금지 사항
- ❌ AI 학습 데이터 기억으로 방송사/플랫폼/수상이력 추측 입력
- ❌ 검색결과나 추론으로 방송사 채우기
- ❌ "아마 tvN일 것" 같은 불확실한 데이터 입력
- ❌ 확인 안 된 값 일괄 업데이트

### 올바른 처리 절차
1. profile_doc_path 확인 → actor-docs 버킷에서 파일 다운로드 시도
2. 파싱 성공 → 문서 텍스트에서 명시적으로 찾은 값만 입력, 출처 명시
3. 파싱 실패(파일 없음) → null 유지, 사용자에게 "어떤 작품의 방송사인지 알려주세요" 요청
4. 입력 후 반드시 사용자에게 변경 내용 보고 + 확인 요청

## 🚨 2026-07-02 기준 현황 (새 채팅 시작 시 반드시 읽기)

## 📋 노션 커맨더 운영 룰 (2026-07-02 감사 후 확정)

**대상**: 「🎓 KD4 수강 현황」(DB f8ac0376, ds cf2db178) · 「🧭 KD4 상담자 현황」(DB e4f5f376, ds 4f7baedd) — 「📋 KD4 컨트롤 타워」 하위.

- 🔁 **월 고정 뷰는 매달 1일 갱신 필수**: 수강현황의 「🎬 수업·기수별」「🎓 기수별 명단」「🔴 미납 체크」「📊 수업별 인원」 4개 뷰는 `월` select 필터가 하드코딩됨(select 타입이라 상대 날짜 필터 불가). 매달 1일 필터를 새 달로 교체 + 뷰 이름 (N월) 갱신. 2026-07-02에 6월→7월 갱신 완료.
- 📱 **모바일 상시 뷰**: 「📱 기수별 (수강중)」 보드(반별 그룹, 상태=수강중) 신설(2026-07-02). 월 필터만 매달 갱신.
- 🚫 **1회성 검색 뷰 만들지 말 것**: 사람 찾기용 임시 뷰(예: "OOO 검색")를 만들면 모바일 탭이 지저분해짐. 검색은 노션 검색 기능 사용. 기존 임시 뷰 4개는 2026-07-02에 파이프라인 상시 뷰(🆕 신규 대기 / 📅 예약 완료 / 🌱 잠재·보류 / 🎓 등록 완료)로 재활용됨.
- ⚠️ **노션 MCP 쿼리 제한**: 현 노션 플랜에서 query-data-sources/query-database-view 사용 불가(Business+ 필요). 행 단위 조회는 구글시트 미러(마스터 DB xlsx export) 경유로 할 것.
- ✅ **노션→구글시트 미러 동기화**(마스터 DB 17gB2UaC..., 매시간)는 Make가 아닌 외부(Apps Script 추정) — Make 계정에 notion 모듈 사용 시나리오 0건 확인(2026-07-02). 생존 여부는 시트 modifiedTime으로 검증.
- 🔴 **방치 확정 자산**: 「KD4 수강료 납부체크」 시트(16OGE0b33...)는 2026-05-21 생성 후 무수정 — 6·7월 열 전부 공백. 폐기 또는 재가동 결정 필요. 마스터 DB 대시보드 「월별 매출 추이」는 2026-04에서 멈춤(5·6월 행 미추가).

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

- [ ] **GA4 데이터 누적 검증** — 5/6 trim fix 후 18일 경과 (2026-05-24). GA4 콘솔에서 직접 확인 필요. curl/grep으로 라이브 코드 확인은 완료, 실제 트래킹 수신은 GA4 콘솔에서만 확인 가능. 미검증 (2026-07-02, GA4 콘솔 접근 불가 — 코드 grep으로만 재확인 가능한 범위 아님)
- [ ] **PSI 모바일 점수 직접 측정** — 자동 PSI API는 일일 quota 초과 상태(공유 IP). pagespeed.web.dev 사용자 직접 1회 측정 권장. 미검증 (2026-07-02, 사용자 직접 측정 필요 항목 — AI 라이브 검증 불가)
- [x] **`director.jpg` / `heart-logo.png` Cache-Control** — 해결됨 (commit af90b1e, max-age=2592000 라이브 확인 2026-05-11)
- [x] **자동 일일 트래픽 리포트 재가동** — 4/27 이후 14일치 누락됐으나 RemoteTrigger `trig_018ENRkD9xeDByXnnGKX5oHw` 등록 완료 (매일 00:00 UTC = 09:00 KST, 첫 실행 2026-05-12). ⚠️ GA4 API 자격증명 미설정 → 실행 시 Notion에 "수동 확인 필요" 페이지만 생성됨 (실제 데이터는 Google 서비스계정 키 설정 필요)
- [x] **app/api/notify/route.ts Meta CAPI** — 커밋 완료 (ba8f4ed). `META_CAPI_TOKEN` + `NEXT_PUBLIC_META_PIXEL_ID` Vercel env 추가 시 즉시 작동 (env 없으면 silent skip)
- [ ] **/actors Drive 썸네일** — 2026-05-14 직접 검증: 51명 중 48명 Storage 완료, 3명(송은아·조소영·김마고) Drive 의존 잔여. 송은아 PPTX 234MB(크기 초과), 조소영·김마고 Drive 파일 삭제됨 → 대표님 원본 파일 전달 필요. 2026-07-02 코드 grep 재확인: `app/actors/[id]/page.tsx`에 `drive_photo_id` 폴백 로직 여전히 존재 → 최소 1명 이상 Drive 의존 잔여 확정, 정확한 잔여 인원수는 라이브 DB 조회 필요(미검증)
- [x] **NEXT_PUBLIC_GEMINI_KEY 제거** — 2026-07-02 코드 grep 재확인: 코드 전체에서 `NEXT_PUBLIC_GEMINI_KEY` 참조 0건(라이브 홈페이지 HTML에도 미노출) → 서버전용 `GEMINI_KEY`로 완전 전환 완료 (커밋 b0dd050 반영 확정)
- [x] **배우 상세페이지 전화번호 비노출** — 2026-07-01 커밋(e530cd0)으로 배우 전화번호 직접 노출 제거, 디렉터 직통 문의 버튼으로 대체. `app/actors/[id]/page.tsx` L378-381에서 PII(phone/email) 서버→클라이언트 직렬화 시 제거 확인(canContact 권한 없는 유저 번들 미노출)
- [x] **회원가입(배우) 성별 필수** — 2026-07-01 커밋(7ef23ec, 46ececf)으로 접수폼·회원가입 양쪽에 성별(남/여) 필수 선택 추가. `app/auth/signup/page.tsx` L73 코드 확인: `memberType==='actor'`일 때 성별 미선택 시 제출 차단
- [x] **`lib/db-missing-column.ts` 42703+PGRST204 이중 폴백** — 2026-06-23 커밋(075b05d)으로 신설, intake·actors/[id] 라우트 교체 완료. 파일 존재 확인(2026-07-02)
- [x] **`scripts/_loadEnv.ts` env 값 개행오염 방어 로더** — 2026-06-18 신설, 파일 존재 확인(2026-07-02). `.env.local` 원본도 perl로 영구 정리됨(같은 날)

### 🔬 분석/관측 (2026-05-06)
- **Meta Pixel 28일 깔때기** (4/27 시점): PageView 1,700 → ViewContent 85(5%) → DeepScroll 44 → InitiateCheckout 1 → CTAClick 1
- **상담 전환율 0.06%** — 정상 광고는 1~3%. 폼 필수 필드 7개(이름·연락처·이메일·희망클래스·마이즈너경험·유입경로·동의)가 강한 마찰 지점으로 의심
- **GA4 수치는 신뢰 불가** (5/6 trim fix 전까지) — Meta 1,700 vs GA 28일 89PV 격차 → fix 적용 후 재진단 필요

### Supabase 상태 (2026-05-29 자율점검 갱신)
- 결제 완료 → 프로젝트 정상 가동 (HTTP 200)
- `actors` 테이블 공개 배우 **52명** 정상 조회됨 (이기옥·박성만 5/28 추가)
- Storage 마이그레이션: 48/51명 완료 기준 → 신규 2명(이기옥·박성만) Storage 상태 별도 확인 필요
- 잔여 Drive 의존 배우: 3명(송은아·조소영·김마고) → placeholder 표시 중 (UX 영향 없음)
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

Gemini (서버 전용 — NEXT_PUBLIC_ 절대 사용 금지):
- GEMINI_KEY=[API Key]

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

### 🚨 반복 사고 함정 (MISTAKES.md 발췌)

> 출처: `KD4-HUB/04-ops/mistakes/MISTAKES.md` (전체 실수 기록은 원본 참조)

| # | 함정 | 대응 | 날짜 |
|---|---|---|---|
| ⓐ | Supabase nullable 컬럼(`actor_filmography.title` 등)에 `.slice`/`.map`/`.toLowerCase`/`.filter` 직접 호출 시 TypeError로 서버컴포넌트 전체 크래시 | `(x ?? '')`·`?.`·`(arr ?? [])` 가드 필수. TS 타입 non-null ≠ 런타임 보장 | 2026-06-13 |
| ⓑ | UPDATE/INSERT 시 누락 컬럼 폴백을 `42703`만 검사하면 무력화됨 — PostgREST는 스키마캐시 단계에서 `PGRST204` 반환(Postgres까지 안 감) | `42703`+`PGRST204` 둘 다 검사 — `lib/db-missing-column.ts`(isMissingColumnError·findMissingOptionalCol) 사용 | 2026-06-23 |
| ⓒ | 파일 크기 제한 변경 시 한 곳만 고치면 재발 — 버킷 `file_size_limit`뿐 아니라 `allowed_mime_types`(HEIC·octet-stream 등)도 별도 게이트 | UI·서버 검증·signed-upload·Storage 버킷(크기+MIME) 4곳 동시 수정 + 실제 업로드 테스트로 확정 | 2026-06-15·06-16 |
| ⓓ | 아직 없는 컬럼을 코드에 먼저 사용(미래 컬럼 선반영) + `?? []` 폴백이 에러를 삼켜 조용한 빈 목록 발생 | ORDER/SELECT 컬럼은 schema.sql+migrations에 실존하는 것만. `?? []` 폴백 쓸 땐 error 로깅 필수 | 2026-06-12 |
| ⓔ | 타입 인터페이스 미확인 상태로 존재하지 않는 프로퍼티 접근 → tsc 에러 있는 채로 커밋됨 | 커밋 전 반드시 `tsc --noEmit` 0개 확인, 에러 있으면 커밋 중단 | 2026-06-09 |
| ⓕ | GitHub push 성공해도 Vercel 웹훅 누락으로 자동배포 미발화 — "push 성공 ≠ 배포 완료" | 중요 배포는 Vercel MCP `list_deployments`로 READY 상태 확인, 누락 시 더미 커밋으로 재트리거 | 2026-06-08 |
| ⓖ | 여러 세션/에이전트가 공유 working tree를 동시 점유 → 브랜치 꼬임·미완성 편집 혼입 | repo 편집은 반드시 격리 git worktree(`git worktree add` + node_modules 심볼릭링크)에서 진행 | 2026-06-08·06-09 |
| ⓗ | `.env.local` 값에 literal `\n`이 큰따옴표 안에 남아 `source`로도 안 지워짐 — DNS/API 인증 실패 반복(5/20·5/29 임시 우회했으나 재발) | 원본 파일을 `perl -i -pe 's/\\n//g; s/\r$//'`로 영구 정리 + 신규 스크립트는 `scripts/_loadEnv.ts` 사용(값 trim+따옴표/이스케이프 제거 로더) | 2026-05-20·06-18(영구종결) |

## 브라우저/크롬 사용 규칙 (절대 준수)
- 크롬 또는 브라우저 창을 열기 전에 **반드시** 이미 열려 있는 창/탭 먼저 확인
- 동일한 URL 또는 같은 목적의 탭이 이미 열려 있으면 새로 열지 말고 기존 탭 사용
- 중복 탭/창 절대 금지 — 확인 없이 새 창 열지 않기
- 맥OS 기준: `osascript` 또는 `chrome-cli` 로 기존 탭 목록 조회 후 판단

## AI 워크플로 규칙 — Fable 오케스트레이션 구조 (2026-07-02 확정, 매번 이 구조로)

**메인 세션 = Fable(오케스트레이터), 실행 = Sonnet 서브에이전트.** 모든 업무에 기본 적용.

- **Fable(메인)의 역할**: 업무 전체 기획 · 구조 설계 · 디자인/품질 점검 · 서브에이전트 결과 검수 · 최종 보고. 직접 손 움직이는 실행은 최소화.
- **Sonnet 서브에이전트(model: sonnet)의 역할**: 실제 실행 전부 — 데이터 조사/입력, 노션 편집, 시트 점검, 코드 수정, 자동화 점검 등. Agent 도구로 스폰.
- **병렬화**: 서로 의존성 없는 실행 작업은 Sonnet 에이전트 여러 개를 한 번에 동시 스폰.
- **위임 프롬프트 원칙**: 서브에이전트에게는 배경·정확한 대상 ID·허용 범위(읽기전용/수정가능)·출력 형식을 명시해 자율 판단 여지를 줄인다.
- **고위험 항목은 Fable이 직접 검토 후 위임** (서브에이전트 단독 진행 금지): DB 스키마 설계/변경, 인증·권한 로직(auth, RLS, role), 배포 전략/환경변수 구조 변경, 대규모 리팩토링.
- 🚨 **여러 요청은 "구조화 후 일괄 처리"**: 사용자가 "다다다" 여러 개를 빠르게 요구하면 → ① 하던 것 멈춤 ② 업무 구조화(목록·우선순위·의존성) ③ 한 번에 배치 처리. **배포·커밋도 모아서 1번** (고칠 때마다 개별 배포 금지 → Vercel 빌드 큐 정체 사고 2026-05-22~23). 여러 세션 동시 푸시 금지. 모든 채팅·코워크·코드 동일 기준.
- 검토 결과를 사용자에게 보여준 후 승인받고 진행 (고위험 항목에 한함)

## 🚨 Dispatch 자율 승인 원칙 (2026-05-23 확정)

**코드 에이전트는 AskUserQuestion을 절대 사용하지 않는다.**

모든 작업은 Dispatch 오케스트레이터(Cowork 메인 채팅)가 지시하고, 승인도 Dispatch를 통해서만 받는다. 코드 에이전트가 UI 팝업으로 사용자를 직접 차단하는 것은 금지.

### 판단이 필요한 상황별 기본 처리 원칙

| 상황 | 기본 행동 |
|---|---|
| feature 브랜치 → main 머지 여부 | 머지충돌 없으면 즉시 머지 후 push |
| Vercel 배포 여부 | main push 후 자동 배포 기다림 (별도 확인 불요) |
| 커밋 범위 판단 | 작업 지시 범위 내 파일만 커밋, 무관한 파일 제외 |
| 작업 범위 외 추가 발견 사항 | 트랜스크립트에 기록 후 계속 진행 (멈추지 않음) |
| 진짜 판단 불가한 상황 | 트랜스크립트에 "❓ Dispatch 확인 필요: [내용]" 명시 후 idle 상태로 대기 |

### 진짜 Dispatch 승인이 필요한 경우 (이것만)
- DB 스키마 변경 (되돌릴 수 없음)
- 환경변수 삭제 또는 이름 변경
- 인증/권한 로직 구조 변경
- 사용자 데이터에 영향을 주는 마이그레이션

위 경우에만 트랜스크립트에 "❓ Dispatch 확인 필요" 남기고 대기. 나머지는 모두 자율 판단 후 진행.

## 🚫 Code 세션 절대 금지 행동 (빌드·프리뷰·충돌)

| 금지 | 대신 |
|---|---|
| `npm run build` / `next build` 로컬 실행 | TypeScript 에러는 `tsc --noEmit`으로만 확인 |
| `preview_start` / 로컬 dev 서버 기동 | 바로 push → Vercel 자동 빌드로 검증 |
| AskUserQuestion 팝업 | transcript에 "❓ Dispatch 확인 필요" 후 idle |
| 다른 Code 세션이 작업 중인 파일 동시 수정 | transcript에 "⚠️ 충돌 위험" 남기고 대기 |
| 같은 repo를 여러 Code 세션이 동시 push | 순차 처리 — 앞 세션 완료(SHA 확인) 후 시작 |
| git index.lock 강제 삭제 후 push | Dispatch에 "❓ index.lock 발견" 보고 후 대기 |

> 로컬 빌드는 10~20분 낭비. Vercel이 실제 환경과 동일하고 더 빠르다.

## 🔄 세션 완료 핸드오프 규칙

작업 완료 후 transcript 마지막에 반드시 아래 형식으로 요약:

```
✅ 완료: [작업 내용 한 줄]
📁 수정 파일: [파일 목록]
🔀 커밋: [SHA]
🚀 배포: [Vercel 자동 배포 대기 중 / URL]
⚠️ 후속 필요: [있으면 기재, 없으면 "없음"]
```

다음 세션이 이 요약을 보고 즉시 이어받을 수 있도록 구체적으로 기재. SHA는 `git rev-parse --short HEAD`로 확인.

## 📡 Vercel 배포 상태 확인

배포 상태 확인 시 `curl` 폴링 / `vercel` CLI 반복 호출 금지.
push 완료 후 transcript에 아래 메시지만 남기고 대기:

```
✅ push 완료 (SHA: [커밋SHA]). Dispatch에서 Vercel MCP → list_deployments로 확인 바람.
```

Dispatch(상위 오케스트레이터)가 Vercel MCP `list_deployments` / `get_deployment`로 배포 상태를 확인한다. Code 에이전트가 직접 확인하려 하지 않는다.

## 🚨 Vercel 배포 누락 주의 (2026-06-08 사고 후 확정)

GitHub push 성공 ≠ Vercel 배포 완료. 간헐적으로 웹훅이 누락되어 자동배포가 발화하지 않는다.

**중요 배포(매출 대시보드 등)는 반드시 Vercel MCP `list_deployments`로 READY 상태 확인.**
배포 목록에 해당 커밋 SHA가 없으면 → 새 더미 커밋으로 재트리거.

## 자산 관리 원칙 (폴더 구조)

| 폴더 | 용도 | 규칙 |
|---|---|---|
| `~/Desktop/KD4-HUB/` | 자산 **원본** 보관소 | 이미지·문서·브랜드 원본은 여기 |
| `~/Desktop/kd4-nextjs/` | 웹사이트 **코드** (Git 관리) | public/ 에는 최적화 완료 파일만 |
| `~/Desktop/클로드 산출물/` | Claude 작업 중 **임시** 생성물 | 확정 시 hub로 승격, 코드 반영 시 public/로 복사 |

- 브랜드·로고 원본 → `KD4-HUB/06-brand/`
- 제휴처 원본 이미지 → `KD4-HUB/06-brand/partners/`
- 콘텐츠 초안 → `KD4-HUB/05-content/`
- **사이트 반영 순서**: 원본(hub) → 최적화(WebP·리사이즈) → `public/` 복사 + git 커밋
- `public/` 에 원본 대용량 파일 직접 넣기 금지 — git이 무거워지고 백업이 꼬임
