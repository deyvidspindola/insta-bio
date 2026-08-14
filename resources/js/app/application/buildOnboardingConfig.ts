import { THEME_PACKS } from '@site/lib/themePacks'
import type { BioConfig } from '@bio-types'
import defaultBio from '../../shared/bio.default.json'

export type OnboardingLink = { title: string; url: string }

/**
 * Monta o JSON inicial da bio a partir do default, pack de cores e links.
 */
export function buildOnboardingConfig(
  name: string,
  template: string,
  packId: string,
  links: OnboardingLink[],
): BioConfig {
  const pack = THEME_PACKS.find((item) => item.id === packId)
  const base = structuredClone(defaultBio) as BioConfig
  const displayName = name || 'Minha Bio'

  return {
    ...base,
    brand: {
      ...base.brand,
      ...(pack?.snapshot.brand ?? {}),
      name: displayName,
      template: template as BioConfig['brand']['template'],
      theme: pack?.snapshot.theme ?? base.brand.theme,
      seo: {
        ...base.brand.seo,
        title: `${displayName} · Link da Bio`,
      },
    },
    sections: [
      {
        id: 'links',
        title: 'Links',
        hideTitle: true,
        items: links
          .filter((link) => link.title.trim() && link.url.trim())
          .map((link) => ({
            type: 'link' as const,
            title: link.title,
            url: link.url,
          })),
      },
    ],
  }
}
