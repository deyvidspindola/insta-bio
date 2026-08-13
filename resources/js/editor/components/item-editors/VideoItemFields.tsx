import type { VideoCard } from '@bio-types'
import { MEDIA_CARD_VARIANTS } from '../../lib/bio'
import { ImageField } from '../ImageField'
import { VideoField } from '../VideoField'
import { Field } from './Field'
import { FieldGroup } from './FieldGroup'

export function VideoItemFields({
  item,
  onChange,
}: {
  item: VideoCard
  onChange: (item: VideoCard) => void
}) {
  return (
    <>
      <FieldGroup title="Mídia">
        <VideoField
          label="Vídeo"
          value={item.video}
          onChange={(video) => onChange({ ...item, video: video ?? '' })}
          hint="MP4 recomendado. Tamanho máximo ~25 MB."
        />
        <ImageField
          label="Capa (opcional)"
          value={item.poster}
          onChange={(poster) => onChange({ ...item, poster })}
          hint="Imagem exibida antes do vídeo carregar."
        />
        <Field label="Formato">
          <select
            value={item.variant ?? 'portrait'}
            onChange={(e) =>
              onChange({
                ...item,
                variant: e.target.value as typeof item.variant,
              })
            }
          >
            {MEDIA_CARD_VARIANTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <FieldGroup title="Conteúdo">
        <Field label="Título (opcional)">
          <input
            value={item.title ?? ''}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Ex.: Bastidores do evento"
          />
        </Field>
        <Field label="Legenda (estilo reels)">
          <textarea
            rows={2}
            value={item.caption ?? item.description ?? ''}
            onChange={(e) => {
              const value = e.target.value
              onChange({
                ...item,
                caption: value,
                // Mantém description alinhada para bios/ferramentas antigas
                description: value,
              })
            }}
            placeholder="Texto sobreposto na parte de baixo do vídeo"
          />
        </Field>
        <Field label="Link ao clicar (opcional)">
          <input
            value={item.url ?? ''}
            onChange={(e) => onChange({ ...item, url: e.target.value || undefined })}
            placeholder="https://"
          />
        </Field>
      </FieldGroup>
    </>
  )
}
