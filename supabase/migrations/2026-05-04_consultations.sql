-- ============================================
-- consultations: kd4.club 상담 접수 (/join, /contact 등)
-- 누락 방지를 위한 1차 영속 저장소
-- /api/notify 라우트가 webhook·SMS 시도 전에 무조건 INSERT
-- ============================================

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  class_name TEXT,
  source TEXT,
  inquiry_type TEXT,
  motivation TEXT,
  status TEXT DEFAULT '대기',
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_created_at
  ON consultations(created_at DESC);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회·수정 가능 (서비스 롤은 RLS 우회)
CREATE POLICY "consultations_admin_all" ON consultations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
