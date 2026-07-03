-- 2026-07-03_actor_videos_scene_metadata.sql (멱등 — 재실행 안전)
-- 승인: 전략설계_캐스팅전환추적+장면메타데이터_2026-06-12.md §3 "1번 고" (6/12 대표 승인)

-- 모닝 문서 7번 흡수: SEO uploadDate 복구용
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 장면 메타데이터 (신규)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS shot_date      DATE;    -- 촬영일 (납품일과 구분)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS genre          TEXT;    -- 드라마/스릴러/코미디/멜로/액션/일상…
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS character_type TEXT;    -- 형사/회사원/엄마/악역… (actors.casting_tags와 같은 어휘 사용)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS character_name TEXT;    -- 배역명 (있으면)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS scene_tags     TEXT[];  -- 장면 키워드 (취조/오열/일상대화/몸싸움…)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS production_source TEXT; -- '찍어주다'/'멤버 업로드'/'외부 작품'
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS meta_evidence  TEXT;    -- 메타 출처 (대표 입력일/납품 기록) — AI 추측 금지 증빙

-- 캐릭터 타입·장면 태그 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_actor_videos_scene_tags ON actor_videos USING GIN (scene_tags);
CREATE INDEX IF NOT EXISTS idx_actor_videos_char_type  ON actor_videos (character_type);
