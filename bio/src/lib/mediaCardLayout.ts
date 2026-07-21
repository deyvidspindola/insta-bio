import type { FeatureCard } from '../types/bio'

/** Variantes de tamanho/formato compartilhadas entre vídeo, slides e cards com mídia. */
export type MediaCardVariant = NonNullable<FeatureCard['variant']>

export const MEDIA_CARD_VARIANTS: ReadonlyArray<{ value: MediaCardVariant; label: string }> = [
  { value: 'portrait', label: 'Retrato — Stories/Reels (9:16)' },
  { value: 'compact', label: 'Compacto (4:5)' },
  { value: 'banner', label: 'Banner (16:9)' },
  { value: 'square', label: 'Quadrado (1:1)' },
  { value: 'gradient', label: 'Alto estreito (3:4)' },
] as const

/** @deprecated compatibilidade com bios que usavam aspectRatio no vídeo */
export type LegacyVideoAspectRatio = 'reel' | 'portrait' | 'square'

export function resolveMediaCardVariant(input: {
  variant?: MediaCardVariant
  aspectRatio?: LegacyVideoAspectRatio
}): MediaCardVariant {
  if (input.variant) {
    return input.variant
  }

  switch (input.aspectRatio) {
    case 'square':
      return 'square'
    case 'portrait':
      return 'compact'
    case 'reel':
    default:
      return 'portrait'
  }
}

export function mediaCardAspectClass(variant: MediaCardVariant): string {
  switch (variant) {
    case 'banner':
      return 'aspect-[16/10] sm:aspect-[16/9]'
    case 'square':
      return 'aspect-square'
    case 'compact':
      return 'aspect-[4/5]'
    case 'gradient':
      return 'aspect-[3/4]'
    case 'portrait':
    default:
      return 'aspect-[9/16]'
  }
}

export function mediaCardMaxWidthClass(_variant: MediaCardVariant): string {
  return 'w-full'
}
