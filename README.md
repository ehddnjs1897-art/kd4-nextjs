# KD4 액팅 스튜디오 — 웹사이트

KD4 액팅 스튜디오 공식 웹사이트. 배우 프로필, 커뮤니티 게시판, AI 대본분석, 관리자 대시보드를 포함한다.

## 스택

- Next.js (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS
- Vercel 배포

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 환경변수 채우기 (아래 참고)
npm run dev
```

→ http://localhost:3000

## 환경변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_KAKAO_JS_KEY=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

NEXT_PUBLIC_GEMINI_KEY=

STORAGE_PROVIDER=supabase   # r2로 바꾸면 Cloudflare R2 전환

# SMS 알림 (Solapi — console.solapi.com에서 API Key 발급)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_FROM_NUMBER=   # 사전 등록된 발신번호 (예: 01012345678)
ADMIN_PHONE_NUMBER=   # 신규 상담 접수 알림 수신번호

# Make.com 웹훅 (구글시트 연동)
MAKE_WEBHOOK_URL=
```

> ⚠️ Vercel 배포 시 위 Solapi 4개 변수도 Environment Variables에 추가 후 Redeploy 필요

## DB 초기화

1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.sql` 전체 실행

## 첫 관리자 계정

1. `/auth/signup` 에서 회원가입
2. Supabase Table Editor → profiles → role 컬럼을 `admin` 으로 변경

## 주요 경로

| 경로 | 내용 |
|---|---|
| `/` | 랜딩 (11섹션) |
| `/actors` | 배우 목록 + 갤러리 |
| `/board` | 커뮤니티 게시판 |
| `/ai-tools` | AI 대본분석 |
| `/dashboard` | 마이페이지 + 편집 |
| `/admin` | 관리자 전용 (role=admin) |
| `/join` | 수강신청 |

## 브랜드 규칙

- "수강생" 금지 → "동료 배우", "KD4 배우"
- 클래스 명칭은 `lib/classes.ts` 데이터 그대로 사용 (임의 수정 금지)
- 베이직 클래스에는 "연기 경험 없어도 OK" 문구 필수

## 개발 규칙

- `supabaseAdmin` (service_role)은 서버 전용 — 클라이언트에서 import 금지
- Three.js HeroScene: `dynamic(import, {ssr: false})` 필수
- 이미지 업로드: 클라이언트에서 5MB 사전 체크
- 배우 편집 API: `actor_id` 본인 여부 서버에서 검증 필수
- 자세한 개발 가이드: `CLAUDE.md` 참고
