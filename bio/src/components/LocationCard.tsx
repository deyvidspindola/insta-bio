import type { LocationCard as LocationCardType } from '../types/bio'
import { CardLink, hasClickableUrl } from '../lib/cardLink'
import { MapPin } from 'lucide-react'

function mapsEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address.trim())}&z=16&output=embed`
}

export function LocationCard({ item }: { item: LocationCardType }) {
  const clickable = hasClickableUrl(item.mapUrl)
  const address = item.address?.trim() ?? ''
  const showMap = (item.showMap ?? true) && Boolean(address)

  return (
    <div className="bio-card bio-location-card overflow-hidden">
      {showMap && (
        <div className="bio-location-map relative aspect-[16/10] w-full bg-muted/40 sm:aspect-[2/1]">
          <iframe
            title={`Mapa: ${item.title}`}
            src={mapsEmbedUrl(address)}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      )}
      <CardLink
        url={item.mapUrl}
        className="bio-location-card__body group relative block"
      >
        <div className="relative overflow-hidden">
          {!showMap && (
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(oklch(0.70 0.18 55 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.70 0.18 55 / 0.18) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
          )}
          <div className="relative flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
              <MapPin className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              {address && <p className="bio-text-secondary text-xs">{item.address}</p>}
              {clickable && (
                <span className="mt-1 inline-block text-[11px] font-medium text-primary">
                  Abrir no mapa →
                </span>
              )}
            </div>
          </div>
        </div>
      </CardLink>
    </div>
  )
}
