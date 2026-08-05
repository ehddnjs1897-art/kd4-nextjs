import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * 공개 데이터 읽기 전용 서버 클라이언트 — anon 키 + RLS.
 *
 * 2026-08-05 service_role 키 무효화 사고: 공개 아카이브(독백 691편)·사이트맵까지
 * 전부 admin 클라이언트를 쓰고 있어 키 하나가 죽자 공개 페이지가 통째로 빈 화면이 됐다.
 * 공개 노출분(is_published/is_public) 읽기는 RLS가 이미 지켜주므로 anon이면 충분하고,
 * 키 사고·유출 시에도 공개 영역은 살아남는다. 쓰기·비공개 조회는 계속 admin 사용.
 */
export const supabasePublic = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  { auth: { persistSession: false, autoRefreshToken: false } }
)
