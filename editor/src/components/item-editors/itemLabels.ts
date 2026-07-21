import type { SectionItem } from '@bio-types'
import { APP_HERO_PRESETS } from '@site/lib/appHeroPresets'
import { CARD_TYPES } from '../../lib/bio'

export function itemTypeLabel(item: SectionItem): string {
  if (item.type === 'app-hero') return `Destaque · ${APP_HERO_PRESETS[item.preset].label}`
  if (item.type === 'whatsapp-hero') return 'WhatsApp destaque'
  return CARD_TYPES.find((t) => t.value === item.type)?.label ?? item.type
}

export function itemPreviewTitle(item: SectionItem): string {
  if ('title' in item && item.title) return item.title
  if (item.type === 'text') return item.text.trim() || 'Texto'
  if (item.type === 'list') return item.items.find((entry) => entry.trim())?.trim() || 'Lista'
  if (item.type === 'video') return 'Vídeo'
  if (item.type === 'slide') return 'Slides'
  if (item.type === 'products') return 'Produtos'
  if (item.type === 'youtube-embed') return 'YouTube'
  if (item.type === 'spotify-embed') return 'Spotify'
  return item.type
}
