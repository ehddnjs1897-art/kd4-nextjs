/**
 * 레피티션 감정 어휘표 공유용 이미지 렌더 (1080×2340 PNG)
 *
 *   npx tsx scripts/render-repetition-words.ts
 *
 * - 데이터는 lib/repetition-emotion-words.ts 단일 출처 (페이지와 동일)
 * - KoPub woff2 를 base64 로 임베드한 자가완결 HTML → 헤드리스 Chrome 스크린샷
 * - 산출: public/guides/repetition-emotion-words.png (REPETITION_IMAGE_PATH)
 * - 어휘를 고치면 lib 만 수정하고 이 스크립트를 다시 돌린다.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { EMOTION_GROUPS, REPETITION_IMAGE_PATH, USAGE_TIPS } from '../lib/repetition-emotion-words'

const ROOT = process.cwd()
const W = 1080
const H = 2340
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

function font(file: string) {
  return readFileSync(path.join(ROOT, 'public/fonts', file)).toString('base64')
}

const NAVY = '#15488A'
const BG = '#F0F0E8'
const BG2 = '#E8E8DF'
const BORDER = '#D2D2C8'

function chip(i: number, n: number, word: string) {
  const t = n <= 1 ? 1 : i / (n - 1)
  const alpha = 0.07 + t * 0.85
  const dark = alpha > 0.45
  return `<span class="chip" style="background:rgba(21,72,138,${alpha.toFixed(2)});color:${dark ? '#fff' : NAVY};font-weight:${dark ? 700 : 500}">${word}</span>`
}

const cards = EMOTION_GROUPS.map(
  (g) => `
  <article class="card">
    <header><span class="no">${String(g.no).padStart(2, '0')}</span><h3>${g.title}</h3></header>
    <div class="scale">${g.scale.map((w, i) => chip(i, g.scale.length, w)).join('')}</div>
    <div class="cues">${g.cues.map((c) => `<p>“${c}”</p>`).join('')}</div>
  </article>`,
).join('')

const tips = USAGE_TIPS.map((t, i) => `<li><b>0${i + 1}</b><span>${t.head}</span></li>`).join('')

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
@font-face{font-family:'KoPubBatang';font-weight:700;src:url(data:font/woff2;base64,${font('KoPubWorldBatang-Bold.woff2')}) format('woff2')}
@font-face{font-family:'KoPubBatang';font-weight:500;src:url(data:font/woff2;base64,${font('KoPubWorldBatang-Medium.woff2')}) format('woff2')}
@font-face{font-family:'KoPubDotum';font-weight:700;src:url(data:font/woff2;base64,${font('KoPubWorldDotum-Bold.woff2')}) format('woff2')}
@font-face{font-family:'KoPubDotum';font-weight:500;src:url(data:font/woff2;base64,${font('KoPubWorldDotum-Medium.woff2')}) format('woff2')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${BG}}
body{font-family:'KoPubDotum','Apple SD Gothic Neo',sans-serif;color:#111;display:flex;flex-direction:column}
.hero{background:${NAVY};color:#fff;padding:52px 64px 42px}
.eyebrow{font-size:22px;letter-spacing:.18em;color:rgba(255,255,255,.78);margin-bottom:14px;font-weight:700}
h1{font-family:'KoPubBatang','AppleMyungjo',serif;font-size:64px;font-weight:700;line-height:1.2;margin-bottom:18px}
.lead{font-size:27px;line-height:1.55;color:rgba(255,255,255,.9);font-weight:500;word-break:keep-all}
.lead b{color:#fff;font-weight:700}
.tips{display:flex;gap:10px;padding:22px 64px;background:${BG2};border-bottom:1px solid ${BORDER};list-style:none}
.tips li{flex:1;display:flex;align-items:center;gap:8px;font-size:22px;font-weight:700;color:${NAVY};line-height:1.3;word-break:keep-all}
.tips li b{font-size:18px;letter-spacing:.08em;opacity:.6;flex-shrink:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:26px 64px 0;flex:1;align-content:start}
.card{background:#fff;border:1.5px solid ${BORDER};border-radius:18px;padding:20px 22px 18px;display:flex;flex-direction:column;gap:12px}
.card header{display:flex;align-items:baseline;gap:10px}
.no{font-size:19px;letter-spacing:.1em;color:${NAVY};font-weight:700}
h3{font-family:'KoPubBatang','AppleMyungjo',serif;font-size:29px;font-weight:700}
.scale{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-block;padding:6px 13px;border-radius:999px;font-size:23px;line-height:1.35;white-space:nowrap}
.cues{border-top:1.5px dashed ${BORDER};padding-top:10px;display:flex;flex-direction:column;gap:3px}
.cues p{font-family:'KoPubBatang','AppleMyungjo',serif;font-size:24px;font-weight:500;color:#222;line-height:1.4}
.cues p::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:${NAVY};opacity:.55;margin:0 10px 5px 2px}
.foot{display:flex;justify-content:space-between;align-items:center;padding:22px 64px 30px;font-size:22px;color:#6B6660;font-weight:500}
.foot b{color:${NAVY};font-weight:700;letter-spacing:.04em}
.legend{display:flex;align-items:center;gap:8px}
.legend i{display:inline-block;width:46px;height:12px;border-radius:6px;background:linear-gradient(90deg,rgba(21,72,138,.1),rgba(21,72,138,.92))}
</style></head><body>
<section class="hero">
  <p class="eyebrow">KD4 ACTING STUDIO · 마이즈너 테크닉</p>
  <h1>레피티션 감정 어휘 정리</h1>
  <p class="lead">레피티션은 상대에게서 <b>본 것</b>을 그대로 말하는 것입니다.<br>“너 지금 ○○하네” / “○○해 보이네” 형태로 사용해 주세요.</p>
</section>
<ul class="tips">${tips}</ul>
<div class="grid">${cards}</div>
<footer class="foot">
  <span class="legend">왼쪽 약함 <i></i> 오른쪽 강함 · 감정 이름보다 몸에서 본 것을 먼저</span>
  <b>kd4.club/meisner-technique</b>
</footer>
</body></html>`

const outDir = path.join(tmpdir(), 'kd4-repwords-render')
mkdirSync(outDir, { recursive: true })
const htmlPath = path.join(outDir, 'card.html')
writeFileSync(htmlPath, html)

const pngPath = path.join(ROOT, 'public', REPETITION_IMAGE_PATH)
mkdirSync(path.dirname(pngPath), { recursive: true })
execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${W},${H}`,
  '--virtual-time-budget=5000',
  `--screenshot=${pngPath}`,
  `file://${htmlPath}`,
], { stdio: 'ignore' })
console.log('rendered →', pngPath)
