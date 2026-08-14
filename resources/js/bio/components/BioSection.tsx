import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import type { BioSection, SectionItem } from '../types/bio'
import { filterVisibleItems, itemHasScheduleWindow, isItemVisibleNow } from '../lib/cardSchedule'
import { itemSpansFullInGrid, groupStackSectionItems } from '../lib/sectionLayout'
import { contrastTextOn } from '../lib/colorEngine'
import { itemTrackLabel } from '../lib/itemLabel'
import { AppHeroCard } from './AppHeroCard'
import { FeatureCard } from './FeatureCard'
import { GridCard } from './GridCard'
import { LinkCard } from './LinkCard'
import { ListCard } from './ListCard'
import { LocationCard } from './LocationCard'
import { PressCard } from './PressCard'
import { ProductsCard } from './ProductsCard'
import { SlideCard } from './SlideCard'
import { SpotifyEmbedCard } from './SpotifyEmbedCard'
import { TextBlock } from './TextBlock'
import { FormCardBlock } from './FormCardBlock'
import { VideoCard } from './VideoCard'
import { YoutubeEmbedCard } from './YoutubeEmbedCard'

function isPreviewMode() {
  return typeof document !== 'undefined' && document.documentElement.dataset.bioPreview === '1'
}

function wrapPreviewItem({
  sectionId,
  index,
  itemType,
  label,
  className,
  style,
  scheduled = false,
  scheduleLive = true,
  children,
}: {
  sectionId: string
  index: number
  itemType: string
  label?: string
  className: string
  style?: CSSProperties
  scheduled?: boolean
  /** false = agendado mas fora da janela agora */
  scheduleLive?: boolean
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
      data-item-type={itemType}
      data-item-label={label || undefined}
      className={`relative ${className}${preview ? ' bio-preview-selectable' : ''}${
        preview && scheduled && !scheduleLive ? ' bio-preview-scheduled-hidden' : ''
      }`}
      style={style}
      onClickCapture={preview ? onClickCapture : undefined}
    >
      {preview && scheduled && (
        <span
          className={`bio-preview-schedule-tag${
            scheduleLive ? '' : ' bio-preview-schedule-tag--hidden'
          }`}
        >
          {scheduleLive ? 'Agendado' : 'Agendado · oculto'}
        </span>
      )}
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
  if (item.type === 'link' || item.type === 'feature' || item.type === 'grid' || item.type === 'press') {
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
  const scheduled = itemHasScheduleWindow(item)
  const scheduleLive = !scheduled || isItemVisibleNow(item)
  const scheduleProps = { scheduled, scheduleLive }

  switch (item.type) {
    case 'whatsapp-hero':
    case 'app-hero':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `${shell} h-full`,
        style: delay,
        ...scheduleProps,
        children: <AppHeroCard item={item} grid={grid} pageBackground={pageBackground} />,
      })
    case 'feature':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `${shell} h-full`,
        style: delay,
        ...scheduleProps,
        children: <FeatureCard item={item} grid={inGrid} pageBackground={pageBackground} />,
      })
    case 'link':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `${shell} h-full`,
        style: delay,
        ...scheduleProps,
        children: <LinkCard item={item} grid={inGrid} />,
      })
    case 'press':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `${shell} h-full`,
        style: delay,
        ...scheduleProps,
        children: <PressCard item={item} grid={inGrid} pageBackground={pageBackground} />,
      })
    case 'grid':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `${shell} h-full`,
        style: delay,
        ...scheduleProps,
        children: <GridCard item={item} pageBackground={pageBackground} />,
      })
    case 'location':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: shell,
        style: delay,
        ...scheduleProps,
        children: <LocationCard item={item} />,
      })
    case 'video':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: shell,
        style: delay,
        ...scheduleProps,
        children: <VideoCard item={item} />,
      })
    case 'slide':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: shell,
        style: delay,
        ...scheduleProps,
        children: <SlideCard item={item} />,
      })
    case 'products':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        ...scheduleProps,
        children: <ProductsCard item={item} />,
      })
    case 'youtube-embed':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        ...scheduleProps,
        children: <YoutubeEmbedCard item={item} />,
      })
    case 'spotify-embed':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        ...scheduleProps,
        children: <SpotifyEmbedCard item={item} />,
      })
    case 'text':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        ...scheduleProps,
        children: <TextBlock item={item} pageBackground={pageBackground} />,
      })
    case 'list':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        ...scheduleProps,
        children: <ListCard item={item} pageBackground={pageBackground} />,
      })
    case 'form':
      return wrapPreviewItem({
        sectionId,
        index,
        itemType: item.type,
        label: itemTrackLabel(item),
        className: `animate-fade-up col-span-2 ${focusClass}`.trim(),
        style: delay,
        ...scheduleProps,
        children: <FormCardBlock item={item} sectionId={sectionId} itemIndex={index} />,
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
  // Preview do editor: mostra todos (incl. fora da janela). Bio pública: filtra schedule.
  const items = isPreviewMode() ? section.items : filterVisibleItems(section.items)

  function originalIndex(item: SectionItem, fallback: number) {
    const idx = section.items.indexOf(item)
    return idx >= 0 ? idx : fallback
  }

  return (
    <section>
      {!section.hideTitle && (
        <SectionTitle
          title={section.title}
          subtitle={section.subtitle}
          pageBackground={pageBackground}
        />
      )}
      {isGrid ? (
        <div className="mb-3 grid grid-cols-2 items-stretch gap-3">
          {items.map((item, index) =>
            renderItem(
              item,
              originalIndex(item, index),
              true,
              section.id,
              focusItemIndex === originalIndex(item, index),
              pageBackground,
            ),
          )}
        </div>
      ) : (
        <div className="mb-3 space-y-3">
          {groupStackSectionItems(items).map((row, rowIndex) => {
            if (row.length === 1 && itemUsesGridLayout(row[0], false)) {
              const itemIndex = originalIndex(row[0], rowIndex)
              return (
                <div key={`row-${rowIndex}`} className="grid grid-cols-2 items-stretch gap-3">
                  {renderItem(
                    row[0],
                    itemIndex,
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
                    const itemIndex = originalIndex(item, 0)
                    return renderItem(
                      item,
                      itemIndex,
                      false,
                      section.id,
                      focusItemIndex === itemIndex,
                      pageBackground,
                    )
                  })}
                </div>
              )
            }

            const itemIndex = originalIndex(row[0], rowIndex)
            return renderItem(
              row[0],
              itemIndex,
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
