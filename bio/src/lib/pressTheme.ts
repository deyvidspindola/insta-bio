import { buildAccentTheme, DEFAULT_ACCENT } from './accentTheme'

/** @deprecated Use DEFAULT_ACCENT from accentTheme */
export const PRESS_DEFAULT_ACCENT = DEFAULT_ACCENT

/**
 * Tema editorial do card Imprensa.
 * @deprecated Prefer buildAccentTheme — mantido como alias estável.
 */
export function buildPressTheme(accentColor?: string) {
  return buildAccentTheme(accentColor)
}
