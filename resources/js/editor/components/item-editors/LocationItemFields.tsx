import { useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import type { LocationCard } from '@bio-types'
import {
  isGoogleMapsUrl,
  isShortGoogleMapsUrl,
  parseMapsCoords,
} from '@site/lib/mapsEmbed'
import { ENDPOINTS } from '../../lib/endpoints'
import { csrfHeaders } from '../../../shared/http'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

async function resolveMapsPin(
  url: string,
): Promise<{ lat: number; lng: number } | null> {
  const local = parseMapsCoords(url)
  if (local) return local

  if (!isGoogleMapsUrl(url)) return null

  try {
    const res = await fetch(ENDPOINTS.resolveMaps, {
      method: 'POST',
      credentials: 'include',
        headers: csrfHeaders(),
      body: JSON.stringify({ url }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { lat?: number; lng?: number; ok?: boolean }
    if (typeof data.lat === 'number' && typeof data.lng === 'number') {
      return { lat: data.lat, lng: data.lng }
    }
  } catch {
    // preview / offline
  }
  return null
}

export function LocationItemFields({
  item,
  onChange,
}: {
  item: LocationCard
  onChange: (item: LocationCard) => void
}) {
  const showMap = item.showMap ?? true
  const [pinHint, setPinHint] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)

  async function applyMapUrl(raw: string) {
    const mapUrl = raw.trim()
    const next: LocationCard = { ...item, mapUrl }

    if (!mapUrl) {
      delete next.mapLat
      delete next.mapLng
      onChange(next)
      setPinHint(null)
      return
    }

    setResolving(true)
    setPinHint(
      isShortGoogleMapsUrl(mapUrl)
        ? 'Resolvendo pin do link curto…'
        : 'Lendo coordenadas do link…',
    )

    const coords = await resolveMapsPin(mapUrl)
    setResolving(false)

    if (coords) {
      onChange({ ...next, mapLat: coords.lat, mapLng: coords.lng })
      setPinHint('Pin do mapa alinhado ao link do Google Maps.')
      return
    }

    delete next.mapLat
    delete next.mapLng
    onChange(next)
    setPinHint(
      isGoogleMapsUrl(mapUrl)
        ? 'Vamos usar o link no mapa embutido. Se o pin ainda errar, abra o local no Maps e cole o URL completo da barra de endereço.'
        : 'Para o pin preciso, cole um link do Google Maps (ex.: maps.app.goo.gl/…).',
    )
  }

  return (
    <>
      <FieldGroup title="Conteúdo">
        <Field label="Título">
          <input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Ex.: Igreja Expressar"
          />
        </Field>
        <Field label="Endereço">
          <input
            value={item.address}
            onChange={(e) => onChange({ ...item, address: e.target.value })}
            placeholder="Rua, número · Cidade, UF"
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Mapa">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">Mapa embutido</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                {showMap
                  ? 'Pin usa o link do Maps (não só o texto do endereço).'
                  : 'Só o card com endereço e link externo.'}
              </span>
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showMap}
            aria-label="Exibir mapa embutido"
            onClick={() => onChange({ ...item, showMap: !showMap })}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              showMap ? 'border-primary bg-primary/25' : 'border-border bg-muted'
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow-sm transition-transform ${
                showMap ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
              }`}
            />
          </button>
        </div>

        <Field label="Link do Google Maps">
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <input
              className="!pl-8"
              value={item.mapUrl}
              onChange={(e) => onChange({ ...item, mapUrl: e.target.value })}
              onBlur={(e) => {
                void applyMapUrl(e.target.value)
              }}
              placeholder="https://maps.app.goo.gl/…"
              disabled={resolving}
            />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
            Cole o link de compartilhar do Maps (maps.app.goo.gl). O pin do mapa embutido e o
            “Abrir no mapa” usam esse link.
            {typeof item.mapLat === 'number' && typeof item.mapLng === 'number'
              ? ` · Pin: ${item.mapLat.toFixed(5)}, ${item.mapLng.toFixed(5)}`
              : ''}
          </p>
          {pinHint && (
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{pinHint}</p>
          )}
        </Field>
      </FieldGroup>
    </>
  )
}
