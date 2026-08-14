export type IconName =
  | 'whatsapp'
  | 'compass'
  | 'droplets'
  | 'map-pin'
  | 'heart'
  | 'gift'
  | 'hand-heart'
  | 'sparkles'
  | 'zap'
  | 'baby'
  | 'users'
  | 'calendar'
  | 'form'
  | 'youtube'
  | 'pray'
  | 'coffee'
  | 'message'
  | 'star'
  | 'phone'
  | 'mail'
  | 'globe'
  | 'link'
  | 'music'
  | 'mic'
  | 'book'
  | 'camera'
  | 'home'
  | 'share'
  | 'headphones'
  | 'sun'
  | 'moon'
  | 'church'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'telegram'
  | 'spotify'
  | 'cart'
  | 'store'
  | 'card'
  | 'tag'
  | 'percent'
  | 'briefcase'
  | 'clock'
  | 'ticket'
  | 'video'
  | 'image'
  | 'check'
  | 'info'
  | 'bell'
  | 'bookmark'
  | 'thumbs-up'
  | 'flame'
  | 'leaf'
  | 'utensils'
  | 'car'
  | 'building'
  | 'graduation'
  | 'wallet'
  | 'download'
  | 'external'
  | 'megaphone'
  | 'newspaper'
  | 'palette'
  | 'scissors'
  | 'shirt'
  | 'dumbbell'
  | 'plane'
  | 'cake'
  | 'party'
  | 'smile'
  | 'lock'
  | 'send'
  | 'file'
  | 'handshake'
  | 'cross'
  | 'linkedin'
  | 'github'
  | 'x'
  | 'telegram'

export type CardWidth = 'full' | 'half'

export type SocialNetwork =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'email'
  | 'whatsapp'
  | 'spotify'
  | 'linkedin'
  | 'github'
  | 'x'
  | 'telegram'

export interface SocialLink {
  network: SocialNetwork
  url: string
}

export type BioTemplate = 'classic' | 'pill' | 'outline' | 'solid' | 'glass' | 'soft'

export interface BioBrand {
  name: string
  tagline?: string
  location: string
  instagram: {
    handle: string
    url: string
  }
  /** Ícones de redes no topo da bio (opcional). */
  socialLinks?: SocialLink[]
  logo: string
  coverImage?: string
  template?: BioTemplate
  /** ID do pack de tema aplicado na galeria (ex.: dark-agency). */
  activeTemplateId?: string
  theme: {
    primary: string
    secondary?: string
    glow?: string
    background?: string
    backgroundImage?: string
    /** ID de gradiente pronto (ver backgroundPresets.ts) */
    backgroundPreset?: string
    /**
     * Escurecimento sobre a imagem de fundo (0–1).
     * Default visual ~0.55 se omitido.
     */
    backgroundOverlayOpacity?: number
    /** 0 = cantos retos, 100 = máximo arredondamento */
    cardRadius?: number
  }
  seo: {
    title: string
    description: string
  }
  footer: string
}

export type AppHeroPreset = 'whatsapp' | 'youtube' | 'instagram' | 'form' | 'telegram' | 'custom'

export type AppHeroLayout = 'default' | 'compact' | 'condensed'

/** Alinhamento do conteúdo (ícone ao lado vs centralizado). */
export type FeatureCardAlign = 'side' | 'center'

/** Agendamento opcional (timezone America/Sao_Paulo). */
export type CardSchedule = {
  /** ISO datetime — início da exibição na bio pública */
  from?: string
  /** ISO datetime — fim da exibição (instante exclusivo) */
  until?: string
}

/**
 * Comportamento do clique no card.
 * - link (padrão): abre `url` em nova aba
 * - copy: copia `cta` (se houver) ou `url` para a área de transferência
 * - tally: abre formulário Tally em popup (URL tally.so)
 * - page: navega para página interna `/{bioSlug}/{pageSlug}`
 */
export type CardAction = 'link' | 'copy' | 'tally' | 'page'

