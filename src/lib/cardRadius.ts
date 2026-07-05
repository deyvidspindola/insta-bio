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
  if (v <= 5) return 'Quadrado'
  if (v <= 30) return 'Leve'
  if (v <= 55) return 'Padrão'
  if (v <= 80) return 'Arredondado'
  return 'Pílula'
}
