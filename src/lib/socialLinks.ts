import type { BioBrand, SocialLink } from '../types/bio'

/** Extrai @usuario a partir de URL ou texto do Instagram. */
export function parseInstagramHandleFromUrl(input: string): string {
  const raw = input.trim()
  if (!raw) return ''

  if (raw.startsWith('@')) return raw

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    if (!url.hostname.replace(/^www\./, '').includes('instagram.com')) return ''
    const username = url.pathname.split('/').filter(Boolean)[0]
    return username ? `@${username.replace(/^@/, '')}` : ''
  } catch {
    return ''
  }
}

export function defaultInstagramSocialLink(brand: Pick<BioBrand, 'instagram'>): SocialLink {
  return {
    network: 'instagram',
    url: brand.instagram?.url?.trim() || '',
  }
}

/** Garante socialLinks e mantém brand.instagram sincronizado (legado / capa). */
export function normalizeBrandSocial(brand: BioBrand): BioBrand {
  let socialLinks = brand.socialLinks ? [...brand.socialLinks] : []

  if (socialLinks.length === 0 && brand.instagram?.url?.trim()) {
    socialLinks = [{ network: 'instagram', url: brand.instagram.url.trim() }]
  }

  if (socialLinks.length === 0) {
    socialLinks = [defaultInstagramSocialLink(brand)]
  }

  const instagramLink = socialLinks.find((link) => link.network === 'instagram')
  const instagramUrl = instagramLink?.url?.trim() || brand.instagram?.url?.trim() || ''
  const instagramHandle =
    parseInstagramHandleFromUrl(instagramUrl) ||
    brand.instagram?.handle?.trim() ||
    ''

  return {
    ...brand,
    socialLinks,
    instagram: {
      handle: instagramHandle,
      url: instagramUrl,
    },
  }
}

export function syncBrandSocialLinks(brand: BioBrand, socialLinks: SocialLink[]): BioBrand {
  const nextLinks = socialLinks.length > 0 ? socialLinks : [defaultInstagramSocialLink(brand)]
  return normalizeBrandSocial({ ...brand, socialLinks: nextLinks })
}