export interface WhatsAppHero {
  type: 'whatsapp-hero'
  badge: string
  title: string
  description: string
  cta: string
  url: string
  action?: CardAction
  /** Slug da página interna quando action === 'page' */
  pageSlug?: string
  /** @deprecated Preferir título; mantido só como fallback de analytics */
  reportName?: string
  layout?: AppHeroLayout
  align?: FeatureCardAlign
  schedule?: CardSchedule
}

export interface AppHero {
  type: 'app-hero'
  preset: AppHeroPreset
  badge: string
  title: string
  description: string
  cta: string
  url: string
  action?: CardAction
  /** Slug da página interna quando action === 'page' */
  pageSlug?: string
  /** @deprecated Preferir título; mantido só como fallback de analytics */
  reportName?: string
  icon?: IconName
  layout?: AppHeroLayout
  align?: FeatureCardAlign
  schedule?: CardSchedule
}

export interface FeatureCard {
  type: 'feature'
  badge?: string
  title: string
  description?: string
  cta?: string
  url: string
  action?: CardAction
  /** Slug da página interna quando action === 'page' */
  pageSlug?: string
  /** @deprecated Preferir título + showTitleOnMedia */
  reportName?: string
  variant?: 'gradient' | 'compact' | 'portrait' | 'banner' | 'square'
  /**
   * Só no formato gradiente:
   * - side: ícone ao lado do texto (padrão)
   * - center: ícone acima, conteúdo centralizado
   */
  align?: FeatureCardAlign
  /**
   * Em portrait/banner: exibir título e descrição sobre a imagem.
   * `false` = só a foto (o título continua no relatório de cliques).
   * Omitido = true.
   */
  showTitleOnMedia?: boolean
  icon?: IconName
  image?: string
  gradient?: string
  tags?: Array<{ label: string; icon?: IconName }>
  /** Metade da largura — 2 cards por linha (fora da grade da seção). */
  width?: CardWidth
  schedule?: CardSchedule
}

export interface LinkCard {
  type: 'link'
  title: string
  subtitle?: string
  url: string
  action?: CardAction
  /** Slug da página interna quando action === 'page' */
  pageSlug?: string
  /** @deprecated Preferir título */
  reportName?: string
  icon?: IconName
  width?: CardWidth
  schedule?: CardSchedule
}

/**
 * Matéria, prêmio ou menção na imprensa.
 * Cor de destaque por item (não usa preset de app).
 */
export interface PressCard {
  type: 'press'
  /** Título da matéria / reconhecimento */
  title: string
  /** Nome da fonte, publicação ou instituição */
  source: string
  url: string
  /** Cor de destaque (hex/CSS). Padrão editorial se omitida. */
  accentColor?: string
  description?: string
  cta?: string
  image?: string
  layout?: AppHeroLayout
  align?: FeatureCardAlign
  width?: CardWidth
  schedule?: CardSchedule
}

export interface GridCard {
  type: 'grid'
  badge?: string
  title: string
  subtitle?: string
  url: string
  image?: string
  gradient?: string
  width?: CardWidth
  schedule?: CardSchedule
}

export interface InstagramCard {
  type: 'instagram'
  name: string
  category: string
  handle: string
  url: string
  gradient: string
  icon?: IconName
  schedule?: CardSchedule
}

export interface LocationCard {
  type: 'location'
  title: string
  address: string
  mapUrl: string
  /**
   * Exibir mapa embutido com pin.
   * Omitido = true (mostra se houver link do Maps, coords ou endereço).
   */
  showMap?: boolean
  /** Latitude do pin (preferida sobre geocode do endereço). */
  mapLat?: number
  /** Longitude do pin (preferida sobre geocode do endereço). */
  mapLng?: number
  schedule?: CardSchedule
}

import type { MediaCardVariant } from '../lib/mediaCardLayout'

export type { MediaCardVariant } from '../lib/mediaCardLayout'

export interface SlideStoryItem {
  image?: string
  video?: string
  poster?: string
  /** Duração em segundos para imagens (padrão 5). Vídeos usam a duração do arquivo. */
  duration?: number
  url?: string
  caption?: string
}

