# KD4 액팅 스튜디오 — 개발 가이드

## 🚨 2026-05-01 기준 현황 (새 채팅 시작 시 반드시 읽기)

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

### 남은 미완료 작업
- [x] ~~Meta 도메인 인증~~ — 완료
- [x] ~~PageSpeed 재측정~~ — 완료
- [x] ~~app/api/notify/route.ts Meta CAPI WIP~~ — 정리됨 (현재 Make 웹훅 + Solapi SMS만 깔끔하게 동작)
- [ ] **/actors Drive 썸네일 → Supabase Storage 마이그레이션**
  - 코드 작업 완료 (`lib/actor-photo.ts` 헬퍼 + 페이지 수정 + `scripts/migrate-actor-photos.ts`)
  - **사장님 출근 후 1회 실행 필요**:
    1. Supabase Dashboard → SQL Editor → `supabase/migrations/20260501_add_storage_photo_path.sql` 전체 실행 (actors 테이블에 storage_photo_path 컬럼 추가)
    2. 로컬 터미널: `npm install` → `npm run migrate:actors` (51명 배우 사진 일괄 이전, 약 2~3분)
- [ ] **CPE 자동 측정 셋업** (`docs/cpe-tracking-setup.md` 가이드 작성됨)
  - **사장님 출근 후 본인 작업 필요**:
    1. Google Sheets `KD4 CPE Tracking` 생성 (가이드 Step 1)
    2. Meta Marketing API 토큰 발급 (가이드 Step 3-1, 30분)
    3. Make 시나리오 2개 추가 (가이드 Step 2 + 3-2)
  - 완료 후 매월 5~10분 운영으로 LP 효과 측정 가능

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
- "수강생" 절대 금지 → "동료 배우", "KD4 배우"
- "수강생 후기" 금지 → "동료 배우 이야기"
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
