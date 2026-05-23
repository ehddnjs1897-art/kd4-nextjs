'use client'

/**
 * 라우트 변경 시 스크린리더에 페이지 제목 알림
 * Next.js App Router는 <title>을 업데이트하지만 screen reader에 자동 announce 안 함.
 * usePathname() 변경 감지 → 100ms 후 document.title을 aria-live 영역에 주입.
 * (100ms 지연: Next.js metadata 적용 후 title이 확정되는 시점 보장)
 */
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function RouteAnnouncer() {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.textContent = document.title || pathname
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      ref={ref}
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
    />
  )
}
