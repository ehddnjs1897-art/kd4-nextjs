import sharp from 'sharp'

const hub = '/Users/dongdongy/Desktop/KD4-HUB/06-brand/kd4-logo-lockups'
const out = '/Users/dongdongy/Desktop/kd4-nextjs/public/partners'

const meta = await sharp(`${hub}/kd4-v3-stamp-light.png`).metadata()
const { width, height } = meta
const size = Math.min(width, height)
const left = Math.floor((width - size) / 2)
const top = Math.floor((height - size) / 2)

await sharp(`${hub}/kd4-v3-stamp-light.png`)
  .extract({ left, top, width: size, height: size })
  .resize(352)
  .webp({ quality: 90 })
  .toFile(`${out}/kd4-logo-stamp.webp`)

console.log(`kd4-v3-stamp-light: ${width}×${height} → center crop ${size}×${size} → 352×352 webp`)
