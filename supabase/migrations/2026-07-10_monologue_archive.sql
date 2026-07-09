-- ============================================
-- 독백 아카이브 (monologues 테이블 + monologue-cards 스토리지)
-- KD4_크롤러(~/Desktop/KD4_크롤러) 자동 파이프라인 산출물을 사이트에 노출
-- 생성일: 2026-07-10
-- 적용: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 → Run.
--       (DDL은 PostgREST/서비스롤키로 직접 적용 불가 — 반드시 대시보드에서 1회 수동 실행)
-- ============================================

CREATE TABLE IF NOT EXISTS public.monologues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 배역·작품 정보
  role          TEXT NOT NULL,
  work          TEXT NOT NULL,
  medium        TEXT NOT NULL
                CHECK (medium IN ('영화', 'TV드라마', '연극', '뮤지컬', '웹드라마', '광고', '연습대본')),
  genre         TEXT NOT NULL,
  target        TEXT NOT NULL,   -- "성별 / 연령대", 예: "여성 / 20대"
  emotion       TEXT NOT NULL,   -- 텍스트 진행순 감정선, 예: "슬픔 → 절망"

  -- 대사 본문
  body          TEXT NOT NULL,   -- 카드에 실린 발췌 (400자 이내)
  full_body     TEXT,            -- 원문 전체 (있으면)

  -- 출처
  source_url      TEXT,
  source_platform TEXT NOT NULL DEFAULT 'unknown'
                   CHECK (source_platform IN ('naver_blog', 'tistory', 'ysdb', 'instagram', 'unknown')),

  -- 카드 이미지 (Storage 버킷 monologue-cards)
  card_image_path TEXT,          -- 버킷 내 경로
  card_image_url  TEXT,          -- public URL 캐시 (조회 시 재계산 불필요)

  -- 등급/노출 관리
  grade         TEXT NOT NULL DEFAULT 'A' CHECK (grade IN ('S', 'A', 'B')),
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_weight   INT NOT NULL DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_monologues_grade ON public.monologues (grade);
CREATE INDEX IF NOT EXISTS idx_monologues_genre ON public.monologues (genre);
CREATE INDEX IF NOT EXISTS idx_monologues_target ON public.monologues (target);
CREATE INDEX IF NOT EXISTS idx_monologues_medium ON public.monologues (medium);
CREATE INDEX IF NOT EXISTS idx_monologues_published ON public.monologues (is_published);
CREATE INDEX IF NOT EXISTS idx_monologues_sort ON public.monologues (grade, sort_weight DESC, created_at DESC);
-- 같은 게시물 중복 삽입 방지 (source_url이 있는 것만 유니크 — NULL은 여러 개 허용)
CREATE UNIQUE INDEX IF NOT EXISTS uq_monologues_source_url
  ON public.monologues (source_url) WHERE source_url IS NOT NULL;

-- ── RLS ──
ALTER TABLE public.monologues ENABLE ROW LEVEL SECURITY;

-- 공개 항목: 누구나 읽기 가능 (SEO/비로그인 포함)
CREATE POLICY "monologues_public_read" ON public.monologues
  FOR SELECT USING (is_published = TRUE);

-- 관리자: 전체 접근 (is_admin()은 기존 함수 재사용)
CREATE POLICY "monologues_admin_all" ON public.monologues
  FOR ALL USING (public.is_admin());

-- ── updated_at 자동 갱신 (기존 set_updated_at() 함수 재사용, 없으면 생성) ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER monologues_updated_at
  BEFORE UPDATE ON public.monologues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 스토리지 버킷: monologue-cards (공개, 카드 PNG)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'monologue-cards', 'monologue-cards', TRUE, 5242880,  -- 5MB
  ARRAY['image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 공개 읽기 (카드 이미지는 비로그인 노출 대상)
DROP POLICY IF EXISTS "monologue_cards_public_read" ON storage.objects;
CREATE POLICY "monologue_cards_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'monologue-cards');

-- 업로드/삭제는 관리자만 (일반적으로 service_role 키로 서버에서만 수행 — RLS 우회되므로 아래는 방어선)
DROP POLICY IF EXISTS "monologue_cards_admin_write" ON storage.objects;
CREATE POLICY "monologue_cards_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'monologue-cards' AND public.is_admin());

DROP POLICY IF EXISTS "monologue_cards_admin_delete" ON storage.objects;
CREATE POLICY "monologue_cards_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'monologue-cards' AND public.is_admin());

-- ============================================
-- 검증
-- ============================================
-- SELECT count(*) FROM public.monologues;
-- SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'monologue-cards';
