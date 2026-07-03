import type { BioSection, SectionItem } from '../types/bio'
import { AppHeroCard } from './AppHeroCard'
import { FeatureCard } from './FeatureCard'
import { GridCard } from './GridCard'
import { LinkCard } from './LinkCard'
import { LocationCard } from './LocationCard'

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
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function renderItem(item: SectionItem, index: number, grid: boolean) {
  const delay = { animationDelay: `${index * 60}ms` }

  switch (item.type) {
    case 'whatsapp-hero':
    case 'app-hero':
      return (
        <div key={item.title} className="animate-fade-up" style={delay}>
          <AppHeroCard item={item} />
        </div>
      )
    case 'feature':
      return (
        <div key={item.title} className="animate-fade-up" style={delay}>
          <FeatureCard item={item} />
        </div>
      )
    case 'link':
      return (
        <div key={item.title} className="h-full animate-fade-up" style={delay}>
          <LinkCard item={item} grid={grid} />
        </div>
      )
    case 'grid':
      return (
        <div key={item.title} className="animate-fade-up" style={delay}>
          <GridCard item={item} />
        </div>
      )
    case 'location':
      return (
        <div key={item.title} className="animate-fade-up" style={delay}>
          <LocationCard item={item} />
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
          {section.items.map((item, index) => renderItem(item, index, false))}
        </div>
      )}
    </section>
  )
}
