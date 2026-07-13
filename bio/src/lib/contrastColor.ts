import { parseColor, relativeLuminance } from './colorEngine'

export interface PrimarySurfaceColors {
  /** Gradiente solid — início (mais claro) */
  solidFrom: string
  /** Gradiente solid — fim (mais escuro) */
  solidTo: string
  /** Fill único para pill e similares */
  fillPrimary: string
}

function resolveLightness(color: string): number {
  const parsed = parseColor(color)
  if (parsed) return relativeLuminance(parsed)
  // oklch / tokens: fallback conservador (não clareia demais)
  const oklch = color.trim().match(/oklch\(\s*([\d.]+%?)/i)
  if (oklch) {
    const raw = oklch[1]
    return raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
  }
  return 0.35
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
