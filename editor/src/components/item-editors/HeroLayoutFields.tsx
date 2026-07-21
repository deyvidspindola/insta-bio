import type { AppHero, AppHeroLayout, FeatureCardAlign, WhatsAppHero } from '@bio-types'
import { APP_HERO_LAYOUTS, FEATURE_ALIGNS, resolveHeroLayout } from '../../lib/bio'
import { Field } from './Field'

export function HeroLayoutFields({
  item,
  isGridSection,
  onChange,
}: {
  item: WhatsAppHero | AppHero
  isGridSection: boolean
  onChange: (item: WhatsAppHero | AppHero) => void
}) {
  const layout = resolveHeroLayout(isGridSection, item.layout)
  const layoutOptions = APP_HERO_LAYOUTS.filter(
    (option) => !isGridSection || option.value !== 'default',
  )
  const align = (item.align ?? 'side') as FeatureCardAlign

  return (
    <>
      <Field label="Layout">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {layoutOptions.map((option) => {
            const selected = layout === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 font-semibold text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
                onClick={() =>
                  onChange({
                    ...item,
                    layout: option.value as AppHeroLayout,
                  })
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {isGridSection && (
          <p className="mt-1 text-[10px] text-muted-foreground/75">
            Layout completo desativado em grade de 2 colunas.
          </p>
        )}
      </Field>

      <Field label="Alinhamento">
        <div className="grid grid-cols-2 gap-1.5">
          {FEATURE_ALIGNS.map((option) => {
            const selected = align === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 font-semibold text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
                onClick={() =>
                  onChange({
                    ...item,
                    align: option.value,
                  })
                }
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Field>

      {layout === 'default' && (
        <Field label="Badge">
          <input value={item.badge} onChange={(e) => onChange({ ...item, badge: e.target.value })} />
        </Field>
      )}
      <Field label="Título">
        <input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
      </Field>
      {layout === 'default' && (
        <Field label="Descrição">
          <textarea
            rows={2}
            value={item.description}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
        </Field>
      )}
      {layout !== 'condensed' && (
        <Field label="Texto do botão">
          <input value={item.cta} onChange={(e) => onChange({ ...item, cta: e.target.value })} />
        </Field>
      )}
      {(layout === 'compact' || layout === 'condensed') && (
        <p className="text-[10px] text-muted-foreground/75">
          No layout {layout === 'compact' ? 'compacto' : 'condensado'}, badge
          {layout === 'compact' ? ' e descrição' : ', descrição e botão'} não aparecem na bio.
        </p>
      )}
    </>
  )
}