export interface SlideCard {
  type: 'slide'
  title?: string
  variant?: MediaCardVariant
  slides: SlideStoryItem[]
  autoplay?: boolean
  schedule?: CardSchedule
}

/** @deprecated use variant — mantido para bios antigas */
export type VideoAspectRatio = 'reel' | 'portrait' | 'square'

export interface VideoCard {
  type: 'video'
  title?: string
  description?: string
  /** Legenda sobreposta no vídeo (estilo reels). Se vazia, usa description. */
  caption?: string
  video: string
  poster?: string
  url?: string
  variant?: MediaCardVariant
  width?: CardWidth
  /** @deprecated use variant */
  aspectRatio?: VideoAspectRatio
  schedule?: CardSchedule
}

export interface ProductItem {
  image: string
  title?: string
  url?: string
  cta?: string
}

export interface ProductsCard {
  type: 'products'
  title?: string
  products: ProductItem[]
  schedule?: CardSchedule
}

export interface YoutubeEmbedCard {
  type: 'youtube-embed'
  title?: string
  /** Legenda sobreposta no player (estilo reels). */
  caption?: string
  url: string
  schedule?: CardSchedule
}

export type SpotifyEmbedTheme = 'dark' | 'light'

export interface SpotifyEmbedCard {
  type: 'spotify-embed'
  title?: string
  /** Código iframe exportado pelo Spotify ou URL de embed. */
  embed?: string
  /** @deprecated Use `embed`. Mantido para bios antigas. */
  url?: string
  /** @deprecated O tema vem no iframe exportado pelo Spotify. */
  theme?: SpotifyEmbedTheme
  /** @deprecated legado */
  size?: 'compact' | 'default'
  schedule?: CardSchedule
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

/** Bloco de texto livre, sem superfície de card. */
export interface TextBlock {
  type: 'text'
  /** Limite aplicado também no editor. */
  text: string
  align?: TextAlignment
  bold?: boolean
  italic?: boolean
  underline?: boolean
  /** Texto mantém fundo transparente por padrão. */
  backgroundMode?: 'template' | 'transparent' | 'custom'
  backgroundColor?: string
  /** Opacidade somente do fundo, de 0 a 100. */
  backgroundOpacity?: number
  schedule?: CardSchedule
}

export type ListStyle = 'number' | 'bullet' | 'letter' | 'plain'

/** Lista com superfície de card e marcadores configuráveis. */
export interface ListCard {
  type: 'list'
  title?: string
  items: string[]
  style?: ListStyle
  /** Superfície padrão do template, sem fundo, ou cor personalizada. */
  backgroundMode?: 'template' | 'transparent' | 'custom'
  backgroundColor?: string
  /** Opacidade somente do fundo, de 0 a 100. */
  backgroundOpacity?: number
  schedule?: CardSchedule
}

export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea'

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  required?: boolean
  placeholder?: string
}

/** Formulário próprio para captar contato sem sair da bio. */
export interface FormCard {
  type: 'form'
  title?: string
  description?: string
  fields: FormField[]
  submitLabel?: string
  successMessage?: string
  schedule?: CardSchedule
}

export interface BioSection {
  id: string
  title: string
  subtitle?: string
  /**
   * Se true, não mostra título/subtítulo na bio pública.
   * O título continua no editor para organizar as seções.
   */
  hideTitle?: boolean
  items: SectionItem[]
  layout?: 'stack' | 'grid-2' | 'instagram-grid'
}

export type SectionItem =
  | WhatsAppHero
  | AppHero
  | FeatureCard
  | LinkCard
  | PressCard
  | GridCard
  | InstagramCard
  | LocationCard
  | VideoCard
  | SlideCard
  | ProductsCard
  | YoutubeEmbedCard
  | SpotifyEmbedCard
  | TextBlock
  | ListCard
  | FormCard

export interface BioConfig {
  brand: BioBrand
  sections: BioSection[]
}
