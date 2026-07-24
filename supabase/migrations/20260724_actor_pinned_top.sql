-- 배우 목록 "항상 최상단 고정" 플래그 (2026-07-24 대표 지시 "권동원을 맨 앞으로 둬")
-- 적용: Supabase SQL Editor에 전체 붙여넣기 → Run
-- 코드는 컬럼 미존재 시 조용히 폴백하므로 순서 무관 (배포 선행 OK)
--
-- is_leader_featured(리더클래스 멤버)보다도 위에 오는 최우선 계층.
-- 컬럼명을 '대표'로 하드코딩하지 않고 범용 플래그로 설계 — 향후 다른 인원을
-- 상단 고정하고 싶으면 이 컬럼만 UPDATE하면 됨(코드 수정 불필요).

alter table public.actors
  add column if not exists is_pinned_top boolean not null default false;

update public.actors set is_pinned_top = true where name = '권동원';
