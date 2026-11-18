'use client'

import { analytics } from '@/lib/analytics'
import type { InstantKey } from '@/lib/join-instant'
import { openConsult } from '@/lib/consult-instant'

/**
 * 페이지 중간 버튼에서 「바로 상담」 창을 여는 링크 (2026-11-18)
 * 예: 출연영상 구역의 «출연영상 클래스 상담 신청» → 출연영상 상담창이 바로 열린다 (클래스를 다시 묻지 않음).
 * 화면이 덜 켜진 순간에 눌리면 href(클래스 선택 구역)로 이동한다.
 */
export default function ConsultOpenLink({
  classKey,
  location,
  label,
  href = '#form-hero',
  children,
  ...rest
}: {
  classKey: InstantKey
  /** 전환 측정용 위치 이름 */
  location: string
  /** 버튼 클릭 측정용 이름 */
  label: string
  href?: string
  children: React.ReactNode
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>) {
  return (
    <a
      href={href}
      aria-haspopup="dialog"
      onClick={(e) => {
        analytics.ctaClick(location, label) // 버튼 클릭은 클릭으로만 센다 (신청 완료 아님)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        openConsult(classKey, location)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
