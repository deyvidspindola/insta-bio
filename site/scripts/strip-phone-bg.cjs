/**
 * Remove o fundo escuro ao redor do mockup de celular, gerando PNG com alpha.
 * Uso: node scripts/strip-phone-bg.cjs <entrada> <saida>
 * Requer `sharp` instalado (npm install --no-save sharp).
 */
const sharp = require('sharp')

const THRESHOLD = 55
const FRINGE_THRESHOLD = 70

async function stripPhoneBackground(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const width = info.width
  const height = info.height
  const channels = 4
  const visited = new Uint8Array(width * height)
  const queue = []

  const idx = (x, y) => y * width + x
  const isBackground = (i) => {
    const o = i * channels
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const max = Math.max(r, g, b)
    return max <= THRESHOLD && max - Math.min(r, g, b) <= 25
  }
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const i = idx(x, y)
    if (visited[i] || !isBackground(i)) return
    visited[i] = 1
    queue.push(i)
  }

  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }

  while (queue.length) {
    const i = queue.pop()
    data[i * channels + 3] = 0
    const x = i % width
    const y = (i / width) | 0
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }

  // Duas passadas removem a borda escura residual em volta da moldura.
  for (let pass = 0; pass < 2; pass++) {
    const toClear = []
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = idx(x, y)
        if (data[i * channels + 3] === 0) continue
        const o = i * channels
        if (Math.max(data[o], data[o + 1], data[o + 2]) > FRINGE_THRESHOLD) continue
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (data[idx(x + dx, y + dy) * channels + 3] === 0) {
            toClear.push(i)
            break
          }
        }
      }
    }
    for (const i of toClear) data[i * channels + 3] = 0
  }

  const raw = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer()
  const trimmed = await sharp(raw).trim({ threshold: 5 }).png().toBuffer()
  await sharp(trimmed).toFile(output)

  const meta = await sharp(output).metadata()
  console.log(`${output} → ${meta.width}x${meta.height} (alpha: ${meta.hasAlpha})`)
}

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error('Uso: node scripts/strip-phone-bg.cjs <entrada> <saida>')
  process.exit(1)
}

stripPhoneBackground(input, output).catch((error) => {
  console.error(error)
  process.exit(1)
})
