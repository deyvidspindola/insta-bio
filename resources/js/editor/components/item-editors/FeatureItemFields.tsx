import type { FeatureCard } from '@bio-types'
import { hasClickableUrl } from '@site/lib/cardLink'
import { FEATURE_ALIGNS, FEATURE_VARIANTS } from '../../lib/bio'
import { GradientField } from '../GradientField'
import { IconPicker } from '../IconPicker'
import { ImageField } from '../ImageField'
import { CardWidthField } from './CardWidthField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'
import { TagsField } from './TagsField'
import { withOptionalIcon } from './withOptionalIcon'

export function FeatureItemFields({
  item,
  isGridSection,
  onChange,
}: {
  item: FeatureCard
  isGridSection: boolean
  onChange: (item: FeatureCard) => void
}) {
  const isMediaCard = ['portrait', 'banner'].includes(item.variant ?? '')
  const showTitleOnMedia = item.showTitleOnMedia !== false
  const titleMissing = !item.title.trim() && hasClickableUrl(item.url)

  return (
    <>
      <FieldGroup title="Layout">
        <Field label="Formato">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {FEATURE_VARIANTS.map((variant) => {
              const selected = (item.variant ?? 'gradient') === variant.value
              return (
                <button
                  key={variant.value}
                  type="button"
                  className={`rounded-lg border px-2 py-2 text-left text-[11px] leading-snug transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 font-semibold text-foreground'
                      : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
                  }`}
                  onClick={() =>
                    onChange({
                      ...item,
                      variant: variant.value as typeof item.variant,
                    })
                  }
                >
                  {variant.label}
                </button>
              )
            })}
          </div>
        </Field>
        {(item.variant ?? 'gradient') === 'gradient' && (
          <Field label="Alinhamento">
            <div className="grid grid-cols-2 gap-1.5">
              {FEATURE_ALIGNS.map((option) => {
                const selected = (item.align ?? 'side') === option.value
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
        )}
        <CardWidthField
          value={item.width}
          isGridSection={isGridSection}
          onChange={(width) => onChange({ ...item, width })}
        />
      </FieldGroup>

      <FieldGroup title="Conteúdo">
        <Field label="Título">
          <input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Ex.: Formulário de inscrição"
          />
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
            Identifica o card no ranking de cliques
            {isMediaCard && !showTitleOnMedia ? ' (mesmo oculto na imagem)' : ''}.
          </p>
          {titleMissing && (
            <p className="mt-1.5 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
              Preencha um título para o relatório de cliques não ficar genérico.
            </p>
          )}
        </Field>

        {isMediaCard && (
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/10 px-3 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                Mostrar título na imagem
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                Desligado: foto limpa; o título continua no dashboard.
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showTitleOnMedia}
              aria-label="Mostrar título na imagem"
              onClick={() => onChange({ ...item, showTitleOnMedia: !showTitleOnMedia })}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                showTitleOnMedia ? 'border-primary bg-primary/25' : 'border-border bg-muted'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow-sm transition-transform ${
                  showTitleOnMedia
                    ? 'translate-x-5 bg-primary'
                    : 'translate-x-0 bg-muted-foreground'
                }`}
              />
            </button>
          </div>
        )}

        <Field label="Badge">
          <input
            value={item.badge ?? ''}
            onChange={(e) => onChange({ ...item, badge: e.target.value })}
          />
        </Field>
        <Field label="Descrição">
          <textarea
            rows={2}
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
          />
          {isMediaCard && !showTitleOnMedia && (
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
              Também oculta na imagem enquanto o toggle acima estiver desligado.
            </p>
          )}
        </Field>
        <Field label="Texto do botão">
          <input
            value={item.cta ?? ''}
            onChange={(e) => onChange({ ...item, cta: e.target.value })}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Mídia e estilo">
        <IconPicker
          value={item.icon}
          onChange={(icon) => onChange(withOptionalIcon(item, icon))}
        />
        <ImageField
          label="Imagem (retrato / banner)"
          value={item.image}
          onChange={(image) => onChange({ ...item, image })}
        />
        {['gradient', 'square'].includes(item.variant ?? 'gradient') && (
          <GradientField
            label="Cor do card (usada sem imagem)"
            value={item.gradient}
            onChange={(gradient) => onChange({ ...item, gradient })}
          />
        )}
        {['banner', 'portrait'].includes(item.variant ?? '') && (
          <TagsField
            value={item.tags ?? []}
            onChange={(tags) => onChange({ ...item, tags })}
          />
        )}
      </FieldGroup>
    </>
  )
}
