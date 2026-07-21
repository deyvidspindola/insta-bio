import type { CSSProperties } from 'react'
import type { TextBlock as TextBlockType } from '../types/bio'
import { contrastTextOn } from '../lib/colorEngine'

export function TextBlock({
  item,
  pageBackground,
}: {
  item: TextBlockType
  pageBackground: string
}) {
  const backgroundMode = item.backgroundMode ?? 'transparent'
  const customBackground = item.backgroundColor?.trim() || '#1f2937'
  const backgroundOpacity = Math.max(0, Math.min(100, item.backgroundOpacity ?? 100))
  const colors = contrastTextOn(
    backgroundMode === 'custom' ? customBackground : pageBackground,
  )
  const style: CSSProperties = {
    color: colors.body,
    textAlign: item.align ?? 'left',
    fontWeight: item.bold ? 700 : 400,
    fontStyle: item.italic ? 'italic' : 'normal',
    textDecoration: item.underline ? 'underline' : 'none',
  }
  const shellClass =
    backgroundMode === 'transparent'
      ? 'px-1 py-1'
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
    <div className={shellClass} style={backgroundStyle}>
      <p
        className="whitespace-pre-wrap break-words text-sm leading-relaxed"
        style={style}
      >
        {item.text.slice(0, 300)}
      </p>
    </div>
  )
}
