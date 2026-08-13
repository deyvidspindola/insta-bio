import type { ThemePackSnapshot } from '@site/lib/themePacks'

const STORAGE_KEY = 'instabio.saved-theme-packs'

export interface SavedThemePack {
  id: string
  name: string
  category: string
  createdAt: string
  snapshot: ThemePackSnapshot
}

function readAll(): SavedThemePack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedThemePack[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: SavedThemePack[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listSavedThemePacks(): SavedThemePack[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function saveThemePack(input: {
  name: string
  category: string
  snapshot: ThemePackSnapshot
}): SavedThemePack {
  const pack: SavedThemePack = {
    id: `user-${Date.now().toString(36)}`,
    name: input.name.trim() || 'Meu template',
    category: input.category.trim() || 'Personalizado',
    createdAt: new Date().toISOString(),
    snapshot: input.snapshot,
  }
  const all = readAll()
  all.unshift(pack)
  writeAll(all.slice(0, 40))
  return pack
}

export function deleteSavedThemePack(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}
