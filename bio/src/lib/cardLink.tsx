import type { ReactNode } from 'react'
import { trackClick, trackMetaFromElement } from './analytics'

export function hasClickableUrl(url?: string): boolean {
  const value = url?.trim() ?? ''
  if (!value || value === '#' || value === 'https://' || value === 'http://') return false

  try {
    const href = value.includes('://') ? value : `https://${value}`
    const parsed = new URL(href)
    return parsed.hostname.length > 0
  } catch {
    return false
  }
}

export function resolveCardHref(url: string): string {
  const value = url.trim()
  return value.includes('://') ? value : `https://${value}`
}

type CardLinkProps = {
  url?: string
  className?: string
  children: ReactNode
  onMouseEnter?: React.MouseEventHandler<HTMLElement>
  onMouseLeave?: React.MouseEventHandler<HTMLElement>
  style?: React.CSSProperties
}

export function CardLink({
  url,
  className = '',
  children,
  onMouseEnter,
  onMouseLeave,
  style,
}: CardLinkProps) {
  if (hasClickableUrl(url)) {
    const href = resolveCardHref(url!)

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={style}
        onClick={(event) => {
          const fromDom = trackMetaFromElement(event.currentTarget)
          trackClick({
            ...fromDom,
            url: href,
          })
        }}
      >
        {children}
      </a>
    )
  }

  return (
    <div
      className={`${className} cursor-default`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      aria-disabled="true"
    >
      {children}
    </div>
  )
}
