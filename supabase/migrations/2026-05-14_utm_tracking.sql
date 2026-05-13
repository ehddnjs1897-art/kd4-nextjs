-- 2026-05-14 광고 채널별 ROI 추적을 위한 UTM 컬럼 추가
-- consultations 테이블에 광고 출처 식별 필드 도입
-- 효과: IG 부스트 A/B, Lead 캠페인, Traffic 캠페인별 진짜 신청자 분리 가능

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT;

-- 캠페인별 집계 빠르게 하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_utm_campaign
  ON consultations(utm_campaign)
  WHERE utm_campaign IS NOT NULL;

COMMENT ON COLUMN consultations.utm_source IS '광고 출처 (meta, instagram, naver, google, etc.)';
COMMENT ON COLUMN consultations.utm_medium IS '광고 매체 (paid_social, organic, email, etc.)';
COMMENT ON COLUMN consultations.utm_campaign IS '캠페인 식별자 (lead_5월, boost_A, traffic, etc.)';
COMMENT ON COLUMN consultations.utm_content IS '광고 소재 식별자 (마이즈너포스터, 출연영상, 카드뉴스1, etc.)';
COMMENT ON COLUMN consultations.utm_term IS '검색 키워드 (검색광고 시)';
COMMENT ON COLUMN consultations.referrer IS '실제 referrer URL (fallback용)';
