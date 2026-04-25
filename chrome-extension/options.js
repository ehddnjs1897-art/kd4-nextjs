const DEFAULT_API_URL = 'http://localhost:3000'

const $apiUrl = document.getElementById('apiUrl')
const $save = document.getElementById('save')
const $status = document.getElementById('status')

// 기존 값 로드
chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL }, ({ apiUrl }) => {
  $apiUrl.value = apiUrl
})

$save.addEventListener('click', () => {
  const value = ($apiUrl.value || '').trim().replace(/\/$/, '')
  if (!value || !value.startsWith('http')) {
    $status.textContent = 'URL은 http 또는 https로 시작해야 합니다.'
    $status.style.color = '#f44336'
    return
  }
  chrome.storage.sync.set({ apiUrl: value }, () => {
    $status.textContent = '저장됨 ✓'
    $status.style.color = '#4caf50'
    setTimeout(() => ($status.textContent = ''), 2000)
  })
})
