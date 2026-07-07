import type { BioConfig, BioSection, IconName, SectionItem, AppHeroPreset, AppHeroLayout } from '@bio-types'
import { bioJsonUrl } from '@site/lib/publicUrl'
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
  { value: 'video', label: 'Vídeo' },
  { value: 'slide', label: 'Slides (Stories)' },
  { value: 'products', label: 'Produtos' },
  { value: 'link', label: 'Link simples' },
  { value: 'location', label: 'Localização' },
] as const

export { MEDIA_CARD_VARIANTS } from '@site/lib/mediaCardLayout'

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

export const APP_HERO_LAYOUTS = [
  { value: 'default', label: 'Completo' },
  { value: 'compact', label: 'Compacto (2 colunas)' },
  { value: 'condensed', label: 'Condensado' },
] as const

export function isHeroItem(
  item: SectionItem,
): item is Extract<SectionItem, { type: 'whatsapp-hero' | 'app-hero' }> {
  return item.type === 'whatsapp-hero' || item.type === 'app-hero'
}

/** Em grade 2 colunas, cards destaque não podem usar layout completo. */
export function ensureGridHeroLayouts(section: BioSection): BioSection {
  if ((section.layout ?? 'stack') !== 'grid-2') return section

  let changed = false
  const items = section.items.map((item) => {
    if (!isHeroItem(item)) return item
    if (item.layout === 'compact' || item.layout === 'condensed') return item
    changed = true
    return { ...item, layout: 'compact' as AppHeroLayout }
  })

  return changed ? { ...section, items } : section
}

export function resolveHeroLayout(isGrid: boolean, layout?: AppHeroLayout): AppHeroLayout {
  if (!isGrid) return layout ?? 'default'
  if (layout === 'condensed') return 'condensed'
  return 'compact'
}

export function heroLayoutForSection(
  section: BioSection,
  layout?: AppHeroLayout,
): AppHeroLayout {
  return resolveHeroLayout((section.layout ?? 'stack') === 'grid-2', layout)
}

export function newHeroItemForSection(
  section: BioSection,
  item: Extract<SectionItem, { type: 'whatsapp-hero' | 'app-hero' }>,
): Extract<SectionItem, { type: 'whatsapp-hero' | 'app-hero' }> {
  const layout = heroLayoutForSection(section, item.layout)
  return layout === item.layout ? item : { ...item, layout }
}

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
    case 'video':
      return {
        type,
        title: 'Novo vídeo',
        description: '',
        video: '',
        variant: 'portrait',
      }
    case 'slide':
      return {
        type,
        title: '',
        variant: 'portrait',
        autoplay: true,
        slides: [{ image: '', duration: 5 }],
      }
    case 'products':
      return {
        type,
        title: 'Produtos',
        products: [{ image: '', title: '', url: '', cta: 'Compre aqui' }],
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
  const response = await fetch(bioJsonUrl(), { cache: 'no-store' })
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
