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
