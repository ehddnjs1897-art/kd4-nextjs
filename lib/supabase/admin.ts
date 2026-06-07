/**
 * Service Role 클라이언트 — RLS를 우회하므로 절대 클라이언트(브라우저)에 노출 금지.
 * 서버 컴포넌트, API Route, Server Action 전용.
 */
import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    // .trim() — env 값 끝 개행/공백 방어 (2026-06-08 OAuth 사고)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    if (!url || !key) throw new Error('Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not set')
    _admin = createClient(
      url,
      key,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
  }
  return _admin
}

// 하위 호환 alias (기존 import 유지) — Reflect.get으로 타입 안전하게 위임
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver)
  },
})
