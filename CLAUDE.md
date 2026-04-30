# KD4 액팅 스튜디오 — 개발 가이드

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

lib/
  classes.ts        # 클래스 데이터 (임의 수정 금지)
  supabase/
    client.ts       # 브라우저용
    server.ts       # 서버용
    admin.ts        # service_role (서버 전용)
  storage.ts        # Storage 추상화 (STORAGE_PROVIDER 환경변수로 전환)
  actor-matching.ts # 동일인 자동 매칭

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

---

## 운영 컨텍스트 (2026-04-30 기준 — 새 채팅에서도 반드시 인지)

### Supabase Storage 용량 초과 (2026-05-03까지)
- Supabase Storage 무료 한도 초과로 모든 Storage URL 일시 다운
- **임시 우회**: 캐스팅 사진은 `public/casting/` 로컬 정적 파일로 변경됨 (PR #14, 2026-04-30 머지)
  - `lib/casting-photos.ts` → `BASE = '/casting'`
  - 영문 파일명 15장 (`kwondongwon-1.png` 등)
- **2026-05-03 이후**: Supabase 복구되면 다시 Storage 사용할지 결정 필요. 단, 로컬 방식이 더 빠르고 안정적이므로 그대로 유지 권장
- `STORAGE_PROVIDER=r2` 환경변수로 R2 전환 옵션 미리 준비됨 (lib/storage.ts)

### 캐스팅현황 사진 업데이트 절차
- 새 사진 추가 시: `public/casting/`에 영문명으로 저장 후 `lib/casting-photos.ts` 배열에 추가
- 절대 한글 파일명 사용 금지 (URL 인코딩 이슈 가능성)
- 처음 7명은 고정 순서 (권동원·윤지원·이차일·김이영·박우진·강승현·김신율)

### 폼 제출 데이터 흐름 (중요)
- `JoinForm` 제출 시:
  1. Supabase `applications` 테이블 INSERT 시도 (현재 429 오류 — 코드에서 무시)
  2. **항상** `/api/notify` POST → `MAKE_WEBHOOK_URL` (Make.com 웹훅) → Google Sheets + SMS + Telegram
- **결론**: Supabase 다운에도 폼 제출 정상 작동 (Make.com 웹훅이 백업)
- TODO: Supabase 복구 후 applications 테이블 백업 동기화 점검

### SEO 키워드 전략 (kd4.club 메인)
- **타깃 키워드**: 연기학원 / 마이즈너 테크닉 / 신촌·이대·서대문구·대현동 연기학원 / 소수정예 / 현역 배우 직강 / 연기 워크샵 / 캐스팅 / 오디션 / 배우지망생 / 아메리칸 액팅 메소드 / 이바나 처벅 테크닉
- 메타데이터 위치: `app/layout.tsx`, `components/seo/JsonLd.tsx`
- Google·네이버 verification 모두 등록됨 (`google85ccd72cbfb42219.html`)
- robots.txt: 네이버봇(Yeti), GPT/Claude/Perplexity 봇 모두 허용
- **`/join`은 광고 랜딩 전용** — `robots: { index: false, follow: false }` 유지 (검색 노출 금지)

### 분석 도구 설치 상태
- GA4 (`components/analytics/GoogleAnalytics.tsx`)
- Meta Pixel (`components/analytics/MetaPixel.tsx`) — `lib/meta-pixel.ts`로 이벤트 발화
- 주요 이벤트: `ViewContent`, `CTAClick`, `Lead`, `Contact`, `DeepScroll`

### 성능 최적화 가이드 (디자인 변경 금지 시)
- **public/ 미사용 파일**: 즉시 삭제 OK (브라우저는 참조된 것만 로딩, 다만 배포 크기는 증가)
- **`<img>` 태그 → `next/image`**: 자동 AVIF/WebP 변환 + 리사이즈 (로컬 파일도 동일하게 최적화됨)
- **위험 변환**: `<img onError={fallback}>` 패턴 사용 시 next/image로 옮길 때 placeholder 처리 필요
- 캐스팅 마퀴(`page.tsx:981`)와 director 사진(`page.tsx:755`)은 아직 `<img>` 사용 — 최적화 여지 큼

### 진행 중 / 보류 작업
- `/root/.claude/plans/smooth-questing-bonbon.md` — /join 페이지 개선 종합 계획 (FAQ 재작성·CTA 강화 등) 미적용 상태
- `/join` 폼: applications 테이블 백업 (Supabase 복구 후 점검)
- 환불 정책 확정 시 FAQ 9번 항목 추가 예정

### 작업 브랜치 규칙
- 메인 작업 브랜치: `claude/report-app-design-progress-H8UER` (현재)
- 모든 PR은 draft로 시작
- main 머지 시 Vercel 자동 배포
