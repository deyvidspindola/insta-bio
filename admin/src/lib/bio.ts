import type { BioConfig, BioSection, IconName, SectionItem, AppHeroPreset } from '@bio-types'
import defaultBio from '../../../public/bio.default.json'
import { APP_HERO_PRESET_LIST, createAppHero } from '@site/lib/appHeroPresets'

export { APP_HERO_PRESET_LIST, createAppHero }
export type { AppHeroPreset }

export const ICON_OPTIONS: IconName[] = [
  'whatsapp',
  'compass',
  'droplets',
  'map-pin',
  'heart',
  'gift',
  'hand-heart',
  'sparkles',
  'zap',
  'baby',
  'users',
  'calendar',
  'form',
  'youtube',
  'pray',
  'coffee',
  'message',
]

export const CARD_TYPES = [
  { value: 'feature', label: 'Card' },
  { value: 'link', label: 'Link simples' },
  { value: 'location', label: 'Localização' },
] as const

export const FEATURE_VARIANTS = [
  { value: 'gradient', label: 'Gradiente' },
  { value: 'square', label: 'Quadrado (grade 2 colunas)' },
  { value: 'compact', label: 'Compacto' },
  { value: 'portrait', label: 'Retrato com imagem' },
  { value: 'banner', label: 'Banner com imagem' },
] as const

export const LAYOUT_OPTIONS = [
  { value: 'stack', label: 'Empilhado' },
  { value: 'grid-2', label: 'Grade 2 colunas' },
] as const

export function createDefaultConfig(): BioConfig {
  return structuredClone(defaultBio as BioConfig)
}

/** @deprecated Use createDefaultConfig — mantido para compatibilidade */
export function createEmptyConfig(): BioConfig {
  return createDefaultConfig()
}

export function createSection(): BioSection {
  return {
    id: `secao-${Date.now()}`,
    title: 'Nova seção',
    items: [],
  }
}

export function createItem(type: SectionItem['type']): SectionItem {
  switch (type) {
    case 'whatsapp-hero':
      return {
        type,
        badge: 'Comunidade',
        title: 'Entre na comunidade',
        description: 'Descrição do grupo',
        cta: 'Entrar agora',
        url: 'https://',
      }
    case 'app-hero':
      return createAppHero('whatsapp')
    case 'feature':
      return {
        type,
        title: 'Novo destaque',
        description: 'Descrição do card',
        url: 'https://',
        variant: 'gradient',
        icon: 'heart',
      }
    case 'link':
      return {
        type,
        title: 'Novo link',
        subtitle: 'Subtítulo opcional',
        url: 'https://',
        icon: 'heart',
      }
    case 'grid':
      return {
        type,
        title: 'Novo card',
        url: 'https://',
        gradient:
          'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)',
      }
    case 'location':
      return {
        type,
        title: 'Local',
        address: 'Endereço completo',
        mapUrl: 'https://maps.google.com',
      }
    default:
      return {
        type: 'link',
        title: 'Novo link',
        url: 'https://',
      }
  }
}

export async function loadBioConfig(): Promise<BioConfig> {
  const response = await fetch('/bio.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('Não foi possível carregar bio.json')
  return response.json()
}

export function downloadBioConfig(config: BioConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'bio.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function copyBioConfig(config: BioConfig) {
  await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
}
