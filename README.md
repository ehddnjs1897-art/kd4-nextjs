# KD4 액팅 스튜디오 — 웹사이트

KD4 액팅 스튜디오 공식 웹사이트 (`kd4.club`). 배우 프로필 DB, 커뮤니티 게시판, AI 대본분석, 관리자 대시보드, 광고 랜딩 페이지를 포함한다.

## 스택

- **Next.js 16** (App Router) + TypeScript
- **Supabase** (PostgreSQL + Auth + Storage)
- **Cloudflare R2** (영상 저장 — 영상만, 이미지는 Supabase Storage)
- **CSS Variables** (`styles/globals.css`) — Tailwind 일부
- **Vercel** 배포 (main push → 자동 빌드)

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 환경변수 채우기 (아래 참고)
npm run dev
```

→ http://localhost:3000

## 환경변수 (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 서버 전용 — 절대 클라이언트 노출 금지

# 카카오 (로그인 + 공유)
NEXT_PUBLIC_KAKAO_JS_KEY=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Gemini AI (대본 분석 + 캐스팅 태그 자동 분류)
GEMINI_KEY=                          # 서버 전용 — NEXT_PUBLIC_ 접두사 절대 금지

# 영상 저장 (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# 이미지/문서 Storage 선택 (현재 supabase 고정)
STORAGE_PROVIDER=supabase

# SMS 알림 (Solapi)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_FROM_NUMBER=                  # 사전 등록 발신번호 (예: 01012345678)
ADMIN_PHONE_NUMBER=                  # 신규 상담 접수 알림 수신번호

# Make.com 웹훅 (구글시트 자동 동기화)
MAKE_WEBHOOK_URL=

# Meta CAPI (광고 추적 — 선택)
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_TOKEN=
```

> ⚠️ Vercel 배포 시 Production Environment Variables에 동일하게 추가 후 Redeploy 필수.

## DB 초기화

1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.sql` 전체 실행
3. 이후 변경 사항은 `supabase/migrations/` 내 SQL 파일을 날짜 순으로 실행

## 첫 관리자 계정

1. `/auth/signup` 에서 회원가입
2. Supabase Table Editor → `profiles` → 본인 row의 `role` 컬럼을 `admin` 으로 변경

## 주요 경로

| 경로 | 내용 | 인덱싱 |
|---|---|---|
| `/` | 랜딩 (히어로 + 11섹션) | ✅ |
| `/about` | 스튜디오 소개 | ✅ |
| `/classes` | 클래스 전체 목록 | ✅ |
| `/meisner-technique-class` | 마이즈너 정규반 랜딩 | ✅ |
| `/reel-production-class` | 출연영상 클래스 랜딩 | ✅ |
| `/sinchon-acting-academy` | 신촌 위치 / 약도 / 갤러리 | ✅ |
| `/acting-coach-dongwon-kwon` | 권동원 액팅 코치(리더) 프로필 | ✅ |
| `/actors` | 배우 목록 (누구나 열람) | ✅ |
| `/actors/[id]` | 개별 배우 프로필 (로그인 필수) | ✅ |
| `/board` | 커뮤니티 게시판 (회원 전용) | ❌ |
| `/ai-tools` | AI 대본분석 (멤버 전용) | ❌ |
| `/dashboard` | 마이페이지 + 편집 | ❌ |
| `/admin` | 관리자 전용 (role=admin) | ❌ |
| `/join` | 무료 상담 신청 (광고 랜딩) | ❌ |
| `/enroll` | 클래스 신청 폼 | ❌ |
| `/onboarding` | 배우 프로필 인테이크 | ❌ |
| `/game` | Spotlight Rush 미니게임 | ❌ |
| `/insights` | 인사이트 (관리자 전용) | ❌ |

## 브랜드 규칙

- **"수강생" 금지** → "**멤버**", "**KD4 멤버**"
- "수강생 후기" 금지 → "**멤버 이야기**"
- "동료 배우", "KD4 동료 배우" 금지 → "**KD4 멤버**" (2026-05-08 변경)
- **클래스 명칭은 `lib/classes.ts` 데이터 그대로 사용** (임의 수정 금지)
- 베이직 클래스: "연기 경험 없어도 OK" 문구 필수
- **"강사" → "액팅 코치 (리더)"** (코치 페이지 등)
- **"대표 직강" → "리더 직강"** (전체 통일)
- 권동원 타이틀: "KD4 액팅 코치 (리더) · 현역 배우"

## 디자인 규칙 (절대 준수)

- **폰트 변경 금지** — KoPubWorld Dotum/Batang 서브셋 자가 서빙
- **`next.config.ts`에 `redirects` 추가 금지** — Next.js 16 무한 루프 사고 (대소문자 정규화는 `middleware.ts`에서만)
- **`@import` CSS 사용 금지** — 렌더 블로킹

## 개발 규칙

- `supabaseAdmin` (service_role)은 **서버 전용** — `lib/supabase/client.ts`에서 절대 import 금지
- **Server Component 안에 `dynamic(... { ssr: false })` 금지** — Next.js 16 빌드 실패 (사고: 2026-05-28 24시간 배포 ERROR)
- Three.js HeroScene: `dynamic(import, {ssr: false})` 가능 — **단, Client Component 안에서만**
- 이미지 업로드: 클라이언트에서 5MB 사전 체크
- 배우 편집 API: `actor_id` 본인 여부 서버에서 검증 필수
- 영상은 R2 signed URL (private 버킷), 이미지는 Supabase Storage (public 버킷)

## AI 자율 작업 워크플로

- 자세한 룰: `CLAUDE.md` 참고
- 통합 Todo DB: Notion `🎯 KD4 통합 Todo` (모든 할일/결정 사항)
- 자산 보관: `~/Desktop/KD4-HUB/` (브랜드·문서·드래프트 원본)

## 관련 문서

| 문서 | 위치 |
|---|---|
| AI 에이전트 개발 규칙 | `CLAUDE.md` (저장소 루트) |
| KD4 운영 매뉴얼 | `~/Desktop/KD4-HUB/00-README.md` |
| 통합 Todo DB | Notion 워크스페이스 |
| 마이그레이션 이력 | `supabase/migrations/` (날짜순) |
