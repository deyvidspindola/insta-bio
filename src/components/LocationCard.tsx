import type { LocationCard as LocationCardType } from '../types/bio'
import { MapPin } from 'lucide-react'

export function LocationCard({ item }: { item: LocationCardType }) {
  return (
    <a
      href={item.mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50"
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(oklch(0.70 0.18 55 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.70 0.18 55 / 0.18) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <MapPin className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.address}</p>
            <span className="mt-1 inline-block text-[11px] font-medium text-primary">
              Abrir no mapa →
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
