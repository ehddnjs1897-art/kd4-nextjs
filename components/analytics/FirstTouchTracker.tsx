'use client'

import { useEffect } from 'react'

/**
 * 최초 유입 보존 트래커 (2026-08-04 신설)
 *
 * 문제: 상담 폼(JoinForm)·외부 CTA(JoinCTALink)는 제출 시점의 document.referrer를
 * 보내는데, 검색으로 /monologues 등 다른 페이지에 착지한 뒤 내부 이동으로 폼에
 * 도달하면 referrer가 내부 주소로 바뀌어 "네이버에서 왔다"가 유실됐다.
 *
 * 해결: 세션 최초 페이지 로드에서 UTM·외부 referrer·착지 경로를 sessionStorage
 * (kd4_utm — JoinForm/JoinCTALink가 이미 읽는 키)에 보존한다.
 * - URL에 UTM이 있으면(광고 클릭) 항상 갱신 — 마지막 광고 클릭 우선(기존 JoinForm 동작과 동일)
 * - 없으면 첫 접점만 기록하고 이후 페이지 이동에는 손대지 않는다
 */
const UTM_STORAGE_KEY = 'kd4_utm'

export default function FirstTouchTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const fromURL = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        utm_term: params.get('utm_term'),
      }
      const hasURLUTM = Object.values(fromURL).some(Boolean)
      if (!hasURLUTM && sessionStorage.getItem(UTM_STORAGE_KEY)) return

      const ref = document.referrer || ''
      const isExternalRef = ref !== '' && !ref.includes(window.location.host)
      sessionStorage.setItem(
        UTM_STORAGE_KEY,
        JSON.stringify({
          ...fromURL,
          referrer: isExternalRef ? ref.slice(0, 500) : null,
          landing: (window.location.pathname + window.location.search).slice(0, 300),
        })
      )
    } catch {
      // 시크릿 모드 등 sessionStorage 접근 불가 — 추적 없이 조용히 통과
    }
  }, [])

  return null
}
