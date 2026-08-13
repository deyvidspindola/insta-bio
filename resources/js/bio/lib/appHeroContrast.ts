// bio/src/lib/appHeroContrast.ts
//
// Contraste adaptativo para os cards de destaque (AppHeroCard).
// Parsing/luminância/fundo efetivo vêm de colorEngine.ts.

import type { AppHeroTheme } from './appHeroPresets'
import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  compositeOver,
  extractColorTokens,
  extractGradientColors,
  clamp01,
  type Rgb,
} from './colorEngine'

export {
  resolveEffectiveBioBackground,
  type BioBackgroundInput,
} from './colorEngine'

export interface ResolvedAppHeroTheme extends AppHeroTheme {
  /** Cor do título — substitui a classe fixa `text-white` no JSX. */
  titleText: string
  /** Cor da descrição — substitui a classe fixa `text-white/85` no JSX. */
  bodyText: string
}

/**
 * Resolve RGB opaco do fundo da página. Aceita cor sólida ou gradiente
 * (média dos stops) — evita cair no fallback preto quando BioPage passa
 * o `gradient` de um backgroundPreset.
 */
function resolvePageRgb(pageBackground: string): Rgb {
  const direct = parseColor(pageBackground)
  if (direct) return { r: direct.r, g: direct.g, b: direct.b, a: 1 }

  const stops = extractGradientColors(pageBackground)
  if (stops.length === 0) return { r: 10, g: 10, b: 10, a: 1 }

  return {
    r: stops.reduce((sum, c) => sum + c.r, 0) / stops.length,
    g: stops.reduce((sum, c) => sum + c.g, 0) / stops.length,
    b: stops.reduce((sum, c) => sum + c.b, 0) / stops.length,
    a: 1,
  }
}

/**
 * Luminância do painel do card: usa o stop MAIS CLARO do gradient composto
 * sobre o fundo (pior caso para texto branco).
 */
function estimatePanelFromGradient(
  gradient: string | undefined,
  pageRgb: Rgb,
): { luminance: number; sample: Rgb } {
  const stops = extractGradientColors(gradient)
  if (stops.length === 0) {
    return { luminance: relativeLuminance(pageRgb), sample: pageRgb }
  }

  let maxLum = -1
  let maxSample = pageRgb
  for (const stop of stops) {
    const composed = compositeOver(stop, pageRgb)
    const lum = relativeLuminance(composed)
    if (lum > maxLum) {
      maxLum = lum
      maxSample = composed
    }
  }
  return { luminance: maxLum, sample: maxSample }
}

/** `true` para valores dinâmicos do tema do editor (`var(--color-primary)`, `color-mix(...)`). */
function isTokenColor(css: string | undefined): boolean {
  return typeof css === 'string' && css.includes('var(')
}

/**
 * Luminância estimada de uma cor sólida ou de um gradiente com stops
 * literais (hex/rgba) — usa a MÉDIA dos stops encontrados.
 */
function estimateLuminance(css: string | undefined, fallback = 0.3): number {
  if (!css || isTokenColor(css)) return fallback
  const direct = parseColor(css)
  if (direct) return relativeLuminance(direct)
  const tokens = extractColorTokens(css)
    .map(parseColor)
    .filter((c): c is Rgb => Boolean(c))
  if (tokens.length === 0) return fallback
  return tokens.reduce((sum, c) => sum + relativeLuminance(c), 0) / tokens.length
}

/** Escurece/clareia uma cor SÓLIDA mantendo a matiz, via CSS `color-mix()`. */
function mixTowards(color: string, towards: 'black' | 'white', amountPercent: number): string {
  const amount = Math.round(clamp01(amountPercent / 100) * 100)
  return `color-mix(in oklch, ${color} ${100 - amount}%, ${towards} ${amount}%)`
}

/**
 * Escurece/clareia qualquer `background` CSS empilhando uma camada extra.
 */
