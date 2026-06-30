# KD4 프로젝트 스킬 (Agent Skills)

출처: [anthropics/skills](https://github.com/anthropics/skills) — KD4 액팅 스튜디오 워크플로에 직접 매핑되는 스킬만 선별 설치.
각 스킬 폴더의 `LICENSE.txt`에 라이선스 조건이 포함되어 있다.

## 설치된 스킬 (2026-06-26)

| 스킬 | 용도 | KD4 적용 지점 |
|---|---|---|
| **pdf** | PDF 읽기·텍스트/표 추출·생성·병합·OCR | 배우 프로필 PDF 파싱 (actor-docs 버킷의 이력서 공문서) |
| **pptx** | PPTX 읽기·텍스트 추출·생성·편집 | 배우 프로필 PPTX 파싱 (actor-docs 버킷, 필모그래피 추출) |
| **xlsx** | 스프레드시트 읽기·정리·생성·변환 | 구글시트 배우 임포트, 전환율/캐스팅 집계 데이터 가공 |
| **frontend-design** | UI 비주얼 디자인 방향·타이포·레이아웃 가이드 | Next.js 사이트 디자인 작업 (DESIGN.md, 폰트 구조와 함께) |
| **webapp-testing** | Playwright 기반 로컬 웹앱 검증·스크린샷·로그 | 사이트 UI 동작 검증 (환경에 Chromium 사전설치됨) |

## 🚨 배우 프로필 파싱 시 필수 룰 (CLAUDE.md 연동)

`pdf`/`pptx` 스킬로 프로필 문서를 파싱할 때:
- 문서 텍스트에서 **명시적으로 찾은 값만** 입력 (방송사·플랫폼·수상이력)
- AI 학습 기억으로 추측 입력 절대 금지
- 파싱 실패(파일 없음) 시 → null 유지 + 사용자에게 확인 요청
- 입력 후 변경 내용 보고 + 확인 (CLAUDE.md "배우 프로필 데이터 입력 룰" 참조)

## 선별 제외 스킬 (참고)

- `brand-guidelines` — **Anthropic 자체 브랜드**용. KD4는 자체 브랜드 규칙(CLAUDE.md, DESIGN.md, BRAND_VOICE_PROFILE.md) 보유 → 제외
- `canvas-design` / `theme-factory` — 대용량(5.5MB+). 마케팅/캐스팅 그래픽은 Canva·Adobe MCP가 커버 → 제외
- `claude-api` — 이미 하네스 기본 스킬로 제공됨 (중복) → 제외
- `docx` — 프로필 문서가 PPTX/PDF로 한정 명시됨 → 필요 시 추후 추가
- `web-artifacts-builder` — claude.ai HTML 아티팩트 전용 (Next.js repo와 무관) → 제외
- `slack-gif-creator` / `internal-comms` / `algorithmic-art` / `mcp-builder` / `skill-creator` / `doc-coauthoring` — KD4 워크플로 비해당 → 제외

## 갱신 방법

upstream 변경 반영 시:
```bash
BASE="https://raw.githubusercontent.com/anthropics/skills/main"
# 예: pdf 스킬 SKILL.md 갱신
curl -fsSL "$BASE/skills/pdf/SKILL.md" -o .claude/skills/pdf/SKILL.md
```
또는 https://github.com/anthropics/skills 의 해당 스킬 폴더 전체를 재다운로드.
