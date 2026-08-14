import type { LinkCard } from '@bio-types'
import { IconPicker } from '../IconPicker'
import { CardWidthField } from './CardWidthField'
import { CardActionField, showsUrlField, urlFieldLabel, urlFieldPlaceholder } from './CardActionField'
import { Field } from './Field'
import { ScheduleFields } from './ScheduleFields'
import { withOptionalIcon } from './withOptionalIcon'

export function LinkItemFields({
  item,
  isGridSection,
  onChange,
}: {
  item: LinkCard
  isGridSection: boolean
  onChange: (item: LinkCard) => void
}) {
  return (
    <>
      <Field label="Título">
        <input
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          placeholder="Texto do botão"
        />
        {!item.title.trim() && (
          <p className="mt-1.5 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
            Preencha um título — ele aparece no botão e no ranking de cliques.
          </p>
        )}
      </Field>
      {showsUrlField(item.action) && (
        <Field label={item.action && item.action !== 'link' ? urlFieldLabel(item.action) : 'URL'}>
          <input
            type="url"
            inputMode="url"
            value={item.url}
            onChange={(e) => onChange({ ...item, url: e.target.value })}
            placeholder={
              item.action && item.action !== 'link' ? urlFieldPlaceholder(item.action) : 'https://'
            }
          />
        </Field>
      )}

      <details className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">Mais opções</summary>
        <div className="mt-3 space-y-3">
          <CardActionField
            value={item.action}
            url={item.url}
            pageSlug={item.pageSlug}
            onChange={({ action, pageSlug }) => onChange({ ...item, action, pageSlug })}
          />
          <Field label="Subtítulo (opcional)">
            <input
              value={item.subtitle ?? ''}
              onChange={(e) => onChange({ ...item, subtitle: e.target.value })}
              placeholder="Linha extra abaixo do título"
            />
          </Field>
          <IconPicker
            value={item.icon}
            onChange={(icon) => onChange(withOptionalIcon(item, icon))}
          />
          <CardWidthField
            value={item.width}
            isGridSection={isGridSection}
            onChange={(width) => onChange({ ...item, width })}
          />
          <ScheduleFields item={item} onChange={(next) => onChange(next as LinkCard)} />
        </div>
      </details>
    </>
  )
}
