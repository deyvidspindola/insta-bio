import type { AppHeroTheme } from './appHeroPresets'
import { extractColorTokens } from './colorEngine'
import { resolvePrimarySurfaceColors } from './contrastColor'
import {
  resolveAppHeroTheme,
  type ResolvedAppHeroTheme,
} from './appHeroContrast'

/** Cor padrão quando o card não define accentColor. */
export const DEFAULT_ACCENT = '#2563eb'

/** Extrai hex sólido + alpha de accent (hex, #rrggbbaa ou rgba). */
export function parseAccentParts(
  accentColor: string,
  fallback: string = DEFAULT_ACCENT,
): { color: string; alpha: number } {
  const raw = accentColor.trim()
  if (!raw) return { color: fallback, alpha: 1 }

  const rgba = raw.match(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i,
  )
  if (rgba) {
    const toHex = (n: string) =>
      Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0')
    return {
      color: `#${toHex(rgba[1])}${toHex(rgba[2])}${toHex(rgba[3])}`,
      alpha: Math.max(0, Math.min(1, parseFloat(rgba[4]))),
    }
  }

  if (/^#[0-9a-f]{8}$/i.test(raw)) {
    return {
      color: `#${raw.slice(1, 7).toLowerCase()}`,
      alpha: parseInt(raw.slice(7, 9), 16) / 255,
    }
  }

  if (/^#[0-9a-f]{6}$/i.test(raw)) {
    return { color: raw.toLowerCase(), alpha: 1 }
  }

  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const [r, g, b] = raw.slice(1).split('')
    return { color: `#${r}${r}${g}${g}${b}${b}`.toLowerCase(), alpha: 1 }
  }

  return { color: raw, alpha: 1 }
}

/**
 * Tema no estilo dos links **Sólido** / **Pill**:
 * - 100% → preenchimento sólido (gradiente leve da mesma cor)
 * - <100% → mesma cor com transparência (color-mix)
 * - chrome (badge/ícone/CTA) em branco, como nos links preenchidos
 *
 * Não usa wash escuro de app-hero — a transparência é só o slider.
 */
export function buildAccentTheme(
  accentColor?: string,
  fallback: string = DEFAULT_ACCENT,
): AppHeroTheme {
  const { color, alpha } = parseAccentParts(accentColor?.trim() || fallback, fallback)
  const intensity = Math.max(0.08, Math.min(1, alpha))
  const pct = Math.round(intensity * 100)
  const surface = resolvePrimarySurfaceColors(color)
  const solid = intensity >= 0.995

  const gradient = solid
    ? `linear-gradient(135deg, ${surface.solidFrom} 0%, ${surface.solidTo} 100%)`
    : `linear-gradient(135deg, color-mix(in oklch, ${surface.solidFrom} ${pct}%, transparent) 0%, color-mix(in oklch, ${surface.solidTo} ${pct}%, transparent) 100%)`

  return {
    border: solid
      ? 'transparent'
      : `color-mix(in oklch, ${color} ${Math.min(55, Math.round(pct * 0.55))}%, transparent)`,
    borderHover: solid
      ? 'transparent'
      : `color-mix(in oklch, ${color} ${Math.min(75, Math.round(pct * 0.75))}%, transparent)`,
    gradient,
    glow: `color-mix(in oklch, ${color} ${Math.round(pct * 0.4)}%, transparent)`,
    // Chrome estilo template solid/pill
    badgeText: 'rgba(255,255,255,0.95)',
    iconBg: 'color-mix(in oklch, white 18%, transparent)',
    iconRing: 'color-mix(in oklch, white 22%, transparent)',
    iconColor: '#FFFFFF',
    pulseBorder: 'color-mix(in oklch, white 40%, transparent)',
    ctaBg: '#FFFFFF',
    ctaText: '#0A0A0A',
    ctaShadow: '0 10px 30px -12px color-mix(in oklch, black 40%, transparent)',
  }
}

/**
 * Resolve tema do card com accent — sem scrim preto do AppHero
 * (ele apagava o preenchimento sólido).
 */
export function resolveAccentCardTheme(
  accentColor: string | undefined,
  pageBackground: string,
  legacyGradient?: string,
): ResolvedAppHeroTheme {
  const resolved = resolveAccentColor(accentColor, legacyGradient)
  const base = buildAccentTheme(resolved)

  // Reusa só o ajuste de texto/CTA; descarta scrim no gradient
  const adapted = resolveAppHeroTheme(base, pageBackground)

  return {
    ...adapted,
    // Preserva o fill sólido / transparente escolhido
    gradient: base.gradient,
    border: base.border,
    borderHover: base.borderHover,
    glow: base.glow,
    badgeText: base.badgeText,
    iconBg: base.iconBg,
    iconRing: base.iconRing,
    iconColor: base.iconColor,
    pulseBorder: base.pulseBorder,
    // CTA branco do estilo solid (pode ser reforçado se contraste falhar)
    ctaBg: adapted.ctaBg.includes('linear-gradient') ? adapted.ctaBg : base.ctaBg,
    ctaText: base.ctaText,
    ctaShadow: base.ctaShadow,
    // Texto branco sobre sólido (como links); se o painel ficar muito claro, o resolve já inverte
    titleText: adapted.titleText,
    bodyText: adapted.bodyText,
  }
}

/**
 * Resolve a cor de destaque do item.
 * Preferência: accentColor → primeiro token do gradient legado → undefined (usa default).
 */
export function resolveAccentColor(
  accentColor?: string,
  legacyGradient?: string,
): string | undefined {
  const direct = accentColor?.trim()
  if (direct) return direct

  const tokens = extractColorTokens(legacyGradient)
  const hex = tokens.find((t) => t.startsWith('#'))
  if (hex) return hex
  return tokens[0]
}
