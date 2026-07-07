-- 2026-07-08_actor_videos_vimeo.sql (멱등 — 재실행 안전)
-- 대표(권동원) 요청: 본인 프로필에 Vimeo 링크(비공개, hash 필요) 삽입.
-- 기존 actor_videos는 youtube_id(YouTube)와 r2_key(R2 업로드) 2개 소스만 지원 → Vimeo를 3번째 소스로 추가.

ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS vimeo_id   TEXT;  -- Vimeo 영상 ID (예: 1176811721)
ALTER TABLE actor_videos ADD COLUMN IF NOT EXISTS vimeo_hash TEXT;  -- 비공개/미등록 영상 재생용 private hash (예: 74eb146ae8)
