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
      'radial-gradient(ellipse 74% 64% at 50% 28%, #5a3a9e 0%, #241448 48%, #0e0818 100%)',
    edgeColor: 'oklch(0.11 0.04 290)',
    primary: 'oklch(0.80 0.14 320)',
    secondary: 'oklch(0.90 0.05 330)',
    glow: 'oklch(0.76 0.14 320 / 0.3)',
  },
  {
    id: 'magenta-dusk',
    name: 'Magenta',
    tag: 'Rosa',
    // Centro mais escuro; rosa claro como acento (legível nos cards)
    gradient:
      'radial-gradient(ellipse 74% 64% at 50% 30%, #6b2a4a 0%, #2a101c 48%, #10060c 100%)',
    edgeColor: 'oklch(0.11 0.035 350)',
    primary: 'oklch(0.80 0.14 350)',
    secondary: 'oklch(0.90 0.05 350)',
    glow: 'oklch(0.76 0.14 350 / 0.3)',
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
    // Fundo escuro quente; âmbar só no acento (evita laranja-sobre-laranja)
    gradient:
      'radial-gradient(ellipse 72% 62% at 50% 30%, #5c3a18 0%, #1c120c 48%, #0a0705 100%)',
    edgeColor: 'oklch(0.11 0.03 55)',
    primary: 'oklch(0.78 0.15 55)',
    secondary: 'oklch(0.90 0.04 70)',
    glow: 'oklch(0.75 0.14 55 / 0.28)',
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
    // Carvão com brilho dourado suave — ouro só no acento, não no fundo inteiro
    gradient:
      'radial-gradient(ellipse 70% 58% at 50% 26%, #5a4a22 0%, #1c1810 46%, #0a0908 100%)',
    edgeColor: 'oklch(0.11 0.018 80)',
    primary: 'oklch(0.84 0.12 88)',
    secondary: 'oklch(0.91 0.03 85)',
    glow: 'oklch(0.78 0.11 85 / 0.26)',
  },
  {
    id: 'teal-clinic',
    name: 'Teal',
    tag: 'Saúde',
    gradient:
      'radial-gradient(ellipse 72% 62% at 50% 30%, #1a5c56 0%, #0c2826 48%, #05100f 100%)',
    edgeColor: 'oklch(0.11 0.03 180)',
    primary: 'oklch(0.78 0.12 175)',
    secondary: 'oklch(0.90 0.04 180)',
    glow: 'oklch(0.74 0.12 175 / 0.28)',
  },
]

export function resolveBackgroundPreset(id?: string): BackgroundPreset | undefined {
  if (!id) return undefined
  return BACKGROUND_PRESETS.find((preset) => preset.id === id)
}
