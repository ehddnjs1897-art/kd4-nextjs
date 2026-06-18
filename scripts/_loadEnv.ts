/**
 * .env.local 견고 로더 (shell `source`의 개행 오염 회피)
 * - 각 값 trim + 따옴표 제거 → supabase-js가 키를 거부하지 않게.
 * 스크립트 최상단에서 `import './_loadEnv'` (다른 import보다 먼저).
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    // .env.local 오염 방어: 값 끝에 잘못 박힌 literal 이스케이프(\n, \r, \t) 제거
    v = v.replace(/(\\[rnt])+$/g, '').trim()
    if (process.env[m[1]] === undefined) process.env[m[1]] = v
  }
} catch {
  // .env.local 없으면 무시 — 실제 환경변수 사용
}
