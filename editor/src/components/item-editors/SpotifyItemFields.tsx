import type { SpotifyEmbedCard } from '@bio-types'
import { parseSpotifyEmbed } from '@site/lib/embedUrls'
import { Field } from './Field'

function normalizeSpotifyInput(raw: string): string {
  const parsed = parseSpotifyEmbed(raw)
  if (!parsed) return raw
  if (raw.includes('<iframe')) return raw.trim()
  return parsed.src
}

export function SpotifyItemFields({
  item,
  onChange,
}: {
  item: SpotifyEmbedCard
  onChange: (item: SpotifyEmbedCard) => void
}) {
  return (
    <>
      <Field label="Link do Spotify">
        <input
          value={
            (item.embed ?? item.url ?? '').includes('<iframe')
              ? ''
              : (item.embed ?? item.url ?? '')
          }
          onChange={(e) =>
            onChange({
              ...item,
              embed: normalizeSpotifyInput(e.target.value),
              url: undefined,
              theme: undefined,
              size: undefined,
            })
          }
          placeholder="https://open.spotify.com/playlist/..."
        />
      </Field>
      <details className="rounded-lg border border-border/70 bg-muted/10 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
          Ou cole o código de incorporação (iframe)
        </summary>
        <div className="mt-2 space-y-2">
          <textarea
            value={item.embed ?? item.url ?? ''}
            onChange={(e) =>
              onChange({
                ...item,
                embed: e.target.value,
                url: undefined,
                theme: undefined,
                size: undefined,
              })
            }
            rows={4}
            placeholder={'<iframe ... src="https://open.spotify.com/embed/..." ...></iframe>'}
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground/75">
            No Spotify: Compartilhar → Incorporar → copie o iframe. Playlist, álbum, artista ou
            música.
          </p>
        </div>
      </details>
      <Field label="Título (opcional)">
        <input
          value={item.title ?? ''}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
        />
      </Field>
      <p className="text-[10px] text-muted-foreground/75">
        Cole o link público da playlist, álbum ou música — o player aparece embutido na bio.
      </p>
    </>
  )
}
