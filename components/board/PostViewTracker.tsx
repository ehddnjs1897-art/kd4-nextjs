'use client'

/**
 * 게시글 조회수 클라이언트 추적 컴포넌트
 * - sessionStorage 키로 중복 제거 (새로고침, 봇, SSR 렌더 제외)
 * - 마운트 시 1회만 서버 전송 → UI에 표시되지 않는 null 컴포넌트
 */
import { useEffect } from 'react'

export default function PostViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `vp_${postId}`
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return
    try { sessionStorage.setItem(key, '1') } catch { /* 시크릿 모드 등 무시 */ }
    fetch(`/api/posts/${postId}/view`, { method: 'POST' }).catch(() => {})
  }, [postId])

  return null
}
