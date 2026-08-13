import { buildGlowColor } from './color'

interface Rgb {
  r: number
  g: number
  b: number
}

export interface ExtractedPalette {
  primary: string
  secondary: string
  glow: string
  swatch: string
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`
}

function relLuminance({ r, g, b }: Rgb): number {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function rgbToHsv({ r, g, b }: Rgb): { h: number; s: number; v: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToRgb(h: number, s: number, v: number): Rgb {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g] = [c, x]
  else if (h < 120) [r, g] = [x, c]
  else if (h < 180) [g, b] = [c, x]
  else if (h < 240) [g, b] = [x, c]
  else if (h < 300) [r, b] = [x, c]
  else [r, b] = [c, x]
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    img.src = src
  })
}

function ensureContrast(accent: Rgb, bg: Rgb): Rgb {
  const bgL = relLuminance(bg)
  const accentL = relLuminance(accent)
  const gap = Math.abs(bgL - accentL)

  if (gap >= 0.28) return accent

  const accentHsv = rgbToHsv(accent)
  const bgHsv = rgbToHsv(bg)
  const hue = accentHsv.s > 0.12 ? accentHsv.h : bgHsv.h
  const sat = Math.max(accentHsv.s, bgHsv.s, 0.45)

  if (bgL > 0.42) {
    return hsvToRgb(hue, Math.min(0.85, sat + 0.2), 0.38)
  }
  return hsvToRgb(hue, Math.min(0.9, sat + 0.1), 0.78)
}

/** Extrai cores com bom contraste a partir de uma imagem de fundo. */
export async function extractPaletteFromImage(imageUrl: string): Promise<ExtractedPalette> {
  const img = await loadImage(imageUrl)
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas indisponível')

  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  let sumR = 0
  let sumG = 0
  let sumB = 0
  let count = 0

  const hueBuckets = new Map<
    number,
    { r: number; g: number; b: number; weight: number; sat: number }
  >()

  for (let i = 0; i < data.length; i += 4) {
    const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
    const alpha = data[i + 3]
    if (alpha < 40) continue

    sumR += pixel.r
    sumG += pixel.g
    sumB += pixel.b
    count++

    const { h, s, v } = rgbToHsv(pixel)
    if (s < 0.18 || v < 0.12 || v > 0.95) continue

    const bucket = Math.round(h / 24) * 24
    const prev = hueBuckets.get(bucket) ?? { r: 0, g: 0, b: 0, weight: 0, sat: 0 }
    const weight = s * s
    prev.r += pixel.r * weight
    prev.g += pixel.g * weight
    prev.b += pixel.b * weight
    prev.weight += weight
    prev.sat = Math.max(prev.sat, s)
    hueBuckets.set(bucket, prev)
  }

  const avgBg: Rgb = count
    ? { r: sumR / count, g: sumG / count, b: sumB / count }
    : { r: 40, g: 35, b: 30 }

  let accent: Rgb | undefined
  let bestScore = 0

  for (const bucket of hueBuckets.values()) {
    if (bucket.weight <= 0) continue
    const candidate: Rgb = {
      r: bucket.r / bucket.weight,
      g: bucket.g / bucket.weight,
      b: bucket.b / bucket.weight,
    }
    const score = bucket.weight * (0.5 + bucket.sat)
    if (score > bestScore) {
      bestScore = score
      accent = candidate
    }
  }

  if (!accent) {
    const bgHsv = rgbToHsv(avgBg)
    accent = hsvToRgb((bgHsv.h + 180) % 360, 0.72, bgHsv.v > 0.5 ? 0.42 : 0.78)
  }

  const primaryRgb = ensureContrast(accent, avgBg)
  const primaryHsv = rgbToHsv(primaryRgb)
  const secondaryRgb = hsvToRgb(
    primaryHsv.h,
    Math.max(0.25, primaryHsv.s * 0.55),
    Math.min(0.88, primaryHsv.v + 0.12),
  )

  const primary = rgbToHex(primaryRgb)
  const secondary = rgbToHex(secondaryRgb)
  const glow = buildGlowColor(primary, 0.32)

  return {
    primary,
    secondary,
    glow,
    swatch: `linear-gradient(135deg, ${primary}, ${secondary})`,
  }
}
