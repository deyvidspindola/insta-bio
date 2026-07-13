import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import type { BioSection, SectionItem } from '../types/bio'
import { itemSpansFullInGrid, groupStackSectionItems } from '../lib/sectionLayout'
import { contrastTextOn } from '../lib/colorEngine'
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

function isPreviewMode() {
  return typeof document !== 'undefined' && document.documentElement.dataset.bioPreview === '1'
}

function wrapPreviewItem({
  sectionId,
  index,
  className,
  style,
  children,
}: {
  sectionId: string
  index: number
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  const preview = isPreviewMode()

  function onClickCapture(event: MouseEvent) {
    if (!preview) return
    event.preventDefault()
    event.stopPropagation()
    window.parent.postMessage(
      { type: 'bio-preview-select', sectionId, itemIndex: index },
      '*',
    )
  }

  return (
    <div
      key={`${sectionId}:${index}`}
      data-preview-item={`${sectionId}:${index}`}
      className={`${className}${preview ? ' bio-preview-selectable' : ''}`}
      style={style}
      onClickCapture={preview ? onClickCapture : undefined}
    >
      {children}
    </div>
  )
}

function SectionTitle({
  title,
  subtitle,
  pageBackground,
}: {
  title: string
  subtitle?: string
  pageBackground: string
}) {
  if (!title) return null
  const textColors = contrastTextOn(pageBackground)

  return (
    <div className="mb-3 mt-6 px-1">
      <h2
        className="bio-section-title text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: textColors.title }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="bio-section-subtitle mt-1 text-xs" style={{ color: textColors.body }}>
          {subtitle}
        </p>
      )}
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
  pageBackground: string,
) {
  const delay = { animationDelay: `${index * 60}ms` }
  const inGrid = itemUsesGridLayout(item, grid)
  const spanClass = grid && itemSpansFullInGrid(item) ? 'col-span-2' : ''
  const focusClass = focused ? 'bio-preview-focus' : ''
  const shell = `animate-fade-up ${spanClass} ${focusClass}`.trim()

  switch (item.type) {
    case 'whatsapp-hero':
    case 'app-hero':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <AppHeroCard item={item} grid={grid} pageBackground={pageBackground} />,
      })
    case 'feature':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <FeatureCard item={item} grid={inGrid} pageBackground={pageBackground} />,
      })
    case 'link':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <LinkCard item={item} grid={inGrid} />,
      })
    case 'grid':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `${shell} h-full`,
        style: delay,
        children: <GridCard item={item} pageBackground={pageBackground} />,
      })
    case 'location':
      return wrapPreviewItem({
        sectionId,
        index,
        className: shell,
        style: delay,
        children: <LocationCard item={item} />,
      })
    case 'video':
      return wrapPreviewItem({
        sectionId,
        index,
        className: shell,
        style: delay,
        children: <VideoCard item={item} />,
      })
    case 'slide':
      return wrapPreviewItem({
        sectionId,
        index,
        className: shell,
        style: delay,
        children: <SlideCard item={item} />,
      })
    case 'products':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        children: <ProductsCard item={item} />,
      })
    case 'youtube-embed':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        children: <YoutubeEmbedCard item={item} />,
      })
    case 'spotify-embed':
      return wrapPreviewItem({
        sectionId,
        index,
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        children: <SpotifyEmbedCard item={item} />,
      })
    default:
      return null
  }
}

export function BioSectionBlock({
  section,
  pageBackground = '#000000',
  focusItemIndex = null,
}: {
  section: BioSection
  /** Fundo efetivo da bio — ver BioPage.tsx (resolveEffectiveBioBackground). */
  pageBackground?: string
  focusItemIndex?: number | null
}) {
  const isGrid = section.layout === 'grid-2'

  return (
    <section>
      <SectionTitle
        title={section.title}
        subtitle={section.subtitle}
        pageBackground={pageBackground}
      />
      {isGrid ? (
        <div className="mb-3 grid grid-cols-2 items-stretch gap-3">
          {section.items.map((item, index) =>
            renderItem(item, index, true, section.id, focusItemIndex === index, pageBackground),
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
                    pageBackground,
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
                      pageBackground,
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
              pageBackground,
            )
          })}
        </div>
      )}
    </section>
  )
}
