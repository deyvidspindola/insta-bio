import type { BioBrand, BioConfig, BioSection, SectionItem, AppHeroPreset, AppHeroLayout } from '@bio-types'
import { bioJsonUrl } from '@site/lib/publicUrl'
import { normalizeBrandSocial } from '@site/lib/socialLinks'
import { deriveCardGradientFromTheme } from '@site/lib/colorEngine'
import defaultBio from '../../shared/bio.default.json'
import demoBio from '../../shared/demo-bio.json'
import { APP_HERO_PRESET_LIST, createAppHero } from '@site/lib/appHeroPresets'

const FALLBACK_CARD_GRADIENT =
  'linear-gradient(135deg, oklch(0.70 0.18 55) 0%, oklch(0.55 0.19 40) 100%)'

export { APP_HERO_PRESET_LIST, createAppHero }
export type { AppHeroPreset }
export {
  ICON_CATALOG,
  ICON_CATEGORY_LABELS,
  ICON_LABELS,
  ICON_OPTIONS,
  filterIconCatalog,
} from './iconCatalog'
export type { IconCatalogEntry, IconCategory } from './iconCatalog'

export const CARD_WIDTH_OPTIONS = [
  { value: 'full', label: 'Largura total' },
  { value: 'half', label: 'Metade (2 por linha)' },
] as const

export const CARD_TYPES = [
  {
    value: 'feature',
    label: 'Destaque',
    hint: 'Card visual com foto, gradiente e CTA — use para links importantes.',
  },
  {
    value: 'press',
    label: 'Imprensa',
    hint: 'Matéria, prêmio ou menção — com cor de destaque própria.',
  },
  {
    value: 'text',
    label: 'Texto',
    hint: 'Texto livre com alinhamento e formatação.',
  },
  {
    value: 'list',
    label: 'Lista',
    hint: 'Lista com números, pontos, letras ou sem marcador.',
  },
  {
    value: 'form',
    label: 'Formulário',
    hint: 'Capte nome, e-mail ou telefone sem o visitante sair da bio.',
  },
  {
    value: 'video',
    label: 'Vídeo',
    hint: 'Vídeo próprio (MP4) com capa opcional.',
  },
  {
    value: 'youtube-embed',
    label: 'YouTube',
    hint: 'Player embutido a partir do link do vídeo.',
  },
  {
    value: 'spotify-embed',
    label: 'Spotify',
    hint: 'Playlist, álbum ou música embutidos.',
  },
  {
    value: 'slide',
    label: 'Slides (Stories)',
    hint: 'Carrossel de imagens no estilo stories.',
  },
  {
    value: 'products',
    label: 'Produtos',
    hint: 'Galeria de produtos com link e botão.',
  },
  {
    value: 'link',
    label: 'Link',
    hint: 'Botão com título e URL — o jeito mais rápido de adicionar um link.',
  },
  {
    value: 'location',
    label: 'Localização',
    hint: 'Endereço + link; opcionalmente mapa embutido com pin.',
  },
] as const

/** Tipos utilitários (lista/botão fino) — não competem com cards visuais. */
export const SECONDARY_CARD_TYPE_VALUES = new Set<string>(['link', 'location'])

export const PRIMARY_CARD_TYPES = CARD_TYPES.filter(
  (type) => !SECONDARY_CARD_TYPE_VALUES.has(type.value),
)

export const SECONDARY_CARD_TYPES = CARD_TYPES.filter((type) =>
  SECONDARY_CARD_TYPE_VALUES.has(type.value),
)

export { MEDIA_CARD_VARIANTS } from '@site/lib/mediaCardLayout'

export const FEATURE_VARIANTS = [
  { value: 'gradient', label: 'Gradiente colorido' },
  { value: 'square', label: 'Quadrado' },
  { value: 'compact', label: 'Compacto' },
  { value: 'portrait', label: 'Retrato (imagem)' },
  { value: 'banner', label: 'Banner (imagem)' },
] as const

/** Alinhamento do conteúdo no destaque em gradiente. */
export const FEATURE_ALIGNS = [
  { value: 'side', label: 'Ícone ao lado' },
  { value: 'center', label: 'Centralizado' },
] as const

/** Nome legível para listas/selects — evita mostrar IDs técnicos. */
export function sectionDisplayName(section: BioSection, index: number): string {
  const title = section.title?.trim()
  if (title) return title
  return `Seção ${index + 1}`
}

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

