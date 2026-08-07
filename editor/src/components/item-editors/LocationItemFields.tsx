import { MapPin, ExternalLink } from 'lucide-react'
import type { LocationCard } from '@bio-types'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export function LocationItemFields({
  item,
  onChange,
}: {
  item: LocationCard
  onChange: (item: LocationCard) => void
}) {
  const showMap = item.showMap ?? true

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
                  ? 'Mostra o mapa com pin no endereço.'
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

        <Field label="Link “Abrir no mapa”">
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <input
              className="!pl-8"
              value={item.mapUrl}
              onChange={(e) => onChange({ ...item, mapUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
            Google Maps, Apple Maps ou Waze — abre fora da bio.
          </p>
        </Field>
      </FieldGroup>
    </>
  )
}
