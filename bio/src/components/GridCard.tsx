import type { GridCard as GridCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { resolveAccentCardTheme } from '../lib/accentTheme'
import { ArrowIcon } from './icons'
import { CardCoverImage } from './CardCoverImage'

export function GridCard({
  item,
  pageBackground = '#000000',
}: {
  item: GridCardType
  pageBackground?: string
}) {
  const clickable = hasClickableUrl(item.url)
  const hasImage = Boolean(item.image?.trim())
  const theme = resolveAccentCardTheme(item.accentColor, pageBackground, item.gradient)

  return (
    <CardLink
      url={item.url}
      className={`bio-card bio-card--media bio-card--grid group relative block aspect-square overflow-hidden border transition-all ${
        clickable ? '' : 'cursor-default'
      }`}
      style={{ borderColor: theme.border }}
      onMouseEnter={(e) => {
        if (!clickable) return
        e.currentTarget.style.borderColor = theme.borderHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
      }}
    >
      <CardCoverImage
        src={item.image}
        alt={item.title}
        gradient={theme.gradient}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {hasImage ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
      ) : null}

      {item.badge && (
        <span
          className="absolute left-2 top-2 text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: hasImage ? 'rgba(255,255,255,0.9)' : theme.badgeText }}
        >
          {item.badge}
        </span>
      )}

      {clickable && (
        <span
          className="absolute right-2 top-2"
          style={{ color: hasImage ? 'rgba(255,255,255,0.9)' : theme.bodyText }}
        >
          <ArrowIcon className="h-4 w-4 drop-shadow" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3
          className="text-base font-bold leading-tight"
          style={{ color: hasImage ? '#FFFFFF' : theme.titleText }}
        >
          {item.title}
        </h3>
        {item.subtitle && (
          <p
            className="mt-0.5 text-[10px]"
            style={{ color: hasImage ? 'rgba(255,255,255,0.85)' : theme.bodyText }}
          >
            {item.subtitle}
          </p>
        )}
      </div>
    </CardLink>
  )
}
