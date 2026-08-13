export interface ColorPalette {
  id: string
  name: string
  tag?: string
  swatch: string
  primary: string
  secondary: string
  background: string
  glow: string
}

/** Paletas por perfil — nomes que o cliente reconhece na hora */
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'igreja',
    name: 'Igreja',
    tag: 'Dourado',
    swatch: 'linear-gradient(135deg, #d4a017, #1a1520)',
    primary: 'oklch(0.72 0.14 85)',
    secondary: 'oklch(0.82 0.08 90)',
    background: 'oklch(0.11 0.025 280)',
    glow: 'oklch(0.72 0.14 85 / 0.28)',
  },
  {
    id: 'confeitaria',
    name: 'Confeitaria',
    tag: 'Doce',
    swatch: 'linear-gradient(135deg, #f472b6, #2a1520)',
    primary: 'oklch(0.72 0.18 350)',
    secondary: 'oklch(0.82 0.1 355)',
    background: 'oklch(0.13 0.03 350)',
    glow: 'oklch(0.72 0.16 350 / 0.28)',
  },
  {
    id: 'barbearia',
    name: 'Barbearia',
    tag: 'Masculino',
    swatch: 'linear-gradient(135deg, #c9a227, #0d0d0d)',
    primary: 'oklch(0.75 0.12 85)',
    secondary: 'oklch(0.68 0.02 260)',
    background: 'oklch(0.1 0.01 260)',
    glow: 'oklch(0.75 0.12 85 / 0.22)',
  },
  {
    id: 'saude',
    name: 'Saúde',
    tag: 'Clínica',
    swatch: 'linear-gradient(135deg, #2dd4bf, #0f1f1c)',
    primary: 'oklch(0.72 0.12 175)',
    secondary: 'oklch(0.78 0.07 180)',
    background: 'oklch(0.13 0.03 180)',
    glow: 'oklch(0.65 0.12 175 / 0.28)',
  },
  {
    id: 'moda',
    name: 'Moda',
    tag: 'Elegante',
    swatch: 'linear-gradient(135deg, #e8b4b8, #141014)',
    primary: 'oklch(0.78 0.1 15)',
    secondary: 'oklch(0.85 0.04 15)',
    background: 'oklch(0.11 0.015 350)',
    glow: 'oklch(0.78 0.1 15 / 0.2)',
  },
  {
    id: 'restaurante',
    name: 'Restaurante',
    tag: 'Gastronomia',
    swatch: 'linear-gradient(135deg, #ef4444, #1a100e)',
    primary: 'oklch(0.62 0.22 25)',
    secondary: 'oklch(0.78 0.08 70)',
    background: 'oklch(0.12 0.03 30)',
    glow: 'oklch(0.62 0.2 25 / 0.28)',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    tag: 'Energia',
    swatch: 'linear-gradient(135deg, #84cc16, #0f1608)',
    primary: 'oklch(0.75 0.2 130)',
    secondary: 'oklch(0.82 0.1 130)',
    background: 'oklch(0.11 0.03 130)',
    glow: 'oklch(0.75 0.18 130 / 0.28)',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    tag: 'Instagram',
    swatch: 'linear-gradient(135deg, #a855f7, #ec4899)',
    primary: 'oklch(0.65 0.22 310)',
    secondary: 'oklch(0.72 0.18 350)',
    background: 'oklch(0.12 0.04 300)',
    glow: 'oklch(0.65 0.2 310 / 0.32)',
  },
  {
    id: 'infantil',
    name: 'Infantil',
    tag: 'Alegre',
    swatch: 'linear-gradient(135deg, #38bdf8, #fbbf24)',
    primary: 'oklch(0.72 0.16 230)',
    secondary: 'oklch(0.82 0.16 85)',
    background: 'oklch(0.14 0.03 260)',
    glow: 'oklch(0.72 0.14 230 / 0.25)',
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    tag: 'Profissional',
    swatch: 'linear-gradient(135deg, #3b82f6, #0f172a)',
    primary: 'oklch(0.62 0.18 255)',
    secondary: 'oklch(0.72 0.06 255)',
    background: 'oklch(0.13 0.03 260)',
    glow: 'oklch(0.62 0.16 255 / 0.28)',
  },
  {
    id: 'beleza',
    name: 'Beleza',
    tag: 'Estética',
    swatch: 'linear-gradient(135deg, #f9a8d4, #1a1018)',
    primary: 'oklch(0.78 0.14 340)',
    secondary: 'oklch(0.85 0.08 340)',
    background: 'oklch(0.13 0.025 340)',
    glow: 'oklch(0.78 0.12 340 / 0.25)',
  },
  {
    id: 'pet',
    name: 'Pet shop',
    tag: 'Pet',
    swatch: 'linear-gradient(135deg, #fb923c, #1a1208)',
    primary: 'oklch(0.72 0.18 55)',
    secondary: 'oklch(0.78 0.1 55)',
    background: 'oklch(0.12 0.025 60)',
    glow: 'oklch(0.72 0.16 55 / 0.28)',
  },
]
