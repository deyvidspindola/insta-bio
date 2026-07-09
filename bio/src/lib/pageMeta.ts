import type { BioBrand } from '../types/bio'
import { publicBase, resolvePublicUrl } from './publicUrl'

export function pageTitle(brand: Pick<BioBrand, 'name'>): string {
  const name = brand.name.trim()
  return name || 'Link na Bio'
}

export function pageDescription(brand: Pick<BioBrand, 'name' | 'tagline'>): string {
  const name = brand.name.trim()
  const tagline = (brand.tagline ?? '').trim()

  if (name && tagline) return `${name}. ${tagline}`
  if (name) return name
  if (tagline) return tagline
  return 'Link na Bio'
}

function faviconMime(path: string): string {
  const lower = path.toLowerCase().split('?')[0]
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/png'
}

function defaultFaviconHref(): string {
  const base = publicBase()
  return base === '/' ? '/favicon.svg' : `${base}favicon.svg`
}

function setMetaProperty(property: string, content: string): void {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaName(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMetaProperty(property: string): void {
  document.querySelector(`meta[property="${property}"]`)?.remove()
}

function removeMetaName(name: string): void {
  document.querySelector(`meta[name="${name}"]`)?.remove()
}

export function applyPageMeta(brand: Pick<BioBrand, 'name' | 'tagline' | 'logo'>): void {
  const title = pageTitle(brand)
  const description = pageDescription(brand)
  document.title = title

  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', description)
  }

  setMetaProperty('og:title', title)
  setMetaProperty('og:description', description)
  setMetaName('twitter:title', title)
  setMetaName('twitter:description', description)

  const pageUrl = `${window.location.origin}${window.location.pathname}`
  setMetaProperty('og:url', pageUrl)

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  const logo = (brand.logo ?? '').trim()
  if (logo) {
    const logoUrl = resolvePublicUrl(logo)
    link.href = logoUrl
    link.type = faviconMime(logo)

    const absoluteImage = new URL(logoUrl, window.location.origin).href
    setMetaProperty('og:image', absoluteImage)
    setMetaName('twitter:image', absoluteImage)
    setMetaName('twitter:card', 'summary_large_image')
  } else {
    link.href = defaultFaviconHref()
    link.type = 'image/svg+xml'
    removeMetaProperty('og:image')
    removeMetaName('twitter:image')
    setMetaName('twitter:card', 'summary')
  }
}

export function syncBrandSeo(brand: BioBrand): BioBrand {
  return {
    ...brand,
    seo: {
      ...brand.seo,
      title: pageTitle(brand),
      description: pageDescription(brand),
    },
  }
}
