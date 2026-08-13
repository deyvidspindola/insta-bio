import type { IconName } from '@bio-types'
import { IconPicker } from '../IconPicker'
import { withOptionalIcon } from './withOptionalIcon'

type Tag = { label: string; icon?: IconName }

export function TagsField({
  value,
  onChange,
}: {
  value: Tag[]
  onChange: (tags: Tag[]) => void
}) {
  function updateTag(index: number, patch: Partial<Tag>) {
    const next = value.map((tag, i) => {
      if (i !== index) return tag
      if ('icon' in patch) return withOptionalIcon({ ...tag, ...patch }, patch.icon)
      return { ...tag, ...patch }
    })
    onChange(next)
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addTag() {
    onChange([...value, { label: '' }])
  }

  return (
    <div className="field">
      <label>Tags</label>
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground/70">Nenhuma tag ainda.</p>
        )}
        {value.map((tag, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <input
                className="w-full"
                value={tag.label}
                placeholder="Texto da tag"
                onChange={(e) => updateTag(index, { label: e.target.value })}
              />
            </div>
            <div className="min-w-0 flex-1 sm:max-w-[11rem]">
              <IconPicker
                bare
                value={tag.icon}
                onChange={(icon) => updateTag(index, { icon })}
              />
            </div>
            <button
              type="button"
              className="btn-ghost shrink-0 self-end px-2 py-1 text-xs sm:mb-0.5"
              onClick={() => removeTag(index)}
              title="Remover tag"
              aria-label="Remover tag"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary mt-2 w-full py-1.5 text-xs" onClick={addTag}>
        + Adicionar tag
      </button>
    </div>
  )
}
