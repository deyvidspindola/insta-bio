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

export type BioTemplate = 'classic' | 'pill' | 'outline' | 'solid' | 'glass' | 'soft'

export interface BioBrand {
  name: string
  tagline?: string
  location: string
  instagram: {
    handle: string
    url: string
  }
  logo: string
  coverImage?: string
  template?: BioTemplate
  theme: {
    primary: string
    secondary?: string
    glow?: string
    background?: string
    backgroundImage?: string
    /** ID de gradiente pronto (ver backgroundPresets.ts) */
    backgroundPreset?: string
    /** 0 = cantos retos, 100 = máximo arredondamento (32px) */
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

export interface WhatsAppHero {
  type: 'whatsapp-hero'
  badge: string
  title: string
  description: string
  cta: string
  url: string
  layout?: AppHeroLayout
}

export interface AppHero {
  type: 'app-hero'
  preset: AppHeroPreset
  badge: string
  title: string
  description: string
  cta: string
  url: string
  icon?: IconName
  layout?: AppHeroLayout
}

export interface FeatureCard {
  type: 'feature'
  badge?: string
  title: string
  description?: string
  cta?: string
  url: string
  variant?: 'gradient' | 'compact' | 'portrait' | 'banner' | 'square'
  icon?: IconName
  image?: string
  gradient?: string
  tags?: Array<{ label: string; icon?: IconName }>
}

export interface LinkCard {
  type: 'link'
  title: string
  subtitle?: string
  url: string
  icon?: IconName
}

export interface GridCard {
  type: 'grid'
  badge?: string
  title: string
  subtitle?: string
  url: string
  image?: string
  gradient?: string
}

export interface InstagramCard {
  type: 'instagram'
  name: string
  category: string
  handle: string
  url: string
  gradient: string
  icon?: IconName
}

export interface LocationCard {
  type: 'location'
  title: string
  address: string
  mapUrl: string
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
}

/** @deprecated use variant — mantido para bios antigas */
export type VideoAspectRatio = 'reel' | 'portrait' | 'square'

export interface VideoCard {
  type: 'video'
  title?: string
  description?: string
  video: string
  poster?: string
  url?: string
  variant?: MediaCardVariant
  /** @deprecated use variant */
  aspectRatio?: VideoAspectRatio
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
}

export interface BioSection {
  id: string
  title: string
  subtitle?: string
  items: SectionItem[]
  layout?: 'stack' | 'grid-2' | 'instagram-grid'
}

export type SectionItem =
  | WhatsAppHero
  | AppHero
  | FeatureCard
  | LinkCard
  | GridCard
  | InstagramCard
  | LocationCard
  | VideoCard
  | SlideCard
  | ProductsCard

export interface BioConfig {
  brand: BioBrand
  sections: BioSection[]
}