export function normalizeBioConfig(config: BioConfig): BioConfig {
  const defaults = structuredClone(defaultBio as BioConfig)
  const raw = (config ?? {}) as BioConfig & { name?: string }

  // Shape quebrada de provision antigo: { name, sections } sem brand
  const incomingBrand =
    raw.brand ??
    (typeof raw.name === 'string'
      ? ({ name: raw.name } as BioConfig['brand'])
      : undefined)

  const incomingTheme = incomingBrand?.theme ?? {}
  const theme = {
    ...defaults.brand.theme,
    ...incomingTheme,
  }
  const incomingSetBackground =
    incomingTheme.background !== undefined ||
    incomingTheme.backgroundPreset !== undefined ||
    incomingTheme.backgroundImage !== undefined
  if (!incomingSetBackground) {
    delete theme.background
  }

  const brand = {
    ...defaults.brand,
    ...(incomingBrand ?? {}),
    theme,
    seo: {
      ...defaults.brand.seo,
      ...(incomingBrand?.seo ?? {}),
    },
    instagram: {
      handle: incomingBrand?.instagram?.handle ?? defaults.brand.instagram?.handle ?? '',
      url: incomingBrand?.instagram?.url ?? defaults.brand.instagram?.url ?? '',
    },
  }

  return {
    ...defaults,
    ...raw,
    brand: normalizeBrandSocial(brand),
    sections: Array.isArray(raw.sections) ? raw.sections : [],
  }
}

export function createDefaultConfig(): BioConfig {
  const config = normalizeBioConfig(structuredClone(defaultBio as BioConfig))
  if (!config.brand.theme.background && !config.brand.theme.backgroundPreset && !config.brand.theme.backgroundImage) {
    config.brand.theme.background = '#ffffff'
  }
  if (config.sections.length === 0) {
    config.sections = [createDefaultSection()]
  }
  return config
}

/** @deprecated Use createDefaultConfig — mantido para compatibilidade */
export function createEmptyConfig(): BioConfig {
  return createDefaultConfig()
}

/**
 * Bio ainda “nova”: sem cards, ou idêntica ao demo padrão.
 * Nesses casos um template pode trocar o conteúdo; caso contrário, só o visual.
 */
export function isStarterBio(config: BioConfig): boolean {
  const sections = config.sections ?? []
  if (sections.length === 0) return true
  if (sections.length === 1 && (sections[0].items?.length ?? 0) === 0) return true

  const demoSections = (demoBio as BioConfig).sections ?? []
  return JSON.stringify(sections) === JSON.stringify(demoSections)
}

/** Primeira seção oculta na bio — o usuário só vê uma lista de links. */
export function createDefaultSection(): BioSection {
  return {
    id: `secao-${Date.now()}`,
    title: 'Links',
    hideTitle: true,
    items: [],
  }
}

export function createSection(): BioSection {
  return {
    id: `secao-${Date.now()}`,
    title: 'Novo grupo',
    hideTitle: true,
    items: [],
  }
}

export function createSimpleLink(title = '', url = ''): Extract<SectionItem, { type: 'link' }> {
  return {
    type: 'link',
    title: title.trim() || 'Novo link',
    url: url.trim(),
  }
}

export function cloneItem(item: SectionItem): SectionItem {
  return JSON.parse(JSON.stringify(item)) as SectionItem
}

export function createItem(
  type: SectionItem['type'],
  theme?: BioBrand['theme'],
): SectionItem {
  const themeGradient = theme
    ? deriveCardGradientFromTheme(theme)
    : FALLBACK_CARD_GRADIENT

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
        gradient: themeGradient,
      }
    case 'link':
      return createSimpleLink()
    case 'press':
      return {
        type,
        title: 'Título da matéria',
        source: 'Nome da publicação',
        description: 'Resumo curto opcional.',
        cta: 'Ler matéria',
        url: 'https://',
        accentColor: '#2563eb',
      }
    case 'grid':
      return {
        type,
        title: 'Novo card',
        url: 'https://',
        gradient: themeGradient,
      }
    case 'location':
      return {
        type,
        title: 'Local',
        address: 'Endereço completo',
        mapUrl: 'https://maps.google.com',
        showMap: true,
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
    case 'youtube-embed':
      return {
        type,
        title: '',
        url: 'https://www.youtube.com/watch?v=',
      }
    case 'spotify-embed':
      return {
        type,
        title: '',
        embed: '',
      }
    case 'text':
      return {
        type,
        text: 'Digite seu texto aqui.',
        align: 'left',
      }
    case 'list':
      return {
        type,
        title: 'Nova lista',
        style: 'bullet',
        items: ['Primeiro item', 'Segundo item'],
      }
    case 'form':
      return {
        type,
        formSlug: '',
        display: 'embed',
        buttonLabel: 'Abrir formulário',
        // fields vazio: o conteúdo vem do formulário (formSlug).
        // Blocos legados com fields inline continuam válidos no schema.
        fields: [],
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
  const data = (await response.json()) as BioConfig
  return normalizeBioConfig(data)
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
