-- 배우 목록 "리더클래스 멤버 우선 노출" 플래그 (2026-07-24 대표 지시)
-- 적용: Supabase SQL Editor에 전체 붙여넣기 → Run
-- 코드는 컬럼 미존재 시 조용히 폴백하므로 순서 무관 (배포 선행 OK)
--
-- 대표가 "일단 지금은"이라고 표현한 임시 조치 — 클릭수(view_count)가 아직
-- 안 쌓인 지금 리더클래스(액터스리더 시즌3) 수강중 멤버를 배우 DB 목록
-- 최상단에 고정 노출. 클릭수가 쌓여도 이 플래그가 true인 동안은 항상 최우선.
-- 다음 기수 전환 등으로 명단이 바뀌면 이 컬럼만 UPDATE하면 됨(코드 수정 불필요).

alter table public.actors
  add column if not exists is_leader_featured boolean not null default false;

-- 2026-07 액터스리더 시즌3 수강중 12명 (노션 "🎓 KD4 수강 현황" DB 대조, 동명이인 없음)
update public.actors set is_leader_featured = true
where name in (
  '김이영', '나민정', '명승호', '민혜린', '박우진', '박정민',
  '배승헌', '설진수', '유진우', '조소영', '최지훈', '홍수민'
);
