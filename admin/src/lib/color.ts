function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`
}

export interface Hsv {
  h: number
  s: number
  v: number
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6)
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ]
}

export function hexToHsv(hex: string): Hsv {
  const [r255, g255, b255] = hexToRgb(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }

  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

export function hsvToHex(h: number, s: number, v: number): string {
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
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  )
}

// getImageData/canvas são caros; reaproveitamos um único canvas e cacheamos
// os resultados para não recriar contexto a cada render (evita travar o navegador
// enquanto o seletor de cor dispara eventos ao vivo).
const hexCache = new Map<string, string>()
let sharedCtx: CanvasRenderingContext2D | null | undefined

function getSharedCtx(): CanvasRenderingContext2D | null {
  if (sharedCtx !== undefined) return sharedCtx
  if (typeof document === 'undefined') {
    sharedCtx = null
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  sharedCtx = canvas.getContext('2d', { willReadFrequently: true })
  return sharedCtx
}

export function cssToHex(color: string, fallback = '#e8a838'): string {
  if (!color) return fallback
  const trimmed = color.trim()
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase()
  if (/^#[0-9a-f]{8}$/i.test(trimmed)) return `#${trimmed.slice(1, 7).toLowerCase()}`

  const cacheKey = `${trimmed}|${fallback}`
  const cached = hexCache.get(cacheKey)
  if (cached) return cached

  const ctx = getSharedCtx()
  if (!ctx) return fallback

  // Rejeita valores que não são cores CSS válidas antes de tentar converter.
  if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('color', trimmed)) {
    hexCache.set(cacheKey, fallback)
    return fallback
  }

  // Canvas normaliza qualquer cor CSS válida (oklch, hsl, rgb, nomes...) para sRGB.
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = trimmed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const hex = rgbToHex(r, g, b)
  hexCache.set(cacheKey, hex)
  return hex
}

export function parseColorAlpha(value: string): { hex: string; opacity: number } {
  const fallback = { hex: '#e8a838', opacity: 0.28 }
  if (!value) return fallback

  let opacity = 1
  const slashMatch = value.match(/\/\s*([\d.]+%?)\s*\)/)
  if (slashMatch) {
    const raw = slashMatch[1]
    opacity = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
  } else {
    const rgbaMatch = value.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\s*\)/)
    if (rgbaMatch) opacity = parseFloat(rgbaMatch[1])
  }

  const hex = cssToHex(value, fallback.hex)
  return { hex, opacity: Number.isFinite(opacity) ? opacity : fallback.opacity }
}

export function buildGlowColor(hex: string, opacity: number): string {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
