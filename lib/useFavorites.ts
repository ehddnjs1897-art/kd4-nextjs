'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'kd4_shortlist'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  // 마운트 시 localStorage에서 복원
  // localStorage는 SSR에서 읽을 수 없는 외부 시스템 → 마운트 후 1회 복원이 hydration-safe한 유일한 방법
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((v): v is string => typeof v === 'string'))
        }
      }
    } catch {
      // localStorage 접근 불가 환경 (SSR 등) — 무시
    }
    setLoaded(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // favorites 변경 시 localStorage 동기화
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // 저장 실패 무시 (시크릿 모드 용량 초과 등)
    }
  }, [favorites, loaded])

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  )

  const addFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((v) => v !== id))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }, [])

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  return {
    favorites,
    loaded,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
  }
}
