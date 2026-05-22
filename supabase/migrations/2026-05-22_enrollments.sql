-- ============================================
-- 2026-05-22 ENROLLMENTS (월별 수강 기록)
-- ============================================
-- "매월 수강" 시스템. 자동결제 없음 — 배우가 매달 "이어서 수강하기" 클릭으로 확정.
-- 한 배우가 같은 달에 여러 클래스 수강 가능(다중 row).
-- 결제는 관리자 수동 체크. 미래 자동결제(PG)는 payment_* 컬럼으로 자리 비워둠.
-- 기존 applications 테이블(단순 1회 상담/신청)과 별도 — 역할 분리.

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결 (로그인 계정 기준, 배우 DB 있으면 함께 매핑)
  user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES actors(id)     ON DELETE SET NULL,

  -- 신청 당시 스냅샷 (계정 정보가 나중에 바뀌어도 기록 보존)
  name  TEXT,
  phone TEXT,
  email TEXT,

  -- 신청 유형 (구글폼 분기 대체)
  enrollment_type TEXT NOT NULL DEFAULT '기존 KD4 멤버'
    CHECK (enrollment_type IN ('신규 등록', '기존 KD4 멤버', '브랜딩 서비스')),

  -- 수강 정보
  class_name TEXT NOT NULL,            -- lib/classes.ts 클래스명 그대로
  year_month TEXT NOT NULL,            -- 'YYYY-MM' (수강 월)
  amount     INT  NOT NULL DEFAULT 0,  -- 수강료 스냅샷 (classes.ts 가격)

  -- 수강 상태 / 결제 상태 (분리 — 둘은 독립적으로 변함)
  status         TEXT NOT NULL DEFAULT '확정'
    CHECK (status IN ('확정', '휴강', '취소')),
  payment_status TEXT NOT NULL DEFAULT '결제대기'
    CHECK (payment_status IN ('결제대기', '결제완료')),

  -- 미래 자동결제(PG) 확장 자리 — 지금은 비워둠
  payment_method TEXT,                 -- 'manual' | 'transfer' | 'card' (추후)
  paid_at        TIMESTAMPTZ,

  memo       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 계정이 같은 달 같은 클래스 중복 신청 방지
  UNIQUE (user_id, class_name, year_month)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user  ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_month ON enrollments(year_month);
CREATE INDEX IF NOT EXISTS idx_enrollments_actor ON enrollments(actor_id);

-- updated_at 자동 갱신 (기존 함수 재사용)
CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- 본인 기록만 조회 (관리자는 전체)
CREATE POLICY "enrollments_own_read" ON enrollments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 로그인 사용자는 본인 명의로만 신청(INSERT)
CREATE POLICY "enrollments_own_insert" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인은 본인 것 수정(휴강/취소), 관리자는 전체(결제완료 체크 등)
CREATE POLICY "enrollments_own_update" ON enrollments
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
