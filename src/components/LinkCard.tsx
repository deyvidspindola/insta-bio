import type { LinkCard as LinkCardType } from '../types/bio'
import { ArrowIcon, BioIcon } from './icons'

export function LinkCard({ item }: { item: LinkCardType }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
          <BioIcon name={item.icon} className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight text-foreground">{item.title}</h3>
          {item.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
          )}
        </div>
        <ArrowIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    </a>
  )
}
