-- 배우 소속사(에이전시) 칸 — 2026-10-07 대표 «소속사는 넣어»
-- Supabase 대시보드 → SQL Editor에 이 파일 전체를 붙여넣고 Run (여러 번 실행해도 안전)
alter table public.actors add column if not exists agency text;
comment on column public.actors.agency is '소속사(에이전시). 배우 상세 페이지 이름 아래 «소속 …»으로 표시, 비어 있으면 숨김';

-- 유청수: 소속사 공개 명단(800casting.com AgencyID 71)에 «CHUNGSOO YOU (836912)»로 등재 확인
update public.actors
   set agency = 'Carolyn''s Model & Talent Agency (캐나다 토론토)'
 where id = 'a7c31a02-0400-4d26-9268-2625acd2b368';

notify pgrst, 'reload schema';
