import type { BioSection, SectionItem } from '../types/bio'
import { itemSpansFullInGrid, groupStackSectionItems } from '../lib/sectionLayout'
import { AppHeroCard } from './AppHeroCard'
import { FeatureCard } from './FeatureCard'
import { GridCard } from './GridCard'
import { LinkCard } from './LinkCard'
import { LocationCard } from './LocationCard'
import { ProductsCard } from './ProductsCard'
import { SlideCard } from './SlideCard'
import { SpotifyEmbedCard } from './SpotifyEmbedCard'
import { VideoCard } from './VideoCard'
import { YoutubeEmbedCard } from './YoutubeEmbedCard'

function SectionTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  if (!title) return null

  return (
    <div className="mb-3 mt-6 px-1">
      <h2 className="bio-section-title text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
        {title}
      </h2>
      {subtitle && <p className="bio-section-subtitle mt-1 text-xs">{subtitle}</p>}
    </div>
  )
}

function itemUsesGridLayout(item: SectionItem, sectionGrid: boolean): boolean {
  if (sectionGrid) return true
  if (item.type === 'link' || item.type === 'feature' || item.type === 'grid') {
    return item.width === 'half'
  }
  return false
}

function renderItem(
  item: SectionItem,
  index: number,
  grid: boolean,
  sectionId: string,
  focused: boolean,
) {
  const delay = { animationDelay: `${index * 60}ms` }
  const inGrid = itemUsesGridLayout(item, grid)
  const spanClass = grid && itemSpansFullInGrid(item) ? 'col-span-2' : ''
  const focusClass = focused ? 'bio-preview-focus' : ''
  const previewAttrs = {
    'data-preview-item': `${sectionId}:${index}`,
  }

  switch (item.type) {
    case 'whatsapp-hero':
    case 'app-hero':
      return (
        <div
          key={`${item.type}-${item.title}-${index}`}
          className={`animate-fade-up h-full ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <AppHeroCard item={item} grid={grid} />
        </div>
      )
    case 'feature':
      return (
        <div
          key={`feature-${item.title}-${index}`}
          className={`animate-fade-up h-full ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <FeatureCard item={item} grid={inGrid} />
        </div>
      )
    case 'link':
      return (
        <div
          key={`link-${item.title}-${index}`}
          className={`animate-fade-up h-full ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <LinkCard item={item} grid={inGrid} />
        </div>
      )
    case 'grid':
      return (
        <div
          key={`grid-${item.title}-${index}`}
          className={`animate-fade-up h-full ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <GridCard item={item} />
        </div>
      )
    case 'location':
      return (
        <div
          key={`location-${item.title}-${index}`}
          className={`animate-fade-up ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <LocationCard item={item} />
        </div>
      )
    case 'video':
      return (
        <div
          key={`video-${item.video}-${index}`}
          className={`animate-fade-up ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <VideoCard item={item} />
        </div>
      )
    case 'slide':
      return (
        <div
          key={`slide-${index}-${item.slides.length}`}
          className={`animate-fade-up ${spanClass} ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <SlideCard item={item} />
        </div>
      )
    case 'products':
      return (
        <div
          key={`products-${index}-${item.products.length}`}
          className={`animate-fade-up col-span-2 ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <ProductsCard item={item} />
        </div>
      )
    case 'youtube-embed':
      return (
        <div
          key={`youtube-${item.url}-${index}`}
          className={`animate-fade-up col-span-2 ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <YoutubeEmbedCard item={item} />
        </div>
      )
    case 'spotify-embed':
      return (
        <div
          key={`spotify-${item.embed ?? item.url ?? index}-${index}`}
          className={`animate-fade-up col-span-2 ${focusClass}`}
          style={delay}
          {...previewAttrs}
        >
          <SpotifyEmbedCard item={item} />
        </div>
      )
    default:
      return null
  }
}

export function BioSectionBlock({
  section,
  focusItemIndex = null,
}: {
  section: BioSection
  focusItemIndex?: number | null
}) {
  const isGrid = section.layout === 'grid-2'

  return (
    <section>
      <SectionTitle title={section.title} subtitle={section.subtitle} />
      {isGrid ? (
        <div className="mb-3 grid grid-cols-2 items-stretch gap-3">
          {section.items.map((item, index) =>
            renderItem(item, index, true, section.id, focusItemIndex === index),
          )}
        </div>
      ) : (
        <div className="mb-3 space-y-3">
          {groupStackSectionItems(section.items).map((row, rowIndex) => {
            if (row.length === 1 && itemUsesGridLayout(row[0], false)) {
              const itemIndex = section.items.indexOf(row[0])
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {renderItem(
                    row[0],
                    itemIndex >= 0 ? itemIndex : rowIndex,
                    false,
                    section.id,
                    focusItemIndex === itemIndex,
                  )}
                </div>
              )
            }

            if (row.length > 1) {
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {row.map((item) => {
                    const itemIndex = section.items.indexOf(item)
                    return renderItem(
                      item,
                      itemIndex >= 0 ? itemIndex : 0,
                      false,
                      section.id,
                      focusItemIndex === itemIndex,
                    )
                  })}
                </div>
              )
            }

            const itemIndex = section.items.indexOf(row[0])
            return renderItem(
              row[0],
              itemIndex >= 0 ? itemIndex : rowIndex,
              false,
              section.id,
              focusItemIndex === itemIndex,
            )
          })}
        </div>
      )}
    </section>
  )
}
