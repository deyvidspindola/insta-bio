import type { YoutubeEmbedCard } from '@bio-types'
import { Field } from './Field'

export function YoutubeItemFields({
  item,
  onChange,
}: {
  item: YoutubeEmbedCard
  onChange: (item: YoutubeEmbedCard) => void
}) {
  return (
    <>
      <Field label="Link do vídeo no YouTube">
        <input
          value={item.url}
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </Field>
      <Field label="Título (opcional)">
        <input
          value={item.title ?? ''}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
        />
      </Field>
      <p className="text-[10px] text-muted-foreground/75">
        Aceita links de vídeo, Shorts ou youtu.be. O player aparece embutido na bio.
      </p>
    </>
  )
}
