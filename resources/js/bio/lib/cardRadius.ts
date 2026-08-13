export const CARD_RADIUS_PRESETS = [
  { label: 'Reto', px: 0, value: 0 },
  { label: 'Suave', px: 8, value: 25 },
  { label: 'Arredondado', px: 16, value: 50 },
  { label: 'Pílula', px: 32, value: 100 },
] as const

export const DEFAULT_CARD_RADIUS = 50

export function resolveCardRadius(value?: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) return DEFAULT_CARD_RADIUS
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** 0–100 → 0px–32px */
export function resolveCardRadiusPx(value?: number): string {
  const v = resolveCardRadius(value)
  return `${((v / 100) * 32).toFixed(2)}px`
}

export function cardRadiusLabel(value?: number): string {
  const v = resolveCardRadius(value)
  if (v <= 5) return 'Reto'
  if (v <= 30) return 'Suave'
  if (v <= 55) return 'Arredondado'
  if (v <= 80) return 'Amplo'
  return 'Pílula'
}
