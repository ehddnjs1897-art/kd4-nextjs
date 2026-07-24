-- 배우 클릭수(조회수) 집계 — 목록 "클릭수 많은 순" 정렬용 (2026-07-24 대표 지시)
-- 적용: Supabase SQL Editor에 전체 붙여넣기 → Run
-- 코드는 컬럼/함수 미존재 시 조용히 폴백하므로 순서 무관 (배포 선행 OK)

alter table public.actors
  add column if not exists view_count integer not null default 0;

create index if not exists actors_view_count_idx
  on public.actors (view_count desc);

-- 원자적 +1 (PostgREST는 update set col=col+1 표현식 미지원 → RPC 필요)
create or replace function public.increment_actor_view(aid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.actors set view_count = view_count + 1 where id = aid;
$$;

-- 서버(service_role) 전용 — 클라이언트 남용 방지
revoke execute on function public.increment_actor_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_actor_view(uuid) to service_role;
