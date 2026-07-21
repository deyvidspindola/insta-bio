export interface BackgroundPreset {
  id: string
  name: string
  tag?: string
  /** Gradiente CSS full-page (radial, estilo spotlight) */
  gradient: string
  /** Cor das bordas — usada em --color-background para cards/overlay */
  edgeColor: string
  /** Acento principal — contraste sobre o fundo escuro do preset */
  primary: string
  secondary: string
  glow: string
}

/** Fundos prontos em gradiente radial (estilo spotlight central) */
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'ocean-glow',
    name: 'Oceano',
    tag: 'Azul',
    gradient:
      'radial-gradient(ellipse 90% 80% at 50% 38%, #2b7bff 0%, #1550b8 38%, #0a2860 72%, #050f22 100%)',
    edgeColor: 'oklch(0.11 0.045 260)',
    primary: 'oklch(0.78 0.14 85)',
    secondary: 'oklch(0.88 0.08 90)',
    glow: 'oklch(0.78 0.14 85 / 0.32)',
  },
  {
    id: 'cobalt-spot',
    name: 'Cobalto',
    tag: 'Azul escuro',
    gradient:
      'radial-gradient(ellipse 85% 75% at 50% 40%, #4f8cff 0%, #2457c5 35%, #102a5c 68%, #070f1f 100%)',
    edgeColor: 'oklch(0.1 0.04 265)',
    primary: 'oklch(0.72 0.15 230)',
    secondary: 'oklch(0.82 0.10 210)',
    glow: 'oklch(0.72 0.15 230 / 0.3)',
  },
  {
    id: 'violet-glow',
    name: 'Violeta',
    tag: 'Roxo',
    gradient:
      'radial-gradient(ellipse 88% 78% at 50% 36%, #9b6dff 0%, #6b3fd4 34%, #321a6e 70%, #12082a 100%)',
    edgeColor: 'oklch(0.11 0.05 290)',
    primary: 'oklch(0.76 0.16 320)',
    secondary: 'oklch(0.85 0.10 330)',
    glow: 'oklch(0.76 0.16 320 / 0.32)',
  },
  {
    id: 'magenta-dusk',
    name: 'Magenta',
    tag: 'Rosa',
    gradient:
      'radial-gradient(ellipse 86% 76% at 50% 40%, #f06cad 0%, #c23d82 32%, #6a1f4a 68%, #1a0812 100%)',
    edgeColor: 'oklch(0.12 0.04 350)',
    primary: 'oklch(0.74 0.14 350)',
    secondary: 'oklch(0.84 0.10 350)',
    glow: 'oklch(0.74 0.14 350 / 0.3)',
  },
  {
    id: 'emerald-glow',
    name: 'Esmeralda',
    tag: 'Verde',
    gradient:
      'radial-gradient(ellipse 88% 78% at 50% 38%, #3dd68c 0%, #1fa86a 34%, #0f5038 70%, #061912 100%)',
    edgeColor: 'oklch(0.11 0.04 155)',
    primary: 'oklch(0.74 0.14 155)',
    secondary: 'oklch(0.84 0.09 160)',
    glow: 'oklch(0.74 0.14 155 / 0.28)',
  },
  {
    id: 'amber-warm',
    name: 'Âmbar',
    tag: 'Quente',
    gradient:
      'radial-gradient(ellipse 86% 76% at 50% 40%, #ffb347 0%, #e8872a 32%, #8a4510 68%, #1a0e06 100%)',
    edgeColor: 'oklch(0.12 0.035 55)',
    primary: 'oklch(0.68 0.17 55)',
    secondary: 'oklch(0.82 0.10 70)',
    glow: 'oklch(0.68 0.17 55 / 0.28)',
  },
  {
    id: 'sunset-fire',
    name: 'Pôr do sol',
    tag: 'Laranja',
    gradient:
      'radial-gradient(ellipse 88% 80% at 50% 36%, #ff7a45 0%, #e04320 30%, #7a1a12 65%, #140806 100%)',
    edgeColor: 'oklch(0.11 0.04 35)',
    primary: 'oklch(0.72 0.16 35)',
    secondary: 'oklch(0.84 0.10 40)',
    glow: 'oklch(0.72 0.16 35 / 0.3)',
  },
  {
    id: 'slate-glow',
    name: 'Grafite',
    tag: 'Neutro',
    gradient:
      'radial-gradient(ellipse 85% 75% at 50% 42%, #6b7280 0%, #3f4654 38%, #1c212b 72%, #0a0c10 100%)',
    edgeColor: 'oklch(0.11 0.01 260)',
    primary: 'oklch(0.74 0.12 250)',
    secondary: 'oklch(0.84 0.06 255)',
    glow: 'oklch(0.74 0.12 250 / 0.28)',
  },
  {
    id: 'gold-church',
    name: 'Dourado',
    tag: 'Igreja',
    gradient:
      'radial-gradient(ellipse 86% 78% at 50% 38%, #e8c547 0%, #b8922a 34%, #5c4512 70%, #141008 100%)',
    edgeColor: 'oklch(0.11 0.025 85)',
    primary: 'oklch(0.74 0.14 85)',
    secondary: 'oklch(0.86 0.08 90)',
    glow: 'oklch(0.74 0.14 85 / 0.22)',
  },
  {
    id: 'teal-clinic',
    name: 'Teal',
    tag: 'Saúde',
    gradient:
      'radial-gradient(ellipse 88% 78% at 50% 40%, #2dd4bf 0%, #0d9488 34%, #0f4f4a 70%, #051412 100%)',
    edgeColor: 'oklch(0.11 0.04 180)',
    primary: 'oklch(0.72 0.14 175)',
    secondary: 'oklch(0.82 0.10 180)',
    glow: 'oklch(0.72 0.14 175 / 0.28)',
  },
]

export function resolveBackgroundPreset(id?: string): BackgroundPreset | undefined {
  if (!id) return undefined
  return BACKGROUND_PRESETS.find((preset) => preset.id === id)
}
