import type { SectionItem } from '../types/bio'

export type CardWidth = 'full' | 'half'

export function itemCardWidth(item: SectionItem): CardWidth {
  if (
    (item.type === 'link' || item.type === 'feature' || item.type === 'grid') &&
    item.width === 'half'
  ) {
    return 'half'
  }
  return 'full'
}

export function itemSpansFullInGrid(item: SectionItem): boolean {
  if (
    item.type === 'products' ||
    item.type === 'youtube-embed' ||
    item.type === 'spotify-embed' ||
    item.type === 'text' ||
    item.type === 'list'
  ) {
    return true
  }
  if (item.type === 'video' || item.type === 'slide') {
    return itemCardWidth(item) === 'full'
  }
  if (item.type === 'link' || item.type === 'feature' || item.type === 'grid') {
    return itemCardWidth(item) === 'full'
  }
  return false
}

/** Agrupa cards em linhas para layout empilhado com opção de metade da largura. */
export function groupStackSectionItems(items: SectionItem[]): SectionItem[][] {
  const rows: SectionItem[][] = []
  let halfRow: SectionItem[] = []

  function flushHalfRow() {
    if (halfRow.length > 0) {
      rows.push(halfRow)
      halfRow = []
    }
  }

  for (const item of items) {
    if (itemCardWidth(item) === 'half') {
      halfRow.push(item)
      if (halfRow.length === 2) flushHalfRow()
      continue
    }

    flushHalfRow()
    rows.push([item])
  }

  flushHalfRow()
  return rows
}
