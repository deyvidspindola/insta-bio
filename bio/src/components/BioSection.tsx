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

function renderItem(item: SectionItem, index: number, grid: boolean) {
  const delay = { animationDelay: `${index * 60}ms` }
  const inGrid = itemUsesGridLayout(item, grid)
  const spanClass = grid && itemSpansFullInGrid(item) ? 'col-span-2' : ''

  switch (item.type) {
    case 'whatsapp-hero':
    case 'app-hero':
      return (
        <div
          key={`${item.type}-${item.title}-${index}`}
          className={`animate-fade-up h-full ${spanClass}`}
          style={delay}
        >
          <AppHeroCard item={item} grid={grid} />
        </div>
      )
    case 'feature':
      return (
        <div key={`feature-${item.title}-${index}`} className={`animate-fade-up h-full ${spanClass}`} style={delay}>
          <FeatureCard item={item} grid={inGrid} />
        </div>
      )
    case 'link':
      return (
        <div key={`link-${item.title}-${index}`} className={`animate-fade-up h-full ${spanClass}`} style={delay}>
          <LinkCard item={item} grid={inGrid} />
        </div>
      )
    case 'grid':
      return (
        <div key={`grid-${item.title}-${index}`} className={`animate-fade-up h-full ${spanClass}`} style={delay}>
          <GridCard item={item} />
        </div>
      )
    case 'location':
      return (
        <div key={`location-${item.title}-${index}`} className={`animate-fade-up ${spanClass}`} style={delay}>
          <LocationCard item={item} />
        </div>
      )
    case 'video':
      return (
        <div key={`video-${item.video}-${index}`} className={`animate-fade-up ${spanClass}`} style={delay}>
          <VideoCard item={item} />
        </div>
      )
    case 'slide':
      return (
        <div key={`slide-${index}-${item.slides.length}`} className={`animate-fade-up ${spanClass}`} style={delay}>
          <SlideCard item={item} />
        </div>
      )
    case 'products':
      return (
        <div key={`products-${index}-${item.products.length}`} className={`animate-fade-up col-span-2`} style={delay}>
          <ProductsCard item={item} />
        </div>
      )
    case 'youtube-embed':
      return (
        <div key={`youtube-${item.url}-${index}`} className={`animate-fade-up col-span-2`} style={delay}>
          <YoutubeEmbedCard item={item} />
        </div>
      )
    case 'spotify-embed':
      return (
        <div key={`spotify-${item.embed ?? item.url ?? index}-${index}`} className={`animate-fade-up col-span-2`} style={delay}>
          <SpotifyEmbedCard item={item} />
        </div>
      )
    default:
      return null
  }
}

export function BioSectionBlock({ section }: { section: BioSection }) {
  const isGrid = section.layout === 'grid-2'

  return (
    <section>
      <SectionTitle title={section.title} subtitle={section.subtitle} />
      {isGrid ? (
        <div className="mb-3 grid grid-cols-2 items-stretch gap-3">
          {section.items.map((item, index) => renderItem(item, index, true))}
        </div>
      ) : (
        <div className="mb-3 space-y-3">
          {groupStackSectionItems(section.items).map((row, rowIndex) => {
            if (row.length === 1 && itemUsesGridLayout(row[0], false)) {
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {renderItem(row[0], rowIndex, false)}
                </div>
              )
            }

            if (row.length > 1) {
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {row.map((item, cellIndex) => renderItem(item, rowIndex * 2 + cellIndex, false))}
                </div>
              )
            }

            return renderItem(row[0], rowIndex, false)
          })}
        </div>
      )}
    </section>
  )
}
