import type { GridCard as GridCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { resolveCardSurface } from '../lib/colorEngine'
import { APP_HERO_PRESETS } from '../lib/appHeroPresets'
import { ArrowIcon } from './icons'
import { CardCoverImage } from './CardCoverImage'

const FALLBACK_GRADIENT = APP_HERO_PRESETS.custom.theme.gradient

export function GridCard({
  item,
  pageBackground = '#000000',
}: {
  item: GridCardType
  pageBackground?: string
}) {
  const clickable = hasClickableUrl(item.url)
  const hasImage = Boolean(item.image?.trim())
  const surface = hasImage
    ? null
    : resolveCardSurface(item.gradient ?? FALLBACK_GRADIENT, pageBackground)
  const titleColor = surface?.titleText ?? '#FFFFFF'
  const bodyColor = surface?.bodyText ?? 'rgba(255,255,255,0.85)'

  return (
    <CardLink
      url={item.url}
      className="bio-card bio-card--media group relative block aspect-square"
    >
      <CardCoverImage
        src={item.image}
        alt={item.title}
        gradient={item.gradient}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {hasImage ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
      ) : null}

      {item.badge && (
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
          {item.badge}
        </span>
      )}

      {clickable && (
        <ArrowIcon className="absolute right-2 top-2 h-4 w-4 text-white/90 drop-shadow" />
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="text-base font-bold leading-tight" style={{ color: titleColor }}>
          {item.title}
        </h3>
        {item.subtitle && (
          <p className="mt-0.5 text-[10px]" style={{ color: bodyColor }}>
            {item.subtitle}
          </p>
        )}
      </div>
    </CardLink>
  )
}
