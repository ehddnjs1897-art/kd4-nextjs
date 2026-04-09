'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} style={styles.btn}>
      로그아웃
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    width: '100%',
    padding: '10px 0',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--gray)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.2s, color 0.2s',
  },
}
