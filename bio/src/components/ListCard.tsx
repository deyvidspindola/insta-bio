import type { ListCard as ListCardType } from '../types/bio'
import { contrastTextOn } from '../lib/colorEngine'

function letterMarker(index: number): string {
  let value = index + 1
  let result = ''
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(97 + (value % 26)) + result
    value = Math.floor(value / 26)
  }
  return `${result}.`
}

function markerFor(style: ListCardType['style'], index: number): string | null {
  switch (style ?? 'bullet') {
    case 'number':
      return `${index + 1}.`
    case 'letter':
      return letterMarker(index)
    case 'plain':
      return null
    default:
      return '•'
  }
}

export function ListCard({
  item,
  pageBackground,
}: {
  item: ListCardType
  pageBackground: string
}) {
  const backgroundMode = item.backgroundMode ?? 'template'
  const customBackground = item.backgroundColor?.trim() || '#1f2937'
  const backgroundOpacity = Math.max(0, Math.min(100, item.backgroundOpacity ?? 100))
  const colors = contrastTextOn(
    backgroundMode === 'custom' ? customBackground : pageBackground,
  )
  const items = item.items.filter((entry) => entry.trim())
  const shellClass =
    backgroundMode === 'transparent'
      ? 'px-1 py-2'
      : 'bio-card px-4 py-4'
  const backgroundStyle =
    backgroundMode === 'custom'
      ? {
          background:
            backgroundOpacity === 100
              ? customBackground
              : `color-mix(in oklch, ${customBackground} ${backgroundOpacity}%, transparent)`,
        }
      : backgroundMode === 'template' && backgroundOpacity < 100
        ? {
            background: `color-mix(in oklch, var(--color-card) ${backgroundOpacity}%, transparent)`,
          }
        : undefined

  return (
    <div
      className={shellClass}
      style={backgroundStyle}
    >
      {item.title?.trim() && (
        <h3
          className="mb-3 text-sm font-bold leading-tight"
          style={{ color: colors.title }}
        >
          {item.title.trim()}
        </h3>
      )}
      <ul className="space-y-2">
        {items.map((entry, index) => {
          const marker = markerFor(item.style, index)
          return (
            <li
              key={`${index}:${entry}`}
              className={`flex min-w-0 text-sm leading-relaxed ${marker ? 'gap-2.5' : ''}`}
              style={{ color: colors.body }}
            >
              {marker && (
                <span className="w-5 shrink-0 text-right font-semibold text-primary" aria-hidden="true">
                  {marker}
                </span>
              )}
              <span className="min-w-0 flex-1 break-words">{entry}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
