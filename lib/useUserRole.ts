'use client'

import { useState, useEffect } from 'react'

/**
 * 클라이언트에서 로그인 사용자의 role을 가져온다.
 * 숏리스트(캐스팅 디렉터 전용 기능) 노출 제어 등에 사용.
 * Navbar와 동일하게 Supabase 클라이언트를 동적 로드(초기 번들에서 제외).
 */
export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        if (!user) { setRole(null); setLoaded(true); return }
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (cancelled) return
        setRole((data?.role as string | null) ?? null)
        setLoaded(true)
      } catch {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // 캐스팅 디렉터 전용 기능 게이트 — 연락처 열람과 동일 기준(director/admin)
  const isDirector = role === 'director' || role === 'admin'
  return { role, loaded, isDirector }
}
