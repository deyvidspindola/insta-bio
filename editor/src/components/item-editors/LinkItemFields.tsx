import type { LinkCard } from '@bio-types'
import { IconPicker } from '../IconPicker'
import { CardWidthField } from './CardWidthField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'
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
      <p className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
        Link simples é para itens secundários (mapa, política, “saiba mais”). Para o que
        converte — WhatsApp, catálogo, CTA — use{' '}
        <span className="font-medium text-foreground/85">Destaque</span> ou um atalho de app.
      </p>
      <FieldGroup title="Layout">
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
          />
        </Field>
        <Field label="Subtítulo">
          <input
            value={item.subtitle ?? ''}
            onChange={(e) => onChange({ ...item, subtitle: e.target.value })}
          />
        </Field>
        <IconPicker
          value={item.icon}
          onChange={(icon) => onChange(withOptionalIcon(item, icon))}
        />
      </FieldGroup>
    </>
  )
}
