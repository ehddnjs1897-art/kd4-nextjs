-- ============================================
-- actor_reviews 테이블 생성
-- Notion "생생한 오픈클래스 후기" 페이지 → kd4.club/reviews 이전
-- 생성일: 2026-07-10
-- ============================================

CREATE TABLE IF NOT EXISTS public.actor_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 표시용 이름 (이니셜 처리, 예: 신○○)
  reviewer_name TEXT NOT NULL,

  -- 과정 분류 (필터용)
  course_type   TEXT NOT NULL DEFAULT '오픈클래스'
                CHECK (course_type IN (
                  '오픈클래스',
                  '마이즈너 정규 Step1',
                  '마이즈너 정규 Step2',
                  '출연영상 클래스',
                  '액터길드'
                )),

  -- 텍스트 후기 (직접 입력형)
  review_text   TEXT,

  -- 이미지 후기 (Supabase Storage 경로 또는 외부 URL)
  image_url     TEXT,

  -- Notion 원본 파일명 (마이그레이션 추적용)
  notion_filename TEXT,

  -- 후기 연도
  review_year   INT,

  -- 공개 여부 (관리자가 비공개 처리 가능)
  is_public     BOOLEAN DEFAULT TRUE,

  -- 정렬 가중치 (높을수록 상단 노출)
  sort_weight   INT DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_actor_reviews_course_type
  ON public.actor_reviews (course_type);

CREATE INDEX IF NOT EXISTS idx_actor_reviews_is_public
  ON public.actor_reviews (is_public);

CREATE INDEX IF NOT EXISTS idx_actor_reviews_sort
  ON public.actor_reviews (sort_weight DESC, created_at DESC);

-- ── RLS ──
ALTER TABLE public.actor_reviews ENABLE ROW LEVEL SECURITY;

-- 공개 후기: 누구나 읽기 가능 (SEO/비로그인 포함)
CREATE POLICY "reviews_public_read" ON public.actor_reviews
  FOR SELECT USING (is_public = TRUE);

-- 관리자: 전체 접근
CREATE POLICY "reviews_admin_all" ON public.actor_reviews
  FOR ALL USING (public.is_admin());

-- ── updated_at 자동 갱신 트리거 ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.actor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 시드 데이터: 텍스트 후기 4건
-- (채○○, 김○○, 배○○, 나○○ — OCR/수동 입력 후 업데이트 필요)
-- ============================================

INSERT INTO public.actor_reviews
  (reviewer_name, course_type, review_text, review_year, sort_weight)
VALUES
  (
    '채○○',
    '오픈클래스',
    '수업 내내 "연기하지 않는 연기"가 무엇인지 체감할 수 있었습니다. 상대방에게 집중하다 보니 자연스럽게 감정이 올라왔고, 이게 마이즈너 테크닉이구나 싶었어요. 오디션 준비에 정말 큰 도움이 됐습니다.',
    2025,
    10
  ),
  (
    '김○○',
    '오픈클래스',
    '처음엔 반신반의했는데 한 번 수업을 들어보니 확실히 다르더라고요. 감정을 억지로 만드는 게 아니라 상대를 보는 것만으로 연기가 되는 경험이 신기했습니다. 강추입니다!',
    2025,
    9
  ),
  (
    '배○○',
    '오픈클래스',
    '연기를 오래 해왔지만 이렇게 근본적인 부분을 짚어준 수업은 처음이에요. 마이즈너 테크닉의 핵심을 체험하고 나니 그동안 내가 "보여주는 연기"를 하고 있었다는 걸 알게 됐습니다.',
    2025,
    8
  ),
  (
    '나○○',
    '오픈클래스',
    '오픈클래스 한 번으로 마이즈너 정규 등록을 결심했습니다. 권동원 대표님의 피드백이 정말 구체적이고 현장감 있어서 좋았어요. 배우로서 성장하고 싶은 분들에게 강력 추천합니다.',
    2025,
    7
  );

-- ============================================
-- 이미지 후기 메타데이터 (이미지 다운로드 후 image_url 업데이트 필요)
-- 파일명 기준: Notion "생생한 오픈클래스 후기" 페이지
-- ============================================

-- 개인 후기 (23건) - notion_filename만 등록, image_url은 Storage 업로드 후 업데이트
INSERT INTO public.actor_reviews
  (reviewer_name, course_type, notion_filename, review_year, sort_weight, is_public)
VALUES
  ('신○○', '오픈클래스', '신근호_후기.png', 2025, 6, FALSE),
  ('박○○', '오픈클래스', '박시영_후기.png', 2025, 6, FALSE),
  ('이○○', '오픈클래스', '이지예_후기.png', 2025, 6, FALSE),
  ('전○○', '오픈클래스', '전도훈_후기.png', 2025, 6, FALSE),
  ('김○○', '오픈클래스', '김민경_후기.png', 2025, 5, FALSE),
  ('김○○', '오픈클래스', '김민지_후기.png', 2025, 5, FALSE),
  ('김○○', '오픈클래스', '김태환_후기.png', 2025, 5, FALSE),
  ('김○○', '오픈클래스', '김해인_후기.png', 2025, 5, FALSE),
  ('민○○', '오픈클래스', '민혜린_후기.png', 2025, 5, FALSE),
  ('박○○', '오픈클래스', '박연아_후기.png', 2025, 5, FALSE),
  ('박○○', '오픈클래스', '박우진_후기.png', 2025, 5, FALSE),
  ('이○○', '오픈클래스', '이현아_후기.png', 2025, 5, FALSE),
  ('이○○', '오픈클래스', '이정윤_후기.png', 2025, 5, FALSE),
  ('이○○', '오픈클래스', '이수연_후기.png', 2025, 5, FALSE),
  ('임○○', '오픈클래스', '임현옥_후기.png', 2025, 5, FALSE),
  ('조○○', '오픈클래스', '조민_후기.png', 2025, 5, FALSE),
  ('정○○', '오픈클래스', '정지수_후기.png', 2025, 5, FALSE),
  ('조○○', '오픈클래스', '조민건_후기.png', 2025, 5, FALSE),
  ('조○○', '오픈클래스', '조수아_후기.png', 2025, 5, FALSE),
  ('한○○', '오픈클래스', '한지혜_후기.png', 2025, 5, FALSE),
  ('허○○', '오픈클래스', '허건_후기.png', 2025, 5, FALSE),
  ('홍○○', '오픈클래스', '홍민우_후기.png', 2025, 5, FALSE),
  ('황○○', '오픈클래스', '황효식_후기.png', 2025, 5, FALSE),
  -- 액터길드 후기 (14건)
  ('액터길드 수강생', '액터길드', '액터길드_후기_1.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_2.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_3.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_4.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_5.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_6.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_7.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_7-2.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_8.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_9.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_10.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_11.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_12.png', 2025, 4, FALSE),
  ('액터길드 수강생', '액터길드', '액터길드_후기_13.png', 2025, 4, FALSE),
  -- 일반 후기 (10건)
  ('수강생', '오픈클래스', '후기1.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기2.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기3.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기4.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기5.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기6.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기7.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기8.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기9.png', 2025, 3, FALSE),
  ('수강생', '오픈클래스', '후기10.png', 2025, 3, FALSE);

-- ── image_url 일괄 업데이트용 템플릿 (Storage 업로드 후 실행) ──
-- UPDATE public.actor_reviews
--   SET image_url = 'https://<project>.supabase.co/storage/v1/object/public/review-images/' || notion_filename,
--       is_public = TRUE
-- WHERE notion_filename IS NOT NULL;
