import type { AppHeroTheme } from './appHeroPresets'

/** Cor editorial padrão quando o card não define accentColor. */
export const PRESS_DEFAULT_ACCENT = '#2563eb'

/**
 * Monta um AppHeroTheme a partir de uma cor de destaque livre
 * (imprensa/reconhecimento — sem preset de app).
 */
export function buildPressTheme(accentColor?: string): AppHeroTheme {
  const accent = accentColor?.trim() || PRESS_DEFAULT_ACCENT

  return {
    border: `color-mix(in oklch, ${accent} 40%, transparent)`,
    borderHover: `color-mix(in oklch, ${accent} 65%, transparent)`,
    gradient: `linear-gradient(135deg, color-mix(in oklch, ${accent} 26%, transparent) 0%, color-mix(in oklch, ${accent} 12%, transparent) 55%, rgba(15,20,30,0.68) 100%)`,
    glow: `color-mix(in oklch, ${accent} 35%, transparent)`,
    badgeText: accent,
    iconBg: `color-mix(in oklch, ${accent} 22%, transparent)`,
    iconRing: `color-mix(in oklch, ${accent} 42%, transparent)`,
    iconColor: accent,
    pulseBorder: `color-mix(in oklch, ${accent} 55%, transparent)`,
    ctaBg: accent,
    ctaText: '#FFFFFF',
    ctaShadow: `0 10px 30px -10px color-mix(in oklch, ${accent} 55%, transparent)`,
  }
}
