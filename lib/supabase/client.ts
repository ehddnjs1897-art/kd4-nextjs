import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // .trim() — env 값에 끝 개행(\n)/공백이 섞여도 방어 (2026-06-08 OAuth 사고).
  // ANON 키가 헤더로 전송될 때 개행이 있으면 요청이 깨질 수 있어 사전 정리.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.')
  }
  return createBrowserClient(url, key)
}
