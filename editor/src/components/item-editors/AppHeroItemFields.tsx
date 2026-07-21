import type { AppHero, WhatsAppHero } from '@bio-types'
import { APP_HERO_PRESETS } from '@site/lib/appHeroPresets'
import { APP_HERO_PRESET_LIST } from '../../lib/bio'
import { IconPicker } from '../IconPicker'
import { Field } from './Field'
import { HeroLayoutFields } from './HeroLayoutFields'
import { withOptionalIcon } from './withOptionalIcon'

export function WhatsAppHeroItemFields({
  item,
  isGridSection,
  onChange,
}: {
  item: WhatsAppHero
  isGridSection: boolean
  onChange: (item: WhatsAppHero) => void
}) {
  return (
    <HeroLayoutFields item={item} isGridSection={isGridSection} onChange={onChange} />
  )
}

export function AppHeroItemFields({
  item,
  isGridSection,
  onChange,
}: {
  item: AppHero
  isGridSection: boolean
  onChange: (item: AppHero) => void
}) {
  return (
    <>
      <Field label="App">
        <select
          value={item.preset}
          onChange={(e) => {
            const preset = e.target.value as typeof item.preset
            const defaults = APP_HERO_PRESETS[preset].defaults
            onChange({
              ...item,
              preset,
              ...defaults,
              layout: item.layout,
              align: item.align,
              ...(preset === 'custom' ? { icon: APP_HERO_PRESETS.custom.defaultIcon } : {}),
            })
          }}
        >
          {APP_HERO_PRESET_LIST.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </Field>
      {item.preset === 'custom' && (
        <IconPicker
          value={item.icon}
          onChange={(icon) => onChange(withOptionalIcon(item, icon))}
        />
      )}
      <HeroLayoutFields item={item} isGridSection={isGridSection} onChange={onChange} />
    </>
  )
}
