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
          placeholder="Ex.: Assista no YouTube"
        />
      </Field>
      <Field label="Legenda (estilo reels)">
        <textarea
          rows={2}
          value={item.caption ?? ''}
          onChange={(e) =>
            onChange({
              ...item,
              caption: e.target.value.trim() ? e.target.value : undefined,
            })
          }
          placeholder="Texto sobreposto na parte de baixo do player"
        />
      </Field>
      <p className="text-[10px] text-muted-foreground/75">
        Aceita links de vídeo, Shorts ou youtu.be. Título e legenda aparecem sobre o player.
      </p>
    </>
  )
}
