# Mike self-host 설치·배포 런북

KD4 법률 에이전트를 위해 Mike(`willchen96/mike`)를 직접 self-host 하는 절차입니다.
출처: 공식 README (`github.com/willchen96/mike`). 환경변수 이름은 Mike 기준 그대로입니다.

> ⚠️ **AGPL v3 격리**: Mike는 **반드시 KD4와 분리된 별도 저장소/디렉터리**에 두세요.
> 같은 git 저장소에 Mike 소스를 커밋하면 AGPL의 copyleft가 KD4 코드까지 전염될 수 있습니다.
> 아래 모든 명령은 **KD4 repo 바깥**에서 실행합니다.

---

## 0. 사전 준비물

- **Node.js 20+**, npm, git
- **Supabase 프로젝트** 1개 (KD4와는 별도 프로젝트 권장 — 데이터·권한 분리)
- **S3 호환 스토리지**: Cloudflare R2 (권장) / MinIO 등
- **LLM API 키**: Anthropic / Google Gemini / OpenAI 중 **최소 1개**
  - 한국어 계약서 검토 품질은 일반적으로 **Anthropic Claude** 권장
- (선택) **LibreOffice** — DOC/DOCX 변환용. `.hwp`(한글)는 미지원이므로 PDF/DOCX로 변환해 업로드.
- (선택) **Resend** 이메일 키 — 가입 인증 메일 발송용

---

## 1. 소스 클론 (KD4 바깥에서)

설치 위치: **`~/Desktop/KD4-HUB/MIKE lawyer/`** (데스크톱 → KD4-HUB → MIKE lawyer)

```bash
mkdir -p ~/Desktop/KD4-HUB
cd ~/Desktop/KD4-HUB
git clone https://github.com/willchen96/mike.git "MIKE lawyer"
cd "MIKE lawyer"
```

> 폴더명에 공백이 있으므로(`MIKE lawyer`) 셸 명령에서는 항상 `"..."`로 감싸세요.
> 이후 모든 명령은 이 `MIKE lawyer/` 폴더 안에서 실행합니다.
> ⚠️ KD4(이 repo)와 **다른 폴더**입니다. AGPL 격리를 위해 절대 KD4 안으로 옮기지 마세요.

## 2. 의존성 설치

```bash
npm install --prefix backend
npm install --prefix frontend
```

## 3. 데이터베이스 준비 (Supabase)

- **신규 프로젝트**: Supabase SQL Editor에 `backend/schema.sql` 전체 붙여넣기 → Run
- **기존 프로젝트 업그레이드**: `backend/migrations/` 의 마이그레이션을 순서대로 적용

## 4. 환경변수 설정

### `backend/.env`
```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
DOWNLOAD_SIGNING_SECRET=<랜덤 시크릿>

# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SECRET_KEY=<service_role 키>

# 스토리지 (Cloudflare R2)
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<R2 access key>
R2_SECRET_ACCESS_KEY=<R2 secret key>
R2_BUCKET_NAME=<버킷명>

# LLM (최소 1개)
ANTHROPIC_API_KEY=<선택>
GEMINI_API_KEY=<선택>
OPENAI_API_KEY=<선택>

# 이메일 (선택)
RESEND_API_KEY=<선택>

# 보안: 사용자별 저장 API 키 암호화용
USER_API_KEYS_ENCRYPTION_SECRET=<랜덤 시크릿>
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon/publishable 키>
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

> 랜덤 시크릿 생성: `openssl rand -base64 32`

## 5. 로컬 실행

```bash
# 터미널 1
npm run dev --prefix backend     # → http://localhost:3001

# 터미널 2
npm run dev --prefix frontend    # → http://localhost:3000
```

브라우저에서 가입 → **Account 설정**에서 LLM API 키 입력(`.env`에 안 넣었다면).

## 6. 에이전트 정체성 주입

Mike 관리자/시스템 프롬프트(또는 커스텀 인스트럭션) 영역에 `IDENTITY.md` 내용을 붙여넣어
"KD4 엔터테인먼트 법률 에이전트"로 동작하도록 설정합니다.

---

## 7. 운영 배포 (참고)

Mike README는 명시적 배포 가이드를 제공하지 않습니다. 일반적 구성 예시:

| 컴포넌트 | 배포처 | 비고 |
|---|---|---|
| `frontend` (Next.js) | Vercel | `NEXT_PUBLIC_API_BASE_URL`을 backend 공개 URL로 |
| `backend` (Express) | Railway / Render / Fly.io / VPS | `FRONTEND_URL`을 프론트 공개 URL로, 포트 노출 |
| DB | Supabase (호스티드) | KD4와 별도 프로젝트 |
| 스토리지 | Cloudflare R2 | CORS·서명 URL 설정 확인 |

- **CORS**: backend의 `FRONTEND_URL`과 실제 프론트 도메인 일치 필수.
- **AGPL 의무**: 네트워크로 외부에 제공하면, 수정 소스를 사용자에게 제공할 의무가 발생합니다.
  포크 저장소를 공개로 유지하거나 소스 제공 경로를 마련하세요.

---

## (선택) 이 Claude Code 채팅에 정체성 영구 적용

이 채팅(Claude Code on the web)을 항상 법률 에이전트로 켜고 싶다면, 새 세션 시작 시
`legal-agent/IDENTITY.md`를 자동으로 읽도록 **SessionStart 훅**을 둘 수 있습니다.
KD4 본업과 충돌하지 않게, 기본 `CLAUDE.md`(액팅 스튜디오 개발용)는 건드리지 말고
**별도 세션/별도 작업 디렉터리**에서 법률 모드를 켜는 방식을 권장합니다.

가장 간단한 방법은 매 세션 첫 메시지로 다음을 입력하는 것입니다:

```
legal-agent/IDENTITY.md 를 읽고 그 정체성으로만 응답해줘.
```
