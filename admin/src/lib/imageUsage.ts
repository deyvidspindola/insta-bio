import type { BioConfig } from '@bio-types'

/** Normaliza caminhos de assets para comparação (ex.: /assets/foo.png → foo.png). */
export function normalizeAssetFilename(path: string): string {
  let value = path.trim()
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      value = new URL(value).pathname
    } catch {
      return value.toLowerCase()
    }
  }
  value = value.replace(/^\/+/, '')
  if (value.startsWith('assets/')) value = value.slice('assets/'.length)
  return value.toLowerCase()
}

export function collectUsedAssetFilenames(config: BioConfig): Set<string> {
  const used = new Set<string>()

  function track(value?: string) {
    if (!value) return
    if (!value.includes('assets')) return
    used.add(normalizeAssetFilename(value))
  }

  track(config.brand.logo)
  track(config.brand.coverImage)

  for (const section of config.sections) {
    for (const item of section.items) {
      if ('image' in item) track(item.image)
    }
  }

  return used
}

export function isAssetInUse(filename: string, config: BioConfig): boolean {
  return collectUsedAssetFilenames(config).has(normalizeAssetFilename(filename))
}
