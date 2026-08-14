import type { SectionItem } from '../types/bio'
import { hasClickableUrl, resolveCardHref } from './cardLink'

/** Encurta URL para relatório (host + path curto). */
export function shortUrlLabel(url?: string): string | undefined {
  const raw = url?.trim()
  if (!raw || !hasClickableUrl(raw)) return undefined

  try {
    const parsed = new URL(resolveCardHref(raw))
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'forms.gle' || (host.endsWith('google.com') && parsed.pathname.includes('/forms'))) {
      return 'Formulário Google'
    }
    if (host.includes('calendar.google.com')) {
      return 'Agenda Google'
    }
    if (host.includes('wa.me') || host.includes('whatsapp.com')) {
      return 'WhatsApp'
    }
    if (host.includes('tally.so')) {
      return 'Formulário Tally'
    }
    if (host.includes('youtube.com') || host === 'youtu.be') {
      return 'YouTube'
    }
    if (host.includes('instagram.com')) {
      return 'Instagram'
    }

    const path = parsed.pathname.replace(/\/$/, '')
    if (path && path !== '/') {
      const short = path.length > 28 ? `${path.slice(0, 27)}…` : path
      return `${host}${short}`
    }
    return host
  } catch {
    return raw.length > 40 ? `${raw.slice(0, 39)}…` : raw
  }
}

/**
 * Nome legível do card para analytics / ranking.
 * Ordem: título → reportName (legado) → descrição → CTA → badge → tags → URL → tipo.
 */
export function itemTrackLabel(item: SectionItem): string | undefined {
  if ('title' in item && typeof item.title === 'string' && item.title.trim()) {
    return item.title.trim()
  }
  if ('reportName' in item && typeof item.reportName === 'string' && item.reportName.trim()) {
    return item.reportName.trim()
  }
  if ('description' in item && typeof item.description === 'string' && item.description.trim()) {
    return item.description.trim().slice(0, 80)
  }
  if ('subtitle' in item && typeof item.subtitle === 'string' && item.subtitle.trim()) {
    return item.subtitle.trim()
  }
  if ('cta' in item && typeof item.cta === 'string' && item.cta.trim()) {
    return item.cta.trim()
  }
  if ('badge' in item && typeof item.badge === 'string' && item.badge.trim()) {
    return item.badge.trim()
  }
  if ('source' in item && typeof item.source === 'string' && item.source.trim()) {
    return item.source.trim()
  }
  if (
    'tags' in item &&
    Array.isArray(item.tags) &&
    item.tags.length > 0 &&
    typeof item.tags[0]?.label === 'string' &&
    item.tags[0].label.trim()
  ) {
    return item.tags[0].label.trim()
  }
  if ('text' in item && typeof item.text === 'string' && item.text.trim()) {
    return item.text.trim().slice(0, 80)
  }
  if ('url' in item && typeof item.url === 'string') {
    const fromUrl = shortUrlLabel(item.url)
    if (fromUrl) return fromUrl
  }
  if ('mapUrl' in item && typeof item.mapUrl === 'string') {
    const fromMap = shortUrlLabel(item.mapUrl)
    if (fromMap) return fromMap
  }

  return typeFallbackLabel(item.type)
}

function typeFallbackLabel(type: string): string {
  const map: Record<string, string> = {
    feature: 'Destaque',
    link: 'Link',
    'app-hero': 'Atalho',
    'whatsapp-hero': 'WhatsApp',
    press: 'Imprensa',
    location: 'Localização',
    video: 'Vídeo',
    slide: 'Slides',
    products: 'Produtos',
    grid: 'Card',
    'youtube-embed': 'YouTube',
    'spotify-embed': 'Spotify',
    text: 'Texto',
    list: 'Lista',
    form: 'Formulário',
  }
  return map[type] ?? 'Card'
}

/** Label para UI do dashboard (cliques já gravados, inclusive sem label). */
export function displayClickLabel(
  label: string | null | undefined,
  targetUrl: string | null | undefined,
  itemType?: string | null,
): string {
  if (label?.trim()) return label.trim()
  const fromUrl = shortUrlLabel(targetUrl ?? undefined)
  if (fromUrl) return fromUrl
  if (itemType) return typeFallbackLabel(itemType)
  return 'Sem título'
}