function reinforceBackground(css: string, towards: 'black' | 'white', amount: number): string {
  const rgb = towards === 'black' ? '0,0,0' : '255,255,255'
  const a = clamp01(amount / 100).toFixed(2)
  return `linear-gradient(rgba(${rgb},${a}), rgba(${rgb},${a})), ${css}`
}

const LOW_CONTRAST_THRESHOLD = 1.8
const SCRIM_MIN = 0.35
const SCRIM_MAX = 0.72

/**
 * Calcula o theme final do AppHeroCard, adaptado ao fundo efetivo da bio.
 */
export function resolveAppHeroTheme(
  baseTheme: AppHeroTheme,
  pageBackground: string,
): ResolvedAppHeroTheme {
  const pageRgb = resolvePageRgb(pageBackground)
  const pageLuminance = relativeLuminance(pageRgb)
  const pageIsLight = pageLuminance > 0.55

  const panel = estimatePanelFromGradient(baseTheme.gradient, pageRgb)
  const panelIsLight = panel.luminance > 0.45 || pageIsLight

  let gradient = baseTheme.gradient
  let finalPanelLuminance = panel.luminance
  if (panelIsLight) {
    const scrimAmount =
      Math.min(SCRIM_MAX, Math.max(SCRIM_MIN, Math.max(panel.luminance, pageLuminance) * 0.85)) *
      100
    gradient = reinforceBackground(baseTheme.gradient, 'black', scrimAmount)
    const scrimmed = compositeOver({ r: 0, g: 0, b: 0, a: scrimAmount / 100 }, panel.sample)
    finalPanelLuminance = relativeLuminance(scrimmed)
  }

  const titleText = finalPanelLuminance > 0.5 ? '#0A0A0A' : '#FFFFFF'
  const bodyText =
    finalPanelLuminance > 0.5 ? 'rgba(10,10,10,0.75)' : 'rgba(255,255,255,0.85)'

  const border = pageIsLight ? mixTowards(baseTheme.border, 'black', 20) : baseTheme.border
  const borderHover = pageIsLight
    ? mixTowards(baseTheme.borderHover, 'black', 20)
    : baseTheme.borderHover
  const glow = pageIsLight ? mixTowards(baseTheme.glow, 'black', 25) : baseTheme.glow
  const pulseBorder = pageIsLight
    ? mixTowards(baseTheme.pulseBorder, 'black', 20)
    : baseTheme.pulseBorder

  const ctaIsToken = isTokenColor(baseTheme.ctaBg)
  const ctaLum = estimateLuminance(baseTheme.ctaBg, 0.3)
  const ctaContrast = contrastRatio(ctaLum, finalPanelLuminance)
  const needsCtaHelp = !ctaIsToken && ctaContrast < LOW_CONTRAST_THRESHOLD

  let ctaBg = baseTheme.ctaBg
  let ctaText = baseTheme.ctaText
  let ctaShadow = baseTheme.ctaShadow

  if (needsCtaHelp) {
    const towards: 'black' | 'white' = ctaLum > 0.5 ? 'black' : 'white'
    const amount = ctaLum > 0.5 ? 12 : 10
    ctaBg = reinforceBackground(baseTheme.ctaBg, towards, amount)
    const reinforcedLum =
      towards === 'black'
        ? ctaLum * (1 - amount / 100)
        : ctaLum * (1 - amount / 100) + amount / 100
    ctaText = reinforcedLum > 0.5 ? '#0A0A0A' : '#FFFFFF'
    const ring =
      ctaLum > 0.5 ? '0 0 0 1px rgba(0,0,0,0.35)' : '0 0 0 1px rgba(255,255,255,0.55)'
    ctaShadow = `${baseTheme.ctaShadow}, ${ring}`
  }

  return {
    ...baseTheme,
    gradient,
    border,
    borderHover,
    glow,
    pulseBorder,
    ctaBg,
    ctaText,
    ctaShadow,
    titleText,
    bodyText,
  }
}
