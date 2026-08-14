import { useState } from 'react'
import {
  ChevronDown,
  Image,
  List,
  MapPin,
  Newspaper,
  Play,
  ShoppingBag,
  Sparkles,
  Type,
  Video,
} from 'lucide-react'
import type { AppHeroPreset, SectionItem } from '@bio-types'
import { APP_HERO_PRESET_LIST, PRIMARY_CARD_TYPES, SECONDARY_CARD_TYPES } from '../lib/bio'

const TYPE_ICONS: Partial<Record<SectionItem['type'], typeof Sparkles>> = {
  feature: Sparkles,
  press: Newspaper,
  text: Type,
  list: List,
  form: Type,
  video: Video,
  'youtube-embed': Play,
  'spotify-embed': Video,
  slide: Image,
  products: ShoppingBag,
  location: MapPin,
}

interface AddBlockPickerProps {
  onAddItem: (type: SectionItem['type']) => void
  onAddAppHero: (preset: AppHeroPreset) => void
}

export function AddBlockPicker({ onAddItem, onAddAppHero }: AddBlockPickerProps) {
  const [open, setOpen] = useState(false)
  const extraTypes = [...PRIMARY_CARD_TYPES, ...SECONDARY_CARD_TYPES.filter((type) => type.value !== 'link')]

  return (
    <div className="card space-y-3">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-1 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold">Mais blocos</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            WhatsApp, vídeo, destaque, localização e outros.
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/70 pt-3">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Apps
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {APP_HERO_PRESET_LIST.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className="add-block-btn"
                  onClick={() => onAddAppHero(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Conteúdo
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {extraTypes.map((type) => {
                const Icon = TYPE_ICONS[type.value] ?? Sparkles
                return (
                  <button
                    key={type.value}
                    type="button"
                    className="add-block-btn"
                    title={type.hint}
                    onClick={() => onAddItem(type.value)}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
