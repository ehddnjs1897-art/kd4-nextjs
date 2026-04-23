// KD4 인사이트 저장 — 우클릭 컨텍스트 메뉴
// API URL은 options.html에서 설정 (chrome.storage.sync)

const DEFAULT_API_URL = 'http://localhost:3000'

// ────────────────────────────────────────────────────────────────
// 설치/업데이트 시 컨텍스트 메뉴 등록
// ────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  // 페이지 우클릭 (링크 없이) — 현재 페이지 URL 저장
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'KD4 인사이트에 저장',
    contexts: ['page'],
  })

  // 선택 텍스트 있을 때 — 텍스트를 메모로 저장
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'KD4 인사이트에 저장 (선택 텍스트 포함)',
    contexts: ['selection'],
  })

  // 링크 우클릭 — 해당 링크 저장
  chrome.contextMenus.create({
    id: 'save-link',
    title: 'KD4 인사이트에 이 링크 저장',
    contexts: ['link'],
  })
})

// ────────────────────────────────────────────────────────────────
// 메뉴 클릭 처리
// ────────────────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL })
    const base = apiUrl.replace(/\/$/, '')

    let url = ''
    let memo = ''

    if (info.menuItemId === 'save-link' && info.linkUrl) {
      url = info.linkUrl
      memo = info.selectionText ?? ''
    } else if (info.menuItemId === 'save-selection') {
      url = tab?.url ?? info.pageUrl ?? ''
      memo = (info.selectionText ?? '').slice(0, 500)
    } else {
      url = tab?.url ?? info.pageUrl ?? ''
    }

    if (!url || !url.startsWith('http')) {
      notify('저장 실패', '유효한 URL이 없습니다.')
      return
    }

    notify('저장 중...', url.slice(0, 80))

    const res = await fetch(`${base}/api/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, memo: memo || undefined }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      notify('저장 실패', err.error ?? `서버 오류 (${res.status})`)
      return
    }

    const data = await res.json()
    notify(
      `저장됨 · ${data.category ?? '기타'}`,
      data.title?.slice(0, 80) ?? url.slice(0, 80)
    )
  } catch (e) {
    notify('저장 실패', String(e?.message ?? e))
  }
})

// ────────────────────────────────────────────────────────────────
// 알림 헬퍼
// ────────────────────────────────────────────────────────────────
function notify(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title,
    message: message || '',
  })
}

// ────────────────────────────────────────────────────────────────
// 툴바 버튼 클릭 → 옵션 페이지 열기
// ────────────────────────────────────────────────────────────────
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})
