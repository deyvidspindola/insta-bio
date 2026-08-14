import type { LinkCard as LinkCardType } from '../types/bio'
import { CardLink, isCardInteractive } from '../lib/cardLink'
import { BioIcon } from './icons'
import { CardActionIcon } from './CardActionIcon'

export function LinkCard({ item, grid = false }: { item: LinkCardType; grid?: boolean }) {
  const interactive = isCardInteractive(item.action, item.url, undefined, item.pageSlug)
  const hasIcon = Boolean(item.icon)

  if (grid) {
    return (
      <CardLink
        url={item.url}
        action={item.action}
        pageSlug={item.pageSlug}
        className="bio-card bio-link-card bio-link-card--grid group relative flex h-full flex-col p-3"
      >
        <div className="bio-link-body mb-3 flex items-center justify-between">
          {hasIcon ? (
            <div className="bio-link-icon-wrap flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <BioIcon name={item.icon} className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <span />
          )}
          {interactive && (
            <span className="bio-link-arrow text-muted-foreground transition-colors group-hover:text-primary">
              <CardActionIcon className="h-4 w-4 shrink-0" />
            </span>
          )}
        </div>
        <div className={`min-w-0 ${item.subtitle ? '' : 'mt-auto'}`}>
          <h3 className="bio-link-title text-sm font-bold leading-tight text-foreground">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="bio-link-subtitle bio-text-secondary mt-1 text-xs leading-snug">
              {item.subtitle}
            </p>
          )}
        </div>
      </CardLink>
    )
  }

  return (
    <CardLink
      url={item.url}
      action={item.action}
      pageSlug={item.pageSlug}
      className="bio-card bio-link-card group relative block"
    >
      <div className="bio-link-body flex items-center gap-4 p-4">
        {hasIcon && (
          <div className="bio-link-icon-wrap flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <BioIcon name={item.icon} className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="bio-link-title text-base font-bold leading-tight text-foreground">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="bio-link-subtitle bio-text-secondary mt-0.5 text-xs">{item.subtitle}</p>
          )}
        </div>
        {interactive && (
          <span className="bio-link-arrow text-muted-foreground transition-colors group-hover:text-primary">
            <CardActionIcon className="h-4 w-4 shrink-0" />
          </span>
        )}
      </div>
    </CardLink>
  )
}
