export interface PrimarySurfaceColors {
  /** Gradiente solid — início (mais claro) */
  solidFrom: string
  /** Gradiente solid — fim (mais escuro) */
  solidTo: string
  /** Fill único para pill e similares */
  fillPrimary: string
}

function parseOklchLightness(color: string): number | null {
  const match = color.trim().match(/oklch\(\s*([\d.]+%?)/i)
  if (!match) return null
  const raw = match[1]
  return raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
}

function estimateRelativeLuminance(color: string): number {
  const trimmed = color.trim()
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const linear = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }
  return 0.35
}

function resolveLightness(color: string): number {
  return parseOklchLightness(color) ?? estimateRelativeLuminance(color)
}

/**
 * Ajusta superfícies preenchidas com a primária para manter texto branco legível
 * sem inverter para preto — escurece o gradiente quando a primária é clara.
 */
export function resolvePrimarySurfaceColors(primary: string): PrimarySurfaceColors {
  const lightness = resolveLightness(primary)

  if (lightness > 0.66) {
    return {
      solidFrom: `color-mix(in oklch, ${primary} 70%, black)`,
      solidTo: `color-mix(in oklch, ${primary} 40%, black)`,
      fillPrimary: `color-mix(in oklch, ${primary} 62%, black)`,
    }
  }

  if (lightness > 0.58) {
    return {
      solidFrom: `color-mix(in oklch, ${primary} 80%, black)`,
      solidTo: `color-mix(in oklch, ${primary} 55%, black)`,
      fillPrimary: `color-mix(in oklch, ${primary} 72%, black)`,
    }
  }

  return {
    solidFrom: `color-mix(in oklch, ${primary} 92%, white)`,
    solidTo: `color-mix(in oklch, ${primary} 78%, black)`,
    fillPrimary: primary,
  }
}
