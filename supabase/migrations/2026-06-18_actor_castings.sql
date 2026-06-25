-- ============================================
-- 2026-06-18 ACTOR_CASTINGS (멤버 오디션→캐스팅 전환 추적)
-- ============================================
-- 목적: "최근 N개월 KD4 멤버의 X%가 실제 작품에 캐스팅" 숫자를 데이터로 누적.
-- 설계서: ~/Desktop/KD4-HUB/04-ops/전략설계_캐스팅전환추적+장면메타데이터_2026-06-12.md (① 부분)
-- 대표 결정: ① 저장위치 = Supabase 새 테이블 actor_castings
--            ② 전환율 분모 = (b) 최근 6개월 수강이력 있는 활동 멤버
--
-- 건별 1행 — 같은 배우가 5번 지원하면 5행. 깔때기(지원→오디션→캐스팅)가 status로 남음.
-- 출연료/정산 칸은 일부러 뺌 (재무 SSoT = 구글시트 마스터 DB. 여기 넣으면 이중저장).
-- AI 추측 입력 금지: status·작품명·결과는 대표 채팅 명시 또는 공식 문서 파싱만. evidence 칸에 출처 필수.
--
-- 비공개 데이터(개인 커리어) — admin만 읽고 씀. 공개 마케팅엔 집계 숫자만 사용.
--
-- 멱등(idempotent): 여러 번 실행해도 안전 (IF NOT EXISTS).
-- 적용: Supabase Dashboard → SQL Editor에 전체 붙여넣고 1회 실행 (스키마 변경은 대표 손으로).
-- ============================================

CREATE TABLE IF NOT EXISTS actor_castings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,        -- 작품명 (예: "진공 층")
  project_type  TEXT,                 -- 드라마/영화/웹드라마/CF/연극/뮤지컬/기타
  role_name     TEXT,                 -- 배역명
  role_grade    TEXT,                 -- 주연/조연/단역/이미지·보조출연
  status        TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied','audition','callback','cast','not_cast','withdrawn')),
    -- applied=프로필 제출/지원, audition=오디션 봄, callback=2차,
    -- cast=캐스팅 확정 🎉, not_cast=불발, withdrawn=중도 포기
  applied_at    DATE,                 -- 지원/프로필 제출일
  result_at     DATE,                 -- 결과 확정일 (전환율 기간 집계 기준)
  source        TEXT,                 -- 경로: KD4추천/필메/직접지원/기획사/지인/기타
  evidence      TEXT,                 -- 출처 메모: "대표 채팅 입력 6/15" / "캐스팅 공문" 등
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 비공개 데이터 (개인 커리어 정보) — admin만 읽고 씀.
ALTER TABLE actor_castings ENABLE ROW LEVEL SECURITY;

-- 정책 재실행 안전화: 있으면 지우고 다시 생성 (CREATE POLICY는 IF NOT EXISTS 미지원)
DROP POLICY IF EXISTS "castings_admin_all" ON actor_castings;
CREATE POLICY "castings_admin_all" ON actor_castings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_castings_actor       ON actor_castings (actor_id);
CREATE INDEX IF NOT EXISTS idx_castings_status_date ON actor_castings (status, result_at);

-- updated_at 자동 갱신 (enrollments 등에서 쓰는 기존 함수 재사용)
DROP TRIGGER IF EXISTS actor_castings_updated_at ON actor_castings;
CREATE TRIGGER actor_castings_updated_at
  BEFORE UPDATE ON actor_castings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
